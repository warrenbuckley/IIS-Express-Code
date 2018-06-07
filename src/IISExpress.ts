import * as vscode from 'vscode';
import * as process from 'child_process';
import * as path from "path";
import * as settings from './settings';

//External libraries
let uuidV4 = require('uuid/v4');
let iconv=require('iconv-lite');

export interface IExpressArguments {
	path?: string;
	port?: number;
	clr?: settings.clrVersion;
	protocol?: settings.protocolType;
}

// TODO:
// * Tidy up code - remove events we do not need

export class IIS {
	private _iisProcess!: process.ChildProcess | undefined;
	private _iisPath: string;
	private _iisAppCmdPath: string;
	private _args: IExpressArguments;
	private _output!: vscode.OutputChannel | null;
	private _statusbar!: vscode.StatusBarItem;
	private _statusMessage!: string;

	constructor(iisPath: string, appCmdPath: string, args: IExpressArguments){
		this._iisPath = iisPath;
		this._iisAppCmdPath = appCmdPath; 
		this._args = args;
	}
	
	public startWebsite(options?: settings.Isettings) {
		
		//Verify process not already running, so if we have a PID (process ID) it's running
		if(this._iisProcess !== undefined){
			//Display error message that it's already running
			vscode.window.showErrorMessage('IISExpress is already running');
			
			//Stop the method/function from running
			return;
		}

		
		if(!options){
			vscode.window.showErrorMessage('No options found');
			return;
		}

        //Get IIS Port Number from config file
        this._args.port = options.port;
		
		//Folder to run as the arg
		this._args.path = options.path ? options.path : vscode.workspace.rootPath;

		//CLR version, yes there are still people on 3.5 & default back to v4 if not set
		this._args.clr = options.clr ? options.clr : settings.clrVersion.v40;

		//If no protocol set fallback to http as opposed to https
		this._args.protocol = options.protocol ? options.protocol : settings.protocolType.http;

		//Create output channel & show it
		this._output = this._output || vscode.window.createOutputChannel('IIS Express');
		this._output.show(vscode.ViewColumn.Three);

		//Site name is the name of the workspace folder & GUID/UUID
		//Need to append a UUID as could have two folders/sites with same name
		var siteName = path.basename(vscode.workspace.rootPath as string) + "-" + uuidV4();

		//If user is using HTTPS & port not in range of auto-approved port numbers (44300-44399)
		//Then display an error & stop process
		if(this._args.protocol === settings.protocolType.https && (this._args.port >= 44300 && this._args.port <=44399) === false){
			//Using HTTPS but not using a port within the range that supports SSL
			vscode.window.showErrorMessage('When using HTTPS you need to use ports 44300 - 44399 in .vscode/iisexpress.json');
			
			//Stop the method/function from running
			return;
		}


		//Add the site to the config (which will invoke/run from iisexpress cmd line)
		//Not done as async - so we wait until this command completes
		try {
			process.execFileSync(this._iisAppCmdPath, ['add', 'site', `-name:${siteName}`, `-bindings:${this._args.protocol}://localhost:${this._args.port}`, `-physicalPath:${this._args.path}`]);
		} catch (error) {
			console.log(error);
		}
		
		//Based on the CLR chosen use the correct built in AppPools shipping with IISExpress
		var appPool = this._args.clr === settings.clrVersion.v40 ? "Clr4IntegratedAppPool" : "Clr2IntegratedAppPool";

		//Assign the apppool to the site
		//appcmd set app /app.name:Site-Staging-201ec232-2906-4052-a431-727ec57b5b2e/ /applicationPool:Clr2IntegratedAppPool
		try {
			process.execFileSync(this._iisAppCmdPath, ['set', 'app', `/app.name:${siteName}/`, `/applicationPool:${appPool}`]);
		} catch (error) {
			console.log(error);
		}

		
		

		//This is the magic that runs the IISExpress cmd from the appcmd config list
		this._iisProcess = process.spawn(this._iisPath, [`-site:${siteName}`]);
		
		//Create Statusbar item & show it
		this._statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		//Set props on statusbar & show it
		this._statusbar.text = `$(browser) ${this._args.protocol}://localhost:${this._args.port}`;
		this._statusMessage = `Running folder '${this._args.path}' as a website on ${this._args.protocol}://localhost:${this._args.port} on CLR: ${this._args.clr}`;
		this._statusbar.tooltip = this._statusMessage;
		this._statusbar.command = 'extension.iis-express.open';
		this._statusbar.show();

        //Open browser
		this.openWebsite(options);
		
		
		//Attach all the events & functions to iisProcess
		this._iisProcess.stdout.on('data', (data: string) =>{
			data = this.decode2gbk(data);
			this._output!.appendLine(data);
		});
		
		this._iisProcess.stderr.on('data', (data: string) => {
			data = this.decode2gbk(data);
			this._output!.appendLine(`stderr: ${data}`);
		});
		
		this._iisProcess.on('error', (err:Error) => {
			var message = this.decode2gbk(err.message);
			this._output!.appendLine(`ERROR: ${message}`);
		});

		this._iisProcess.on('close', () =>{

			//Tidying up - so we remove the entry from appcmd
			//As we use a uuid every time we start a site we need to do housekeeping & clean up
			//When we are finished - this happens for:

			//* Will happen when users stops with CTRL+F5
			//* Close from the systray icon
			//* Restart of site

			//Delete any existing entries for the site using appcmd
			//Not done as async - so we wait until this command completes
			try {
				process.execFileSync(this._iisAppCmdPath, ['delete', 'site', `${siteName}`]);
			} catch (error) {
				console.log(error);
			}
		});


		//Display Message
		vscode.window.showInformationMessage(this._statusMessage);
	}
	
	public stopWebsite(){
		
		//If we do not have an iisProcess running
		if(!this._iisProcess){
			vscode.window.showErrorMessage('No website currently running');
			
			//Stop function from running
			return;
		}
		
		//Kill the process - which will also hook into the exit event to remove the config entry
		this._iisProcess.kill('SIGINT');
        this._iisProcess = undefined;
		
		//Clear the output log
		this._output!.clear();
        this._output!.hide();
        this._output!.dispose();
		this._output = null;

		//Remove the statusbar item
		this._statusbar.hide();
		this._statusbar.dispose();
		
	}

	public openWebsite(options?: settings.Isettings){

		//If we do not have an iisProcess running
		if(!this._iisProcess){
			vscode.window.showErrorMessage('No website currently running');
			
			//Stop function from running
			return;
		}

		
		if (options && options.url) {
			//We have a starting URL set - but lets ensure we strip starting / if present
			let startUrl = options.url.startsWith('/') ? options.url.substring(1) : options.url;

			//Start browser with start url
			process.exec(`start ${this._args.protocol}://localhost:${this._args.port}/${startUrl}`);
    	} else {
			//Uses the 'start' command & url to open default browser
			process.exec(`start ${this._args.protocol}://localhost:${this._args.port}`);
		}
	}

	public restartSite(options? : settings.Isettings){
		//If we do not have an iisProcess/website running
		if(!this._iisProcess){
			//Then just do a start site...
			this.startWebsite(options);
		}
		else {
			//It's already running so stop it first then, start it
			this.stopWebsite();
			this.startWebsite(options);
		}

	}
	
    private decode2gbk(data: string): string {
		var buffer = new Buffer(data);
 		return iconv.decode(buffer, 'gbk');
	}
    
}
