import * as vscode from 'vscode';
import * as process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as settings from './settings';
import * as telemtry from './telemetry';

// External libraries
import { v4 as uuidv4 } from 'uuid';
import * as iconv from 'iconv-lite';
import TelemetryReporter from 'vscode-extension-telemetry';


export interface IExpressArguments {
	path: string;
	port: number;
	clr: settings.clrVersion;
	protocol: settings.protocolType;
}

export class IISExpress {
	private _iisProcess!: process.ChildProcessWithoutNullStreams;
	private _iisPath: string;
	private _iisAppCmdPath: string;
	private _args!: IExpressArguments;
	private _output!: vscode.OutputChannel | null;
	private _statusbar!: vscode.StatusBarItem;
	private _statusMessage!: string;
	private _context: vscode.ExtensionContext;
	private _reporter: TelemetryReporter;

	constructor(iisPath: string, appCmdPath: string, context:vscode.ExtensionContext, reporter:TelemetryReporter){
		this._iisPath = iisPath;
		this._iisAppCmdPath = appCmdPath;
		this._context = context;
		this._reporter = reporter;
	}

	public startWebsite(options: settings.Isettings, workspaceFolder: vscode.Uri) {

		// Verify process not already running, so if we have a PID (process ID) it's running
		if(this._iisProcess !== undefined && this._iisProcess.killed === false){
			// Display error message that it's already running
			vscode.window.showErrorMessage('IIS Express is already running',{modal: true});

			// Stop the method/function from running
			return;
		}

		if(!options){
			vscode.window.showErrorMessage('No options found in .vscode/iisexpress.json',{modal: true});

			// Stop the method/function from running
			return;
		}

		this._args = {
			// Get IIS Port Number from config file
			port: options.port,

			// Folder to run as the arg
			path: options.path ? options.path : workspaceFolder.fsPath,

			// CLR version, yes there are still people on 3.5 & default back to v4 if not set
			clr: options.clr ? options.clr : settings.clrVersion.v40,

			// If no protocol set fallback to http as opposed to https
			protocol: options.protocol ? options.protocol : settings.protocolType.http
		};



		// The path stored in options could be a relative path such as './' or './child-sub-folder'
		// It may also include the legacy full path of the workspace rootpath
		// Which caused issues - when checked into source control & other users did not have same folder structure
		// or if you moved the folder on your own machine - it would no longer map correctly
		const resolvedPath = path.resolve(workspaceFolder.fsPath, this._args.path);
		this._args.path = resolvedPath;

		// Verify folder exists on disk (in case relative path used & selected wrong thing)
		if(fs.existsSync(resolvedPath) === false){
			vscode.window.showErrorMessage(`The folder does not exist ${resolvedPath} & IIS Express can not run.`, {modal: true});

			// Stop the method/function from running
			return;
		}

		// Create output channel & show it
		this._output = this._output || vscode.window.createOutputChannel('IIS Express');
		this._output.show();

		// Site name is the name of the workspace folder & GUID/UUID
		// Need to append a UUID as could have two folders/sites with same name
		const siteName = path.basename(workspaceFolder.fsPath as string) + "-" + uuidv4();

		// If user is using HTTPS & port not in range of auto-approved port numbers (44300-44399)
		// Then display an error & stop process
		if(this._args.protocol === settings.protocolType.https && (this._args.port >= 44300 && this._args.port <=44399) === false){
			// Using HTTPS but not using a port within the range that supports SSL
			vscode.window.showErrorMessage('When using HTTPS you need to use ports 44300 - 44399 in .vscode/iisexpress.json',{modal: true});

			// Stop the method/function from running
			return;
		}

		// Add the site to the config (which will invoke/run from iisexpress cmd line)
		// Not done as async - so we wait until this command completes
		try {
			process.execFileSync(this._iisAppCmdPath, ['add', 'site', `-name:${siteName}`, `-bindings:${this._args.protocol}://localhost:${this._args.port}`, `-physicalPath:${this._args.path}`]);
		} catch (error:any) {
			console.log(error);
			this._reporter.sendTelemetryException(error, {"appCmdPath": this._iisAppCmdPath, "appCmd": `add site -name:${siteName} -bindings:${this._args.protocol}://localhost:${this._args.port} -physicalPath:${this._args.path}`});
		}

		// Based on the CLR chosen use the correct built in AppPools shipping with IISExpress
		const appPool = this._args.clr === settings.clrVersion.v40 ? "Clr4IntegratedAppPool" : "Clr2IntegratedAppPool";

		// Assign the apppool to the site
		// appcmd set app /app.name:Site-Staging-201ec232-2906-4052-a431-727ec57b5b2e/ /applicationPool:Clr2IntegratedAppPool
		try {
			process.execFileSync(this._iisAppCmdPath, ['set', 'app', `/app.name:${siteName}/`, `/applicationPool:${appPool}`]);
		} catch (error:any) {
			console.log(error);
			this._reporter.sendTelemetryException(error, {"appCmdPath": this._iisAppCmdPath});
		}

		// Log telemtry
		telemtry.updateCountAndReport(this._context, this._reporter, telemtry.keys.start);
		telemtry.updateCountAndReport(this._context, this._reporter, telemtry.keys.sponsorware);

		// This is the magic that runs the IISExpress cmd from the appcmd config list
		this._iisProcess = process.spawn(this._iisPath, [`-site:${siteName}`]);

		// Create Statusbar item & show it
		this._statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

		// Set props on statusbar & show it
		this._statusbar.text = `$(browser) ${this._args.protocol}://localhost:${this._args.port}`;
		this._statusMessage = `Running folder '${this._args.path}' as a website on ${this._args.protocol}://localhost:${this._args.port} on CLR: ${this._args.clr}`;
		this._statusbar.tooltip = this._statusMessage;
		this._statusbar.command = 'extension.iis-express.open';
		this._statusbar.show();

		// Open browser
		const autoLaunchBrowser:boolean = vscode.workspace.getConfiguration().get<boolean>('iisexpress.autoLaunchBrowser', true);

		if(autoLaunchBrowser){
			this.openWebsite(options);
		}

		// Used to enable/disable commands & to know when a site is running
		vscode.commands.executeCommand('setContext', 'iisexpress:siterunning', true);

		// Attach all the events & functions to iisProcess
		this._iisProcess.stdout.on('data', (data: string) =>{
			data = this.decode2gbk(data);
			this._output!.appendLine(data);
		});

		this._iisProcess.stderr.on('data', (data: string) => {
			data = this.decode2gbk(data);
			this._output!.appendLine(`stderr: ${data}`);
		});

		this._iisProcess.on('error', (err:Error) => {
			const message = this.decode2gbk(err.message);
			this._output!.appendLine(`ERROR: ${message}`);
		});

		this._iisProcess.on('close', () =>{

			// Tidying up - so we remove the entry from appcmd
			// As we use a uuid every time we start a site we need to do housekeeping & clean up
			// When we are finished - this happens for:

			//* Will happen when users stops with CTRL+F5
			//* Close from the systray icon
			//* Restart of site

			// Delete any existing entries for the site using appcmd
			// Not done as async - so we wait until this command completes
			try {
				process.execFileSync(this._iisAppCmdPath, ['delete', 'site', `${siteName}`]);
			} catch (error:any) {
				console.log(error);
				this._reporter.sendTelemetryException(error, {"appCmdPath": this._iisAppCmdPath, "appCmd": `delete site ${siteName}`});
			}
		});
	}

