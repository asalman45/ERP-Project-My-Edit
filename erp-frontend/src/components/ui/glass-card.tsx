import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  title, 
  description,
  variant = 'default',
  hover = true
}) => {
  const variants = {
    default: "bg-white/60 backdrop-blur-md border border-white/30 shadow-lg",
    elevated: "bg-white/70 backdrop-blur-lg border border-white/40 shadow-xl",
    subtle: "bg-white/40 backdrop-blur-sm border border-white/20 shadow-md"
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 transition-all duration-300 ease-out",
      variants[variant],
      hover && "hover:shadow-2xl hover:scale-[1.01]",
      "group",
      className
    )}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;
