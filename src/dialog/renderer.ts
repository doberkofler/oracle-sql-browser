import {ipcRenderer} from 'electron';
import {onDomReady, getElementById} from '../dom';

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

	const dataElement = getElementById('data') as HTMLFormElement;
	
	getElementById('form').addEventListener('submit', () => {
		ipcRenderer.sendSync('prompt-post-data:' + promptId, dataElement.value);
	});

	getElementById('cancel').addEventListener('click', () => {
		ipcRenderer.sendSync('prompt-post-data:' + promptId, null);
	});

	if (typeof connectString === 'string' && connectString.length > 0) {
		dataElement.value = connectString;
	}
	dataElement.focus();
	dataElement.select();
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

onDomReady(promptRegister);
