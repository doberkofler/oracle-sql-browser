import moo from 'moo';

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
	'null',
	'sysdate',
].map(textToCaseInsensitiveRegex);

const sqlplus_keywords = [
	'connect', 'disconnect',
	'whenever',
	'spool', 'spool off',
].map(textToCaseInsensitiveRegex);

const rules = {
	SCOMMENT:			{match: /--.*?$/, lineBreaks: true},
	MCOMMENT:			{match: /\/\*(?:.|[\r\n])*?\*\//, lineBreaks: true},
	SSTRING:			{match: /'(?:\\['\\]|[^\n'\\])*'/, lineBreaks: true},
	DSTRING:			{match: /"(?:\\["\\]|[^\n"\\])*"/, lineBreaks: true},
	SEMICOLON: 			{match: /;/, lineBreaks: true},
	SLASH: 				{match: /^[ \t]*\/[ \t]*$/, lineBreaks: true},
	SQLPLUS_KEYWORDS:	{match: sqlplus_keywords, lineBreaks: true},
	SQL_KEYWORDS_SLASH:	{match: sql_keywords_slash, lineBreaks: true},
	SQL_KEYWORDS_SEMI:	{match: sql_keywords_semi, lineBreaks: true},
	SQL_KEYWORDS:		{match: sql_keywords, lineBreaks: true},
	STAR:				{match: '*', lineBreaks: true},
	EQUAL:				{match: /=/, lineBreaks: true},
	UNEQUAL:			{match: /[!=|<>]/, lineBreaks: true},
	LESS:				{match: '<', lineBreaks: true},
	LESS_EQUAL:			{match: '<=', lineBreaks: true},
	GREATER:			{match: '>', lineBreaks: true},
	GREATER_EQUAL:		{match: '>=', lineBreaks: true},
	IDENTIFIER:			{match: /[a-zA-Z_$]+[a-zA-Z_$0-9]*/, lineBreaks: true},
	WS:					{match: /[ \t]+/, lineBreaks: true},
	NL:					{match: /\n/, lineBreaks: true},
};

const mooLexer = moo.compile(rules as unknown as moo.Rules);

export function lexer(text: string): Array<moo.Token> {
	mooLexer.reset(text);

	const tokens = Array.from(mooLexer);

	//tokens.forEach(console.log);

	return tokens;
}

export function split(text: string): Array<ScriptBlockType> {
	console.log(`split "${text}"`);

	const blocks: Array<ScriptBlockType> = [];

	// tokenize the script
	const tokens = lexer(text);

	// process the tokens
	const tokenCount = tokens.length;
	let i = 0;
	while (i < tokenCount) {
		const token = tokens[i];

		console.log(`i=${i} token.type="${token.type}" token.text="${token.text}"`);

		switch (token.type) {
			case 'SQL_KEYWORDS_SLASH': {
				// find the next semicolon
				const result = findToken(tokens, tokenCount, i, 'SLASH');
				if (result) {
					console.log(`${token.text.toUpperCase()}: result.text=${result.text} result.index="${result.index}"`);
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

			case 'SQL_KEYWORDS_SEMI': {
				// find the next semicolon
				const result = findToken(tokens, tokenCount, i, 'SEMICOLON');
				if (result) {
					console.log(`${token.text.toUpperCase()}: result.text=${result.text} result.index="${result.index}"`);
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

			default:
				break;
		}
		
		i++;
	}

	console.log('split returned:', blocks);

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
