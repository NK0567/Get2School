import clsx from 'clsx'
import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Compose des classes Tailwind en resolvant les conflits. */
export function cn(...entrees: ClassValue[]) {
  return twMerge(clsx(entrees))
}
