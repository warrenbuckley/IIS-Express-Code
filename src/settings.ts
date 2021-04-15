import * as fs from 'fs';
import * as vscode from 'vscode';
import * as util from './util';

export interface Isettings {
    port: number;
    path: string;
    config?: string;
    url?: string;
    clr: clrVersion;
    protocol: protocolType;
}

export enum clrVersion {
    v40 = <any>"v4.0",
	v20 = <any>"v2.0"
}


export enum protocolType {
    http = <any>"http",
    https = <any>"https"
}

export async function getFolder():Promise<vscode.Uri | undefined> {

    // Check if we are in a workspace (where user added multiple folders)
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if(workspaceFolders !== undefined && workspaceFolders.length > 1){

        // User needs to decide which site they wish to start with the picker
        // *********** TODO: ERROR HANDLING IF USER PRESSES ESC KEY ***********
        const pickedFolder = await vscode.window.showWorkspaceFolderPick({ placeHolder: "Choose your site to start"});
        return pickedFolder?.uri;
    }
    else if(workspaceFolders !== undefined && workspaceFolders.length === 1) {
        // The user has only one folder open - so we don't need to prompt & can use the first item in the array
        return workspaceFolders[0].uri;
    }
    return undefined;
}

export function getSettings(uri:vscode.Uri| undefined):Isettings{
    // Give some default values
    let defaultSettings:Isettings = {
        port : getRandomPort(),
        path: './',
        clr: clrVersion.v40,
        protocol: protocolType.http
    };

    let settings:Isettings;

    // *******************************************
    // Checks that iisexpress.json exist
    // *******************************************

    if(uri === undefined){
        return defaultSettings;
    }

    const settingsFolderPath = vscode.Uri.joinPath(uri, ".vscode");
    const settingsFilePath = vscode.Uri.joinPath(settingsFolderPath, "iisexpress.json");


    // use -> https://www.npmjs.com/package/jsonfile
    let jsonfile = require('jsonfile');

    let fileExists = false;
    let folderExists = false;

    try {
        fileExists = fs.existsSync(settingsFilePath.fsPath);
    }
    catch(err){
        // Error checking if file exists
        // Maybe permissions or something else?
        vscode.window.showErrorMessage('Unable to check if .vscode/iisexpress.json config exists');
    }

    if(fileExists === false){
        // File does not exist lets create it

        // However we also need to verify that the directory exists as well
        // As writeFile does not create the directories if they do not exist
        try {
            folderExists = fs.existsSync(settingsFolderPath.fsPath);
        } catch (error) {
            // Error checking if folder exists
            // Maybe permissions or something else?
            vscode.window.showErrorMessage('Unable to check if .vscode folder exists');
        }

        if(folderExists === false){
            // Create the directory so the file can be written
            // create .vscode folder first

            try {
                fs.mkdirSync(settingsFolderPath.fsPath);
            } catch (error) {
                // Error creating the directory - again perhaps a permission error?
                vscode.window.showErrorMessage('Unable to create .vscode folder');
            }
        }

        // jsonfile.writeFile (does not create path/folder if it does not exist)
        // The dir should be available & thus able to now write the file
        jsonfile.writeFile(settingsFilePath.fsPath, defaultSettings, {spaces: 2}, function (jsonErr:string) {
            if(jsonErr){
                console.error(jsonErr);
                vscode.window.showErrorMessage('Error creating iisexpress.json file: ' + jsonErr);
            }
        });

        return defaultSettings;

    } else {
        // File exists lets read the settings from the JSON file then
        // read file .vscode\iisexpress.json and merge with defaults
        const fileSettings = jsonfile.readFileSync(settingsFilePath.fsPath);
        settings = {...defaultSettings, ...fileSettings};
        
        // Check if path to applicationhost.config file is defined in settings
        if(!settings.config){
            // Checks if local applicationhost.config file exists
            let localApplicatonHostConfig = getVSCodeLocalApplicationHostConfig(settingsFolderPath);

            if(localApplicatonHostConfig){
                // File exists
                // Add path to settings
                settings.config = localApplicatonHostConfig;
            }
        }

        return settings;
    }
}

function getVSCodeLocalApplicationHostConfig(vsCodeSettingsFolderUri:vscode.Uri){

    const apphostFilePath = vscode.Uri.joinPath(vsCodeSettingsFolderUri, "applicationhost.config");
    let fileExists = false;

    try {
        // Checks if local applicationhost.config file exists
        fileExists = fs.existsSync(apphostFilePath.fsPath);
    }
    catch(err){
        // Error checking if file exists
        // Maybe permissions or something else?
        vscode.window.showErrorMessage('Unable to automatically check if .vscode/applicationhost.config exists');
    }

    if(fileExists){
        // File exists
        // Return path to local applicationhost.config file
        return apphostFilePath.fsPath;
    }

    return "";
}

// IIS Express docs recommend ports greater than 1024
// http://www.iis.net/learn/extensions/using-iis-express/running-iis-express-without-administrative-privileges
export function getRandomPort():number{
    return util.getRandomIntInclusive(1024,44399);
}