	public stopWebsite(){
		// Ensure process is not null & is running
		if(this._iisProcess === undefined || this._iisProcess.killed === true){
			// Display error message
			vscode.window.showErrorMessage('IIS Express is not running', {modal:true});

			// Stop the method/function from running
			return;
		}

		// Kill the process - which will also hook into the exit event to remove the config entry
		this._iisProcess.kill('SIGINT');

		// Used to enable/disable commands & to know when a site is running
		vscode.commands.executeCommand('setContext', 'iisexpress:siterunning', false);

		// Log telemtry
		telemtry.updateCountAndReport(this._context, this._reporter, telemtry.keys.stop);

		// Clear the output log
		this._output!.clear();
        this._output!.hide();
        this._output!.dispose();
		this._output = null;

		// Remove the statusbar item
		this._statusbar.hide();
		this._statusbar.dispose();

	}

	public openWebsite(options: settings.Isettings){

		let browserConfig = vscode.workspace.getConfiguration().get<string>("iisexpress.openInBrowser", "default");
		let browser:string = browserConfig.toLocaleLowerCase() === "default" ? "" : browserConfig;

		if (options && options.url) {
			// We have a starting URL set - but lets ensure we strip starting / if present
			let startUrl = options.url.startsWith('/') ? options.url.substring(1) : options.url;

			// Start browser with start url
			process.exec(`start ${browser} ${this._args.protocol}://localhost:${this._args.port}/${startUrl}`);
    	} else {
			// Uses the 'start' command & url to open default browser
			process.exec(`start ${browser} ${this._args.protocol}://localhost:${this._args.port}`);
		}
	}

	public restartSite(options : settings.Isettings, workspaceFolder: vscode.Uri){
		// If we do not have an iisProcess/website running
		if(!this._iisProcess){
			// Then just do a start site...
			this.startWebsite(options, workspaceFolder);
		}
		else {
			// It's already running so stop it first then, start it
			this.stopWebsite();
			this.startWebsite(options, workspaceFolder);
		}

		// Log telemtry
		telemtry.updateCountAndReport(this._context, this._reporter, telemtry.keys.restart);
	}

    private decode2gbk(data: string): string {
		const buffer = Buffer.from(data);
 		return iconv.decode(buffer, 'gbk');
	}

}
