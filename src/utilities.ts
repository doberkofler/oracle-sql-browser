import {app, remote, BrowserWindow, ipcRenderer} from 'electron';
import {channel} from './constants';

export function getCurrentWindow(): BrowserWindow {
	return remote.getCurrentWindow();
}

export function setMainWindowTitle(title: string): void {
	const mainWindow = getCurrentWindow();
	const fullTitle = 'Oracle SQL Browser' + (title.length > 0 ? ` - ${title}` : '');

	mainWindow.setTitle(fullTitle);
}

export function isPackaged(): boolean {
	return app ? app.isPackaged : isPackagedRemote();
}

function isPackagedRemote(): boolean {
	const isPackaged = ipcRenderer.sendSync(channel.appIsPackaged);
	if (typeof isPackaged !== 'boolean') {
		throw new Error(`Error in ipc channel "${channel.appIsPackaged}"`);
	}

	return isPackaged;
}
