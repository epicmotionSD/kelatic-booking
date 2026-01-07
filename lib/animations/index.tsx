// Animation utilities for smooth interactions
'use client';

import React, { useState, useEffect } from 'react';
import { useReducedMotion } from '@/lib/accessibility';

// Animation presets
export const animations = {
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Slide animations  
  slideInUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideInDown: 'animate-in slide-in-from-top-4 duration-300',
  slideInLeft: 'animate-in slide-in-from-left-4 duration-300',
  slideInRight: 'animate-in slide-in-from-right-4 duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-150',
  
  // Bounce effect
  bounce: 'animate-bounce',
  
  // Pulse effect
  pulse: 'animate-pulse',
  
  // Spin effect
  spin: 'animate-spin',
} as const;

// Loading animation component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'amber' | 'stone' | 'white';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'amber', 
  className = '' 
}: LoadingSpinnerProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
  };
  
  const colorClasses = {
    amber: 'border-amber-500 border-t-transparent',
    stone: 'border-stone-400 border-t-transparent',
    white: 'border-white border-t-transparent',
  };
  
  return (
    <div 
      className={`
        border-2 rounded-full 
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        ${prefersReducedMotion ? '' : 'animate-spin'}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
}

// Animated button component
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
}: AnimatedButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isPressed, setIsPressed] = useState(false);
  
  const baseClasses = `
    relative font-medium rounded-xl transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${prefersReducedMotion ? '' : 'transform hover:scale-105 active:scale-95'}
  `;
  
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
  
  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${isPressed && !prefersReducedMotion ? 'scale-95' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <LoadingSpinner 
            size={size === 'lg' ? 'md' : 'sm'} 
            color={variant === 'primary' ? 'white' : 'amber'} 
            className="mr-2" 
          />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Fade in wrapper component
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = 300, className = '' }: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div 
      className={`
        transition-all ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger animation for lists
interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggeredList({ children, staggerDelay = 100, className = '' }: StaggeredListProps) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Slide transition component
interface SlideTransitionProps {
  show: boolean;
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function SlideTransition({ 
  show, 
  children, 
  direction = 'up', 
  className = '' 
}: SlideTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return show ? <div className={className}>{children}</div> : null;
  }
  
  const directionClasses = {
    up: show ? 'translate-y-0' : 'translate-y-4',
    down: show ? 'translate-y-0' : '-translate-y-4',
    left: show ? 'translate-x-0' : 'translate-x-4',
    right: show ? 'translate-x-0' : '-translate-x-4',
  };
  
  return (
    <div 
      className={`
        transition-all duration-300 ease-out
        ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        ${directionClasses[direction]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Scale transition for modals/overlays
interface ScaleTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ScaleTransition({ show, children, className = '' }: ScaleTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return show ? <div className={className}>{children}</div> : null;
  }
  
  return (
    <div 
      className={`
        transition-all duration-200 ease-out
        ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Floating action button with animation
interface FloatingActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FloatingActionButton({ 
  onClick, 
  children, 
  className = '',
  position = 'bottom-right'
}: FloatingActionButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };
  
  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-50
        w-14 h-14 bg-amber-500 text-white rounded-full shadow-xl
        flex items-center justify-center
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
        ${prefersReducedMotion ? 'hover:bg-amber-600' : 'hover:bg-amber-600 hover:scale-110'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// Progress indicator
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isActive = index <= currentStep;
        const isCurrent = index === currentStep;
        
        return (
          <div key={step} className="flex items-center">
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                transition-all duration-300
                ${isActive 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-stone-200 text-stone-500'
                }
                ${isCurrent ? 'ring-2 ring-amber-300 ring-offset-2' : ''}
              `}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`
                  w-16 h-0.5 mx-2 transition-colors duration-300
                  ${isActive ? 'bg-amber-500' : 'bg-stone-200'}
                `} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}