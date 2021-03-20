import {app, BrowserWindow} from 'electron';
import {isDebug} from './utilities';
import {loadSettings, saveSettings} from './settings';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

async function createWindow(): Promise<void> {
	// load settings
	const settings = await loadSettings();
	
	// Create the browser window.
	const mainWindow = new BrowserWindow({
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

	if (settings.windowStatus.isMaximized) {
		mainWindow.maximize();
	}

	// and load the index.html of the app.
	mainWindow.loadFile(path.resolve(__dirname, '../src/index.html'));

	// Open the DevTools.
	if (isDebug()) {
		mainWindow.webContents.openDevTools();
	}

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
