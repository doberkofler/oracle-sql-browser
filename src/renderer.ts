import {remote, ipcRenderer} from 'electron';
import XLSX from 'xlsx';
import {onDomReady, querySelector} from './dom';
import {getDefaultSettings,loadSettings, saveSettings} from './settings';
import {createDialog} from './dialog';
import {renderTabs} from './tabs';
import {Database} from './database';
import {runStatement} from './runStatement';
import {channel, menuOption} from './constants';

import type {stateType} from './state';

const database = new Database();

/*
*	Execute the "connect" command
*/
async function cmdConnect(database: Database, state: stateType): Promise<void> {
	// prompt for a connection string
	const currentWindow = remote.getCurrentWindow();
	state.settings.connectString = await createDialog(currentWindow, state.settings.connectString);
	if (state.settings.connectString === null) {
		return;
	}
 
	// connect
	const result = await connectWithDatabase(database, state.settings.connectString);
	getTableElement(state.settings.currentPageId).innerHTML = result;

	// save the settings
	await saveSettings({connectString: state.settings.connectString});
}

/*
*	Execute the "disconnect" command
*/
async function cmdDisconnect(database: Database, state: stateType): Promise<void> {
	if (database.isConnected()) {
		await database.disconnect();
	}
 
	getTableElement(state.settings.currentPageId).innerHTML = 'Disconnected';
}

/*
*	Execute the "closeAllTabs" command
*/
async function cmdCloseAllTabs(state: stateType): Promise<void> {
	// set default settings for pages
	Object.assign(state.settings.pages, getDefaultSettings().pages);

	// render tabs
	renderTabs(database, state);

	// save the settings (not await because we don't care when it finishes)
	await saveSettings({pages: state.settings.pages});
}

/*
*
*/
async function cmdExport(pageId: number) {
	const tableElement = getTableElement(pageId);
	const wb = XLSX.utils.table_to_book(tableElement);
	const file = await remote.dialog.showSaveDialog({
		title: 'Save file as',
		filters: [{
			name: 'Spreadsheets',
			extensions: 'xlsx|csv'.split('|')
		}]
	});

	XLSX.writeFile(wb, file.filePath);
}
 
/*
*	Connect with the database
*/
async function connectWithDatabase(database: Database, connectString: string): Promise<string> {
	// parse the connection string
	let result;
	try {
		result = Database.parseConnectString(connectString);
	} catch (e) {
		return `Connection error:&nbsp;${e.message}`;
	}
 
	// disconnect, if already connected
	if (database.isConnected()) {
		database.disconnect();
	}
 
	// connect
	try {
		await database.connect(result.user, result.password, result.connectString);
	} catch (e) {
		return `Connection error:&nbsp;${e.message}`;
	}

	return `Successfully connected as ${result.user}.`;
}

/*
*	render
*/
async function render(): Promise<void> {
	// get configuration settings
	const state: stateType = {
		settings: await loadSettings(),
	};

	// listen to messages from main process 
	ipcRenderer.on(channel.menu, async (event, message: string) => {
		switch (message) {
		case menuOption.connect:
			await cmdConnect(database, state);
			break;

		case menuOption.disconnect:
			await cmdDisconnect(database, state);
			break;
		
		case menuOption.closeAllTabs:
			await cmdCloseAllTabs(state);
			break;
	
		case menuOption.run:
			await runStatement(database, state.settings.pages[state.settings.currentPageId].statement, getTableElement(state.settings.currentPageId));
			break;

		case menuOption.commit:
			await runStatement(database, 'commit', getTableElement(state.settings.currentPageId));
			break;

		case menuOption.rollback:
			await runStatement(database, 'rollback', getTableElement(state.settings.currentPageId));
			break;
	
		case menuOption.export:
			if (state.settings.currentPageId >= 0) {
				await cmdExport(state.settings.currentPageId);
			}
			break;
		

		default:
			throw new Error(`The channel "${channel.menu}" received an unrecongnized message "${message}"`);
		}
	});

	// check for the window close
	window.addEventListener('unload', async () => {
		// save the settings
		await saveSettings(state.settings);

		// disconnect
		if (database.isConnected()) {
			database.disconnect();
		}		
	});

	// create the tabs
	renderTabs(database, state);

	// connect
	if (state.settings.connectString.length > 0) {
		const result = await connectWithDatabase(database, state.settings.connectString);
		getTableElement(state.settings.currentPageId).innerHTML = result;
	}
}

/*
*	Get table element
*/
function getTableElement(pageId: number): HTMLElement {
	return querySelector(`#view-pane-${pageId} .table-pane`) as HTMLElement;
}

onDomReady(render);
