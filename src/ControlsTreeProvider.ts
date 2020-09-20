import * as vscode from 'vscode';

export class ControlsTreeProvider implements vscode.TreeDataProvider<ControlsTreeItem> {


    onDidChangeTreeData?: vscode.Event<void | ControlsTreeItem | null | undefined> | undefined;

    getTreeItem(element: ControlsTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ControlsTreeItem | undefined): vscode.ProviderResult<ControlsTreeItem[]> {
        if(element === undefined){
            const items = new Array<ControlsTreeItem>();

            const startIconThemeColor = new vscode.ThemeColor("debugIcon.startForeground");
            const stopIconThemeColor = new vscode.ThemeColor("debugIcon.stopForeground");
            const restartIconThemeColor = new vscode.ThemeColor("debugIcon.pauseForeground");
            const sponsorIconThemeColor = new vscode.ThemeColor("terminal.ansiBrightMagenta");
            
            items.push(
                {
                    label: 'Start Website',
                    iconPath: new vscode.ThemeIcon2("play").with(startIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Start Website',
                        command: "extension.iis-express.start"
                    }
                },
                {
                    label: 'Restart Website',
                    iconPath: new vscode.ThemeIcon2("refresh").with(restartIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Restart Website',
                        command: "extension.iis-express.restart"
                    }
                },
                {
                    label: 'Stop Website',
                    iconPath: new vscode.ThemeIcon2("stop").with(stopIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Stop Website',
                        command: "extension.iis-express.stop"
                    }
                },
                {
                    label: 'Become a supporter',
                    iconPath: new vscode.ThemeIcon2("heart").with(sponsorIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Become a supporter',
                        command: 'extension.iis-express.supporter'
                    }
                });

            return items;
        }

        return Promise.resolve([]);
    }
}

export class ControlsTreeItem extends vscode.TreeItem {}