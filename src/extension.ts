// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as iis from './IISExpress';
import * as verify from './verification';
import * as settings from './settings';


let iisProc:iis.IIS;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {    

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var startSite = vscode.commands.registerCommand('extension.iis-express.start',() => {
		 
		//Begin checks of OS, IISExpress location etc..
		let verification = verify.checkForProblems();

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
	});

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var stopSite = vscode.commands.registerCommand('extension.iis-express.stop',() => {
		 
		//Begin checks of OS, IISExpress location etc..
		let verification = verify.checkForProblems();

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Stop Website...
		iisProc.stopWebsite();
	});

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var openSite = vscode.commands.registerCommand('extension.iis-express.open',() => {
		 
		//Begin checks of OS, IISExpress location etc..
		let verification = verify.checkForProblems();

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Open site in browser - this will need to check if site is running first...
		//Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisProc.openWebsite(settings.getSettings());
	});

    //Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var restartSite = vscode.commands.registerCommand('extension.iis-express.restart',() => {
		 
		//Begin checks of OS, IISExpress location etc..
		let verification = verify.checkForProblems();

		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Open site in browser - this will need to check if site is running first...
		//Pass settings - just in case its changed between session (Hence not set globally in this file)
		iisProc.restartSite(settings.getSettings());
	});

	//Push the commands
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