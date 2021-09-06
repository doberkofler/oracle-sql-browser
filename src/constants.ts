export enum channel {
	menu = 'ipc-channel:menu',
	appIsPackaged = 'ipc-channel:isPackaged',
	setMainWindowTitle = 'ipc-channel:setMainWindowTitle',
}

export enum menuOption {
	connect = 'connect',
	disconnect = 'disconnect',
	runScript = 'runScript',
	runStatement = 'runStatement',
	commit = 'commit',
	rollback = 'rollback',
	closeAllTabs = 'closeAllTabs',
	export = 'export',
}

