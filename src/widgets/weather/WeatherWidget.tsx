import { CloudSun, Droplets, Wind } from 'lucide-react'
import type { WidgetProps } from '../types'

export function WeatherWidget({ instanceId }: WidgetProps) {
	return (
		<div className="flex h-full flex-col gap-4" data-widget-instance={instanceId}>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-3xl font-semibold tracking-tight">22°C</p>
					<p className="text-sm text-muted-foreground">Partly cloudy</p>
				</div>
				<CloudSun className="size-10 text-muted-foreground" aria-hidden="true" />
			</div>
			<div className="mt-auto grid grid-cols-2 gap-3 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Droplets className="size-4 shrink-0" aria-hidden="true" />
					<span>Humidity 58%</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<Wind className="size-4 shrink-0" aria-hidden="true" />
					<span>Wind 12 km/h</span>
				</div>
			</div>
			<p className="text-xs text-muted-foreground/70">Placeholder — connect a weather API later</p>
		</div>
	)
}
