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
import debounce from 'lodash.debounce';
import {loadSettings, saveSettings} from './settings';
import {createDialog} from './dialog';
import Split from 'split.js';
import {Database} from './database';
import {runStatement} from './runStatement';

import type {settingsType} from './settings';

type stateType = {
	settings: settingsType,
	pageId: number,
};

const saveSettingsDebounced = debounce(saveSettings, 5 * 1000);
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
	getTableElement(state.pageId).innerHTML = result;

	// set configuration settings
	await saveSettings({connectString: state.settings.connectString});
}
 
/*
*	Execute the "run" command
*/
async function cmdRun(database: Database, state: stateType): Promise<void> {
	const html = await runStatement(database, state.settings.pages[state.pageId].statement);
	getTableElement(state.pageId).innerHTML = html;
}
 
/*
*	Execute the "clean" command
*/
function cmdClean(state: stateType): void {
	state.settings.pages[state.pageId].statement = '';
	getEditorElement(state.pageId).value = '';
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
	// check for the window close
	window.addEventListener('unload', function() {
		if (database.isConnected()) {
			database.disconnect();
		}		
	});

	// get configuration settings
	const state: stateType = {
		settings: await loadSettings(),
		pageId: 0,
	};

	// create the tabs
	renderTabs(state);
	
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
	
				case '#run':
					cmdRun(database, state);
					break;
	
				case '#clear':
					cmdClean(state);
					break;
	
				default:
					break;
			}
		}
	}, false);
	
	// connect
	if (state.settings.connectString.length > 0) {
		const result = await connectWithDatabase(database, state.settings.connectString);
		getTableElement(state.pageId).innerHTML = result;
	}
}

/*
*	Create the tabs
*/
function renderTabs(state: stateType) {
	// get the elements
	const tabsPaneElement = getElementById('tabs-pane');

	// process the settings
	let tabs = '';
	let views = '';
	state.settings.pages.forEach((page, index) => {
		const pageId = `view-pane-${index}`;
		tabs += `<a href="#${index}">${page.name}</a>`;
		views += `<div id="${pageId}" class="view-pane" style="${index > 0 ? 'display: none;' : ''}"><div class="editor-pane"><textarea class="editor">${page.statement}</textarea></div><div class="table-pane"></div></div>`;
	});
	tabsPaneElement.innerHTML = tabs;
	tabsPaneElement.insertAdjacentHTML('afterend', views);

	state.settings.pages.forEach((page, index) => {
		// create the split area
		const pageId = `view-pane-${index}`;

		if (typeof page.editorSizePct !== 'number' || page.editorSizePct < 10 || page.editorSizePct > 90) {
			page.editorSizePct = 30;
		}

		/*const split = */Split([`#${pageId} .editor-pane`, `#${pageId} .table-pane`], {
			direction: 'vertical',
			sizes: [page.editorSizePct, 100 - page.editorSizePct],
		});

		// attach editor key listener
		const editorElement = getEditorElement(index);
		editorElement.addEventListener('keydown', (ev: KeyboardEvent) => {
			if (ev.ctrlKey && ev.key === 'Enter') {
				page.statement = editorElement.value;
				saveSettingsDebounced(state.settings);
				cmdRun(database, editorElement.value);
			}
		});
		editorElement.addEventListener('keyup', () => {
			page.statement = editorElement.value;
			saveSettingsDebounced(state.settings);
		});
	});

	const viewElements = Array.from(document.getElementsByClassName('view-pane')) as Array<HTMLElement>;
	const hideAllViews = () => viewElements.forEach(e => e.style.display = 'none');
	tabsPaneElement.addEventListener('click', (ev: MouseEvent) => {
		hideAllViews();

		const href = ev.target instanceof HTMLElement ? ev.target.getAttribute('href') : '';
		if (typeof href !== 'string' || href[0] !== '#') {
			throw new Error('attribute "href" not found');
		}
		const pageId = parseInt(href.replace('#', ''), 10);
		if (typeof pageId !== 'number' || pageId < 0 || pageId >= state.settings.pages.length) {
			throw new Error(`Invalid pageId "${pageId}"`);
		}
		state.pageId = pageId;
		getElementById(`view-pane-${pageId}`).style.display = 'block';
	});
}

/*
*	Get editor element
*/
function getEditorElement(pageId: number): HTMLFormElement {
	return querySelector(`#view-pane-${pageId} .editor`) as HTMLFormElement;
}

/*
*	Get table element
*/
function getTableElement(pageId: number): HTMLElement {
	return querySelector(`#view-pane-${pageId} .table-pane`) as HTMLElement;
}

onDomReady(render);
