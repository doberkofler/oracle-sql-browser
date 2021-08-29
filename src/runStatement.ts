import {BlockType, split, getBlockRange} from './sqlparser/split';
import {Database} from './database';
import {runStatementSqlPlus} from './runStatementSqlPlus';
import {runStatementSql} from './runStatementSql';

import type {pageType} from './settings'; 
import type {ScriptBlockType} from './sqlparser/lexer';

export enum RunType {
	RunScript = 'RunScript',
	RunOneStatement = 'RunOneStatement',
}

/*
*	Execute script
*/
export async function execute(database: Database, page: pageType, runType: RunType): Promise<string> {
	// split the script into blocks
	let allBlocks: Array<ScriptBlockType>;
	try {
		allBlocks = split(page.statement);
	} catch (err) {
		return err.message;
	}

	// what shoud be executed
	let blocksToExecute: Array<ScriptBlockType>;
	let resultHtml = '';
	switch (runType) {
		case RunType.RunScript:
			break;

		case RunType.RunOneStatement:
			blocksToExecute = getBlockRange(allBlocks, page.selectionStart);
			break;

		default:
			throw new Error(`Invalid run type "${runType}"`);
	}

	// execute blocks
	for (const block of blocksToExecute) {
		try {
			resultHtml = await runBlock(database, block);
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
async function runBlock(database: Database, block: ScriptBlockType): Promise<string> {
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
