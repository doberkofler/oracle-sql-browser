import {Database} from './database';
import {getTableMarkup} from './table';
import oracledb from 'oracledb';
import type {DBError} from 'oracledb';

/*
*	Run an arbistrary sql statement and show results
*/
export async function runStatement(database: Database, statement: string, resultElement: HTMLElement): Promise<void> {
	resultElement.innerHTML = await executeStatement(database, statement);
}

/*
*	Execute statement
*/
async function executeStatement(database: Database, statement: string): Promise<string> {
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
			return await executeSelect(database, purifiedStatement);

		case oracledb.STMT_TYPE_INSERT:
			return await executeInsert(database, purifiedStatement);

		case oracledb.STMT_TYPE_UPDATE:
			return await executeUpdate(database, purifiedStatement);

		case oracledb.STMT_TYPE_DELETE:
			return await executeDelete(database, purifiedStatement);

		case oracledb.STMT_TYPE_COMMIT:
			return await executeCommit(database);

		case oracledb.STMT_TYPE_ROLLBACK:
			return await executeRollback(database);

		default:
			break;
	}

	return '';
}

/*
*	Execute a select statement
*/
async function executeSelect(database: Database, statement: string): Promise<string> {
	let result;
	
	try {
		result = await database.select(statement);
	} catch (e) {
		return getFormattedError(database, e, statement);
	}

	console.log('executeSelect: result=', result);

	const html = getTableMarkup(result);

	return html;
}

/*
*	Execute a insert statement
*/
async function executeInsert(database: Database, statement: string): Promise<string> {
	let result;

	try {
		result = await database.getConnection().execute(statement, {}, {extendedMetaData: true});
	} catch (e) {
		return getFormattedError(database, e, statement);
	}

	return `Successfully inserted ${result.rowsAffected} rows.`;
}

/*
*	Execute a update statement
*/
async function executeUpdate(database: Database, statement: string): Promise<string> {
	let result;

	try {
		result = await database.getConnection().execute(statement, {}, {extendedMetaData: true});
	} catch (e) {
		return getFormattedError(database, e, statement);
	}

	return `Successfully updated ${result.rowsAffected} rows.`;
}

/*
*	Execute a delete statement
*/
async function executeDelete(database: Database, statement: string): Promise<string> {
	let result;

	try {
		result = await database.getConnection().execute(statement, {}, {extendedMetaData: true});
	} catch (e) {
		return getFormattedError(database, e, statement);
	}

	return `Successfully deleted ${result.rowsAffected} rows.`;
}

/*
*	Execute commit statement
*/
async function executeCommit(database: Database): Promise<string> {
	try {
		await database.getConnection().commit();
	} catch (e) {
		return getFormattedError(database, e, 'commit');
	}

	return 'Successful commit.';
}

/*
*	Execute rollback statement
*/
async function executeRollback(database: Database): Promise<string> {
	try {
		await database.getConnection().rollback();
	} catch (e) {
		return getFormattedError(database, e, 'rollback');
	}

	return 'Successful rollback.';
}

/*
*	Get formatted error text
*/
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
