import * as vscode from 'vscode';
import * as process from 'child_process';

export interface IExpressArguments {
	path: string;
	port: number;
}

export module IIS {
	export function startWebsite(args: IExpressArguments){
		//Need to run this command
		//iisexpress /path:app-path [/port:port-number] [/clr:clr-version] [/systray:boolean]
		//isexpress /path:c:\myapp\ /port:5005
		
		vscode.window.showInformationMessage(`Running folder '${args.path}' as a website on http://localhost:${args.port}`);
	}
}
