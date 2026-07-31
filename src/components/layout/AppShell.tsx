import type { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'

interface AppShellProps {
	children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
	return (
		<div className="flex h-svh w-full overflow-hidden bg-background">
			<Sidebar className="hidden md:flex" />

			<div className="flex min-w-0 flex-1 flex-col">
				<TopNav />
				<main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
			</div>
		</div>
	)
}
