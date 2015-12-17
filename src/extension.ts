// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "iis-express" is now active!'); 

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('extension.iis-express', () => {
		// The code you place here will be executed every time your command is executed

		//Check if we are on Windows and not OSX
		//Type = 'WINDOWS_NT'
		//Platform = 'win32'
		let operatingSystem = os.platform();
		let oSys = os.type();

		//Check if we are in a folder/workspace & NOT just have a single file open
		let folderPath = vscode.workspace.rootPath;
		if(!folderPath){
			vscode.window.showErrorMessage('Please open a workspace directory first.');
			
			//Stop the extension from excuting anymore
			return;
		}
		
		
		
		

	});
	
	context.subscriptions.push(disposable);
}