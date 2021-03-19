export function isDebug(): boolean {
	return process.env.npm_lifecycle_event === 'start';
}
