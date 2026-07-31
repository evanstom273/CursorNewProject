/** Pause remote overwrites briefly after local edits (drag, add, remove). */
let pauseRemoteUntil = 0

let gridInteracting = false

let requestDashboardSaveFn: (() => void) | null = null

export function markLocalDashboardEdit() {
	pauseRemoteUntil = Date.now() + 3000
}

export function isRemotePaused(): boolean {
	return gridInteracting || Date.now() < pauseRemoteUntil
}

export function setGridInteracting(interacting: boolean) {
	gridInteracting = interacting
	if (interacting) {
		pauseRemoteUntil = Date.now() + 10000
	} else {
		markLocalDashboardEdit()
	}
}

export function isGridInteracting(): boolean {
	return gridInteracting
}

export function registerDashboardSaveHandler(handler: (() => void) | null) {
	requestDashboardSaveFn = handler
}

export function requestDashboardSave() {
	markLocalDashboardEdit()
	requestDashboardSaveFn?.()
}
