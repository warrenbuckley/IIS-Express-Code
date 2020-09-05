import * as vscode from 'vscode';
import path = require('path');
import { Credentials } from './credentials';

export class Sponsorware {

    private context: vscode.ExtensionContext;
    private totalCount:number = 0;
    private credentials: Credentials;

    constructor(context: vscode.ExtensionContext, credentials:Credentials) {
        this.context = context;
        this.credentials = credentials;
    }

    private doWeShowSponsoreMessagePanel():boolean {
        // Exit out early if they are a sponsor
        // Don't show them the sponsorware message
        if(this.credentials.isUserSponsor()){
            return false;
        }

        // Get the counter values
        this.totalCount = this.context.globalState.get<number>('iisexpress.start.count', 0);
        const sponsorwareCount = this.context.globalState.get<number>('iisexpress.sponsorware.count', 0);
        const sponsorwareDisplayCount = this.context.globalState.get<number>('iisexpress.sponsorware.display.count', 20);

        // Decide if we met the threshold yet
        if(sponsorwareCount > sponsorwareDisplayCount){
            // Each activation of extension (ie when VSCode boots)
            // Will decide a random number in a range as the threshold counter
            // So its not always the same number of launches of a site

            // If we have met the threshold - reset the sponsor counter back to 0
            this.context.globalState.update('iisexpress.sponsorware.count', 0);
            return true;
        }
        else {
            return false;
        }
    }

    showSponsorMessagePanel(){

        // Exit out early (if user is a sponsor or the counter threshold not met yet)
        if(this.doWeShowSponsoreMessagePanel() === false){
            return;
        }

        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel(
            'iisExpress.sponsorware',
            'IIS Express - Sponsorware',
            vscode.ViewColumn.Beside,
            {
                // Only allow the webview to access resources in our extension's media directory
                localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'assets'))]
            }
        );

        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'assets', 'sponsorware.svg'));
        const sponsorSvgSrc = panel.webview.asWebviewUri(onDiskPath);

        // And set its HTML content
        panel.webview.html = this.getWebviewContent(this.totalCount, sponsorSvgSrc);
    }

    private getWebviewContent(numberOfLaunches:number, svgSrc:vscode.Uri) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>IIS Express - Sponsorware</title>
            <style>
                h1 span {
                    color: var(--vscode-terminal-ansiBrightYellow);
                }

                a.button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    padding: 10px;
                    border-radius: 7px;
                    font-weight: 700;
                    text-decoration: none;
                    display:inline-block;
                    margin-top: 20px;
                }

                a.button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                img {
                    width:60%;
                    float:right;
                }
            </style>
        </head>
        <body>
            <img src="${svgSrc}" />
            <h1>You have used IIS Express <span>${numberOfLaunches}</span> times.</h1>
            <p>As you like to use this VSCode extension alot, have you considered becoming a GitHub sponsor for this project?</p>
            <p>Becoming a sponsor removes this sponsorware message and you get a warm fuzzy feeling for supporting someone</p>

            <p>
                <a href="https://github.com/sponsors/warrenbuckley"
                    class="button"
                    role="button"
                    title="Sponsor Warren Buckley">Sponsor Warren Buckley on GitHub</a>
            </p>
        </body>
        </html>`;
    }
}


