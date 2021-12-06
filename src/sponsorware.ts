import * as vscode from 'vscode';
import path = require('path');
import { Credentials } from './credentials';
import TelemetryReporter from 'vscode-extension-telemetry';

export class Sponsorware {

    private context: vscode.ExtensionContext;
    private totalCount:number = 0;
    private credentials: Credentials;
    private reporter: TelemetryReporter;
    private outputWindow: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, credentials:Credentials, reporter:TelemetryReporter, outputWindow:vscode.OutputChannel) {
        this.context = context;
        this.credentials = credentials;
        this.reporter = reporter;
        this.outputWindow = outputWindow;
    }

    private async doWeShowSponsorMessagePanel():Promise<boolean> {
        // Exit out early if they are a sponsor
        // Don't show them the sponsorware message
        const isSponsor = await this.credentials.isUserSponsor();
        if(isSponsor){
            const githubUsername = this.credentials.authSession?.account?.label;
            this.outputWindow.appendLine(`[Sponsorware] User ${githubUsername} is a valid sponsor`);
            return false;
        }

        // Get the counter values
        this.totalCount = this.context.globalState.get<number>('iisexpress.start.count', 0);
        const sponsorwareCount = this.context.globalState.get<number>('iisexpress.sponsorware.count', 0);
        const sponsorwareDisplayCount = this.context.globalState.get<number>('iisexpress.sponsorware.display.count', 10); // Default to 10 if the random number not been set

        this.outputWindow.appendLine(`[Sponsorware] Total count ${this.totalCount}`);
        this.outputWindow.appendLine(`[Sponsorware] Sponsorware count ${sponsorwareCount}`);
        this.outputWindow.appendLine(`[Sponsorware] Sponsorware display count ${sponsorwareDisplayCount}`);

        // Decide if we met the threshold yet
        if(sponsorwareCount >= sponsorwareDisplayCount){
            // Each activation of extension (ie when VSCode boots)
            // Will decide a random number in a range as the threshold counter
            // So its not always the same number of launches of a site

            // If we have met the threshold - reset the sponsor counter back to 0
            this.context.globalState.update('iisexpress.sponsorware.count', 0);
            this.outputWindow.appendLine(`[Sponsorware] Sponsorware threshold met - display the friendly message`);
            return true;
        }
        else {
            return false;
        }
    }

    private getWebviewContent(numberOfLaunches:number, svgSrc:vscode.Uri, showAuth: boolean = true) {
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

                #auth {
                    display: ${showAuth ? 'block' :'none' };
                }
            </style>
        </head>
        <body>
            <img src="${svgSrc}" />
            <h1>You have used IIS Express <span>${numberOfLaunches}</span> times.</h1>
            <p>I'm happy to see you're using IIS Express extension alot, have you considered becoming a GitHub sponsor for this project?</p>
            <p>Becoming a sponsor removes this sponsorware message and you get a warm fuzzy feeling for supporting an individual.</p>

            <p>
                <a href="command:extension.iis-express.supporter"
                    class="button"
                    role="button"
                    title="Sponsor Warren Buckley">Sponsor Warren Buckley on GitHub</a>
            </p>
            <div id="auth">
                <h2>Authenticate</h2>
                <p>Authenticate with GitHub to check if you are a sponsor</p>
                <ul>
                    <li>You are part of the Umbraco organization on GitHub</li>
                    <li>You have made a PR that has been merged into the codebase</li>
                    <li>You are an active sponsor of WarrenBuckley</li>
                </ul>
                <p>
                    <a id="github-login"
                        href="command:extension.iis-express.githublogin"
                        class="button"
                        role="button"
                        title="Login to GitHub">Login to GitHub</a>
                </p>
            </div>
        </body>
        </html>`;
    }

    public async showSponsorMessagePanel():Promise<void> {

        // Exit out early (if user is a sponsor or the counter threshold not met yet)
        if(await this.doWeShowSponsorMessagePanel() === false){
            return;
        }

        // Send telmetry event - so we know how many times this is being shown
        this.reporter.sendTelemetryEvent('sponsorware.displayed', {}, { 'totalCount': this.totalCount });


        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel(
            'iisExpress.sponsorware',
            'IIS Express - Sponsorware',
            vscode.ViewColumn.Beside,
            {
                // Only allow the webview to access resources in our extension's media directory
                localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'assets'))],
                enableCommandUris: true
            }
        );

        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'assets', 'sponsorware.svg'));
        const sponsorSvgSrc = panel.webview.asWebviewUri(onDiskPath);
        const userHasAuth = this.credentials.authSession !== undefined;

        // And set its HTML content
        panel.webview.html = this.getWebviewContent(this.totalCount, sponsorSvgSrc, !userHasAuth);
    }
}


