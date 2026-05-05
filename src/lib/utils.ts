import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getArgentinaTime() {
  return new Date().toLocaleTimeString('es-AR', { 
    timeZone: 'America/Argentina/Buenos_Aires', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}
