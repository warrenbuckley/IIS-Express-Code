import * as vscode from 'vscode';
import * as process from 'child_process';

export interface IExpressArguments {
	path: string;
	port: number;
}

// TODO:
// * Tidy up code - remove events we do not need
// * Open up URL automagically - once process started

export class IIS {
	private _iisProcess: process.ChildProcess;
	private _iisPath: string;
	private _args: IExpressArguments;
	private _output: vscode.OutputChannel;
	private _statusbar: vscode.StatusBarItem;
	
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
		
		//This is the magic that runs the IISExpress cmd
		this._iisProcess = process.spawn(this._iisPath, [`-path:${this._args.path}`,`-port:${this._args.port}`]);
		
		//Create output channel & show it
		this._output = vscode.window.createOutputChannel('IIS Express');
		this._output.show(vscode.ViewColumn.Three);
		
		//Create Statusbar item & show it
		this._statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		
		//Set props on statusbar & show it
		this._statusbar.text = `$(browser) http://localhost:${this._args.port}`;
		this._statusbar.tooltip = `Running folder '${this._args.path}' as a website on http://localhost:${this._args.port}`;
		this._statusbar.command = 'extension.iis-express';
		this._statusbar.show();
		
        //Open Browser
        let browser = process.exec(`start http://localhost:${this._args.port}`);
		
		//Attach all the events & functions to iisProcess
		this._iisProcess.stdout.on('data', (data) =>{
			this._output.appendLine(data);
			console.log(`stdout: ${data}`);
		});
		
		this._iisProcess.stderr.on('data', (data) => {
			this._output.appendLine(`stderr: ${data}`);
			console.log(`stderr: ${data}`);
		});
		
		this._iisProcess.on('error', (err:Error) => {
			this._output.appendLine(`ERROR: ${err.message}`);
			console.log(`ERROR: ${err.message}`);
		});
		
		
		//Display Message
		vscode.window.showInformationMessage(`Running folder '${this._args.path}' as a website on http://localhost:${this._args.port}`);
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
		
		//Clear the output log
		this._output.clear();
        this._output.hide();
        this._output.dispose();
		
		//Remove the statusbar item
		this._statusbar.hide();
		this._statusbar.dispose();
		
	}
}
