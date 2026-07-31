import { LayoutDashboard, PanelsTopLeft, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const NAV_ITEMS = [
	{ label: 'Dashboard', icon: LayoutDashboard, active: true },
	{ label: 'Widgets', icon: PanelsTopLeft, active: false },
	{ label: 'Settings', icon: Settings, active: false },
] as const

interface SidebarProps {
	className?: string
	onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
	return (
		<aside
			className={cn(
				'flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
				className,
			)}
		>
			<div className="flex h-14 items-center gap-2 px-4">
				<div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
					<LayoutDashboard className="size-4" aria-hidden="true" />
				</div>
				<div className="flex flex-col">
					<span className="text-sm font-semibold leading-none">Personal</span>
					<span className="text-xs text-muted-foreground">Dashboard</span>
				</div>
			</div>

			<Separator />

			<ScrollArea className="flex-1 px-2 py-3">
				<nav className="flex flex-col gap-1" aria-label="Main navigation">
					{NAV_ITEMS.map((item) => (
						<Button
							key={item.label}
							variant={item.active ? 'secondary' : 'ghost'}
							className={cn(
								'w-full justify-start gap-3',
								item.active && 'bg-sidebar-accent text-sidebar-accent-foreground',
							)}
							onClick={onNavigate}
						>
							<item.icon className="size-4" aria-hidden="true" />
							{item.label}
						</Button>
					))}
				</nav>
			</ScrollArea>

			<Separator />

			<div className="p-4">
				<p className="text-xs text-muted-foreground">
					Modular widget dashboard — add, move, and resize widgets freely.
				</p>
			</div>
		</aside>
	)
}
