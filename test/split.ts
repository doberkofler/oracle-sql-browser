import {split} from '../src/sqlparser/lexer';

describe('split', () => {
	it('lexer', () => {
		expect.hasAssertions();

		expect(split('')).toStrictEqual([]);
		expect(split(' ')).toStrictEqual([]);
		expect(split('  ')).toStrictEqual([]);
		expect(split('\t\t')).toStrictEqual([]);
		expect(split('\n\n')).toStrictEqual([]);
	});

	it('sql', () => {
		expect(split('select sysdate from dual;')).toStrictEqual([
			{
				type: 'sql',
				text: 'select sysdate from dual;',
			},
		]);

		expect(split(`select sysdate from dual; select * from users; update foo set bar = 'bar';`)).toStrictEqual([
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

		expect(split('select sysdate from dual;commit;')).toStrictEqual([
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

		expect(split(script)).toStrictEqual([
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
		expect(split(script)).toStrictEqual([
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
		expect(split(script)).toStrictEqual([
			{
				type: 'sqlplus',
				text: 'spool foo.log\n',
			},
		]);
	});
});
