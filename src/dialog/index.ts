import electron from 'electron';
import * as path from 'path';
import * as url from 'url';

const browserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
const ipcMain = electron.ipcMain || electron.remote.ipcMain;

export function createDialog(parent: electron.BrowserWindow, connectString: string): Promise<string|null> {
	return new Promise((resolve, reject) => {
		const id = `${new Date().getTime()}-${Math.random()}`;
		const preloadFilename = path.resolve(__dirname, 'renderer.js');
		//const htmlFilename = path.resolve(__dirname, '../../src/dialog', 'index.html');
		/*
		console.log(`__dirname="${__dirname}"`);
		console.log(`preloadFilename="${preloadFilename}"`);
		console.log(`htmlFilename="${htmlFilename}"`);
		*/

		let dialogWindow = new browserWindow({
			parent,
			modal: true,
			height: 200,
			width: 500,
			resizable: false,
			minimizable: false,
			fullscreenable: false,
			maximizable: false,
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				preload: preloadFilename,
			}
		});

		dialogWindow.setMenu(null);
		dialogWindow.setMenuBarVisibility(false);

		function cleanup(): void {
			ipcMain.removeListener('prompt-get-options:' + id, getOptionsListener);
			ipcMain.removeListener('prompt-post-data:' + id, postDataListener);
			ipcMain.removeListener('prompt-error:' + id, errorListener);

			if (dialogWindow) {
				dialogWindow.close();
				dialogWindow = null;
			}
		}

		function getOptionsListener(event: electron.IpcMainEvent): void {
			event.returnValue = JSON.stringify(connectString);
		}

		function postDataListener(event: electron.IpcMainEvent, value: string): void {
			resolve(value);
			event.returnValue = null;
			cleanup();
		}

		function unresponsiveListener(): void {
			reject(new Error('Window was unresponsive'));
			cleanup();
		}

		function errorListener(event: electron.IpcMainEvent, message: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
			reject(new Error(message));
			event.returnValue = null;
			cleanup();
		}

		ipcMain.on('prompt-get-options:' + id, getOptionsListener);
		ipcMain.on('prompt-post-data:' + id, postDataListener);
		ipcMain.on('prompt-error:' + id, errorListener);
		dialogWindow.on('unresponsive', unresponsiveListener);

		dialogWindow.on('closed', () => {
			dialogWindow = null;
			cleanup();
			resolve(null);
		});

		const promptUrl = url.format({
			protocol: 'file',
			slashes: true,
			pathname: path.resolve(__dirname, '../../src/dialog', 'index.html'),
			hash: id,
		});

		dialogWindow.loadURL(promptUrl);

		// Open the DevTools.
		//dialogWindow.webContents.openDevTools();
	});
}
