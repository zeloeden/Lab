/**
 * Formats a date to 12-hour format with AM/PM
 */
export function formatTo12Hour(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return dateObj.toLocaleString('en-US', options);
}

/**
 * Formats a date to 12-hour time only
 */
export function formatTimeOnly12Hour(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return 'Invalid Time';
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return dateObj.toLocaleString('en-US', options);
}

/**
 * Formats a date for datetime-local input (which needs 24-hour format)
 */
export function formatForDateTimeInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if valid date
  if (isNaN(dateObj.getTime())) return '';
  
  // Format: YYYY-MM-DDTHH:mm
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
