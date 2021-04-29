//import moo from 'moo';
import {parse} from '../src/sqlparser/lexer';

describe('parse sql scripts', () => {
	it('lexer', () => {
		expect.hasAssertions();

		const tokens = parse(' ');
		tokens.forEach(e => delete e.toString);
		expect(tokens).toHaveLength(1);
		expect(tokens).toStrictEqual([{
			col: 1,
			line: 1,
			lineBreaks: 0,
			offset: 0,
			text: ' ',
			type: 'WS',
			value:  ' ',
		}]);
	});
});
