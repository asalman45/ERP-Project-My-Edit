import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'indigo' | 'pink';
  subtitle?: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  className,
  trend,
  color = 'orange',
  subtitle,
  loading = false
}) => {
  const colorVariants = {
    orange: {
      bg: 'from-orange-400/20 to-orange-500/20',
      icon: 'text-orange-600',
      border: 'border-orange-200/50',
      hover: 'hover:from-orange-400/30 hover:to-orange-500/30'
    },
    blue: {
      bg: 'from-blue-400/20 to-blue-500/20',
      icon: 'text-blue-600',
      border: 'border-blue-200/50',
      hover: 'hover:from-blue-400/30 hover:to-blue-500/30'
    },
    green: {
      bg: 'from-green-400/20 to-green-500/20',
      icon: 'text-green-600',
      border: 'border-green-200/50',
      hover: 'hover:from-green-400/30 hover:to-green-500/30'
    },
    purple: {
      bg: 'from-purple-400/20 to-purple-500/20',
      icon: 'text-purple-600',
      border: 'border-purple-200/50',
      hover: 'hover:from-purple-400/30 hover:to-purple-500/30'
    },
    red: {
      bg: 'from-red-400/20 to-red-500/20',
      icon: 'text-red-600',
      border: 'border-red-200/50',
      hover: 'hover:from-red-400/30 hover:to-red-500/30'
    },
    indigo: {
      bg: 'from-indigo-400/20 to-indigo-500/20',
      icon: 'text-indigo-600',
      border: 'border-indigo-200/50',
      hover: 'hover:from-indigo-400/30 hover:to-indigo-500/30'
    },
    pink: {
      bg: 'from-pink-400/20 to-pink-500/20',
      icon: 'text-pink-600',
      border: 'border-pink-200/50',
      hover: 'hover:from-pink-400/30 hover:to-pink-500/30'
    }
  };

  const colors = colorVariants[color];

  if (loading) {
    return (
      <div className={cn(
        "relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg animate-pulse",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out group overflow-hidden",
      "hover:scale-[1.02] hover:bg-white/80",
      className
    )}>
      {/* Background gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        colors.bg.replace('/20', '/30').replace('/20', '/30')
      )}></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-300">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-3">
              <div className={cn(
                "flex items-center text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm border",
                trend.isPositive 
                  ? "text-green-700 bg-green-100/60 border-green-200/50" 
                  : "text-red-700 bg-red-100/60 border-red-200/50"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
              <span className="text-xs text-gray-500 ml-2">
                {trend.label || 'vs last month'}
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
          colors.bg,
          colors.hover,
          "group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl"
        )}>
          <Icon className={cn("w-8 h-8", colors.icon, "transition-transform duration-300 group-hover:scale-110")} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
