import * as vscode from 'vscode';
import axios from 'axios';
import TelemetryReporter from 'vscode-extension-telemetry';

// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const SCOPES = ['read:user', 'read:org'];
const GITHUB_AUTH_PROVIDER_ID = 'github';
const AZURE_FUNCTION_URL = 'https://warren-buckley.co.uk/IsActiveSponsor';

export class Credentials {

	public authSession: vscode.AuthenticationSession | undefined;
	private reporter: TelemetryReporter | undefined;
	private context: vscode.ExtensionContext;
	private outputWindow: vscode.OutputChannel;

	constructor(context: vscode.ExtensionContext, reporter:TelemetryReporter, outputWindow:vscode.OutputChannel) {
		this.context = context;
		this.reporter = reporter;
		this.outputWindow = outputWindow;

		this.initialize();
	}

	private async initialize(): Promise<void> {
		this.registerListeners();
		this.setAuthSession(false);
	}

	private async setAuthSession(showPrompt:boolean = false): Promise<void>  {
		/**
		 * By passing the `createIfNone` flag, a numbered badge will show up on the accounts activity bar icon.
		 * An entry for the sample extension will be added under the menu to sign in. This allows quietly
		 * prompting the user to sign in.
		 * */
		const session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: showPrompt });

		if (session) {
			this.authSession = session;

			// Used to enable/disable the GitHub Login command & to know when user has auth'd
			vscode.commands.executeCommand('setContext', 'iisexpress:userIsLoggedIn', true);
			this.reporter?.sendTelemetryEvent('github.loggedin');
			this.outputWindow.appendLine(`[Credentials] Logged in as ${session.account.label}`);
			return;
		}

		// Not logged in or cancelled
		this.authSession = undefined;

		// Used to enable/disable the GitHub Login command & to know when user has auth'd
		vscode.commands.executeCommand('setContext', 'iisexpress:userIsLoggedIn', false);
		this.outputWindow.appendLine(`[Credentials] Logged out`);
		this.reporter?.sendTelemetryEvent('github.loggedout');
	}

	private registerListeners(): void {
		/**
		 * Sessions are changed when a user logs in or logs out.
		 */
		this.context.subscriptions.push(vscode.authentication.onDidChangeSessions(async e => {
			if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
				await this.setAuthSession();
			}
		}));
	}

	public async promptForAuthSession():Promise<void> {
		// Used in our sponsorware message button to auth to GitHub
		// Calling setAuthSession will explicitly prompt the user with a dialog
		this.setAuthSession(true);
	}

	// Acessed from sponsorware class
	public async isUserSponsor():Promise<boolean> {
		// Use the token in authSession
		const accessToken = this.authSession?.accessToken;
		let isValidSponsor = false;

		if(accessToken){

			const accountLabel = this.authSession?.account.label;
			this.outputWindow.appendLine(`[Credentials] Checking sponsorship for ${accountLabel}`);

			// Make a request to Azure Function to check if they are a sponsor
			// Do request - pass back JSON response bool from this func
			await axios.post(AZURE_FUNCTION_URL, {token: accessToken})
				.then(response => {
					isValidSponsor = response.data.validSponsor ? response.data.validSponsor : false;
					this.outputWindow.appendLine(`[Credentials] Is ${accountLabel} a valid sponsor from Azure Function? ${isValidSponsor}`);
				})
				.catch(error => {

					// if (error.response) {
					// 	// The request was made and the server responded with a status code
					// 	// that falls out of the range of 2xx
					// 	console.log(error.response.data);

					// } else if (error.request) {
					// 	// The request was made but no response was received
					// 	// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
					// 	// http.ClientRequest in node.js
					// 	console.log(error.request);
					// } else {
					// 	// Something happened in setting up the request that triggered an Error
					// 	console.log("Error", error.message);
					// }

					this.reporter?.sendTelemetryException(error);
					isValidSponsor = false;
					this.outputWindow.appendLine(`[Credentials] Error determining if user ${accountLabel} is a valid sponsor`);
					this.outputWindow.appendLine(`[ERROR] ${error}`);
				});
		}

		return isValidSponsor;
	}
}