import {split, getBlockRange} from '../src/sqlparser/split';

import type {ScriptBlockType} from '../src/sqlparser/lexer';

type TypeAndTextType = Pick<ScriptBlockType, 'type' | 'text'>;

const  splitTypeAndText = (text: string): Array<TypeAndTextType> => split(text).map(e => ({type: e.type, text: e.text}));

describe('split', () => {
	it('separators', () => {
		expect.hasAssertions();

		expect(splitTypeAndText('')).toStrictEqual([]);
		expect(splitTypeAndText(' ')).toStrictEqual([]);
		expect(splitTypeAndText('  ')).toStrictEqual([]);
		expect(splitTypeAndText('\t\t')).toStrictEqual([]);
		expect(splitTypeAndText('\n\n')).toStrictEqual([]);
	});

	it('sqlplus, sql and pl/sql', () => {
		expect.hasAssertions();

		const script = `connect user/password@host
select sysdate from dual;
create procedure foo is
begin
	null;
end;
/
`;

		expect(splitTypeAndText(script)).toStrictEqual([
			{
				type: 'sqlplus',
				text: 'connect user/password@host\n',
			},
			{
				type: 'sql',
				text: 'select sysdate from dual;',
			},
			{
				type: 'plsql',
				text: 'create procedure foo is\nbegin\n\tnull;\nend;\n/',
			},
		]);
	});

	it('sql', () => {
		expect(splitTypeAndText('select sysdate from dual;')).toStrictEqual([
			{
				type: 'sql',
				text: 'select sysdate from dual;',
			},
		]);

		expect(splitTypeAndText(`select sysdate from dual; select * from users; update foo set bar = 'bar';`)).toStrictEqual([
			{
				type: 'sql',
				text: 'select sysdate from dual;',
			},
			{
				type: 'sql',
				text: 'select * from users;',
			},
			{
				type: 'sql',
				text: 'update foo set bar = \'bar\';',
			},
		]);

		expect(splitTypeAndText('select sysdate from dual;commit;')).toStrictEqual([
			{
				type: 'sql',
				text: 'select sysdate from dual;',
			},
			{
				type: 'sql',
				text: 'commit;',
			},
		]);
	});

	it('plsql', () => {
		const script = `create procedure foo is
begin
	null;
end;
/
`;

		expect(splitTypeAndText(script)).toStrictEqual([
			{
				type: 'plsql',
				text: 'create procedure foo is\nbegin\n\tnull;\nend;\n/',
			},
		]);
	});

	it('plsql and sql', () => {
		const script = `create procedure foo is
begin
	null;
end;
/
select * from user_errors;
`;
		expect(splitTypeAndText(script)).toStrictEqual([
			{
				type: 'plsql',
				text: 'create procedure foo is\nbegin\n\tnull;\nend;\n/',
			},
			{
				type: 'sql',
				text: 'select * from user_errors;',
			},
		]);
	});

	it('sqlplus', () => {
		const script = `spool foo.log
`;
		expect(splitTypeAndText(script)).toStrictEqual([
			{
				type: 'sqlplus',
				text: 'spool foo.log\n',
			},
		]);
	});
});

describe('getBlockRange', () => {
	const testBlocks = split('select "line1" from dual;\nselect "line02" from dual;\nselect "line003" from dual;\n');	

	it('should have valid offsets', () => {
		expect.hasAssertions();

		expect(testBlocks).toHaveLength(3);

		expect(testBlocks[0].text).toStrictEqual('select "line1" from dual;');
		expect(testBlocks[0].tokens).toHaveLength(8);
		expect(testBlocks[0].tokens[0].offset).toStrictEqual(0);
		expect(testBlocks[0].tokens[testBlocks[0].tokens.length - 1].offset).toStrictEqual(24);

		expect(testBlocks[1].text).toStrictEqual('select "line02" from dual;');
		expect(testBlocks[1].tokens).toHaveLength(8);
		expect(testBlocks[1].tokens[0].offset).toStrictEqual(26);
		expect(testBlocks[1].tokens[testBlocks[1].tokens.length - 1].offset).toStrictEqual(51);

		expect(testBlocks[2].text).toStrictEqual('select "line003" from dual;');
		expect(testBlocks[2].tokens).toHaveLength(8);
		expect(testBlocks[2].tokens[0].offset).toStrictEqual(53);
		expect(testBlocks[2].tokens[testBlocks[2].tokens.length - 1].offset).toStrictEqual(79);
	});

	it('should return tokens in the given offset', () => {
		expect.hasAssertions();

		expect(getBlockRange(testBlocks, -1)).toHaveLength(0);

		expect(getBlockRange(testBlocks, 0)).toHaveLength(1);
		expect(getBlockRange(testBlocks, 0)[0].text).toStrictEqual('select "line1" from dual;');

		expect(getBlockRange(testBlocks, 25)).toHaveLength(1);
		expect(getBlockRange(testBlocks, 25)[0].text).toStrictEqual('select "line1" from dual;');

		expect(getBlockRange(testBlocks, 26)).toHaveLength(1);
		expect(getBlockRange(testBlocks, 26)[0].text).toStrictEqual('select "line02" from dual;');

		expect(getBlockRange(testBlocks, 52)).toHaveLength(1);
		expect(getBlockRange(testBlocks, 52)[0].text).toStrictEqual('select "line02" from dual;');

		expect(getBlockRange(testBlocks, 53)).toHaveLength(1);
		expect(getBlockRange(testBlocks, 53)[0].text).toStrictEqual('select "line003" from dual;');

		expect(getBlockRange(testBlocks, 79)).toHaveLength(1);
		expect(getBlockRange(testBlocks, 79)[0].text).toStrictEqual('select "line003" from dual;');

		expect(getBlockRange(testBlocks, 81)).toHaveLength(0);
	});
});
