import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: "crimson" | "blue" | "amber" | "green";
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("stats-card", className)}>
      <div className="flex items-center">
        <div className={cn("stats-icon", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
