import moo from 'moo';
import _ from 'lodash';

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

export function getTokens(text: string, properties?: Array<string>): Partial<moo.Token> {
	// get the tokens
	const tokens = lexer(text);

	const selectProperties = (token: moo.Token): Partial<moo.Token> => {
		const keys = Object.keys(token);
		const keysToKeep = keys.filter(key => properties ? properties.indexOf(key) !== -1 : key !== 'toString');
		return _.pick(token, keysToKeep);
	};

	const newTokens = tokens.map(selectProperties);

	//console.log(`***** getTokens(${text}) = `, newTokens);

	return newTokens;
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
