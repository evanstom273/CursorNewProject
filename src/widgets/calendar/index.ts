import { CalendarDays } from 'lucide-react'
import type { WidgetDefinition } from '../types'
import { CalendarWidget } from './CalendarWidget'

export const calendarWidget: WidgetDefinition = {
	type: 'calendar',
	title: 'Calendar',
	description: 'Upcoming events and schedule',
	icon: CalendarDays,
	defaultLayout: { x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
	component: CalendarWidget,
}
