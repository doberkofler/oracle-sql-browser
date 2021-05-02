import {lexer} from '../src/sqlparser/lexer';

describe('parser', () => {
	it('lexer', () => {
		expect.hasAssertions();

		expect(getTokens(' ')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
		]);

		expect(getTokens('\t')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '\t',
				type: 'WS',
				value: '\t',
			},
		]);

		expect(getTokens('   ')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '   ',
				type: 'WS',
				value: '   ',
			},
		]);

		expect(getTokens('\n')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 1,
				offset: 0,
				text: '\n',
				type: 'NL',
				value: '\n',
			},
		]);

		expect(getTokens('-- comment')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '-- comment',
				type: 'SCOMMENT',
				value: '-- comment',
			},
		]);

		expect(getTokens('select sysdate from dual;')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: 'select',
				type: 'SQL_KEYWORDS_SEMI',
				value: 'select',
			},
			{
				col: 7,
				line: 1,
				lineBreaks: 0,
				offset: 6,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
			{
				col: 8,
				line: 1,
				lineBreaks: 0,
				offset: 7,
				text: 'sysdate',
				type: 'SQL_KEYWORDS',
				value: 'sysdate',
			},
			{
				col: 15,
				line: 1,
				lineBreaks: 0,
				offset: 14,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
			{
				col: 16,
				line: 1,
				lineBreaks: 0,
				offset: 15,
				text: 'from',
				type: 'SQL_KEYWORDS',
				value: 'from',
			},
			{
				col: 20,
				line: 1,
				lineBreaks: 0,
				offset: 19,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
			{
				col: 21,
				line: 1,
				lineBreaks: 0,
				offset: 20,
				text: 'dual',
				type: 'IDENTIFIER',
				value: 'dual',
			},
			{
				col: 25,
				line: 1,
				lineBreaks: 0,
				offset: 24,
				text: ';',
				type: 'SEMICOLON',
				value: ';',
			},
		]);

		expect(getTokens(`create procedure foo is
begin
	null;
end;
/
`)).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: 'create',
				type: 'SQL_KEYWORDS_SLASH',
				value: 'create',
			},
			{
				col: 7,
				line: 1,
				lineBreaks: 0,
				offset: 6,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
			{
				col: 8,
				line: 1,
				lineBreaks: 0,
				offset: 7,
				text: 'procedure',
				type: 'SQL_KEYWORDS',
				value: 'procedure',
			},
			{
				col: 17,
				line: 1,
				lineBreaks: 0,
				offset: 16,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
			{
				col: 18,
				line: 1,
				lineBreaks: 0,
				offset: 17,
				text: 'foo',
				type: 'IDENTIFIER',
				value: 'foo',
			},
			{
				col: 21,
				line: 1,
				lineBreaks: 0,
				offset: 20,
				text: ' ',
				type: 'WS',
				value: ' ',
			},
			{
				col: 22,
				line: 1,
				lineBreaks: 0,
				offset: 21,
				text: 'is',
				type: 'SQL_KEYWORDS',
				value: 'is',
			},
			{
				col: 24,
				line: 1,
				lineBreaks: 1,
				offset: 23,
				text: '\n',
				type: 'NL',
				value: '\n',
			},
			{
				col: 1,
				line: 2,
				lineBreaks: 0,
				offset: 24,
				text: 'begin',
				type: 'SQL_KEYWORDS_SLASH',
				value: 'begin',
			},
			{
				col: 6,
				line: 2,
				lineBreaks: 1,
				offset: 29,
				text: '\n',
				type: 'NL',
				value: '\n',
			},
			{
				col: 1,
				line: 3,
				lineBreaks: 0,
				offset: 30,
				text: '\t',
				type: 'WS',
				value: '\t',
			},
			{
				col: 2,
				line: 3,
				lineBreaks: 0,
				offset: 31,
				text: 'null',
				type: 'SQL_KEYWORDS',
				value: 'null',
			},
			{
				col: 6,
				line: 3,
				lineBreaks: 0,
				offset: 35,
				text: ';',
				type: 'SEMICOLON',
				value: ';',
			},
			{
				col: 7,
				line: 3,
				lineBreaks: 1,
				offset: 36,
				text: '\n',
				type: 'NL',
				value: '\n',
			},
			{
				col: 1,
				line: 4,
				lineBreaks: 0,
				offset: 37,
				text: 'end',
				type: 'SQL_KEYWORDS',
				value: 'end',
			},
			{
				col: 4,
				line: 4,
				lineBreaks: 0,
				offset: 40,
				text: ';',
				type: 'SEMICOLON',
				value: ';',
			},
			{
				col: 5,
				line: 4,
				lineBreaks: 1,
				offset: 41,
				text: '\n',
				type: 'NL',
				value: '\n',
			},
			{
				col: 1,
				line: 5,
				lineBreaks: 0,
				offset: 42,
				text: '/',
				type: 'SLASH',
				value: '/',
			},
			{
				col: 2,
				line: 5,
				lineBreaks: 1,
				offset: 43,
				text: '\n',
				type: 'NL',
				value: '\n',
			},
		]);
	});
});

function getTokens(text: string) {
	const tokens = lexer(text);

	tokens.forEach(e => delete e.toString);

	//console.log(`***** getTokens(${text}) = `, tokens);

	return tokens;
}
