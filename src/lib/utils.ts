import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes, handling conflicts correctly.
 */
export function cn(...inputs: (string | undefined | null)[]): string {
  return twMerge(inputs.filter(Boolean));
}

/**
 * Formats a date string to a localized Spanish format.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Escapes HTML special characters to prevent XSS.
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
