import moo from 'moo';
import _debug from 'debug';

const debug = _debug('lexer');

export enum ruleNames {
	scomment = 'scomment',
	mcomment = 'mcomment',
	ws = 'ws',
	nl = 'nl',
	semicolon = 'semicolon',
	dot = 'dot',
	identifier = 'identifier',
	singleString = 'singleString',
	doubleString = 'doubleString',
	number = 'number',
	operator = 'operator',
	operatorBraces = 'operatorBraces',
	operatorAssign = 'operatorAssign',
	operatorCompare = 'operatorCompare',
	sqlSlash = 'sqlSlash',
	sqlKeywordsSlash = 'sqlKeywordsSlash',
	sqlKeywordsSemi = 'sqlKeywordsSemi',
	sqlKeywordsOther = 'sqlKeywordsOther',
	sqlPlusKeywords = 'sqlPlusKeywords',
	unknown = 'unknown',
//	syntaxError = 'syntaxError',
}

export enum BlockType {
	sql = 'sql',
	plsql = 'plsql',
	sqlplus = 'sqlplus',
}
export type ScriptBlockType = {
	type: BlockType,
	text: string,
}

const LETTER_REGEXP = /[a-zA-Z]/;
const isCharLetter= (char: string) => LETTER_REGEXP.test(char);

function textToCaseInsensitiveRegex(text: string): string|RegExp {
	const regexSource = text.split('').map((char) => {
		if (isCharLetter(char)) {
			return `[${char.toLowerCase()}${char.toUpperCase()}]`;
		}

		return char;
	});

	return new RegExp(regexSource.join(''));
}

const sql_keywords_semi = [
	'select', 'insert', 'update', 'delete',
	'commit', 'rollback',
	'drop', 'alter',
	'grant', 'revoke',
].map(textToCaseInsensitiveRegex);

const sql_keywords_slash = [
	'create',
	'declare',
	'begin',
].map(textToCaseInsensitiveRegex);

const sql_keywords = [
	'from', 'where', 'order', 'group', 'by',
	'and', 'or', 'not',
	'replace',
	'procedure', 'function', 'package', 'body', 'type',
	'end', 'as', 'is',
	'number', 'varchar2', 'date', 'boolean',
	'null',
	'sysdate',
].map(textToCaseInsensitiveRegex);

const sqlplus_keywords = [
	'connect', 'disconnect',
	'whenever',
	'spool', 'spool off',
].map(textToCaseInsensitiveRegex);

const rules = {
	[ruleNames.scomment]:			/--.*?$/,
	[ruleNames.mcomment]:			{match: /\/\*(?:.|[\r\n])*?\*\//, lineBreaks: true},
	[ruleNames.singleString]:		{match: /'(?:\\['\\]|[^\n'\\])*'/, lineBreaks: true},
	[ruleNames.doubleString]:		{match: /"(?:\\["\\]|[^\n"\\])*"/, lineBreaks: true},
	[ruleNames.sqlPlusKeywords]:	{match: sqlplus_keywords, lineBreaks: true},
	[ruleNames.sqlSlash]:			{match: /^[ \t]*\/[ \t]*$/, lineBreaks: true},
	[ruleNames.sqlKeywordsSlash]:	{match: sql_keywords_slash, lineBreaks: true},
	[ruleNames.sqlKeywordsSemi]:	{match: sql_keywords_semi, lineBreaks: true},
	[ruleNames.sqlKeywordsOther]:	{match: sql_keywords, lineBreaks: true},
	[ruleNames.semicolon]: 			{match: /;/, lineBreaks: true},
	[ruleNames.identifier]:			/[a-zA-Z_$]+[a-zA-Z_$0-9]*/,
//	[ruleNames.number]:				/^([+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)$/,
	[ruleNames.number]:				/[+-]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/,
	[ruleNames.operator]:			/\+|-|\*|\//,
	[ruleNames.operatorBraces]:		/\(|\)/,
	[ruleNames.operatorAssign]:		':=',
	[ruleNames.operatorCompare]:	/=|!=|<>|<|>|<=|>=/,
	[ruleNames.dot]:				'.',
	[ruleNames.ws]:					/[ \t]+/,
	[ruleNames.nl]:					{match: /\n/, lineBreaks: true},
	[ruleNames.unknown]:			{match: /.+/, lineBreaks: true},
//	[ruleNames.syntaxError]:		moo.error, // return an error token instead of throwing an exception
};

const mooLexer = moo.compile(rules as unknown as moo.Rules);

export function lexer(text: string): Array<moo.Token> {
	mooLexer.reset(text);

	const tokens = Array.from(mooLexer);

	return tokens;
}

export function split(text: string): Array<ScriptBlockType> {
	debug(`split "${text}"`);

	const blocks: Array<ScriptBlockType> = [];

	// tokenize the script
	const tokens = lexer(text);

	// process the tokens
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
function findToken(tokens: Array<moo.Token>, tokenCount: number, start: number, type: string): {text: string, index: number}|undefined {
	let text = '';

	for (let i = start; i < tokenCount; i++) {
		const token = tokens[i];
		text += token.text;
		if (token.type === type) {
			return {text, index: i};
		}
	}

	return undefined;
}
