import {app, remote, BrowserWindow} from 'electron';

export function getCurrentWindow(): BrowserWindow {
	return remote.getCurrentWindow();
}

export function setMainWindowTitle(title: string): void {
	const mainWindow = getCurrentWindow();
	const fullTitle = 'Oracle SQL Browser' + (title.length > 0 ? ` - ${title}` : '');

	mainWindow.setTitle(fullTitle);
}

export function isDebug(): boolean {
	return app ? !app.isPackaged : !remote.app.isPackaged;
}
