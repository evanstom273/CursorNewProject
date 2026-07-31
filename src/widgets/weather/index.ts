import { CloudSun } from 'lucide-react'
import type { WidgetDefinition } from '../types'
import { WeatherWidget } from './WeatherWidget'

export const weatherWidget: WidgetDefinition = {
	type: 'weather',
	title: 'Weather',
	description: 'Current conditions and forecast',
	icon: CloudSun,
	defaultLayout: { x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
	component: WeatherWidget,
}
