import * as SheetPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Sheet({ ...props }: ComponentProps<typeof SheetPrimitive.Root>) {
	return <SheetPrimitive.Root {...props} />
}

function SheetTrigger({ ...props }: ComponentProps<typeof SheetPrimitive.Trigger>) {
	return <SheetPrimitive.Trigger {...props} />
}

function SheetClose({ ...props }: ComponentProps<typeof SheetPrimitive.Close>) {
	return <SheetPrimitive.Close {...props} />
}

function SheetPortal({ ...props }: ComponentProps<typeof SheetPrimitive.Portal>) {
	return <SheetPrimitive.Portal {...props} />
}

function SheetOverlay({ className, ...props }: ComponentProps<typeof SheetPrimitive.Overlay>) {
	return (
		<SheetPrimitive.Overlay
			className={cn(
				'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				className,
			)}
			{...props}
		/>
	)
}

function SheetContent({
	className,
	children,
	side = 'left',
	...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
	side?: 'top' | 'right' | 'bottom' | 'left'
}) {
	return (
		<SheetPortal>
			<SheetOverlay />
			<SheetPrimitive.Content
				className={cn(
					'fixed z-50 flex flex-col gap-4 bg-sidebar p-6 text-sidebar-foreground shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
					side === 'left' &&
						'inset-y-0 left-0 h-full w-72 border-r border-sidebar-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
					className,
				)}
				{...props}
			>
				{children}
				<SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
					<X className="size-4" />
					<span className="sr-only">Close</span>
				</SheetPrimitive.Close>
			</SheetPrimitive.Content>
		</SheetPortal>
	)
}

export { Sheet, SheetTrigger, SheetClose, SheetContent }
