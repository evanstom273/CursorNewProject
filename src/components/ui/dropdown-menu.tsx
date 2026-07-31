import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function DropdownMenu({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root {...props} />
}

function DropdownMenuTrigger({ ...props }: ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return <DropdownMenuPrimitive.Trigger {...props} />
}

function DropdownMenuContent({
	className,
	sideOffset = 4,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				sideOffset={sideOffset}
				className={cn(
					'z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
					className,
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	)
}

function DropdownMenuItem({
	className,
	inset,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { inset?: boolean }) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
				inset && 'pl-8',
				className,
			)}
			{...props}
		/>
	)
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) {
	return (
		<DropdownMenuPrimitive.Label
			className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
			{...props}
		/>
	)
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return <DropdownMenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
	return (
		<DropdownMenuPrimitive.CheckboxItem
			className={cn(
				'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
				className,
			)}
			checked={checked}
			{...props}
		>
			<span className="absolute left-2 flex size-3.5 items-center justify-center">
				<DropdownMenuPrimitive.ItemIndicator>
					<Check className="size-4" />
				</DropdownMenuPrimitive.ItemIndicator>
			</span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	)
}

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
}
