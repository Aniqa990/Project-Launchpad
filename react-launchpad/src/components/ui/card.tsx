import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const classes = `
    bg-white rounded-xl shadow-sm border border-gray-200
    ${hover ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-200' : ''}
    ${paddingClasses[padding]}
    ${className}
  `;

  return (
    <div className={classes}>
      {children}
    </div>
  );
}