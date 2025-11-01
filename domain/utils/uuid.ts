// Simple UUID generator for client-side usage
// Uses crypto.randomUUID when available, falls back to timestamp-based ID

export function generateId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp-based with random component
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

export function generateTaskId(): string {
  return `task_${generateId()}`;
}

export function generateListId(): string {
  return `list_${generateId()}`;
}
