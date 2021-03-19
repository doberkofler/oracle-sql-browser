const path = require('path'); // eslint-disable-line @typescript-eslint/no-var-requires

module.exports = {
	packagerConfig: {
		extraResource: path.resolve('./instantclient_19_8'),
	},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
				config: {
					name: 'oracle_sql_browser'
				}
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: [
				'darwin'
			]
		},
		{
			name: '@electron-forge/maker-deb',
			config: {}
		},
		{
			name: '@electron-forge/maker-rpm',
			config: {}
		}
	]
};


