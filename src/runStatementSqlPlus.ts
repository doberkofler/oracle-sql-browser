import {Database} from './database';
import {ruleNames, getText} from './sqlparser/lexer';
import {databaseConnect, databaseDisconnect} from './connect';

import type {ScriptBlockType} from './sqlparser/lexer';

/*
*	Execute SQL statement
*/
export async function runStatementSqlPlus(database: Database, block: ScriptBlockType): Promise<string> {
	console.log(JSON.stringify(block.tokens, null, 3));

	if (block.tokens.length === 0) {
		throw new Error('ERROR: The block must at least contain one token');
	}

	switch (block.tokens[0].value) {
		case 'connect':
			return executeConnect(database, block);
		
		case 'disconnect':
			return executeDisconnect(database);
		
		default:
			throw new Error(`ERROR: Invalid sqlplus command "${block.text}"!`);
			break;
	}
}

/*
*	Execute a "connect" statement
*/
async function executeConnect(database: Database, block: ScriptBlockType): Promise<string> {
	// get the connection string
	const connectionString = getText(block.tokens, 2, ruleNames.nl)

	// connect
	const result = await databaseConnect(database, connectionString);

	return result;
}

/*
*	Execute a "disconnect" statement
*/
async function executeDisconnect(database: Database): Promise<string> {
	await databaseDisconnect(database);
 
	return 'Disconnected';
}
