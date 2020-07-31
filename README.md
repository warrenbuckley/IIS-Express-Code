# IIS Express for VSCode
This extension gives you the power to run a folder open in Visual Studio Code as a website using an IIS Express web server.

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/warren-buckley.iis-express?logo=visual-studio-code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=warren-buckley.iis-express)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/warren-buckley.iis-express?logo=visual-studio-code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=warren-buckley.iis-express)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/warren-buckley.iis-express?logo=visual-studio-code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=warren-buckley.iis-express)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/warren-buckley.iis-express?logo=visual-studio-code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=warren-buckley.iis-express)

## Sponsorware
<a href="https://github.com/sponsors/warrenbuckley"><img src="https://github.githubassets.com/images/modules/site/sponsors/pixel-mona-heart.gif" align="left" height="45" /></a>
This is a **free extension** I have made for VSCode, if you find it useful to yourself or your business then <a href="https://github.com/sponsors/warrenbuckley">I would love you to consider sponsoring me on Github</a> please

## Features
* Auto opens folder in browser
* Super simple way from the command pallete to start & stop the website
* See ouput from the IIS Express command line directly in Visual Studio
* Support for PHP via `ApplicationHost.config` common changes for all sites running with IIS Express

### Requirements
* Windows Machine (Sorry not for Linux, OSX or Web)

## How do I Install IIS Express for VSCode?
Open the command pallete in VSCode & type **ext install** then search for **IIS Express** alternatively you can [download the IIS Express for VSCode extension on the marketplace](https://marketplace.visualstudio.com/items?itemName=warren-buckley.iis-expres)

![Installing IIS Express for VSCode](images/iis-express-install.gif)

## Global Settings for IIS Express for VSCode
Below is a table of settings that can be used to configure IIS Express for VSCode. You can easily get to these settings by using the settings (cog) icon in the IIS Express pane found by default under the file explorer.

Setting | Alias | Description | Default Value
--------|-------|-------------|------
Path to IISExpress.exe|iisexpress.iisExpressPath|An absolute path to **IISExpress.exe** such as `C:\Program Files\IIS Express\iisexpress.exe`|null - We try to use default program path location
Path to AppCmd.exe|iisexpress.appcmdPath|An absolute path to **appcmd.exe** such as `C:\Program Files\IIS Express\appcmd.exe`|null - We try to use default program path location
Auto launch browser|iisexpress.autoLaunchBrowser|An option to disable or enable the browser from launching the site when IIS Express starts. By default this is **true**|true
Open in browser|iisexpress.autoLaunchBrowser|Decide which browser to auto launch the site with when `iisexpress.autoLaunchBrowser` is set to **true**|default (default, chrome, msedge, firefox, opera)

## Available commands
* **IIS Express: Start Website** - Start the current folder run as a website
* **IIS Express: Stop Website** - Stop the current folder run as a website
* **IIS Express: Restart Website** - Restart (Stop & Start) the current folder run as a website

![Usage](images/iis-express-usage.gif)

