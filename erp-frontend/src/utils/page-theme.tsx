import React from 'react';
import GlassCard from '@/components/ui/glass-card';

// Utility function to wrap page content with glassmorphism theme
export const withGlassmorphismTheme = (PageComponent: React.ComponentType<any>) => {
  return (props: any) => {
    return (
      <div className="space-y-6">
        <PageComponent {...props} />
      </div>
    );
  };
};

// Utility function to create glassmorphism page wrapper
export const GlassPageWrapper: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, description, children, actions }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-2">{description}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      
      {/* Content */}
      {children}
    </div>
  );
};

// Utility function to create glassmorphism section
export const GlassSection: React.FC<{
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, description, children, className }) => {
  return (
    <GlassCard title={title} className={className}>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {children}
    </GlassCard>
  );
};
