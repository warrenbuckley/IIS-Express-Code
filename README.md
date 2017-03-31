# Run websites straight from VS Code using IIS Express
This extension gives you the power to run a folder open in Visual Studio code as a website using IIS Express.

## Install
Open the command pallete & type **ext install** then search for **IIS Express**

![Install](images/iis-express-install.gif)

# Usage
## Available commands
* **IIS Express: Run Website** - Start or stop the current folder run as a website

![Usage](images/iis-express-usage.gif)

# Features
* Auto opens folder in browser
* Super simple way from the command pallete to start & stop the website
* See ouput from the IIS Express command line directly in Visual Studio 

# Requirements 
* Windows Machine (Sorry not for Linux & OSX)
* IIS Express installed


# Changelog
## Version 0.0.7
* **New:** `.vscode/iisexpress.json` now supports a new property `url` which is an optional property & allows you to set the URL you wish to open eg: '/about/the-team'
* **New:** `.vscode/iisexpress.json` now supports a new property `clr` which is an optional property allowing you to set the CLR to run your .NET website (Thanks to @avieru)

## Version 0.0.6
* **New:** Restart site option
* **New:** Keyboard shortcuts to start (Ctrl+F5), stop (Shift+F5) & restart site (Ctrl+Shift+F5)
* **New:** Clicking the status bar icon now opens the site in your browser using the 'start' command & you no longer needn to copy & paste the URL from the ouput window anymore
* **New:** `.vscode/iisexpress.json` now supports a new property `path` which allows you to set a subfolder inside your folder as the path of your site to run. This must be a full path & not relative
* **New:** JSON Schema validation & auto-completion of the `.vscode/iisexpress.json` file
* **Bug Fix:** Fixed logic that will now auto create the `.vscode/iisexpress.json` config file with the random assigned port if it does not already exist
* **Removes** The old UI of launching the extension/command & using a quick pick options to start & stop the site, as we could not assign a keyboard shortcut to the quick pick items


Adds the following:
* Seperate commands for Start, Stop & New Restart option
* With new commands we can assign key bindings aka keyboard shortcuts same as the main VS
* The status bar when clicked now opens the site in your browser using the 'start' command & don't want to paste & copy the URL from the ouput window anyymore
* JSON Schema for the VS Code IISExpress config. Ensure port is specified config value & within correct range of valid port numbers according to IIS Express

Removes the following
* The old UI of launching the extension/command & using a quick pick options to start & stop the site, as we could not assign a keyboard shortcut to the quick pick items

## Version 0.0.5
* **Bug Fix:** Fixes problem with extension from loading correctly after updating to VSCode 1.3

## Version 0.0.4
* **New:** Community PR from @czhj that supports Chinese characters in output build log window

## Version 0.0.3
* **New:** Port number setting can be set in .vscode/iisexpress.json if you wish to override random port number

You need the following file added `.vscode/iisexpress.json` and then you can set the port setting like so

```
{
    "port":8081
}
```

## Version 0.0.2
* **New:** Port number is now random

## Version 0.0.1
* Initial release
