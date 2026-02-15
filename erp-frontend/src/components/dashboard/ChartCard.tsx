import React from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

const ChartCard: React.FC<ChartCardProps> = ({ 
  title, 
  children, 
  className, 
  description,
  variant = 'default'
}) => {
  const variants = {
    default: "bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg",
    elevated: "bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl",
    subtle: "bg-white/50 backdrop-blur-lg border border-white/20 shadow-md"
  };

  return (
    <div className={cn(
      "relative rounded-2xl p-6 transition-all duration-500 ease-out group overflow-hidden",
      variants[variant],
      "hover:shadow-2xl hover:scale-[1.01] hover:bg-white/80",
      className
    )}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-indigo-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors duration-300">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
            {description}
          </p>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
