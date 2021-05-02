import {split} from '../src/sqlparser/lexer';

describe('parser', () => {
	it('split', () => {
		expect.hasAssertions();

		expect(split('')).toStrictEqual([]);
		expect(split(' ')).toStrictEqual([]);
		expect(split('  ')).toStrictEqual([]);
		expect(split('\t\t')).toStrictEqual([]);
		expect(split('\n\n')).toStrictEqual([]);

		expect(split('select sysdate from dual;')).toStrictEqual([
			{
				type: 'sql',
				text: 'select sysdate from dual;',
			},
		]);

		expect(split(`select sysdate from dual;
select * from users;
update foo set bar = 'bar';`)).toStrictEqual([
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

		expect(split(`create procedure foo is
begin
	null;
end;
/
`)).toStrictEqual([
			{
				type: 'plsql',
				text: 'create procedure foo is\nbegin\n\tnull;\nend;\n/',
			},
		]);

		expect(split(`create procedure foo is
begin
	null;
end;
/
select * from user_errors;
`)).toStrictEqual([
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
});
