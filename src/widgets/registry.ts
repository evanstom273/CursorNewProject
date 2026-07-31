import type { WidgetDefinition, WidgetType } from './types'
import { calendarWidget } from './calendar'
import { notesWidget } from './notes'
import { weatherWidget } from './weather'

/**
 * Central widget registry.
 * To add a new widget: create a folder under src/widgets/, export a WidgetDefinition,
 * and register it here. The dashboard shell picks it up automatically.
 */
export const widgetRegistry = {
	weather: weatherWidget,
	calendar: calendarWidget,
	notes: notesWidget,
} satisfies Record<WidgetType, WidgetDefinition>

export const widgetList = Object.values(widgetRegistry)

export function getWidgetDefinition(type: WidgetType): WidgetDefinition {
	return widgetRegistry[type]
}
