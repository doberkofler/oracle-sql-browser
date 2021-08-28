import {split} from '../src/sqlparser/lexer';

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
