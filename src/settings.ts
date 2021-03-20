/*
*	Application settings
*
*	app.getPath('userData') -> "/Users/doberkofler/Library/Application Support/oracle-sql-browser"
*/

import storage from 'electron-json-storage';

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
const defaultSettings: settingsType = {
	connectString: '',
	windowStatus: {
		height: 400,
		width: 800,
		x: undefined,
		y: undefined,
		isMaximized: false,
	},
	pages: [
		{
			name: 'Query 1',
			statement: 'select * from dual;',
			editorSizePct: 30,
		},
		{
			name: 'Query 2',
			statement: 'select sysdate from dual;',
			editorSizePct: 30,
		}
	],
};

/*
*	Load settings
*/
export async function loadSettings(): Promise<settingsType> {
	return new Promise((resolve, reject) => {
		storage.get(settingsName, function(error, data) {
			if (error) {
				reject(error);
			} else {
				resolve(Object.assign({}, defaultSettings, data));
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
				const mergedSettings = Object.assign({}, defaultSettings, data, settings);

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
