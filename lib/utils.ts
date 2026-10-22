import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export {
  clamp,
  initials,
  roundMoney,
  uid,
} from "@asharibook/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
