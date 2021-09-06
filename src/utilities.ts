import {app, dialog, BrowserWindow, Dialog, ipcRenderer} from 'electron';
import {channel} from './constants';

export function getDialog(): Dialog {
	if (dialog) {
		return dialog;
	}

	return require('@electron/remote').dialog; // eslint-disable-line @typescript-eslint/no-var-requires
}

export function getCurrentWindow(): BrowserWindow {
	const {getCurrentWindow} = require('@electron/remote'); // eslint-disable-line @typescript-eslint/no-var-requires

	return getCurrentWindow();
}

export function setMainWindowTitle(title: string): void {
	const fullTitle = 'Oracle SQL Browser' + (title.length > 0 ? ` - ${title}` : '');

	ipcRenderer.send(channel.setMainWindowTitle, fullTitle);
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
