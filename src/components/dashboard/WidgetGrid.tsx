import { useCallback, useMemo, useState } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WidgetWrapper } from '@/components/dashboard/WidgetWrapper'
import {
	dashboardInteraction,
	requestLayoutSave,
} from '@/lib/dashboard-interaction'
import {
	GRID_BREAKPOINTS,
	GRID_COLS,
	useDashboardStore,
	type GridBreakpoint,
} from '@/stores/dashboard-store'
import { getWidgetDefinition } from '@/widgets/registry'
import type { WidgetLayoutItem } from '@/widgets/types'

const ResponsiveGridLayout = WidthProvider(Responsive)

function toWidgetLayoutItems(layout: Layout[]): WidgetLayoutItem[] {
	return layout.map((item) => ({
		i: item.i,
		x: item.x,
		y: item.y,
		w: item.w,
		h: item.h,
		minW: item.minW,
		minH: item.minH,
		maxW: item.maxW,
		maxH: item.maxH,
	}))
}

export function WidgetGrid() {
	const instances = useDashboardStore((s) => s.instances)
	const layouts = useDashboardStore((s) => s.layouts)
	const setLayouts = useDashboardStore((s) => s.setLayouts)
	const [currentBreakpoint, setCurrentBreakpoint] = useState<GridBreakpoint>('lg')

	const applyBreakpointLayout = useCallback(
		(layout: Layout[]) => {
			setLayouts(currentBreakpoint, toWidgetLayoutItems(layout))
		},
		[currentBreakpoint, setLayouts],
	)

	const onLayoutChange = useCallback(
		(_currentLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
			// Keep the controlled grid responsive during drag/resize only
			if (!dashboardInteraction.isInteracting) return

			for (const bp of Object.keys(GRID_BREAKPOINTS) as GridBreakpoint[]) {
				const layout = allLayouts[bp]
				if (layout) {
					setLayouts(bp, toWidgetLayoutItems(layout))
				}
			}
		},
		[setLayouts],
	)

	const onInteractionStart = useCallback(() => {
		dashboardInteraction.isInteracting = true
	}, [])

	const onInteractionStop = useCallback(
		(layout: Layout[]) => {
			dashboardInteraction.isInteracting = false
			applyBreakpointLayout(layout)
			requestLayoutSave()
		},
		[applyBreakpointLayout],
	)

	const gridLayouts = useMemo(
		() =>
			Object.fromEntries(
				(Object.keys(layouts) as GridBreakpoint[]).map((bp) => [bp, layouts[bp]]),
			),
		[layouts],
	)

	if (instances.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
				<p className="text-sm font-medium">No widgets on your dashboard</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Use &ldquo;Add widget&rdquo; in the top bar to get started.
				</p>
			</div>
		)
	}

	return (
		<ResponsiveGridLayout
			className="widget-grid"
			breakpoints={GRID_BREAKPOINTS}
			cols={GRID_COLS}
			layouts={gridLayouts}
			rowHeight={80}
			margin={[16, 16]}
			containerPadding={[0, 0]}
			draggableHandle=".widget-drag-handle"
			draggableCancel="textarea, input, button, select, a, .no-drag"
			onBreakpointChange={(bp) => setCurrentBreakpoint(bp as GridBreakpoint)}
			onLayoutChange={onLayoutChange}
			onDragStart={onInteractionStart}
			onDragStop={onInteractionStop}
			onResizeStart={onInteractionStart}
			onResizeStop={onInteractionStop}
			compactType="vertical"
			useCSSTransforms
		>
			{instances.map((instance) => {
				const definition = getWidgetDefinition(instance.type)
				const WidgetComponent = definition.component

				return (
					<div key={instance.id}>
						<WidgetWrapper instanceId={instance.id} title={definition.title}>
							<WidgetComponent instanceId={instance.id} />
						</WidgetWrapper>
					</div>
				)
			})}
		</ResponsiveGridLayout>
	)
}
