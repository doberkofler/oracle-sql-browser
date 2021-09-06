import oracledb from 'oracledb';
import path from 'path';
import type {Connection} from 'oracledb';
import {isPackaged} from './utilities';

export type Oracle$RowType = {[key: string]: any}; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Oracle$MetaType = {
	name: string,
	type: number,
};
export type Oracle$ResultType = {
	rows: Array<Oracle$RowType>,
	meta: Array<Oracle$MetaType>,
};

/*
*	load and initialize the Oracle Client libraries
*/
export function initOracleClient(): string {
	let libDir = '';

	try {
		libDir = !isPackaged() ? path.join(__dirname, '../instantclient_19_8') : path.join(process.resourcesPath, 'instantclient_19_8');
	} catch (e) {
		return `Unable to determine the location of the  Oracle Client libraries\n${e.message}`
	}

	try {
		oracledb.initOracleClient({libDir});
		return '';
	} catch (e) {
		return `Unable to find the Oracle Client libraries in the directory "${libDir}"`;
	}
}

export class Database {
	private connection: oracledb.Connection|null = null;

	constructor() {
		// The format of query rows fetched when using connection.execute() or connection.queryStream().
		// If specified as oracledb.OUT_FORMAT_ARRAY, each row is fetched as an array of column values.
		oracledb.outFormat = oracledb.OUT_FORMAT_ARRAY;

		// When any column having one of the types is queried with execute() or queryStream(),
		//	the column data is returned as a string instead of the default representation.
		oracledb.fetchAsString = [oracledb.CLOB];

		// load and initialize the Oracle Client libraries
		initOracleClient();
	}

	isConnected(): boolean {
		return this.connection !== null;
	}

	async connect(user: string, password: string, connectString: string): Promise<void> {
		this.connection = await oracledb.getConnection({user, password, connectString});
	}

	async disconnect(): Promise<void> {
		if (this.connection !== null) {
			this.connection.close();
		}
		this.connection = null;
	}

	getConnection(): Connection {
		if (this.connection === null) {
			throw new Error('Not connected');
		}

		return this.connection;
	}

	async select(statement: string): Promise<Oracle$ResultType> {
		const connection = this.getConnection();

		const result = await connection.execute<{[key: string]: any}>(statement, {}, { // eslint-disable-line @typescript-eslint/no-explicit-any
				extendedMetaData: true,
		});

		if (!Array.isArray(result.rows)) {
			throw new Error('No array has been returned');
		}
		if (!Array.isArray(result.metaData)) {
			throw new Error('No metaData has been returned');
		}

		if (result.rows.length > 0) {
			result.rows[0].forEach((column: any, index: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
				console.log(`#${index}: type="${typeof column}" value="${column}"`);
			});
		}

		return {
			rows: result.rows,
			meta: result.metaData.map(e => ({name: e.name, type: typeof e.dbType === 'number' ? e.dbType : -1})),
		}
	}

	static parseConnectString(value: string): {user: string, password: string, connectString: string} {
		const result = {
			user: '',
			password: '',
			connectString: '',
		};

		// split user/password and connect string
		const temp1 = value.trim().split('@');
		if (temp1.length !== 2) {
			throw new Error('No single "@" sign found to separate user/password from connect string');
		}
		if (typeof temp1[0] !== 'string' || temp1[0].length === 0) {
			throw new Error('No username and password given');
		}
		if (typeof temp1[1] !== 'string' || temp1[1].length === 0) {
			throw new Error('No connect string given');
		}

		result.connectString = temp1[1];

		// split user and password
		const temp2 = temp1[0].trim().split('/');
		if (temp2.length !== 2) {
			throw new Error('No single "/" sign found to separate user and password');
		}
		if (typeof temp2[0] !== 'string' || temp2[0].length === 0) {
			throw new Error('No username given');
		}
		if (typeof temp2[1] !== 'string') {
			throw new Error('No password given');
		}

		result.user = temp2[0];
		result.password = temp2[1];

		return result;
	}

	static purifyStatement(statement: string): string {
		let temp = statement.trim();

		temp = temp.replace(/;$/, '');

		return temp;
	}
}
