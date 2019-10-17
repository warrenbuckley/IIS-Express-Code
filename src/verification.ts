import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as install from './install';


interface verification {
    isValidOS: boolean;
    folderIsOpen: boolean;
    iisExists: boolean;
    programPath: string;
    appCmdProgramPath: string;
}


export function checkForProblems():verification{

    //Give some default values
    let results:verification = {
        isValidOS: false,
        folderIsOpen: false,
        iisExists:false,
        programPath: '',
        appCmdProgramPath: ''
    };
    
    // *******************************************
    // Check if we are on Windows and not OSX
    // *******************************************
    
	//Type = 'Windows_NT', 'Darwin', 'Linux' (WSL)
	let operatingSystem = os.type();
	let operatingSystemRelease = os.release().toLowerCase();
	
	//Uppercase string to ensure we match correctly
	operatingSystem = operatingSystem.toUpperCase();
	
	// New ES2015 includes as opposed to indexOf()
    if(operatingSystem.includes('DARWIN') || (operatingSystem.includes('LINUX') && !operatingSystemRelease.includes('microsoft'))) {
		vscode.window.showErrorMessage(`You can only run this extension on Windows and WLS. (${operatingSystem})`);
        results.isValidOS = false;
	} else {
        
        //Is Valid & Passes - we are on Windows
        results.isValidOS = true;
    }
    results.isValidOS = true;
    
    
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
 
    try {
        // Try to find IISExpress excutable at typical locations
        const programFilesPath = [
            'C:/Program Files/',
            'C:/Program Files (x86)/',
            '/mnt/c/Program Files/',
            '/mnt/c/Program Files (x86)/',
        ].find(pathEl => fs.existsSync(pathEl));

        if(programFilesPath) {
            // build up path to EXE
            let iisPath = path.join(programFilesPath, 'IIS Express', 'iisexpress.exe');
            
            results.iisExists = true;
            results.programPath = iisPath;
            results.appCmdProgramPath = path.join(programFilesPath, 'IIS Express', 'appcmd.exe');
            
        } else {
            // Prompt user - so they opt in to installing IIS Express
            vscode.window.showWarningMessage(`We could not find IIS Express. Would you like us to install it for you?`, 'Yes Please', 'No Thanks').then(selection => {
                switch(selection){
                    case 'Yes Please':
                        //Kick in to auto-pilot
                        install.DoMagicInstall();
                        break;

                    case 'No Thanks':
                        //Open a browser to the IIS 10 Express download page for them to do it themselves
                        install.OpenDownloadPage();
                        break;

                    default:
                        //Do nothing for now (Assume they clicked close on message)
                }
            });
        
            results.iisExists = false;
            results.programPath = "";
        }
    } catch(err) {
        results.iisExists = false;
        results.programPath = "";

        vscode.window.showErrorMessage(`There was an error trying to find IISExpress.exe due to ${err.message}`);
    }
    
    
    //Return an object back from verifications
    return results;
    
}