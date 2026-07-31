/** Shared flag — sync must not overwrite the grid while the user is dragging/resizing. */
export const dashboardInteraction = {
	isInteracting: false,
}

let requestLayoutSaveFn: (() => void) | null = null

export function registerLayoutSaveHandler(handler: (() => void) | null) {
	requestLayoutSaveFn = handler
}

export function requestLayoutSave() {
	requestLayoutSaveFn?.()
}
