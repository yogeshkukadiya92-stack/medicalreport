// Utility functions for the app

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getHealthStatusColor(status: string): string {
  switch (status) {
    case 'normal':
      return 'text-health-normal';
    case 'borderline':
      return 'text-health-borderline';
    case 'high':
      return 'text-health-high';
    case 'low':
      return 'text-health-low';
    case 'critical':
      return 'text-health-high';
    default:
      return 'text-gray-500';
  }
}

export function getHealthStatusBgColor(status: string): string {
  switch (status) {
    case 'normal':
      return 'bg-green-100';
    case 'borderline':
      return 'bg-amber-100';
    case 'high':
      return 'bg-red-100';
    case 'low':
      return 'bg-blue-100';
    default:
      return 'bg-gray-100';
  }
}

export function getHealthStatusDotColor(status: string): string {
  switch (status) {
    case 'normal':
      return 'bg-health-normal';
    case 'borderline':
      return 'bg-health-borderline';
    case 'high':
      return 'bg-health-high';
    case 'low':
      return 'bg-health-low';
    default:
      return 'bg-gray-300';
  }
}

export function validatePhone(phone: string): boolean {
  const regex = /^\+?[1-9]\d{9,13}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validateOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

// Generate fake report data for chart
export function generateTrendData(baseValue: number, points: number = 6) {
  const data = [];
  for (let i = points - 1; i >= 0; i--) {
    const variance = Math.random() * 4 - 2; // ±2
    const value = Math.round((baseValue + variance) * 10) / 10;
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    data.push({
      date: formatDate(date),
      value: value.toString(),
      status: value > 5.7 ? 'high' : 'normal',
    });
  }
  return data;
}

// Debounce helper
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Session storage helpers
export function setSession(key: string, value: any) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

export function getSession(key: string) {
  if (typeof window !== 'undefined') {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  return null;
}

export function clearSession(key?: string) {
  if (typeof window !== 'undefined') {
    if (key) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.clear();
    }
  }
}
