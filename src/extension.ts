// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as iis from './IISExpress';
import * as verify from './verification';
import * as settings from './settings';

import * as vsls from 'vsls';

let iisProc:iis.IIS;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// This will check if the user has VS LiveShare installed & return its API to us
	// If not then this will be null
	const liveshare = await vsls.getApi();
	let liveShareServer:vscode.Disposable;

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var startSite = vscode.commands.registerCommand('extension.iis-express.start',async () => {

		//Begin checks of OS, IISExpress location etc..
		let verification = await verify.checkForProblems();

		//IISExpress command line arguments
		let args: iis.IExpressArguments = {
		};

		//Run IISExpress Class Contructor
		iisProc = new iis.IIS(verification.programPath, verification.appCmdProgramPath, args);

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Start Website...
		//Pass settings - just in case its changed between session
		iisProc.startWebsite(settings.getSettings());

		// Ensure user has liveshare extension
		if(liveshare != null){
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

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var stopSite = vscode.commands.registerCommand('extension.iis-express.stop',async () => {

		//Begin checks of OS, IISExpress location etc..
		let verification = await verify.checkForProblems();

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		// iisProc could be undefinied as we only init in start
		if(iisProc === undefined){
			vscode.window.showErrorMessage('No website currently running', {modal: true});
			return;
		}

		//Stop Website...
		iisProc.stopWebsite();

		// Ensure user has liveshare extension
		if(liveshare != null){
			if((liveshare.session.id !== null) && (liveshare.session.role === vsls.Role.Host) && (liveShareServer != null)){
				// Kill off the live share server if its running
				liveShareServer.dispose();
			}
		}
	});

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var openSite = vscode.commands.registerCommand('extension.iis-express.open', async () => {

		//Begin checks of OS, IISExpress location etc..
		let verification = await verify.checkForProblems();

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
		}

		// iisProc could be undefinied as we only init in start
		if(iisProc === undefined){
			vscode.window.showErrorMessage('No website currently running');
			return;
		}

		//Open site in browser - this will need to check if site is running first...
		//Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisProc.openWebsite(settings.getSettings());
	});

    //Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var restartSite = vscode.commands.registerCommand('extension.iis-express.restart',async () => {

		//Begin checks of OS, IISExpress location etc..
		let verification = await verify.checkForProblems();

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
		}

		// iisProc could be undefinied as we only init in start
		if(iisProc === undefined){
			vscode.window.showErrorMessage('No website currently running');
			return;
		}

		//Open site in browser - this will need to check if site is running first...
		//Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisProc.restartSite(settings.getSettings());
	});

	//Push the commands & any other VSCode disposables
	context.subscriptions.push(startSite, stopSite, openSite, restartSite);
}

//this method is called when your extension is deactivated
export function deactivate() {

	//Deals with removing the site from appcmd
	//As stop site - calls the kill signal which we listen to already to remove appcmd site

	//This is to deal with when IIS Express & Site running in VSCode
	//And the VSCode Window/Application is shutdown
	if(iisProc){
		iisProc.stopWebsite();
	}
}