// Mobile-first responsive utilities and components
'use client';

import React, { useEffect, useState } from 'react';

// Responsive breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Custom hook for responsive behavior
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      setIsMobile(width < breakpoints.md);
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
      setIsDesktop(width >= breakpoints.lg);

      if (width >= breakpoints['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint(null);
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
  };
}

// Touch gesture utilities
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50 && Math.abs(distanceY) < 100;
    const isRightSwipe = distanceX < -50 && Math.abs(distanceY) < 100;
    const isUpSwipe = distanceY > 50 && Math.abs(distanceX) < 100;
    const isDownSwipe = distanceY < -50 && Math.abs(distanceX) < 100;

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY,
    };
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

// Responsive container component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'xl',
  padding = 'md',
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 sm:px-6',
    md: 'px-4 sm:px-6 lg:px-8',
    lg: 'px-6 sm:px-8 lg:px-12',
  };

  return (
    <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

// Mobile-friendly button component
interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function MobileButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
  type = 'button',
}: MobileButtonProps) {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg hover:shadow-xl',
    secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-300',
    outline: 'border-2 border-amber-500 text-amber-600 hover:bg-amber-50',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}

// Mobile-optimized input component
interface MobileInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
}

export function MobileInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  autoComplete,
}: MobileInputProps) {
  const inputId = `mobile-input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-stone-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`
          w-full px-4 py-3 text-base border border-stone-300 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
          disabled:bg-stone-50 disabled:cursor-not-allowed
          placeholder:text-stone-400
          min-h-[44px]
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Mobile-friendly card component
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
}

export function MobileCard({
  children,
  className = '',
  padding = 'md',
  clickable = false,
  onClick,
}: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseClasses = 'bg-white rounded-xl border border-stone-200 shadow-sm';
  const interactiveClasses = clickable 
    ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2' 
    : '';

  if (clickable) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${interactiveClasses} ${paddingClasses[padding]} ${className} w-full text-left`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const gridCols = `grid-cols-${columns.sm || 1} md:grid-cols-${columns.md || 2} lg:grid-cols-${columns.lg || 3} xl:grid-cols-${columns.xl || 4}`;

  return (
    <div className={`grid ${gridCols} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}