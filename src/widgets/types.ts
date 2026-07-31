import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

export type WidgetType = 'weather' | 'calendar' | 'notes'

export interface WidgetLayout {
	x: number
	y: number
	w: number
	h: number
	minW?: number
	minH?: number
	maxW?: number
	maxH?: number
}

export interface WidgetInstance {
	id: string
	type: WidgetType
}

export interface WidgetProps {
	instanceId: string
}

export interface WidgetDefinition {
	type: WidgetType
	title: string
	description: string
	icon: LucideIcon
	defaultLayout: WidgetLayout
	component: ComponentType<WidgetProps>
}

export interface WidgetLayoutItem extends WidgetLayout {
	i: string
}
