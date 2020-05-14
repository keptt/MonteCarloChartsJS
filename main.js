const electron  = require('electron');
const url       = require('url');
const path      = require('path');

const {app, BrowserWindow, Menu, ipcMain} = electron;

process.env.NODE_ENV = 'production';

let mainWindow;
let addWindow;

const mainMenuTemplate = [
    {
        label: 'File'
        , submenu: [
            {
                label: 'Configure'
                , accelerator: process.platform == 'darwin' ? 'Command+G' : 'Ctrl+G'
                , click() {
                    createAddWindow();
                }
            }
            , {
                label: 'Revert to defaults'
                , accelerator: process.platform == 'darwin' ? 'Command+D' : 'Ctrl+D'
                ,  click() {
                    let config= getDefaultConfig();
                    mainWindow.webContents.send('config:default:change', config);
                    addWindow.webContents.send('config:default:change', config);
                }
            }
            , {
                label: 'Quit'
                , accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q'
                , click() {
                    app.quit();
                }
            }
        ]
    }
];

// if mac, add empty object to menu
if (process.platform == 'darwin') {
    mainMenuTemplate.unshift({});
}

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developers'
        , submenu: [
            {
                label: 'Toggle DevTools'
                , accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I'
                , click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }
            , {
                role: 'reload'
            }
        ]
    })
}

app.on('ready', function() {
    mainWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html')
        , protocol: 'file:'
        , slashes: true
    }));

    mainWindow.on('closed', function() {
        app.quit();
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    Menu.setApplicationMenu(mainMenu);
});

ipcMain.on('config:change', function(e, item) {
    mainWindow.webContents.send('config:change', item);
});

function createAddWindow() {
    addWindow = new BrowserWindow({
        width: 420
        , height: 720
        , title: 'Configure plots'
        , webPreferences: {nodeIntegration: true}
    });
    // load html file into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html')
        , protocol: 'file:'
        , slashes: true
    }));
    // Garbage collection andle
    addWindow.on('close', function() {
        addWindow = null;
    })
}

function getDefaultConfig() {
    config = {}
    config.min             = 10;
	config.max             = 100;
	config.concessionStep  = 2 / 100;
	config.concessionMin   = 0 / 100;
	config.concessionMax   = 10 / 100;
	config.length          = 10;
    config.trialsAmount    = 1000;

    return config
}

