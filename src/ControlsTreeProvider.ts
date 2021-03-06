import * as vscode from 'vscode';

export class ControlsTreeProvider implements vscode.TreeDataProvider<ControlsTreeItem> {


    onDidChangeTreeData?: vscode.Event<void | ControlsTreeItem | null | undefined> | undefined;

    getTreeItem(element: ControlsTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: ControlsTreeItem | undefined): vscode.ProviderResult<ControlsTreeItem[]> {
        if(element === undefined){
            const items = new Array<ControlsTreeItem>();

            const startIconThemeColor = new vscode.ThemeColor("iisexpress.startIcon");
            const stopIconThemeColor = new vscode.ThemeColor("iisexpress.stopIcon");
            const restartIconThemeColor = new vscode.ThemeColor("iisexpress.restartIcon");
            const supporterIconThemeColor = new vscode.ThemeColor("iisexpress.supporterIcon");

            items.push(
                {
                    label: 'Start Website',
                    iconPath: new vscode.ThemeIcon("play", startIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Start Website',
                        command: "extension.iis-express.start"
                    }
                },
                {
                    label: 'Restart Website',
                    iconPath: new vscode.ThemeIcon("refresh", restartIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Restart Website',
                        command: "extension.iis-express.restart"
                    }
                },
                {
                    label: 'Stop Website',
                    iconPath: new vscode.ThemeIcon("stop", stopIconThemeColor),
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    command: {
                        title: 'Stop Website',
                        command: "extension.iis-express.stop"
                    }
                },
                {
                    label: 'Become a supporter',
                    iconPath: new vscode.ThemeIcon("heart", supporterIconThemeColor),
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