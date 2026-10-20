import {
  Banknote,
  Briefcase,
  Car,
  Circle,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  FileText,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Pill,
  Plane,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Undo2,
  Users,
  Utensils,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  zap: Zap,
  home: Home,
  users: Users,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  clapperboard: Clapperboard,
  plane: Plane,
  repeat: Repeat,
  "file-text": FileText,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  wallet: Wallet,
  "undo-2": Undo2,
  gift: Gift,
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  "credit-card": CreditCard,
  coffee: Coffee,
  fuel: Fuel,
  pill: Pill,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
};

export function AppIcon({
  name,
  className,
  strokeWidth = 1.9,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = icons[name] ?? Circle;
  return <Icon className={cn("size-4", className)} strokeWidth={strokeWidth} />;
}
