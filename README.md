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
