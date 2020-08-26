// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as vsls from 'vsls';
import TelemetryReporter from 'vscode-extension-telemetry';

import * as iis from './IISExpress';
import * as verify from './verification';
import * as settings from './settings';
import { ControlsTreeProvider } from './ControlsTreeProvider';
import { Credentials } from './credentials';


let iisExpressServer:iis.IISExpress;

// all events will be prefixed with this event name
const extensionId = 'iis-express';

// extension version will be reported as a property with each event
const pkgJson = require('../package.json');
const extensionVersion = pkgJson.version;

// the application insights key (also known as instrumentation key)
const key = 'e0cc903f-73ec-4216-92cd-3479696785b2';

// telemetry reporter
// create telemetry reporter on extension activation
const reporter:TelemetryReporter = new TelemetryReporter(extensionId, extensionVersion, key);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {


	// This will check if the user has VS LiveShare installed & return its API to us
	// If not then this will be null
	const liveshare = await vsls.getApi();
	let liveShareServer:vscode.Disposable;

	// Init credentials class
	// Means we can fetch token later when needed with
	// const userAuth = await credentials.getAuthSession();
	const credentials = new Credentials();
	await credentials.initialize(context, reporter);
	const isValidSponsor = await credentials.isUserSponsor();

	// Register tree provider to put our custom commands into the tree
	// Start, Stop, Restart, Support etc...
	const controlsTreeProvider = new ControlsTreeProvider();
	vscode.window.registerTreeDataProvider('iisexpress.controls', controlsTreeProvider);

	// Begin checks of OS, IISExpress location etc..
	const verification = await verify.checkForProblems();
	iisExpressServer = new iis.IISExpress(verification.programPath, verification.appCmdProgramPath, context, reporter);

	// Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const startSite = vscode.commands.registerCommand('extension.iis-express.start',async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
        }

		// Start Website...
		// Pass settings - just in case its changed between session
		iisExpressServer.startWebsite(settings.getSettings());

		// Ensure user has liveshare extension
		if(liveshare !== null){
			if((liveshare.session.id !== null) && (liveshare.session.role === vsls.Role.Host)){
				const portNumber = settings.getSettings().port;

				// This will prompt the LiveShare Host to share the IIS Server Port
				liveShareServer = await liveshare.shareServer({ displayName: `IIS Express:${portNumber}`, port: portNumber });

				// Push the disposable VSCode into the subscriptions
				// so VSCode can dispose them if we forget to or when the extension is deactivated
				context.subscriptions.push(liveShareServer);
			}
		}
	});

	// Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const stopSite = vscode.commands.registerCommand('extension.iis-express.stop',async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
        }

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

		// Open site in browser - this will need to check if site is running first...
		// Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisExpressServer.openWebsite(settings.getSettings());
	});

    // Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	const restartSite = vscode.commands.registerCommand('extension.iis-express.restart',async () => {

		// Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            // Stop the extension from running
            return;
		}

		// Open site in browser - this will need to check if site is running first...
		// Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisExpressServer.restartSite(settings.getSettings());
	});

	const supporter = vscode.commands.registerCommand('extension.iis-express.supporter',async () => {
		vscode.env.openExternal(vscode.Uri.parse("http://github.com/sponsors/warrenbuckley"));
		reporter.sendTelemetryEvent('supporterlinkopened');
	});

	const openSettings = vscode.commands.registerCommand('extension.iis-express.settings',async () => {
		// 'workbench.action.openSettings' argument is search query to only show our settings to filter out other settings
		vscode.commands.executeCommand('workbench.action.openSettings', '@ext:warren-buckley.iis-express');
	});

	const displaySponsorMessage = vscode.commands.registerCommand('extension.iis-express.displaySponsorMessage', async () => {
		// // Check if we need to display or not...
		// const foo = await credentials.getAuthSession();
		// const bar = foo.scopes;
		// const temp = foo.account.id;
		// const tempBar = foo.account.label; // warrenbuckley
		// const accessToken = foo.accessToken; //

		if(isValidSponsor === false){
			vscode.window.showErrorMessage("You are NOT a sponsor", { modal: true });
		}
		else {
			vscode.window.showInformationMessage("YAY you are a sponsor", { modal: true });
		}

		 // Create and show a new webview
		 const panel = vscode.window.createWebviewPanel(
			'iisExpress.sponsorware',
			'IIS Express - Sponsorware',
			vscode.ViewColumn.Beside,
			{
			}
		  );

		    // And set its HTML content
			panel.webview.html = getWebviewContent(87);
	});

	// Push the commands & any other VSCode disposables
	context.subscriptions.push(startSite, stopSite, openSite, restartSite, supporter, openSettings, displaySponsorMessage);
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

function getWebviewContent(numberOfLaunches:number) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>IIS Express - Sponsorware</title>
	  <style>
	  button {
		  font-size:40px;
		color: var(--vscode-editor-background);
	  }
	  </style>
  </head>
  <body>
	  <h1>IIS Express - Sponsorware</h1>
	  <p>You have used IIS Express ${numberOfLaunches} times. You like to use it alot, have you considered becoming a sponsor</p>
	  <button>Sponsor</button>
	  <a href="http://google.com">Google</a>
	  <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
  </body>
  </html>`;
  }