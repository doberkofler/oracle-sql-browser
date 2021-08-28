import {Database} from './database';
import oracledb from 'oracledb';
import type {DBError} from 'oracledb';

/*
*	Get formatted error text
*/
export function getFormattedError(database: Database, error: DBError, statement: string): string { // eslint-disable-line @typescript-eslint/no-unused-vars
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
