import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateString));
}

export function getSessionId(): string {
  let sid = localStorage.getItem('cart_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sid);
  }
  return sid;
}

export function calculateDiscount(subtotal: number, code: { type: string; value: number; min_order_amount?: number }): number {
  if (code.min_order_amount && subtotal < code.min_order_amount) return 0;
  if (code.type === 'percent') return (subtotal * code.value) / 100;
  if (code.type === 'fixed') return Math.min(code.value, subtotal);
  return 0;
}
