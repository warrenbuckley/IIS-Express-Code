import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

export enum keys {
    start = 'start',
    restart = 'restart',
    stop = 'stop',
    sponsorware = 'sponsorware'
}


export async function updateCountAndReport(context: vscode.ExtensionContext, reporter:TelemetryReporter, eventName:keys) {

    // Get the total number of times (Start at 0 if we have never stored a value)
    // Increase total counter of how many times the extension has run/started a site
    // Stopped, Sponorship opened etc

    const counterKey = `iisexpress.${eventName}.count`;
    let totalCount: number = context.globalState.get<number>(counterKey, 0);
	totalCount++;
    await context.globalState.update(counterKey, totalCount);

    reporter.sendTelemetryEvent(eventName, {}, { [counterKey]: totalCount });
}
