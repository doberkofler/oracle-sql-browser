import {split, BlockType} from './sqlparser/lexer';
import {Database} from './database';
import {runStatementSqlPlus} from './runStatementSqlPlus';
import {runStatementSql} from './runStatementSql';

import type {ScriptBlockType} from './sqlparser/lexer';

/*
*	Execute arbistrary script
*/
export async function executeScript(database: Database, script: string): Promise<string> {
	// split the script into blocks
	let blocks;
	try {
		blocks = split(script);
	} catch (err) {
		return err.message;
	}

	// process each block
	let resultHtml = '';
	for (const block of blocks) {
		try {
			resultHtml = await executeScriptBlock(database, block);
		} catch (err) {
			return err.message;
		}
	}

	// return the results
	return resultHtml;
}

/*
*	Execute script block
*/
async function executeScriptBlock(database: Database, block: ScriptBlockType): Promise<string> {
	switch (block.type) {
		case BlockType.sqlplus:
			return runStatementSqlPlus(database, block);

		case BlockType.plsql:
			return runStatementSql(database, block);

		case BlockType.sql:
			return runStatementSql(database, block);

		default:
			throw new Error(`ERROR: Unrecognize block type "${block.type}"!`);
		}
}
