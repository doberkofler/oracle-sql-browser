module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
	],
	parser: '@typescript-eslint/parser',
	rules: {
		'@typescript-eslint/no-use-before-define': 'off',
		'@typescript-eslint/ban-ts-error': 'off',
	},
}
