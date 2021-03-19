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
import debounce from 'lodash.debounce';
import {loadSettings, saveSettings} from './settings';
import {createDialog} from './dialog';
import Split from 'split.js';
import {Database} from './database';
import {runStatement} from './runStatement';

const oracle = new Database();

/*
*	Execute the "connect" command
*/
async function cmdConnect(database: Database, connectString: string): Promise<void> {
	// prompt for a connection string
	const currentWindow = remote.getCurrentWindow();
	connectString = await createDialog(currentWindow, connectString);

	//const connectString = 'LJ_UNITTEST/DTRELKMARPAT@localhost:1521/TEST';
	if (connectString === null) {
		return;
	}
 
	// get table-pane element
	const tableElement = document.getElementById('table-pane');
	if (tableElement === null) {
		throw new Error('table-pane not found');
	}
 
	// parse the connection string
	let result;
	try {
		result = Database.parseConnectString(connectString);
	} catch (e) {
		tableElement.innerHTML = `Connection error:&nbsp;${e.message}`;
		return;
	}
 
	// disconnect
	if (database.isConnected()) {
		database.disconnect();
	}
 
	// connect
	try {
		await database.connect(result.user, result.password, result.connectString);
	} catch (e) {
		tableElement.innerHTML = `Connection error:&nbsp;${e.message}`;
		return;
	}
 
	// set configuration settings
	await saveSettings({connectString});

	tableElement.innerHTML = `Successfully connected as ${result.user}.`;
}
 
/*
*	Execute the "run" command
*/
async function cmdRun(database: Database, statement: string): Promise<void> {
	cmdSaveEditor(statement);

	const html = await runStatement(database, statement);
	const tableElement = document.getElementById('table-pane');
	if (tableElement === null) {
		throw new Error('table-pane not found');
	}

	tableElement.innerHTML = html;
}
 
/*
*	Execute the "clean" command
*/
function cmdClean(): void {
	const editor = document.getElementById('editor') as HTMLTextAreaElement;
	if (editor === null) {
		throw new Error('editor not found');
	}

	editor.value = '';
}

/*
*	Execute the "save editor" command
*/
async function cmdSaveEditor(statement: string): Promise<void> {
	await saveSettings({statement});
}
const cmdSaveEditorDebounced = debounce(cmdSaveEditor, 5 * 1000);

/*
*	render
*/
async function render(): Promise<void> {
	// get configuration settings
	const settings = await loadSettings();
	
	// create the split area
	/*const split = */Split(['#editor-pane', '#table-pane'], {
		direction: 'vertical',
		sizes: [30, 70],
	});

	// get DOM elements
	const toolbarElement = document.getElementById('toolbar-pane');
	if (toolbarElement === null) {
		throw new Error('toolbar-pane not found');
	}
	const editorElement = document.getElementById('editor') as HTMLFormElement;
	if (editorElement === null) {
		throw new Error('editor not found');
	}

	// set editor content
	editorElement.value = settings.statement;
	
	// attach toolbar listener
	toolbarElement.addEventListener('click', (ev: MouseEvent) => {
	if (ev.target instanceof HTMLElement && ev.target.tagName === 'A') {
			const element = ev.target as HTMLAnchorElement;
			const href = element.getAttribute('href');

			switch (href) {
				case '#connect':
					cmdConnect(oracle, settings.connectString);
					break;
	
				case '#run':
					cmdRun(oracle, editorElement.value);
					break;
	
				case '#clear':
					cmdClean();
					break;
	
				default:
					break;
			}
		}
	}, false);
	
	// attach editor key listener
	editorElement.addEventListener('keydown', (ev: KeyboardEvent) => {
		if (ev.ctrlKey && ev.key === 'Enter') {
			cmdRun(oracle, editorElement.value);
		}
	});
	editorElement.addEventListener('keyup', () => {
		cmdSaveEditorDebounced(editorElement.value);
	});
}

document.addEventListener('DOMContentLoaded', render);
