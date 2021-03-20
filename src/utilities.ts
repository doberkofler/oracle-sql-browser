import {app, remote} from 'electron';

export function isDebug(): boolean {
	return app ? !app.isPackaged : !remote.app.isPackaged;
}
