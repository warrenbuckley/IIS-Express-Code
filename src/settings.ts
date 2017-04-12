import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export interface Isettings {
    port: number;
    path: string;
    url?: string;
    clr: clrVersion;
    protocol: protocol;
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
    //Give some default values
    let settings:Isettings = {
        port : getRandomPort(),
        path: vscode.workspace.rootPath,
        clr: clrVersion.v40,
        protocol: protocolType.http
    };
    
    // *******************************************
    // Checks that iisexpress.json exist
    // *******************************************
    let settingsFolderPath = vscode.workspace.rootPath + "\\.vscode";
	let settingsFilePath = settingsFolderPath + "\\iisexpress.json";

    
    //use -> https://www.npmjs.com/package/jsonfile
    var jsonfile = require('jsonfile');
    
    try {
        //Check if we can find the iisexpress config file from the path (get stat info on it)
        let fileCheck = fs.statSync(settingsFilePath);
        
        //read file .vscode\iisexpress.json and overwrite port property from iisexpress.json
        settings = jsonfile.readFileSync(settingsFilePath);
    }
    catch (err) {
        //file didn't exist so
        //create .vscode folder first
        fs.mkdirSync(settingsFolderPath);
        
        //jsonfile.writeFile (does not create path/folder if it does not exist)
        //The dir should be available & thus able to now write the file
       	jsonfile.writeFile(settingsFilePath, settings, {spaces: 2}, function (jsonErr) {
            if(jsonErr){
                console.error(jsonErr);
                vscode.window.showErrorMessage('Error creating iisexpress.json file: ' + jsonErr);
            }
        });
    }
    
    //Return an object back from verifications
    return settings;
    
}


//IIS Express docs recommend ports greater than 1024
//http://www.iis.net/learn/extensions/using-iis-express/running-iis-express-without-administrative-privileges
export function getRandomPort():number{
    return getRandomIntInclusive(1024,44399);
}


// Returns a random integer between min (included) and max (included)
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomIntInclusive(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}