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
