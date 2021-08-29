import {Database} from './database';
import {saveSettings} from './settings';
import {setMainWindowTitle} from './utilities';

/*
*	Connect with the database
*/
export async function databaseConnect(database: Database, connectString: string): Promise<string> {
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

	// save the settings
	await saveSettings({connectString: connectString});

	// update window title
	setMainWindowTitle(`${result.user}@${result.connectString}`);

	return `Successfully connected as ${result.user}.`;
}

/*
*	Execute the "disconnect" command
*/
export async function databaseDisconnect(database: Database): Promise<void> {
	// disconnect
	if (database.isConnected()) {
		await database.disconnect();
	}

	// update window title
	setMainWindowTitle('');
}
