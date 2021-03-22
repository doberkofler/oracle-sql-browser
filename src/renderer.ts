/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import {remote} from 'electron';
import {onDomReady, getElementById, querySelector} from './dom';
import {getDefaultSettings,loadSettings, saveSettings} from './settings';
import {createDialog} from './dialog';
import {renderTabs, addTab} from './tabs';
import {Database} from './database';
import {runStatement} from './runStatement';

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
	getTableElement(state.currentPageId).innerHTML = result;

	// save the settings
	await saveSettings({connectString: state.settings.connectString});
}

/*
*	Execute the "clear" command
*/
function cmdClear(state: stateType): void {
	// set default settings for pages
	Object.assign(state.settings.pages, getDefaultSettings().pages);
	state.currentPageId = 0;

	// render tabs
	renderTabs(database, state);

	// save the settings (not await because we don't care when it finishes)
	saveSettings({pages: state.settings.pages});
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
		currentPageId: 0,
	};

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
	
	// get DOM elements
	const toolbarElement = getElementById('toolbar-pane');

	// attach toolbar listener
	toolbarElement.addEventListener('click', (ev: MouseEvent) => {
	if (ev.target instanceof HTMLElement && ev.target.tagName === 'A') {
			const element = ev.target as HTMLAnchorElement;
			const href = element.getAttribute('href');

			switch (href) {
				case '#connect':
					cmdConnect(database, state);
					break;

				case '#new':
					addTab(database, state);
					break;
	
				case '#run':
					runStatement(database, state.settings.pages[state.currentPageId].statement, getTableElement(state.currentPageId));
					break;
	
				case '#clear':
					cmdClear(state);
					break;
	
				default:
					break;
			}
		}
	}, false);
	
	// connect
	if (state.settings.connectString.length > 0) {
		const result = await connectWithDatabase(database, state.settings.connectString);
		getTableElement(state.currentPageId).innerHTML = result;
	}
}

/*
*	Get table element
*/
function getTableElement(pageId: number): HTMLElement {
	return querySelector(`#view-pane-${pageId} .table-pane`) as HTMLElement;
}

onDomReady(render);
