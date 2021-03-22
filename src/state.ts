import type {settingsType} from './settings';
export type {pageType, settingsType} from './settings';

export type stateType = {
	settings: settingsType,
	currentPageId: number,
};
