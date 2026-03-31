import {
  Banknote, Laptop, ShoppingBag, TrendingUp, Plus, UtensilsCrossed,
  Car, Home, Heart, GraduationCap, Gamepad2, ShoppingCart, Wrench,
  MoreHorizontal, Briefcase, Gift, Plane, Music, Dumbbell, Coffee,
  Smartphone, BookOpen, Zap, Fuel, Shirt, Dog, Baby, Scissors, Palette,
  Wallet, Building2, CreditCard, PiggyBank, type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Banknote, Laptop, ShoppingBag, TrendingUp, Plus, UtensilsCrossed,
  Car, Home, Heart, GraduationCap, Gamepad2, ShoppingCart, Wrench,
  MoreHorizontal, Briefcase, Gift, Plane, Music, Dumbbell, Coffee,
  Smartphone, BookOpen, Zap, Fuel, Shirt, Dog, Baby, Scissors, Palette,
  Wallet, Building2, CreditCard, PiggyBank,
}

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || MoreHorizontal
}
