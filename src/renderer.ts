import {ipcRenderer} from 'electron';
import {getCurrentWindow, getDialog} from './utilities';
import XLSX from 'xlsx';
import {onDomReady, querySelector} from './dom';
import {getDefaultSettings,loadSettings, saveSettings} from './settings';
import {createConnectDialog} from './connectDialog';
import {renderTabs} from './tabs';
import {Database} from './database';
import {RunType, execute} from './runStatement';
import {executeCommit, executeRollback} from './runStatementSql';
import {channel, menuOption} from './constants';
import {databaseConnect, databaseDisconnect} from './connect';

import type {stateType} from './state';

const database = new Database();

/*
*	Execute the "connect" command
*/
async function cmdConnect(database: Database, state: stateType): Promise<void> {
	// prompt for a connection string
	const currentWindow = getCurrentWindow();
	state.settings.connectString = await createConnectDialog(currentWindow, state.settings.connectString);
	if (state.settings.connectString === null) {
		return;
	}
 
	// connect
	const result = await databaseConnect(database, state.settings.connectString);
	getTableElement(state.settings.currentPageId).innerHTML = result;
}

/*
*	Execute the "disconnect" command
*/
async function cmdDisconnect(database: Database, state: stateType): Promise<void> {
	await databaseDisconnect(database);
 
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
*	Export results to an Excel file
*/
async function cmdExport(pageId: number) {
	const tableElement = getTableElement(pageId);
	const wb = XLSX.utils.table_to_book(tableElement);
	const file = await getDialog().showSaveDialog({
		title: 'Save file as',
		filters: [{
			name: 'Spreadsheets',
			extensions: 'xlsx|csv'.split('|')
		}]
	});

	XLSX.writeFile(wb, file.filePath);
}
 
/*
*	render
*/
async function render(): Promise<void> {
	// get configuration settings
	const state: stateType = {
		settings: await loadSettings(),
	};

	let resultHtml = '';

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
	
		case menuOption.runScript:
			resultHtml = await execute(database, state.settings.pages[state.settings.currentPageId], RunType.RunScript);
			break;

		case menuOption.runStatement:
			resultHtml = await execute(database, state.settings.pages[state.settings.currentPageId], RunType.RunOneStatement);
			break;
	
			case menuOption.commit:
			resultHtml = await executeCommit(database);
			break;

		case menuOption.rollback:
			resultHtml = await executeRollback(database);
			break;
	
		case menuOption.export:
			if (state.settings.currentPageId >= 0) {
				await cmdExport(state.settings.currentPageId);
			}
			break;
		

		default:
			throw new Error(`The channel "${channel.menu}" received an unrecongnized message "${message}"`);
		}

		// update result panel
		if (resultHtml.length > 0) {
			const resultElement = getTableElement(state.settings.currentPageId);
			resultElement.innerHTML = resultHtml;
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
		const result = await databaseConnect(database, state.settings.connectString);
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
