/*
*	Run function when DOM has been loaded
*/
export function onDomReady(render: () => any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
	document.addEventListener('DOMContentLoaded', render);
}

/*
*	Get a DOM element by id
*/
export function getElementById(id: string): HTMLElement {
	const el = document.getElementById(id);

	if (el === null) {
		throw new Error(`No element with id "${id}" found`);
	}

	return el;
}

/*
*	Get a DOM element by query selector
*/
export function querySelector(selector: string): HTMLElement {
	const el = document.querySelector(selector);

	if (el === null || !(el instanceof HTMLElement)) {
		throw new Error(`No element with selector "${selector}" found`);
	}

	return el;
}

/*
 *	Get the cursor positin in an input or texatarea element
 *	@param {DOMElement} el A dom element of a textarea or input text.
 *	@return {{start: number, end: number}} reference Object with 2 properties (start and end) with the identifier of the location of the cursor and selected text.
 */
 export function getInputSelection(el: HTMLInputElement | HTMLTextAreaElement): {start: number, end: number} {
	let start = 0, end = 0, normalizedValue, range, textInputRange, len, endRange;

	if (typeof el.selectionStart == 'number' && typeof el.selectionEnd == 'number') {
		start = el.selectionStart;
		end = el.selectionEnd;
	} else {
		//@ts-expect-error TODO
		range = document.selection.createRange();

		if (range && range.parentElement() == el) {
			len = el.value.length;
			normalizedValue = el.value.replace(/\r\n/g, '\n');

			// Create a working TextRange that lives only in the input
			//@ts-expect-error TODO
			textInputRange = el.createTextRange();
			textInputRange.moveToBookmark(range.getBookmark());

			// Check if the start and end of the selection are at the very end
			// of the input, since moveStart/moveEnd doesn't return what we want
			// in those cases
			//@ts-expect-error TODO
			endRange = el.createTextRange();
			endRange.collapse(false);

			if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
				start = end = len;
			} else {
				start = -textInputRange.moveStart("character", -len);
				start += normalizedValue.slice(0, start).split("\n").length - 1;

				if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
					end = len;
				} else {
					end = -textInputRange.moveEnd("character", -len);
					end += normalizedValue.slice(0, end).split("\n").length - 1;
				}
			}
		}
	}

	return {start, end};
}
