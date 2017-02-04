import * as vscode from 'vscode';
import * as process from 'child_process';
import * as settingsHelpers from './settings';
var iconv=require('iconv-lite')

export interface IExpressArguments {
	path?: string;
	port?: number;
	clr?: string;
}

// TODO:
// * Tidy up code - remove events we do not need

export class IIS {
	private _iisProcess: process.ChildProcess;
	private _iisPath: string;
	private _args: IExpressArguments;
	private _output: vscode.OutputChannel;
	private _statusbar: vscode.StatusBarItem;
	private _statusMessage: string;

	constructor(iisPath: string, args: IExpressArguments){
		this._iisPath = iisPath;
		this._args = args;
	}
	
	public startWebsite(): process.ChildProcess{
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
        
		//settings
		var settings = settingsHelpers.getSettings();

        //Get IIS Port Number from config file
        this._args.port = settings.port;
		
		//Folder to run as the arg
		this._args.path = settings.path ? settings.path : vscode.workspace.rootPath;

		//CLR version, yes there are still people on 3.5
		this._args.clr = settings.clr;	

		//This is the magic that runs the IISExpress cmd
		this._iisProcess = process.spawn(this._iisPath, [`-path:${this._args.path}`,`-port:${this._args.port}`,`-clr:${this._args.clr}`]);
		console.log(`stdout: Command with Params ${this._iisPath} ${[`-path:${this._args.path}`,`-port:${this._args.port}`,`-clr:${this._args.clr}`].join(' ')}`);
		//Create output channel & show it
		this._output = this._output || vscode.window.createOutputChannel('IIS Express');
		this._output.show(vscode.ViewColumn.Three);
		
		//Create Statusbar item & show it
		this._statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		//Set props on statusbar & show it
		this._statusbar.text = `$(browser) http://localhost:${this._args.port}`;
		this._statusMessage = `Running folder '${this._args.path}' as a website on http://localhost:${this._args.port} on CLR: ${this._args.clr}`;
		this._statusbar.tooltip = this._statusMessage;
		this._statusbar.command = 'extension.iis-express.open';
		this._statusbar.show();
		
        //Open browser
		this.openWebsite();
		
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

	public openWebsite(){

		//If we do not have an iisProcess running
		if(!this._iisProcess){
			vscode.window.showErrorMessage('No website currently running');
			
			//Stop function from running
			return;
		}

		//Uses the 'start' command & url to open default browser
		let browser = process.exec(`start http://localhost:${this._args.port}`);
	}

	public restartSite(){
		//If we do not have an iisProcess/website running
		if(!this._iisProcess){
			//Then just do a start site...
			this.startWebsite();
		}
		else {
			//It's already running so stop it first then, start it
			this.stopWebsite();
			this.startWebsite();
		}

	}
	
    private decode2gbk(data) {
		var buffer = new Buffer(data);
 		return iconv.decode(buffer, 'gbk');
	}
    
}
