import {ipcRenderer} from 'electron';

function promptRegister(): void {
	const promptId = document.location.hash.replace('#', '');

	let connectString = '';
	try {
		connectString = JSON.parse(ipcRenderer.sendSync('prompt-get-options:' + promptId));
	} catch (error) {
		return reportError(promptId, error);
	}
	
	if (window) {
		window.addEventListener('error', error => {
			reportError(promptId, error);
		});
	}
	
	const submitElement = document.getElementById('form');
	if (submitElement) {
		submitElement.addEventListener('submit', () => {
			const dataElement = document.getElementById('data') as HTMLFormElement;
			if (dataElement) {
				ipcRenderer.sendSync('prompt-post-data:' + promptId, dataElement.value);
			}
		});
	}

	const cancelElement = document.getElementById('cancel');
	if (cancelElement) {
		cancelElement.addEventListener('click', () => {
			ipcRenderer.sendSync('prompt-post-data:' + promptId, null);
		});
	}


	const dataElement = document.getElementById('data') as HTMLFormElement;
	if (dataElement) {
		if (typeof connectString === 'string' && connectString.length > 0) {
			dataElement.value = connectString;
		}
		dataElement.focus();
		dataElement.select();
	}
}

function reportError(id: string, error: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
	if (id) {
		let message = '';
		if (typeof error === 'string') {
			message = error;
		} else if (error instanceof Error) {
			message = error.message;
		} else {
			try {
				message = JSON.stringify(error);
			} catch (e) {
				message = '';
			}
		}
		ipcRenderer.sendSync('prompt-error:' + id, message);
	}
}

document.addEventListener('DOMContentLoaded', promptRegister, false);
