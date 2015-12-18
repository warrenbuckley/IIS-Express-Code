import * as vscode from 'vscode';
import * as process from 'child_process';

export interface IExpressArguments {
	path: string;
	port: number;
}

// TODO:
// * Serialise object to string array for cmd line args/switches?
// * New function to stopWebsite - Kills process
// * Tidy up code - remove events we do not need
// * Open up URL automagically - once process started
// * Test when VSCode quits that it kills the iisExpress process
// * Is there any events for on close etc on main app?

export class IIS {
	//public _iisProcess: process.ChildProcess;
	private _iisPath: string;
	private _args: IExpressArguments;
	
	constructor(iisPath: string, args: IExpressArguments){
		this._iisPath = iisPath;
		this._args = args;
		this._iisProcess = null;
	}
	
	
	private _iisProcess : process.ChildProcess;
	public get iisProcess() : process.ChildProcess {
		return this._iisProcess;
	}
	public set iisProcess(v : process.ChildProcess) {
		this._iisProcess = v;
	}
	
	
	public startWebsite(){
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
		
		//
		console.log('After init:' + this._iisProcess);
		
		//Attach all the events & functions to iisProcess
		this._iisProcess.stdout.on('data', (data) =>{
			console.log(`stdout: ${data}`);
		});
		
		this._iisProcess.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});
		
		this._iisProcess.on('error', (err:Error) => {
			console.log(`ERROR: ${err.message}`);
		});
		
		
		//When closing from systry following events occur
		//Not sure we need or can get rid of?
		//STDOUT End, iisProcess.exit then iisProcess.close
		this._iisProcess.stdout.on('end', (data) =>{
			console.log(`End: ${data}`);
		});
		
		this._iisProcess.on('exit', (code) =>{
			console.log(`Exit with code: ${code}`);
		});
		
		this._iisProcess.on('close', (code) =>{
			console.log(`Closing with code: ${code}`);
		});
		
		//Display Message
		vscode.window.showInformationMessage(`Running folder '${this._args.path}' as a website on http://localhost:${this._args.port}`);
	}
	
	public stopWebsite(){
		
		//Why is _iisProcess undefined/null?!
		//Thought with it being a prop on the class both methods could be able to retrieve it
		//So when we spawn it from startWebsite() it will have a val
		//That stopWebsite() could Kill it
		
		//Check what iisProcess here
		console.log(this._iisProcess);
		
		if(!this._iisProcess){
			vscode.window.showErrorMessage('No website currently running');
			
			//Stop function from running
			return;
		}
				
		//Kill the process
		this._iisProcess.kill('SIGINT');
		
		//Display Message
		vscode.window.showInformationMessage(`Stopped running folder '${this._args.path}' as a website on http://localhost:${this._args.port}`);
	}
}
