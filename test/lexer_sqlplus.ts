import {getTokens, ruleNames} from '../src/sqlparser/lexer';

describe('lexer_sqlplus', () => {
	it('spool foo.log', () => {
		expect.hasAssertions();
		const tokens = getTokens('spool foo.log', ['type', 'value']);
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
		]);
	});

	it('spool off', () => {
		expect.hasAssertions();
		const tokens = getTokens('spool off', ['type', 'value']);
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
				value: 'off',
			},
		]);
	});
});
