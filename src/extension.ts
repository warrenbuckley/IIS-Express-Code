// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as vsls from 'vsls';
import TelemetryReporter from '@vscode/extension-telemetry';

import * as iis from './IISExpress';
import * as verify from './verification';
import * as settings from './settings';
import * as util from './util';
import { ControlsTreeProvider } from './ControlsTreeProvider';
import { Credentials } from './credentials';
import { Sponsorware } from './sponsorware';


let iisExpressServer:iis.IISExpress;

// all events will be prefixed with this event name
// const extensionId = 'iis-express';

// extension version will be reported as a property with each event
//const pkgJson = require('../package.json');
//const extensionVersion = pkgJson.version;

// the application insights key (also known as instrumentation key)
const key = 'e0cc903f-73ec-4216-92cd-3479696785b2';

// telemetry reporter
// create telemetry reporter on extension activation

// TODO: Previously passed in the version and the extension name - NEED to investigae source code repo
// https://github.com/microsoft/vscode-extension-telemetry
// TODO: Test with new Azure AppInsights key to check data going in OK
const reporter:TelemetryReporter = new TelemetryReporter(key);

const iisOutputWindow = vscode.window.createOutputChannel('IIS Express (Logs)');

let vsCodeFolderToRun:vscode.Uri | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Get a random number to use/compare if we have run IIS Express
	const randomNumberOfLaunchesToShowSponsor = util.getRandomIntInclusive(5, 20);
	context.globalState.update('iisexpress.sponsorware.display.count', randomNumberOfLaunchesToShowSponsor);

	// This will check if the user has VS LiveShare installed & return its API to us
	// If not then this will be null
	const liveshare = await vsls.getApi();
	let liveShareServer:vscode.Disposable;

	// Init credentials class with event listener & prompt/get token from GitHub auth
	const credentials = new Credentials(context, reporter, iisOutputWindow);
	const sponsorware = new Sponsorware(context, credentials, reporter, iisOutputWindow);

	// Register tree provider to put our custom commands into the tree
	// Start, Stop, Restart, Support etc...
	const controlsTreeProvider = new ControlsTreeProvider();
	vscode.window.registerTreeDataProvider('iisexpress.controls', controlsTreeProvider);

	// Begin checks of OS, IISExpress location etc..
	const verification = await verify.checkForProblems();
	iisExpressServer = new iis.IISExpress(verification.programPath, verification.appCmdProgramPath, context, reporter);

	// Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const startSite = vscode.commands.registerCommand('extension.iis-express.start', async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
        }

		// Will auto get single folder or let user choose single folder from multi-workspace folders
		settings.getFolder().then(async folderToRun => {

			vsCodeFolderToRun = folderToRun;

			// Exit out early
			if(vsCodeFolderToRun === undefined){
				return;
			}

			// Start Website...
			// Pass settings - just in case its changed between session
			// GetSettings now takes new param of workspace folder URI to use
			const serverSettings = settings.getSettings(vsCodeFolderToRun);
			await iisExpressServer.startWebsite(serverSettings, vsCodeFolderToRun);

			// Checks if we need to display sponsorware webview message
			await sponsorware.showSponsorMessagePanel();

			// Ensure user has liveshare extension
			if(liveshare !== null){
				if((liveshare.session.id !== null) && (liveshare.session.role === vsls.Role.Host)){
					const portNumber = serverSettings.port;

					// This will prompt the LiveShare Host to share the IIS Server Port
					liveShareServer = await liveshare.shareServer({ displayName: `IIS Express:${portNumber}`, port: portNumber });

					// Push the disposable VSCode into the subscriptions
					// so VSCode can dispose them if we forget to or when the extension is deactivated
					context.subscriptions.push(liveShareServer);
				}
			}
		});
		
	});

	// Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const stopSite = vscode.commands.registerCommand('extension.iis-express.stop',async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
		}
		
		vsCodeFolderToRun = undefined;

		// Stop Website...
		iisExpressServer.stopWebsite();

		// Ensure user has liveshare extension
		if(liveshare !== null){
			if((liveshare.session.id !== null) && (liveshare.session.role === vsls.Role.Host) && (liveShareServer !== null)){
				// Kill off the live share server if its running
				liveShareServer.dispose();
			}
		}
	});

	// Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const openSite = vscode.commands.registerCommand('extension.iis-express.open', async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
		}

		// Exit out early
		if(vsCodeFolderToRun === undefined){
			return;
		}

		// GetSettings now takes new param of workspace folder URI to use
		const serverSettings = settings.getSettings(vsCodeFolderToRun);
			
		// Open site in browser - this will need to check if site is running first...
		// Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisExpressServer.openWebsite(serverSettings);
	});

    // Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const restartSite = vscode.commands.registerCommand('extension.iis-express.restart', async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
		}

		// Exit out early
		if(vsCodeFolderToRun === undefined){
			return;
		}

		// GetSettings now takes new param of workspace folder URI to use
		const serverSettings = settings.getSettings(vsCodeFolderToRun);
		
		// Restart site  - this will need to check if site is running first...
		// Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisExpressServer.restartSite(serverSettings, vsCodeFolderToRun);

		// Checks if we need to display sponsoware webview message
		await sponsorware.showSponsorMessagePanel();
	});

	const supporter = vscode.commands.registerCommand('extension.iis-express.supporter', async () => {
		vscode.env.openExternal(vscode.Uri.parse("http://github.com/sponsors/warrenbuckley"));
		reporter.sendTelemetryEvent('supporterlinkopened');
	});

	const openSettings = vscode.commands.registerCommand('extension.iis-express.settings', async () => {
		// 'workbench.action.openSettings' argument is search query to only show our settings to filter out other settings
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:warren-buckley.iis-express');
	});

	const promptGitHubLogin = vscode.commands.registerCommand('extension.iis-express.githublogin', async () => {
		// Will try to get an auth session & if it does not exist it will prompt with a popup/dialog
		credentials.promptForAuthSession();
	});

	// Push the commands & any other VSCode disposables
	context.subscriptions.push(startSite, stopSite, openSite, restartSite, supporter, openSettings, promptGitHubLogin);
}

// this method is called when your extension is deactivated
export function deactivate() {

	// Deals with removing the site from appcmd
	// As stop site - calls the kill signal which we listen to already to remove appcmd site

	// This is to deal with when IIS Express & Site running in VSCode
	// And the VSCode Window/Application is shutdown
	if(iisExpressServer){
		iisExpressServer.stopWebsite();
	}
}