import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { widgetList } from '@/widgets/registry'
import type { WidgetInstance, WidgetLayoutItem, WidgetType } from '@/widgets/types'

export const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const
export const GRID_COLS = { lg: 12, md: 8, sm: 4, xs: 2, xxs: 1 } as const

export type GridBreakpoint = keyof typeof GRID_BREAKPOINTS

type LayoutsByBreakpoint = Record<GridBreakpoint, WidgetLayoutItem[]>

function createDefaultInstances(): WidgetInstance[] {
	return widgetList.map((widget) => ({
		id: `${widget.type}-1`,
		type: widget.type,
	}))
}

function createDefaultLayouts(instances: WidgetInstance[]): LayoutsByBreakpoint {
	const lgLayout: WidgetLayoutItem[] = instances.map((instance) => {
		const definition = widgetList.find((w) => w.type === instance.type)!
		return {
			i: instance.id,
			...definition.defaultLayout,
		}
	})

	return {
		lg: lgLayout,
		md: lgLayout.map((item) => ({ ...item, w: Math.min(item.w, GRID_COLS.md) })),
		sm: lgLayout.map((item, index) => ({
			...item,
			x: 0,
			y: index * item.h,
			w: GRID_COLS.sm,
		})),
		xs: lgLayout.map((item, index) => ({
			...item,
			x: 0,
			y: index * item.h,
			w: GRID_COLS.xs,
		})),
		xxs: lgLayout.map((item, index) => ({
			...item,
			x: 0,
			y: index * item.h,
			w: GRID_COLS.xxs,
		})),
	}
}

interface DashboardState {
	instances: WidgetInstance[]
	layouts: LayoutsByBreakpoint
	setLayouts: (breakpoint: GridBreakpoint, layout: WidgetLayoutItem[]) => void
	addWidget: (type: WidgetType) => void
	removeWidget: (instanceId: string) => void
}

export const useDashboardStore = create<DashboardState>()(
	persist(
		(set) => {
			const instances = createDefaultInstances()
			return {
				instances,
				layouts: createDefaultLayouts(instances),
				setLayouts: (breakpoint, layout) =>
					set((state) => ({
						layouts: { ...state.layouts, [breakpoint]: layout },
					})),
				addWidget: (type) => {
					const definition = widgetList.find((w) => w.type === type)
					if (!definition) return

					const instanceId = `${type}-${crypto.randomUUID().slice(0, 8)}`
					const newInstance: WidgetInstance = { id: instanceId, type }

					set((state) => {
						const newLayoutItem: WidgetLayoutItem = {
							i: instanceId,
							...definition.defaultLayout,
							y: Infinity,
						}

						const updatedLayouts = Object.fromEntries(
							(Object.keys(state.layouts) as GridBreakpoint[]).map((bp) => [
								bp,
								[...state.layouts[bp], newLayoutItem],
							]),
						) as LayoutsByBreakpoint

						return {
							instances: [...state.instances, newInstance],
							layouts: updatedLayouts,
						}
					})
				},
				removeWidget: (instanceId) => {
					set((state) => ({
						instances: state.instances.filter((i) => i.id !== instanceId),
						layouts: Object.fromEntries(
							(Object.keys(state.layouts) as GridBreakpoint[]).map((bp) => [
								bp,
								state.layouts[bp].filter((item) => item.i !== instanceId),
							]),
						) as LayoutsByBreakpoint,
					}))
				},
			}
		},
		{
			name: 'dashboard-layout',
			partialize: (state) => ({
				instances: state.instances,
				layouts: state.layouts,
			}),
		},
	),
)
