import * as React from 'react'
import { cn } from '@/frontend/lib/utils'

// Renders a card container.
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass-card relative flex flex-col rounded-2xl border bg-card/90 p-6 shadow-subtle',
        className
      )}
      {...props}
    />
  )
}

// Renders the top part of a card.
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mb-4 flex flex-col gap-1', className)}
      {...props}
    />
  )
}

// Renders a card title.
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

// Renders card description text.
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

// Renders the main card content.
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-3 text-sm', className)}
      {...props}
    />
  )
}

