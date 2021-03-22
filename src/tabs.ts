import Split from 'split.js';
import {getElementById, querySelector} from './dom';
import {addPage} from './settings';
import {Database} from './database';
import {runStatement} from './runStatement';

import type {stateType, pageType} from './state';

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
		const pageMarkup = getTabMarkup(index, page.name, page.statement);

		tabs += pageMarkup.tab;
		views += pageMarkup.view;
	});
	tabsPaneElement.innerHTML = tabs;
	//tabsPaneElement.insertAdjacentHTML('afterend', views);
	viewsPaneElement.innerHTML = views;

	state.settings.pages.forEach((page, index) => addTabListener(database, index, page));

	tabsPaneElement.addEventListener('click', (ev: MouseEvent) => {
		const href = ev.target instanceof HTMLElement ? ev.target.getAttribute('href') : '';
		if (typeof href !== 'string' || href[0] !== '#') {
			throw new Error('attribute "href" not found');
		}
		const pageId = parseInt(href.replace('#', ''), 10);
		if (typeof pageId !== 'number' || pageId < 0 || pageId >= state.settings.pages.length) {
			throw new Error(`Invalid pageId "${pageId}"`);
		}

		activateTab(pageId);
		state.currentPageId = pageId;
	});
}

/*
*	Add a tab
*/
export function addTab(database: Database, state: stateType): void {
	// get the elements
	const tabsPaneElement = getElementById('tabs-pane');
	const viewsPaneElement = getElementById('views-pane');
	
	// add a new page
	const page = addPage(state.settings);

	// render page
	const currentPageId = state.settings.pages.length - 1;
	const pageMarkup = getTabMarkup(currentPageId, page.name, page.statement);
	tabsPaneElement.insertAdjacentHTML('beforeend', pageMarkup.tab);
	viewsPaneElement.insertAdjacentHTML('beforeend', pageMarkup.view);
	addTabListener(database, currentPageId, page)

	// activate tab
	activateTab(currentPageId);
	state.currentPageId = currentPageId;
}

function activateTab(pageId: number) {
	const viewElements = Array.from(document.getElementsByClassName('view-pane')) as Array<HTMLElement>;
	
	viewElements.forEach(e => e.style.display = 'none');
	getElementById(`view-pane-${pageId}`).style.display = 'block';
}

function getTabMarkup(index: number, name: string, statement: string): {tab: string, view: string} {
	const pageId = `view-pane-${index}`;

	return {
		tab: `<a href="#${index}">${name}</a>`,
		view: `<div id="${pageId}" class="view-pane" style="${index > 0 ? 'display: none;' : ''}"><div class="editor-pane"><textarea class="editor">${statement}</textarea></div><div class="table-pane"></div></div>`,
	};
}

function addTabListener(database: Database, currentPageId: number, page: pageType): void {
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
		page.statement = editorElement.value;
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
