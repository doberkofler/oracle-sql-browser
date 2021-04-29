import moo from 'moo';

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

const sql_keywords = [
	'select', 'insert', 'update', 'delete',
	'create', 'drop', 'alter',
	'grant', 'revoke',
	'from', 'where', 'order', 'group', 'by',
	'and', 'or', 'not',
	'procedure', 'function', 'package', 'body', 'type',
	'begin', 'end', 'as', 'is',
	'null',
	'sysdate',
].map(textToCaseInsensitiveRegex);

const sqlplus_keywords = [
	'connect', 'disconnect',
	'whenever',
	'spool', 'spool off',
].map(textToCaseInsensitiveRegex);

const rules = {
	scomment:			{match: /--.*?$/, lineBreaks: true},
	mcomment:			{match: /\/\*(?:.|[\r\n])*?\*\//, lineBreaks: true},
	sstring:			{match: /'(?:\\['\\]|[^\n'\\])*'/, lineBreaks: true},
	dstring:			{match: /"(?:\\["\\]|[^\n"\\])*"/, lineBreaks: true},
	SEMICOLON: 			{match: /;/, lineBreaks: true},
	SLASH: 				{match: /^[ \t]*\/[ \t]*$/, lineBreaks: true},
	SQLPLUS_KEYWORDS:	{match: sqlplus_keywords, lineBreaks: true},
	SQL_KEYWORDS:		{match: sql_keywords, lineBreaks: true},
	IDENTIFIER:			{match: /[a-zA-Z]+/, lineBreaks: true},
	WS:					{match: /[ \t]+/, lineBreaks: true},
	NL:					{match: /\n/, lineBreaks: true},
};

const lexer = moo.compile(rules as unknown as moo.Rules);

export function parse(text: string): Array<moo.Token> {
	lexer.reset(text);

	const tokens = Array.from(lexer);

	//tokens.forEach(console.log);

	return tokens;
}
