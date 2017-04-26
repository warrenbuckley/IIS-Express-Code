import * as vscode from 'vscode';
import * as process from 'child_process';
import * as path from "path";
import * as settings from './settings';
var iconv=require('iconv-lite')

export interface IExpressArguments {
	path?: string;
	port?: number;
	clr?: settings.clrVersion;
	protocol?: settings.protocolType;
}

// TODO:
// * Tidy up code - remove events we do not need

export class IIS {
	private _iisProcess: process.ChildProcess;
	private _iisPath: string;
	private _iisAppCmdPath: string;
	private _args: IExpressArguments;
	private _output: vscode.OutputChannel;
	private _statusbar: vscode.StatusBarItem;
	private _statusMessage: string;

	constructor(iisPath: string, appCmdPath: string, args: IExpressArguments){
		this._iisPath = iisPath;
		this._iisAppCmdPath = appCmdPath; 
		this._args = args;
	}
	
	public startWebsite(options?: settings.Isettings): process.ChildProcess{
		//Need to run this command
		//iisexpress /path:app-path [/port:port-number] [/clr:clr-version] [/systray:boolean]
		//isexpress /path:c:\myapp\ /port:5005
		
		//Verify process not already running, so if we have a PID (process ID) it's running
		//TODO: NOT WORKING?! - So it re-runs & moans that port in use
		if(this._iisProcess != undefined){
			//Display error message that it's already running
			vscode.window.showErrorMessage('IISExpress is already running');
			
			//Stop the method/function from running
			return;
		}
        
        //Get IIS Port Number from config file
        this._args.port = options.port;
		
		//Folder to run as the arg
		this._args.path = options.path ? options.path : vscode.workspace.rootPath;

		//CLR version, yes there are still people on 3.5
		this._args.clr = options.clr ? options.clr : settings.clrVersion.v40;

		this._args.protocol = options.protocol ? options.protocol : settings.protocolType.http;

		//Create output channel & show it
		this._output = this._output || vscode.window.createOutputChannel('IIS Express');
		this._output.show(vscode.ViewColumn.Three);

		//Its the folder name (with some illegal chars removed)
		//TODO: Need to get the comma's removed
		var siteName = vscode.workspace.rootPath.split(path.sep).join().replace(' ', '_').replace(':', '_').replace(',', '_');

		//TODO - Could maybe move this to iisexpress cmd line exit event (so we tidy up on way out)
		//Delete any existing entries for the site using appcmd
		//Not done as async - so we wait until this command completes
		try {
			process.execFileSync(this._iisAppCmdPath, ['delete', 'site', `-name:${siteName}`]);
		} catch (error) {
			console.log(error);
		}


		//Add the site to the config (which will invoke/run from iisexpress cmd line)
		//Not done as async - so we wait until this command completes
		try {
			process.execFileSync(this._iisAppCmdPath, ['add', 'site', `-name:${siteName}`, `-bindings:${this._args.protocol}://localhost:${this._args.port}`, `-physicalPath:${this._args.path}`]);
		} catch (error) {
			console.log(error);
		}

		

		//TODO: Add the correct AppPool based on CLR Version to run
		//appcmd set app /app.name: Website1/ /applicationPool:Clr4IntegratedAppPool
		//appcmd set app /app.name: Website1/ /applicationPool:Clr2IntegratedAppPool


		//This is the magic that runs the IISExpress cmd
		this._iisProcess = process.spawn(this._iisPath, [`-site:${vscode.workspace.rootPath.replace(' ', '_')}`]);
		
		//Create Statusbar item & show it
		this._statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		//Set props on statusbar & show it
		this._statusbar.text = `$(browser) ${options.protocol}://localhost:${this._args.port}`;
		this._statusMessage = `Running folder '${this._args.path}' as a website on ${options.protocol}://localhost:${this._args.port} on CLR: ${this._args.clr}`;
		this._statusbar.tooltip = this._statusMessage;
		this._statusbar.command = 'extension.iis-express.open';
		this._statusbar.show();

        //Open browser
		this.openWebsite(options);
		
		
		//Attach all the events & functions to iisProcess
		this._iisProcess.stdout.on('data', (data) =>{
			var data=this.decode2gbk(data);
			this._output.appendLine(data);
			console.log(`stdout: ${data}`);
		});
		
		this._iisProcess.stderr.on('data', (data) => {
			var data=this.decode2gbk(data);
			this._output.appendLine(`stderr: ${data}`);
			console.log(`stderr: ${data}`);
		});
		
		this._iisProcess.on('error', (err:Error) => {
			var message=this.decode2gbk(err.message);
			this._output.appendLine(`ERROR: ${message}`);
			console.log(`ERROR: ${message}`);
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
		
		//Kill the process
		this._iisProcess.kill('SIGINT');
        this._iisProcess = undefined;
		
		//Clear the output log
		this._output.clear();
        this._output.hide();
        this._output.dispose();
		
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
			//TODO - PASS IN PROTOCOL
			let browser = process.exec(`start http://localhost:${this._args.port}/${startUrl}`);
    	} else {
			//Uses the 'start' command & url to open default browser
			//TODO - PASS IN PROTOCOL
			let browser = process.exec(`start http://localhost:${this._args.port}`);
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
	
    private decode2gbk(data) {
		var buffer = new Buffer(data);
 		return iconv.decode(buffer, 'gbk');
	}
    
}
