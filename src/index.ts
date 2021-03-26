import {app, BrowserWindow, Menu, shell} from 'electron';
import defaultMenu from 'electron-default-menu';
import {loadSettings, saveSettings} from './settings';
import {channel, menuOption} from './constants';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

/*
*	Create browser window
*/
async function createWindow(): Promise<void> {
	// load settings
	const settings = await loadSettings();
	
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		show: false,
		height: settings.windowStatus.height,
		width: settings.windowStatus.width,
		x: settings.windowStatus.x,
		y: settings.windowStatus.y,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			preload: path.resolve(__dirname, 'renderer.js'),
		}
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	});

	if (settings.windowStatus.isMaximized) {
		mainWindow.maximize();
	}

	// create application menu
	createApplicationMenu(mainWindow);

	// and load the index.html of the app.
	mainWindow.loadFile(path.resolve(__dirname, '../src/index.html'));

	async function saveWindowStatus(): Promise<void> {
		const isMaximized = mainWindow.isMaximized();
		const bounds = mainWindow.getBounds();
		const windowStatus = {
			height: bounds.height,
			width: bounds.width,
			x: bounds.x,
			y: bounds.y,
			isMaximized,
		};

		await saveSettings({windowStatus});
	}

	// keep track of the window status
	mainWindow.on('resize', saveWindowStatus);
	mainWindow.on('move', saveWindowStatus);
	mainWindow.on('close', saveWindowStatus);
}

/*
*	Create application menu
*/
function createApplicationMenu(mainWindow: BrowserWindow): void {
	const menu = defaultMenu(app, shell);

	menu.splice(1, 0, {
		label: 'File',
		submenu: [
			{
				label: 'Connect',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.connect);
				},
			},
			{
				label: 'Disconnect',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.disconnect);
				},
			}
		]
	});

	menu.splice(2, 0, {
		label: 'Script',
		submenu: [
			{
				label: 'Run',
				accelerator: 'Control+Enter',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.run);
				},
			},
			{
				label: 'Clear',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.clear);
				},
			},
			{
				label: 'Export',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.export);
				},
			},
		]
	});

	Menu.setApplicationMenu(Menu.buildFromTemplate(menu));	
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
