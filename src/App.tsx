import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/contexts/auth-context'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'

function LoadingScreen() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
			Loading…
		</div>
	)
}

export function App() {
	const { session, loading } = useAuth()

	if (loading) {
		return <LoadingScreen />
	}

	if (!session) {
		return <AuthPage />
	}

	return (
		<AppShell>
			<DashboardPage />
		</AppShell>
	)
}
