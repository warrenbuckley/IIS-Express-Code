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
    

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('extension.iis-express', () => {
		// The code you place here will be executed every time your command is executed
		
        //Stop extension from running if we did not pass checks
        if(!verification || !verification.isValidOS || !verification.folderIsOpen || !verification.iisExists){
            //Stop the extension from running
            return;
        }
        
		//Quick Pick (Dropdown item/s to start or stop the IIS Express cmd line process)
		let quickPickItems: vscode.QuickPickItem[] = [
			{
				label: 'Start Website',
				description: 'Run IISExpress site from this current folder'
			},
			{
				label: 'Stop Website',
				description: 'Stop the curently running IISExpress site from this current folder'
			}
		];
		
		
		//Show the quick pick items & decide what we do based on what item selected
		vscode.window.showQuickPick(quickPickItems).then(result => {
			
			//It's possible to press escape & cancel quick pick selector
			if(!result){
				vscode.window.showErrorMessage('No item chosen, quiting.');
				
				//Stop the extension from excuting anymore
				return
			}
			
			//Depending on what item select is what function/method we call on our class
			switch (result.label.toUpperCase()) {
				case 'START WEBSITE':
					let proc = iisProc.startWebsite();
					break;
			
				case 'STOP WEBSITE':
					iisProc.stopWebsite();
					break;
			
				default:
					break;
			}
		});

	});
	
	context.subscriptions.push(disposable);
}

//this method is called when your extension is deactivated
export function deactivate() {
}