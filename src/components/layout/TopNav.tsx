import { Bell, Menu, Plus, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/Sidebar'
import { widgetList } from '@/widgets/registry'
import { useDashboardStore } from '@/stores/dashboard-store'

export function TopNav() {
	const addWidget = useDashboardStore((s) => s.addWidget)

	return (
		<header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
			<Sheet>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
						<Menu className="size-5" />
					</Button>
				</SheetTrigger>
				<SheetContent side="left" className="w-64 p-0">
					<Sidebar className="w-full border-0" />
				</SheetContent>
			</Sheet>

			<div className="flex flex-1 items-center gap-3">
				<div className="relative hidden max-w-md flex-1 sm:block">
					<Search
						className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<input
						type="search"
						placeholder="Search widgets, notes…"
						className="h-9 w-full rounded-md border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
						aria-label="Search"
					/>
				</div>
			</div>

			<div className="flex items-center gap-1">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
							<Plus className="size-4" aria-hidden="true" />
							Add widget
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuLabel>Available widgets</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{widgetList.map((widget) => (
							<DropdownMenuItem
								key={widget.type}
								onClick={() => addWidget(widget.type)}
								className="gap-2"
							>
								<widget.icon className="size-4" aria-hidden="true" />
								{widget.title}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>

				<Button variant="ghost" size="icon" aria-label="Notifications">
					<Bell className="size-4" />
				</Button>

				<Button variant="ghost" size="icon" aria-label="User profile">
					<User className="size-4" />
				</Button>
			</div>
		</header>
	)
}
