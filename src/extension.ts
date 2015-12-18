// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as iis from './IISExpress';

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
		let operatingSystem = os.type();
		
		//Uppercase string to ensure we match correctly
		operatingSystem = operatingSystem.toUpperCase();
		
		//New ES2015 includes as opposed to indexOf()
		if(!operatingSystem.includes('WINDOWS_NT')){
			vscode.window.showErrorMessage('You can only run this extension on Windows.');
			
			//Stop the extension from excuting anymore
			return;
		}

		//Check if we are in a folder/workspace & NOT just have a single file open
		const folderPath = vscode.workspace.rootPath;
		if(!folderPath){
			vscode.window.showErrorMessage('Please open a workspace directory first.');
			
			//Stop the extension from excuting anymore
			return;
		}
		
		//Let's check for two folder locations for IISExpress
		//32bit machines - 'C:\Program Files\IIS Express\iisexpress.exe'
		//64bit machines - 'C:\Program Files (x86)\IIS Express\iisexpress.exe'
		
		//'C:\Program Files (x86)'
		let programFilesPath = process.env.ProgramFiles;
		
		//Try to find IISExpress excutable - build up path to EXE
		programFilesPath = path.join(programFilesPath, 'IIS Express', 'iisexpress.exe');
		
		//Check if we can find the file path (get stat info on it)
		fs.stat(programFilesPath, (err, stats) =>{
			
			//err is undefinied & stats contains info on the file in an object if we find the file
			
			//ENOENT - File or folder not found
			if(err && err.code.toUpperCase() === 'ENOENT'){
				vscode.window.showErrorMessage(`We did not find a copy of IISExpress.exe at ${programFilesPath}`);
				
				//Stop the extension from excuting anymore
				//TODO: The return is exiting the fs.stat function not the extension
				return;
			}
			else if(err){
				//Some other error - maybe file permission or ...?
				vscode.window.showErrorMessage(`There was an error trying to find IISExpress.exe at ${programFilesPath} due to ${err.message}`);
				
				//Stop the extension from excuting anymore
				//TODO: The return is exiting the fs.stat function not the extension
				return;
			}
		});
		
		//OK done all the basic checks - lets run IISExpress
		
		//IISExpress command line arguments
		var args: iis.IExpressArguments = {
			path: folderPath,
			port: 5002
		};
		
		//Run IISExpress Class Contructor
		let iisProc = new iis.IIS(programFilesPath, args);
	
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
					iisProc.startWebsite();
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