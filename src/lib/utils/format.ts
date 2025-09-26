/**
 * Format file size in bytes to a human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a number as a price string
 * @param value - The number to format
 * @param currency - Currency symbol (default: 'JOD')
 * @returns Formatted price string
 */
export function formatPrice(value: number, currency: string = 'JOD'): string {
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency: 'JOD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('JOD', currency);
}

/**
 * Format a date string to a localized date
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
