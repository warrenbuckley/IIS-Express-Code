import * as fs from 'fs';
import * as vscode from 'vscode';
import * as util from './util';

export interface Isettings {
    port: number;
    path: string;
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

export function getSettings():Isettings{
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
    let settingsFolderPath = vscode.workspace.rootPath + "\\.vscode";
	let settingsFilePath = settingsFolderPath + "\\iisexpress.json";


    // use -> https://www.npmjs.com/package/jsonfile
    let jsonfile = require('jsonfile');

    let fileExists = false;
    let folderExists = false;

    try {
        fileExists = fs.existsSync(settingsFilePath);
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
            folderExists = fs.existsSync(settingsFolderPath);
        } catch (error) {
            // Error checking if folder exists
            // Maybe permissions or something else?
            vscode.window.showErrorMessage('Unable to check if .vscode folder exists');
        }

        if(folderExists === false){
            // Create the directory so the file can be written
            // create .vscode folder first

            try {
                fs.mkdirSync(settingsFolderPath);
            } catch (error) {
                // Error creating the directory - again perhaps a permission error?
                vscode.window.showErrorMessage('Unable to create .vscode folder');
            }
        }

        // jsonfile.writeFile (does not create path/folder if it does not exist)
        // The dir should be available & thus able to now write the file
        jsonfile.writeFile(settingsFilePath, defaultSettings, {spaces: 2}, function (jsonErr:string) {
            if(jsonErr){
                console.error(jsonErr);
                vscode.window.showErrorMessage('Error creating iisexpress.json file: ' + jsonErr);
            }
        });

        return defaultSettings;

    } else {
        // File exists lets read the settings from the JSON file then
        // read file .vscode\iisexpress.json and merge with defaults
        const fileSettings = jsonfile.readFileSync(settingsFilePath);
        settings = {...defaultSettings, ...fileSettings};
        return settings;
    }
}


// IIS Express docs recommend ports greater than 1024
// http://www.iis.net/learn/extensions/using-iis-express/running-iis-express-without-administrative-privileges
export function getRandomPort():number{
    return util.getRandomIntInclusive(1024,44399);
}