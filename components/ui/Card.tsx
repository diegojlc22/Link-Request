import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-b border-gray-100 dark:border-gray-700 ${className}`} {...props}>
    {children}
  </div>
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);