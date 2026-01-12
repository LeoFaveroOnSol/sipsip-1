import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// We don't have clsx/tailwind-merge installed, so let's simplify
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}

// Format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}min ago`;
  return 'now';
}

// Format remaining time
export function formatTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return 'Available!';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}min ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

// Generate deterministic seed
export function generateEggSeed(): number {
  return Math.floor(Math.random() * 1000000);
}

// Truncate wallet address
export function truncateWallet(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Calculate next week
export function getWeekBoundaries(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Week number of the year
export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Validate pet name
export function validatePetName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must have at least 2 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Name can have at most 20 characters' };
  }

  // Only letters, numbers, spaces and some special characters
  const validPattern = /^[a-zA-Z0-9\s\-_áéíóúàèìòùãõâêîôûçÁÉÍÓÚÀÈÌÒÙÃÕÂÊÎÔÛÇ]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Sanitize string to prevent XSS
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Check if today is a ritual day
export function getTodayRitual(): string | null {
  const today = new Date().getDay();
  const rituals: Record<number, string> = {
    0: 'rest_sunday',
    1: 'grind_monday',
    3: 'mutation_wednesday',
    5: 'chaos_friday',
    6: 'social_saturday',
  };
  return rituals[today] || null;
}
