import {lexer, ruleNames} from './lexer';
import _debug from 'debug';

const debug = _debug('lexer');

export enum BlockType {
	sql = 'sql',
	plsql = 'plsql',
	sqlplus = 'sqlplus',
}
export type ResultType = {
	tokens: Array<moo.Token>,
	index: number,
	text: string,
}
export type ScriptBlockType = {
	type: BlockType,
	tokens: Array<moo.Token>,
	text: string,
}

export function split(text: string): Array<ScriptBlockType> {
	debug(`split "${text}"`);

	if (text[text.length - 1] !== '\n') {
		text += '\n';
	}

	// tokenize the script
	const tokens = lexer(text);

	// process the tokens
	const blocks: Array<ScriptBlockType> = [];
	const tokenCount = tokens.length;
	let i = 0;
	while (i < tokenCount) {
		const token = tokens[i];

		debug(`i=${i} token.type="${token.type}" token.text="${token.text}"`);

		switch (token.type) {
			case ruleNames.sqlKeywordsSlash: {
				// find the next "sqlSlash" token
				const result = findToken(tokens, tokenCount, i, ruleNames.sqlSlash);
				if (result) {
					debug(`${token.text.toUpperCase()}: result.text=${result.text} result.index="${result.index}"`);
					blocks.push({
						type: BlockType.plsql,
						tokens: result.tokens,
						text: result.text,
					});
					i = result.index;
				} else {
					throw new Error(`${token.line}:${token.col} - The ${token.text.toLowerCase()} statement is not followed by a slash`);
				}
				break;
			}

			case ruleNames.sqlKeywordsSemi: {
				// find the next "semicolon" token
				const result = findToken(tokens, tokenCount, i, ruleNames.semicolon);
				if (result) {
					debug(`${token.text.toUpperCase()}: result.text=${result.text} result.index="${result.index}"`);
					blocks.push({
						type: BlockType.sql,
						tokens: result.tokens,
						text: result.text,
					});
					i = result.index;
				} else {
					throw new Error(`${token.line}:${token.col} - The ${token.text.toLowerCase()} statement is not followed by a semicolon`);
				}
				break;
			}

			case ruleNames.sqlPlusKeywords: {
				// find the next "nl" token
				const result = findToken(tokens, tokenCount, i, ruleNames.nl);
				if (result) {
					debug(`${token.text.toUpperCase()}: result.text=${result.text} result.index="${result.index}"`);
					blocks.push({
						type: BlockType.sqlplus,
						tokens: result.tokens,
						text: result.text,
					});
					i = result.index;
				} else {
					throw new Error(`${token.line}:${token.col} - The ${token.text.toLowerCase()} statement is not followed by a nl`);
				}
				break;
			}

			default:
				break;
		}
		
		i++;
	}

	debug('split returned:', blocks);

	return blocks;
}

/*
*	Find a token with the property "type" equal to the "type" argument startig with the token with index "start".
*/
function findToken(tokens: Array<moo.Token>, tokenCount: number, start: number, type: string): ResultType|undefined {
	const resultTokens: Array<moo.Token> = [];
	let resultText = '';

	for (let i = start; i < tokenCount; i++) {
		const token = tokens[i];

		resultTokens.push(token);
		resultText += token.text;
		
		if (token.type === type) {
			return {
				tokens: resultTokens,
				text: resultText,
				index: i,
			};
		}
	}

	return undefined;
}

/*
*	Get the text of all tokens starting with the n-th token until the end of the tokens or the given end type.
*/
export function getText(tokens: Array<moo.Token>, start = 0, endType = ''): string {
	let text = '';

	for (let i = start; i < tokens.length; i++) {
		const token = tokens[i];

		if (endType !== '' && token.type === endType) {
			break;
		}

		text += token.text;
	}

	return text;
}

/*
*	Return an array of blocks within the range of offsets
*/
export function getBlockRange(blocks: Array<ScriptBlockType>, offset: number): Array<ScriptBlockType> {
	return blocks.filter(block => isOffsetInBlock(block.tokens, offset));
}

/*
*	Is the given offset within the tokens in the given block
*/
export function isOffsetInBlock(tokens: Array<moo.Token>, offset: number): boolean {
	if (tokens.length === 0) {
		return false;
	}

	const firstTokenOffset = tokens[0].offset;
	const lastToken = tokens[tokens.length - 1];
	const lastTokenOffset = lastToken.offset + lastToken.text.length;

	return offset >= firstTokenOffset && offset <= lastTokenOffset;
}
