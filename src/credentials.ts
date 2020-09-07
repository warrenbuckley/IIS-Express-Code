import * as vscode from 'vscode';
import axios from 'axios';
import TelemetryReporter from 'vscode-extension-telemetry';

// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const SCOPES = ['read:user', 'read:org'];
const GITHUB_AUTH_PROVIDER_ID = 'github';
const AZURE_FUNCTION_URL = 'https://warren-buckley.co.uk/IsActiveSponsor';

export class Credentials {

	private authSession: vscode.AuthenticationSession | undefined;
	private reporter: TelemetryReporter | undefined;

	async initialize(context: vscode.ExtensionContext, reporter:TelemetryReporter): Promise<void> {
		this.registerListeners(context);
		this.setAuthSession();
		this.reporter = reporter;
	}

	private async setAuthSession() {
		/**
		 * By passing the `createIfNone` flag, a numbered badge will show up on the accounts activity bar icon.
		 * An entry for the sample extension will be added under the menu to sign in. This allows quietly
		 * prompting the user to sign in.
		 * */
		const session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: false });

		if (session) {
			this.authSession = session;
			return;
		}

		this.authSession = undefined;
	}

	private registerListeners(context: vscode.ExtensionContext): void {
		/**
		 * Sessions are changed when a user logs in or logs out.
		 */
		context.subscriptions.push(vscode.authentication.onDidChangeSessions(async e => {
			if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
				await this.setAuthSession();
			}
		}));
	}

	// Acessed from sponsorware class
	async isUserSponsor():Promise<boolean> {

		// Ensure we have an auth session
		if(this.authSession === undefined){
			/**
			 * When the `createIfNone` flag is passed, a modal dialog will be shown asking the user to sign in.
			 * Note that this can throw if the user clicks cancel.
			 */
			try {
				const session = await vscode.authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, { createIfNone: true });
				this.authSession = session;
			} catch (error) {
				// User has explicitly not consented to allow us to login
				// We will need to show the sponsorware message
				return false;
			}
		}

		// Use the token in this.authSession.accessToken
		const accessToken = this.authSession?.accessToken;

		let isValidSponsor = false;

		// Make a request to Azure Function to check if they are a sponsor
		// Do request - pass back JSON response bool from this func
		await axios.post(AZURE_FUNCTION_URL, {token: accessToken})
			.then(response => {
				isValidSponsor = response.data.validSponsor ? response.data.validSponsor : false;
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
			});

		return isValidSponsor;
	}
}