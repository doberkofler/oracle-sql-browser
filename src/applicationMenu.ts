import {app, BrowserWindow, Menu, shell} from 'electron';
import defaultMenu from 'electron-default-menu';
import {channel, menuOption} from './constants';

/*
*	Create application menu
*/
export function createApplicationMenu(mainWindow: BrowserWindow): void {
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
			},
			{
				label: 'Close all tabs',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.closeAllTabs);
				},
			},
		]
	});

	menu.splice(2, 0, {
		label: 'Script',
		submenu: [
			{
				label: 'Run script',
				accelerator: 'F5',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.runScript);
				},
			},
			{
				label: 'Run obe statement at current cursor position',
				accelerator: 'Control+Enter',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.runStatement);
				},
			},
			{
				label: 'Commit',
				accelerator: 'Control+C',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.commit);
				},
			},
			{
				label: 'Rollback',
				accelerator: 'Control+R',
				click: (/*item, focusedWindow*/) => {
					mainWindow.webContents.send(channel.menu, menuOption.rollback);
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
