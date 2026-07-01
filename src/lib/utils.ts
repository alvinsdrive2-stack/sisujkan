import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const JENIS_KELAS_LABEL: Record<string, string> = {
  '2': 'Luring',
  '3': 'Daring',
  '4': 'Onsite',
  '5': 'Hybrid',
}

export function jenisKelasLabel(id: string | undefined | null): string {
  return JENIS_KELAS_LABEL[id ?? ''] ?? id ?? '-'
}
