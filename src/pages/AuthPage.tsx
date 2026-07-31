import { LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'

export function AuthPage() {
	const { signIn, signUp, signInWithGoogle } = useAuth()
	const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [message, setMessage] = useState<string | null>(null)
	const [submitting, setSubmitting] = useState(false)

	async function handleGoogleSignIn() {
		setSubmitting(true)
		setMessage(null)

		const error = await signInWithGoogle()
		if (error) {
			setMessage(error)
			setSubmitting(false)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setMessage(null)

		const error =
			mode === 'sign-in'
				? await signIn(email, password)
				: await signUp(email, password)

		if (error) {
			setMessage(error)
		} else if (mode === 'sign-up') {
			setMessage('Account created. Check your email if confirmation is required, then sign in.')
			setMode('sign-in')
		}

		setSubmitting(false)
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-3 text-center">
					<div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<LayoutDashboard className="size-5" aria-hidden="true" />
					</div>
					<div>
						<CardTitle>Personal Dashboard</CardTitle>
						<CardDescription>
							{mode === 'sign-in' ? 'Sign in to access your widgets' : 'Create an account to get started'}
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button
						type="button"
						variant="outline"
						className="w-full gap-2"
						disabled={submitting}
						onClick={() => void handleGoogleSignIn()}
					>
						<GoogleIcon />
						Continue with Google
					</Button>

					<div className="flex items-center gap-3">
						<Separator className="flex-1" />
						<span className="text-xs text-muted-foreground">or</span>
						<Separator className="flex-1" />
					</div>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
								required
								minLength={6}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
							/>
						</div>

						{message && (
							<p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
								{message}
							</p>
						)}

						<Button type="submit" className="w-full" disabled={submitting}>
							{submitting ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
						</Button>
					</form>

					<div className="text-center text-sm text-muted-foreground">
						{mode === 'sign-in' ? (
							<>
								No account?{' '}
								<button
									type="button"
									className="text-foreground underline-offset-4 hover:underline"
									onClick={() => setMode('sign-up')}
								>
									Sign up
								</button>
							</>
						) : (
							<>
								Already have an account?{' '}
								<button
									type="button"
									className="text-foreground underline-offset-4 hover:underline"
									onClick={() => setMode('sign-in')}
								>
									Sign in
								</button>
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
