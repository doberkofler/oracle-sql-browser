import {Database} from './database';
import {getTableMarkup} from './table';
import oracledb from 'oracledb';
import type {DBError} from 'oracledb';

export async function runStatement(database: Database, statement: string): Promise<string> {
	// remove trailing spaces and trailing semicolon
	const purifiedStatement = Database.purifyStatement(statement);

	// get information
	let info;
	try {
		info = await database.getConnection().getStatementInfo(purifiedStatement);
	} catch (e) {
		return getFormattedError(database, e, purifiedStatement);
	}

	// switch depending in statement type
	switch (info.statementType) {
		case oracledb.STMT_TYPE_SELECT:
			return await selectStatement(database, purifiedStatement);

		default:
			break;
	}

	return '';
}

async function selectStatement(database: Database, statement: string): Promise<string> {
	let result;
	
	try {
		result = await database.select(statement);
	} catch (e) {
		return getFormattedError(database, e, statement);
	}

	const html = getTableMarkup(result);

	return html;
}

function getFormattedError(database: Database, error: DBError, statement: string): string { // eslint-disable-line @typescript-eslint/no-unused-vars
	const html = [];

	html.push('<div class="error">');

	html.push('<h1>Oracle error:</h1>');

	try {
		html.push(`<p>Oracle client library version:&nbsp;${oracledb.oracleClientVersionString}</p>`);
	} catch (e)  {} // eslint-disable-line no-empty
	try {
		html.push(`<p>Oracle server version:&nbsp;${database.getConnection().oracleServerVersionString}</p>`);
	} catch (e)  {} // eslint-disable-line no-empty

	if (typeof error.message === 'string') {
		html.push(`<p>Error message:&nbsp;${error.message}</p>`);
	}

	if (typeof error.errorNum === 'number') {
		html.push(`<p>Error number:&nbsp;${error.errorNum}</p>`);
	}

	if (typeof error.offset === 'number') {
		html.push(`<p>Error offset:&nbsp;${error.offset}</p>`);
	}

	html.push('</div>');

	return html.join('');
}
