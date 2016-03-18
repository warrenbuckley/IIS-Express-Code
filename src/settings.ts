import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

interface Isettings {
    port: number;
}


export function getSettings():Isettings{
    //Give some default values
    let settings:Isettings = {
        port : getRandomPort()
    };
    
    // *******************************************
    // Checks that iisexpress.json exist
    // *******************************************
	let settingsFilePath = vscode.workspace.rootPath + "\\.vscode\\iisexpress.json";
    
    //use -> https://www.npmjs.com/package/jsonfile
    var jsonfile = require('jsonfile');
    
    try {
        //Check if we can find the file path (get stat info on it)
        let fileCheck = fs.statSync(settingsFilePath);
        
        //read file .vscode\iisexpress.json and overwrite port property from iisexpress.json
        settings = jsonfile.readFileSync(settingsFilePath);
    }
    catch (err) {
        //file didn't exist so
        //create .vscode\iisexpress.json and append settings object
       	jsonfile.writeFile(settingsFilePath, settings, {spaces: 2}, function (err) {
            console.error(err);
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