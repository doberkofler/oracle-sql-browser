import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import {initOracleClient} from './database';
import {loadSettings, saveSettings} from './settings';
import * as path from 'path';
import {createApplicationMenu} from './applicationMenu';
import {channel} from './constants';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	app.quit();
}

/*
*	Create browser window
*/
async function createWindow(): Promise<void> {
	// load settings
	const settings = await loadSettings();

	// check, if the oracle libraries are available and oracledb can be initialized
	const error = initOracleClient();
	if (error !== '') {
		dialog.showErrorBox('Fatal error', error);
		app.exit(1);
	}
	
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

	// ipc channel
	ipcMain.on(channel.setMainWindowTitle, (event, title: string) => mainWindow.setTitle(title));
	ipcMain.on(channel.appIsPackaged, event => event.returnValue = app.isPackaged);
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
