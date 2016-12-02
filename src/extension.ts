// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as iis from './IISExpress';
import * as verify from './verification';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    
    //Begin checks of OS, IISExpress location etc..
    let verification = verify.checkForProblems();

    //IISExpress command line arguments
    let args: iis.IExpressArguments = {
        path: verification.folderPath
    };

    //Run IISExpress Class Contructor
    let iisProc = new iis.IIS(verification.programPath, args);
    

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var startSite = vscode.commands.registerCommand('extension.iis-express.start',() => {
 		
		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Start Website...
		iisProc.startWebsite();
	});

	//Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var stopSite = vscode.commands.registerCommand('extension.iis-express.stop',() => {
 		
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
 		
		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Open site in browser - this will need to check if site is running first...
		iisProc.openWebsite();
	});

    //Registering a command so we can assign a direct keybinding to it (without opening quick launch)
	var restartSite = vscode.commands.registerCommand('extension.iis-express.restart',() => {
 		
		 //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }

		//Open site in browser - this will need to check if site is running first...
		iisProc.restartSite();
	});

	//Push the commands
	context.subscriptions.push(startSite, stopSite, openSite, restartSite);
}

//this method is called when your extension is deactivated
export function deactivate() {
}