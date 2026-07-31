/** Pause remote overwrites briefly after local edits (drag, add, remove). */
let pauseRemoteUntil = 0

export function markLocalDashboardEdit() {
	pauseRemoteUntil = Date.now() + 2000
}

export function isRemotePaused(): boolean {
	return Date.now() < pauseRemoteUntil
}

let requestLayoutSaveFn: (() => void) | null = null

export function registerLayoutSaveHandler(handler: (() => void) | null) {
	requestLayoutSaveFn = handler
}

export function requestLayoutSave() {
	markLocalDashboardEdit()
	requestLayoutSaveFn?.()
}
