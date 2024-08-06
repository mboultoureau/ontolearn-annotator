import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncate(input: string, length: number) {
  return input?.length > length ? `${input.substring(0, length - 3)}...` : input;
}