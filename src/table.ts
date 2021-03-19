/**
 * This file will display the rows in a table.
 */

import type {Oracle$RowType, Oracle$MetaType, Oracle$ResultType} from './database';

export function getTableMarkup(data: Oracle$ResultType): string {
	const html = [];

	html.push('<table class="table">');

	html.push('<thead>');
	html.push(getHeaderMarkup(data.meta));
	html.push('</thead>');

	html.push('<tbody>');
	const rowCount = data.rows.length;
	for (let i = 0; i < rowCount; i++) {
		const row = data.rows[i];
		if (row) {
			html.push(getRowMarkup(row, data.meta));
		}
	}
	html.push('</tbody>');

	html.push('</table>');

	return html.join('');
}

function getHeaderMarkup(meta: Array<Oracle$MetaType>): string {
	const html = [];

	html.push('<tr>');
	meta.forEach(e => {
		html.push(`<th>${e.name}</th>`);
	});
	html.push('</tr>');

	return html.join('');
}

function getRowMarkup(row: Oracle$RowType, meta: Array<Oracle$MetaType>): string {
	const html = [];

	html.push('<tr>');
	const colNumber = meta.length;
	for (let i = 0; i < colNumber; i++) {
		const value = row[i];
		const displayValue = value === null || value === '' ? '&nbsp;' : value.toString();

		html.push(`<td><div>${displayValue}</div></td>`);
	}
	html.push('</tr>');

	return html.join('');
}
