import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "destructive";
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = "primary",
}) => {
  const colorClasses = {
    primary: "text-primary bg-primary-light",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };

  return (
    <div className="card-enterprise p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
          {change && (
            <p className="text-xs mt-1">
              <span
                className={`font-medium ${
                  change.positive ? "text-success" : "text-destructive"
                }`}
              >
                {change.positive ? "+" : ""}{change.value}
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};