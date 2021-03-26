import Split from 'split.js';
import debounce from 'lodash.debounce';
import {getElementById, querySelector} from './dom';
import * as settings from './settings';
import {Database} from './database';
import {runStatement} from './runStatement';

import type {stateType, settingsType, pageType} from './state';

const saveSettingsDebounced = debounce(settings.saveSettings, 2000);

/*

export type tabConfigType = {
	id: string;
	name: string;
	render: (view: HTMLElement) => void;
};

type tabType = tabConfigType & {
	tabElement?: HTMLElement;
	viewElement: HTMLElement;
};

export class TabsWidget {
	tabs: Array<tabType> = [];
	rendered = false;

	public add(config: tabConfigType|Array<tabConfigType>): void {
		if (Array.isArray(config)) {
			config.forEach(e => this.add(e));
			return;
		}

		if (typeof this.get(config.id) !== 'undefined') {
			throw new Error(`The id "${config.id}" has already been used in this TabWidget`);
		}

		const tab: tabType = {
			id:  config.id,
			name: config.name,
			render: config.render,
		};

		this.tabs.push(tab);
		if (this.rendered) {
			this.renderTab(tab);
		}
	}

	public del(id: string): void {
		const tab = this.get(id);
		// delete
	}


	public activate(id: string): void {
		const tab = this.get(id);
		// activate
	}

	public render(tabsElement: HTMLElement, viewElement: HTMLElement): void {
		this.rendered = true;
	}

	public get(id: string): tabConfigType|null {
		return this.tabs.find(e => e.id === id);
	}

	private renderTab(tab: tabType): void {
		;
	}
}

*/

/*
*	Create the tabs
*/
export function renderTabs(database: Database, state: stateType): void {
	// get the elements
	const tabsPaneElement = getElementById('tabs-pane');
	const viewsPaneElement = getElementById('views-pane');

	// process the settings
	let tabs = '';
	let views = '';
	state.settings.pages.forEach((page, index) => {
		tabs += getTab(index, page.name);
		views += getView(index, page.name, page.statement);
	});

	// add the "add tab" icon
	tabs += '<div id="tab-add" class="tab-container""><a href="#" class="tab-add">+</a></div>';

	// render
	tabsPaneElement.innerHTML = tabs;
	viewsPaneElement.innerHTML = views;

	// activate tab
	if (state.settings.currentPageId >= 0 && state.settings.currentPageId < state.settings.pages.length) {
		activateTab(state.settings.currentPageId);
	}

	// add lister to the views
	state.settings.pages.forEach((page, index) => addTabListener(database, state.settings, index, page));

	// add one listener to the tabs
	tabsPaneElement.addEventListener('click', (ev: MouseEvent) => {
		if (ev.target instanceof HTMLElement) {
			const target = ev.target as HTMLElement;

			if (target.classList.contains('tab-label')) {
				const pageId = getPageId(target);
				activateTab(pageId);
				state.settings.currentPageId = pageId;
				settings.saveSettings(state.settings);
			} else if (target.classList.contains('tab-close')) {
				const pageId = getPageId(target);
				closeTab(state, pageId);
				settings.saveSettings(state.settings);
			} else if (target.classList.contains('tab-add')) {
				addTab(database, state);
				settings.saveSettings(state.settings);
			}
		}
	});
}

/*
*	Get the page id from the "data-pageid" attribute
*/
function getPageId(element: HTMLElement): number {
	const text = element.dataset.pageid;
	if (typeof text !== 'string' || text.length === 0) {
		throw new Error('data attribute "pageid" not found');
	}

	const pageId = parseInt(text, 10);
	if (isNaN(pageId)) {
		throw new Error(`data attribute "${text}" is not a number`);
	}

	return pageId;
}

/*
*	Add a tab
*/
function addTab(database: Database, state: stateType): void {
	// get the elements
	const tabAddElement = getElementById('tab-add');
	const viewsPaneElement = getElementById('views-pane');
	
	// add new page to state
	const page = settings.addPage(state.settings);

	// render page
	const currentPageId = state.settings.pages.length - 1;
	tabAddElement.insertAdjacentHTML('beforebegin', getTab(currentPageId, page.name));
	viewsPaneElement.insertAdjacentHTML('beforeend', getView(currentPageId, page.name, page.statement));
	addTabListener(database, state.settings, currentPageId, page)

	// activate tab
	activateTab(currentPageId);
	state.settings.currentPageId = currentPageId;
}

/*
*	Close a tab
*/
function closeTab(state: stateType, pageId: number): void {
	// remove page from state
	settings.removePage(state.settings, pageId);

	// get the elements
	const tabsPaneElement = getElementById(`tab-${pageId}`);
	const viewsPaneElement = getElementById(`view-pane-${pageId}`);
	
	// remove the elements
	tabsPaneElement.parentNode.removeChild(tabsPaneElement);
	viewsPaneElement.parentNode.removeChild(viewsPaneElement);

	// activate tab
	activateTab(state.settings.currentPageId);
}

function activateTab(pageId: number) {
	// tab
	const tabElements = Array.from(document.getElementsByClassName('tab-container')) as Array<HTMLElement>;
	tabElements.forEach(e => e.classList.remove('active'));
	getElementById(`tab-${pageId}`).classList.add('active');

	// view
	const viewElements = Array.from(document.getElementsByClassName('view-pane')) as Array<HTMLElement>;
	viewElements.forEach(e => e.style.display = 'none');
	getElementById(`view-pane-${pageId}`).style.display = 'block';
}

function getTab(index: number, name: string): string {
	const dataAttribute = `data-pageid="${index}"`;

	return `<div id="tab-${index}" class="tab-container" ${dataAttribute}><span class="tab-label" ${dataAttribute}>${name}</span><a href="#" class="tab-close" ${dataAttribute}>✖</a></div>`;
}

function getView(index: number, name: string, statement: string): string {
	return `<div id="view-pane-${index}" class="view-pane" style="${index > 0 ? 'display: none;' : ''}"><div class="editor-pane"><textarea class="editor">${statement}</textarea></div><div class="table-pane"></div></div>`;
}

function addTabListener(database: Database, settings: settingsType, currentPageId: number, page: pageType): void {
	// create the split area
	const pageId = `view-pane-${currentPageId}`;

	if (typeof page.editorSizePct !== 'number' || page.editorSizePct < 10 || page.editorSizePct > 90) {
		page.editorSizePct = 30;
	}

	/*const split = */Split([`#${pageId} .editor-pane`, `#${pageId} .table-pane`], {
		direction: 'vertical',
		sizes: [page.editorSizePct, 100 - page.editorSizePct],
	});

	// attach editor key listener
	const editorElement = getEditorElement(currentPageId);
	editorElement.addEventListener('keydown', (ev: KeyboardEvent) => {
		if (ev.ctrlKey && ev.key === 'Enter') {
			page.statement = editorElement.value;
			runStatement(database, page.statement, getTableElement(currentPageId));
		}
	});
	editorElement.addEventListener('keyup', () => {
		// upfdate state with current statement
		page.statement = editorElement.value;

		// save settings but debounce
		saveSettingsDebounced(settings);
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
