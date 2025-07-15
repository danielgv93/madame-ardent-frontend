import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null)[]): string {
  return twMerge(inputs.filter(Boolean));
}