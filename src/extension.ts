// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';


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
		let folderPath = vscode.workspace.rootPath;
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
		
		//Check if we have access to the file/path & ensure this process can excute it
		fs.access(programFilesPath, fs.X_OK, err => {
			
			//If found we get err as undefinied
			console.log(err ? 'no access!' : 'can read/write');
		});
		
		fs.stat(programFilesPath, (err, stats) =>{
			
			//Err for not found file
			//& stats is null/undefinied if not found
			
			console.log(err);
			console.log(stats);
		});
		
		// 
		// if(!iisExpress){
		// 	//The object is empty - so means we did not find the EXE on the machines
		// 	//Using new ES2015 string concatantion 
		// 	vscode.window.showErrorMessage(`We did not find a copy of IISExpress.exe at ${programFilesPath}`);
		// 	
		// 	//Stop the extension from excuting anymore
		// 	return;
		// }
		
		
		
		

	});
	
	context.subscriptions.push(disposable);
}