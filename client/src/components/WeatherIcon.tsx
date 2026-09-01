import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { weatherIcon } from "@/lib/icons";

interface WeatherIconProps {
  icon: string;
  condition?: string;
  size?: number;
  className?: string;
}

export function WeatherIcon({ icon, condition, size = 48, className }: WeatherIconProps) {
  const Icon: LucideIcon = weatherIcon(icon, condition);
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" className={className} />;
}