import {
  Banknote,
  Briefcase,
  Car,
  CircleDollarSign,
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
} from "lucide-react-native";

const icons: Record<string, LucideIcon> = {
  landmark: Landmark,
  banknote: Banknote,
  "credit-card": CreditCard,
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  coffee: Coffee,
  fuel: Fuel,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
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
  "circle-dollar-sign": CircleDollarSign,
  "piggy-bank": PiggyBank,
};

export function AppIcon({
  name,
  color,
  size = 18,
  strokeWidth = 1.9,
}: {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = icons[name] ?? CircleDollarSign;
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
}
