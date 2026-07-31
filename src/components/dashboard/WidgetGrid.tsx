import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Responsive, WidthProvider, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { WidgetWrapper } from '@/components/dashboard/WidgetWrapper'
import {
	requestDashboardSave,
	setGridInteracting,
} from '@/lib/dashboard-interaction'
import {
	GRID_BREAKPOINTS,
	GRID_COLS,
	useDashboardStore,
	type GridBreakpoint,
	type LayoutsByBreakpoint,
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

function fromStoreLayouts(layouts: LayoutsByBreakpoint): Record<string, Layout[]> {
	return Object.fromEntries(
		(Object.keys(layouts) as GridBreakpoint[]).map((bp) => [bp, layouts[bp]]),
	)
}

function toStoreLayouts(allLayouts: Record<string, Layout[]>): LayoutsByBreakpoint {
	const result = {} as LayoutsByBreakpoint
	for (const bp of Object.keys(GRID_BREAKPOINTS) as GridBreakpoint[]) {
		const layout = allLayouts[bp]
		if (layout) {
			result[bp] = toWidgetLayoutItems(layout)
		}
	}
	return result
}

export function WidgetGrid() {
	const instances = useDashboardStore((s) => s.instances)
	const storeLayouts = useDashboardStore((s) => s.layouts)
	const replaceLayouts = useDashboardStore((s) => s.replaceLayouts)

	const [gridLayouts, setGridLayouts] = useState(() => fromStoreLayouts(storeLayouts))
	const gridLayoutsRef = useRef(gridLayouts)
	const interactingRef = useRef(false)

	useEffect(() => {
		gridLayoutsRef.current = gridLayouts
	}, [gridLayouts])

	useEffect(() => {
		if (!interactingRef.current) {
			setGridLayouts(fromStoreLayouts(storeLayouts))
		}
	}, [storeLayouts])

	const commitLayouts = useCallback(
		(allLayouts: Record<string, Layout[]>) => {
			const nextLayouts = toStoreLayouts(allLayouts)
			setGridLayouts(fromStoreLayouts(nextLayouts))
			replaceLayouts(nextLayouts)
		},
		[replaceLayouts],
	)

	const onLayoutChange = useCallback(
		(_currentLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
			gridLayoutsRef.current = allLayouts
			if (interactingRef.current) {
				setGridLayouts(allLayouts)
				return
			}
			commitLayouts(allLayouts)
		},
		[commitLayouts],
	)

	const onInteractionStart = useCallback(() => {
		interactingRef.current = true
		setGridInteracting(true)
	}, [])

	const onInteractionStop = useCallback(() => {
		interactingRef.current = false
		setGridInteracting(false)
		commitLayouts(gridLayoutsRef.current)
		requestDashboardSave()
	}, [commitLayouts])

	const layoutsKey = useMemo(
		() => instances.map((instance) => instance.id).join(','),
		[instances],
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
			key={layoutsKey}
			className="widget-grid"
			breakpoints={GRID_BREAKPOINTS}
			cols={GRID_COLS}
			layouts={gridLayouts}
			rowHeight={80}
			margin={[16, 16]}
			containerPadding={[0, 0]}
			draggableHandle=".widget-drag-handle"
			draggableCancel="textarea, input, button, select, a, .no-drag"
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
