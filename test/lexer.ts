import {getTokens, ruleNames} from '../src/sqlparser/lexer';

describe('lexer', () => {
	it('ws and nl', () => {
		expect.hasAssertions();

		expect(getTokens(' ')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: ' ',
				type: ruleNames.ws,
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
				type: ruleNames.ws,
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
				type: ruleNames.ws,
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
				type: ruleNames.nl,
				value: '\n',
			},
		]);
	});

	it('number', () => {
		expect.hasAssertions();

		expect(getTokens('0')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '0',
				type: ruleNames.number,
				value: '0',
			},
		]);

		expect(getTokens('1')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '1',
				type: ruleNames.number,
				value: '1',
			},
		]);

		expect(getTokens(' 1')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: ' ',
				type: ruleNames.ws,
				value: ' ',
			},
			{
				col: 2,
				line: 1,
				lineBreaks: 0,
				offset: 1,
				text: '1',
				type: ruleNames.number,
				value: '1',
			},
		]);

		expect(getTokens('.14')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '.14',
				type: ruleNames.number,
				value: '.14',
			},
		]);

		expect(getTokens('-0.14')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '-0.14',
				type: ruleNames.number,
				value: '-0.14',
			},
		]);

		expect(getTokens('+3.14e+10')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '+3.14e+10',
				type: ruleNames.number,
				value: '+3.14e+10',
			},
		]);
	});

	it('operator', () => {
		expect.hasAssertions();

		expect(getTokens('+', ['type', 'value'])).toStrictEqual([
			{
				type: ruleNames.operator,
				value: '+',
			},
		]);

		expect(getTokens('1 + 3', ['type', 'value'])).toStrictEqual([
			{
				type: ruleNames.number,
				value: '1',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.operator,
				value: '+',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.number,
				value: '3',
			},
		]);

		expect(getTokens('1 / 3', ['type', 'value'])).toStrictEqual([
			{
				type: ruleNames.number,
				value: '1',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.operator,
				value: '/',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.number,
				value: '3',
			},
		]);
	});

	it('comment', () => {
		expect.hasAssertions();

		expect(getTokens('-- comment')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: '-- comment',
				type: ruleNames.scomment,
				value: '-- comment',
			},
		]);
	});

	it('select', () => {
		expect.hasAssertions();

		expect(getTokens('select sysdate from dual;')).toStrictEqual([
			{
				col: 1,
				line: 1,
				lineBreaks: 0,
				offset: 0,
				text: 'select',
				type: ruleNames.sqlKeywordsSemi,
				value: 'select',
			},
			{
				col: 7,
				line: 1,
				lineBreaks: 0,
				offset: 6,
				text: ' ',
				type: ruleNames.ws,
				value: ' ',
			},
			{
				col: 8,
				line: 1,
				lineBreaks: 0,
				offset: 7,
				text: 'sysdate',
				type: ruleNames.sqlKeywordsOther,
				value: 'sysdate',
			},
			{
				col: 15,
				line: 1,
				lineBreaks: 0,
				offset: 14,
				text: ' ',
				type: ruleNames.ws,
				value: ' ',
			},
			{
				col: 16,
				line: 1,
				lineBreaks: 0,
				offset: 15,
				text: 'from',
				type: ruleNames.sqlKeywordsOther,
				value: 'from',
			},
			{
				col: 20,
				line: 1,
				lineBreaks: 0,
				offset: 19,
				text: ' ',
				type: ruleNames.ws,
				value: ' ',
			},
			{
				col: 21,
				line: 1,
				lineBreaks: 0,
				offset: 20,
				text: 'dual',
				type: ruleNames.identifier,
				value: 'dual',
			},
			{
				col: 25,
				line: 1,
				lineBreaks: 0,
				offset: 24,
				text: ';',
				type: ruleNames.semicolon,
				value: ';',
			},
		]);
	});

	it('create procedure', () => {
		expect.hasAssertions();

		const script = `create procedure foo is
begin
	null;
end;
/
`;

	const tokens = getTokens(script, ['type', 'value']);

	expect(tokens).toStrictEqual([
			{
				type: ruleNames.sqlKeywordsSlash,
				value: 'create',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.sqlKeywordsOther,
				value: 'procedure',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.identifier,
				value: 'foo',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.sqlKeywordsOther,
				value: 'is',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlKeywordsSlash,
				value: 'begin',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.ws,
				value: '\t',
			},
			{
				type: ruleNames.sqlKeywordsOther,
				value: 'null',
			},
			{
				type: ruleNames.semicolon,
				value: ';',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlKeywordsOther,
				value: 'end',
			},
			{
				type: ruleNames.semicolon,
				value: ';',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlSlash,
				value: '/',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
		]);
	});

	it('declare', () => {
		expect.hasAssertions();

		const script = `declare
	i number;
begin
	i := 1 / 3;
end;
/
`;

		const tokens = getTokens(script, ['type', 'value']);

		expect(tokens).toStrictEqual([
			{
				type: ruleNames.sqlKeywordsSlash,
				value: 'declare',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.ws,
				value: '\t',
			},
			{
				type: ruleNames.identifier,
				value: 'i',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.sqlKeywordsOther,
				value: 'number',
			},
			{
				type: ruleNames.semicolon,
				value: ';',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlKeywordsSlash,
				value: 'begin',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.ws,
				value: '\t',
			},
			{
				type: ruleNames.identifier,
				value: 'i',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.operatorAssign,
				value: ':=',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.number,
				value: '1',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.operator,
				value: '/',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.number,
				value: '3',
			},
			{
				type: ruleNames.semicolon,
				value: ';',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlKeywordsOther,
				value: 'end',
			},
			{
				type: ruleNames.semicolon,
				value: ';',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlSlash,
				value: '/',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
		]);
	});

	it('spool', () => {
		expect.hasAssertions();

		const script = `spool foo.log
spool off
`;

		const tokens = getTokens(script, ['type', 'value']);

		expect(tokens).toStrictEqual([
			{
				type: ruleNames.sqlPlusKeywords,
				value: 'spool',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.identifier,
				value: 'foo',
			},
			{
				type: ruleNames.dot,
				value: '.',
			},
			{
				type: ruleNames.identifier,
				value: 'log',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
			{
				type: ruleNames.sqlPlusKeywords,
				value: 'spool',
			},
			{
				type: ruleNames.ws,
				value: ' ',
			},
			{
				type: ruleNames.identifier,
				value: 'off',
			},
			{
				type: ruleNames.nl,
				value: '\n',
			},
		]);
	});
});
