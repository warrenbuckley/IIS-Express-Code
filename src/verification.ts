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


export async function checkForProblems():Promise<verification>{

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




    const iisPath = await getConfigValue('iisexpress.iisExpressPath', 'iisexpress.exe');
    const appCmdPath = await getConfigValue('iisexpress.appcmdPath', 'appcmd.exe');

    if(iisPath !== null && appCmdPath !== null){
        results.iisExists = true;
        results.programPath = iisPath;
        results.appCmdProgramPath = appCmdPath;

        return results;
    }

    //Prompt user - so they opt in to installing IIS Express
    vscode.window.showWarningMessage(`We could not find IIS Express. Would you like us to install it for you?`, 'Yes Please', 'No Thanks').then(selection => {
        switch(selection){
            case 'Yes Please':
                // Kick in to auto-pilot
                install.DoMagicInstall();
                break;

            case 'No Thanks':
                // Open a browser to the IIS 10 Express download page for them to do it themselves
                install.OpenDownloadPage();
                break;

            default:
                // Do nothing for now (Assume they clicked close on message)
        }
    });

    results.iisExists = false;
    results.programPath = '';
    results.appCmdProgramPath = '';

    return results;
}


async function getConfigValue(configKey:string, fileName:string):Promise<string | null> {
    const config = vscode.workspace.getConfiguration();
    let configValue = <string>config.get(configKey);

    // It's null or an empty string
    if(configValue === null || configValue.length === 0){
        // Go and attempt to get it based on convetion from program path

        // Let's check for two folder locations for IISExpress
        // 64bit machines - 'C:\Program Files\IIS Express\iisexpress.exe'
        // 32bit machines - 'C:\Program Files (x86)\IIS Express\iisexpress.exe'

        // 'C:\Program Files (x86)' or 'C:\Program Files\'
        const programFilesPath = <string>process.env.ProgramFiles;

        // Try to find IISExpress excutable - build up path to EXE
        const conventionFilePath = path.join(programFilesPath, 'IIS Express', fileName);

        // Verify we can find the exe on disk
        try {
            // Check if we can find the file path (get stat info on it)
            fs.statSync(conventionFilePath);

            // Add the convetion path to global config
            // So we can fetch from config next time
            await config.update(configKey, conventionFilePath, vscode.ConfigurationTarget.Global);

            // Return the path we found
            return conventionFilePath;
        }
        catch {
            // In the case of trying to find the convention path
            // We may not have it installed at all so we need to offer to auto install it
            return null;
        }
    }

    // Check if value in config path ends with filename
    if(configValue.endsWith(fileName) === false){
        await vscode.window.showErrorMessage(`Please check your VSCode Global configuration for ${configKey} as the path does not end with ${fileName}`, { modal: true });
        return null;
    }

    // We have a value set in the config
    // Try and verify its existance
    try{
         // Check if we can find the file path (get stat info on it)
         fs.statSync(configValue);
         return configValue;
    }
    catch {
        // User has definied or changed the config key and we are unable to find the file at that location
        // Lets show an error
        await vscode.window.showErrorMessage(`Unable to find ${fileName} at the location ${configValue} set in ${configKey} configuration key`, { modal: true });
        return null;
    }
}