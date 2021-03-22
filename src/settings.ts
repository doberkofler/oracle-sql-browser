/*
*	Application settings
*
*	app.getPath('userData') -> "/Users/doberkofler/Library/Application Support/oracle-sql-browser"
*/

import storage from 'electron-json-storage';
//import debounce from 'lodash.debounce';

export type pageType = {
	name: string;
	statement: string;
	editorSizePct: number;
};

export type settingsType = {
	connectString: string;
	windowStatus: {
		height: number;
		width: number;
		x: number|undefined;
		y: number|undefined;
		isMaximized: boolean;
	};
	pages: Array<pageType>;
};

const settingsName = 'oracle_sql_browser_settings';

/*
*	Get default settings
*/
export function getDefaultSettings(): settingsType {
	const settings: settingsType = {
		connectString: '',
		windowStatus: {
			height: 400,
			width: 800,
			x: undefined,
			y: undefined,
			isMaximized: false,
		},
		pages: [],
	};

	addPage(settings);
	
	return settings;
}

/*
*	Load settings
*/
export function addPage(settings: settingsType): pageType {
	const page = {
		name: `Query ${settings.pages.length + 1}`,
		statement: '',
		editorSizePct: 30,
	};

	settings.pages.push(page);

	return page;
}
	
	
/*
*	Load settings
*/
export async function loadSettings(): Promise<settingsType> {
	return new Promise((resolve, reject) => {
		storage.get(settingsName, function(error, data) {
			if (error) {
				reject(error);
			} else {
				resolve(Object.assign({}, getDefaultSettings(), data));
			}
		});
	});
}

/*
*	Save settings
*/
export async function saveSettings(settings: Partial<settingsType>): Promise<void> {
	return new Promise((resolve, reject) => {
		// get the settings
		storage.get(settingsName, function(error, data) {
			if (error) {
				reject(error);
			} else {
				// merge the new settings
				const mergedSettings = Object.assign({}, getDefaultSettings(), data, settings);

				// set the settings
				storage.set(settingsName, mergedSettings, function(error) {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			}
		});
	});
}
