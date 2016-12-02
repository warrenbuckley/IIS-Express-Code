import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as settingsHelpers from './settings';

interface verification {
    isValidOS: boolean;
    folderIsOpen: boolean;
    iisExists: boolean;
    programPath: string;
}


export function checkForProblems():verification{

    //Give some default values
    let results:verification = {
        isValidOS: false,
        folderIsOpen: false,
        iisExists:false,
        programPath: ''
    };
    
    // *******************************************
    // Check if we are on Windows and not OSX
    // *******************************************
    
	//Type = 'WINDOWS_NT'
	let operatingSystem = os.type();
	
	//Uppercase string to ensure we match correctly
	operatingSystem = operatingSystem.toUpperCase();
	
	//New ES2015 includes as opposed to indexOf()
	if(!operatingSystem.includes('WINDOWS_NT')){
		vscode.window.showErrorMessage('You can only run this extension on Windows.');
		
        results.isValidOS = false;
	} 
    else {
        
        //Is Valid & Passes - we are on Windows
        results.isValidOS = true;
    }
    
    
    // *******************************************
    // Checks that VS Code is open with a folder 
    // *******************************************
    
    //Get the path of the folder that is open in VS Code
    const folderPath = vscode.workspace.rootPath;
    
    
    //Check if we are in a folder/workspace & NOT just have a single file open
	if(!folderPath){
		vscode.window.showErrorMessage('Please open a workspace directory first.');
		
        //We are not a folder
        results.folderIsOpen = false;
	} 
    else {
        results.folderIsOpen = true;
    }
    
    
    
    
    // *******************************************
    // Verify IIS Express excutable Exists
    // *******************************************
 
    //Let's check for two folder locations for IISExpress
	//32bit machines - 'C:\Program Files\IIS Express\iisexpress.exe'
	//64bit machines - 'C:\Program Files (x86)\IIS Express\iisexpress.exe'
	
	//'C:\Program Files (x86)'
	let programFilesPath = process.env.ProgramFiles;
	
	//Try to find IISExpress excutable - build up path to EXE
	programFilesPath = path.join(programFilesPath, 'IIS Express', 'iisexpress.exe');
	
    try {
        //Check if we can find the file path (get stat info on it)
        let fileCheck = fs.statSync(programFilesPath);
    
        results.iisExists = true;
        results.programPath = programFilesPath;
    }
    catch (err) {
       	//ENOENT - File or folder not found
		if(err && err.code.toUpperCase() === 'ENOENT'){
			vscode.window.showErrorMessage(`We did not find a copy of IISExpress.exe at ${programFilesPath}`);
        }
		else if(err){
			//Some other error - maybe file permission or ...?
			vscode.window.showErrorMessage(`There was an error trying to find IISExpress.exe at ${programFilesPath} due to ${err.message}`);
		}
       
       
        results.iisExists = false;
        results.programPath = null;
    }
    
    
    //Return an object back from verifications
    return results;
    
}