// Loading states and feedback components for better UX
'use client';

import { useState, useEffect } from 'react';
import { Check, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { AnimatedButton, LoadingSpinner, FadeIn, SlideTransition } from '@/lib/animations';
import { useReducedMotion } from '@/lib/accessibility';

// Toast notification system
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// Toast component
interface ToastComponentProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export function ToastComponent({ toast, onRemove }: ToastComponentProps) {
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);
  
  const typeConfig = {
    success: {
      icon: Check,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
  };
  
  const config = typeConfig[toast.type];
  const Icon = config.icon;
  
  return (
    <FadeIn className={`
      max-w-sm w-full ${config.bgColor} border ${config.borderColor} rounded-xl shadow-lg p-4
      ${prefersReducedMotion ? '' : 'transform transition-all duration-300 hover:scale-105'}
    `}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${config.iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {toast.title}
          </p>
          {toast.message && (
            <p className={`text-sm ${config.textColor} opacity-75 mt-1`}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className={`ml-3 ${config.textColor} opacity-50 hover:opacity-75 transition-opacity`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </FadeIn>
  );
}

// Toast container
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ show, message = 'Loading...', className = '' }: LoadingOverlayProps) {
  if (!show) return null;
  
  return (
    <div 
      className={`
        fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-stone-700 font-medium text-center">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Skeleton loading component
interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circle' | 'rectangular';
}

export function Skeleton({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '', 
  variant = 'rectangular' 
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const variantClasses = {
    text: 'rounded',
    circle: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  return (
    <div 
      className={`
        ${width} ${height} ${variantClasses[variant]}
        bg-stone-200
        ${prefersReducedMotion ? '' : 'animate-pulse'}
        ${className}
      `}
      role="status"
      aria-label="Loading..."
    />
  );
}

// Card skeleton for list items
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton variant="circle" width="w-12" height="h-12" />
          <div className="space-y-2 flex-1">
            <Skeleton width="w-3/4" height="h-4" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton width="w-full" height="h-3" />
          <Skeleton width="w-5/6" height="h-3" />
        </div>
        <div className="flex justify-between">
          <Skeleton width="w-20" height="h-6" />
          <Skeleton width="w-24" height="h-8" variant="text" />
        </div>
      </div>
    </div>
  );
}

// Progress indicator with steps
interface ProgressStepsProps {
  steps: Array<{ id: string; title: string; description?: string }>;
  currentStepId: string;
  completedStepIds: string[];
  className?: string;
}

export function ProgressSteps({ 
  steps, 
  currentStepId, 
  completedStepIds, 
  className = '' 
}: ProgressStepsProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="space-y-6">
        {steps.map((step, stepIndex) => {
          const isCompleted = completedStepIds.includes(step.id);
          const isCurrent = step.id === currentStepId;
          const isUpcoming = !isCompleted && !isCurrent;
          
          return (
            <li key={step.id} className="relative">
              {stepIndex < steps.length - 1 && (
                <div 
                  className={`
                    absolute top-8 left-4 w-0.5 h-6 transition-colors duration-200
                    ${isCompleted ? 'bg-green-500' : 'bg-stone-300'}
                  `} 
                />
              )}
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      transition-all duration-200
                      ${isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-amber-500 text-white ring-4 ring-amber-200' 
                          : 'bg-stone-200 text-stone-500'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span>{stepIndex + 1}</span>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 min-w-0 flex-1">
                  <p 
                    className={`
                      text-sm font-medium transition-colors duration-200
                      ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-stone-500'}
                    `}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p 
                      className={`
                        text-sm mt-1 transition-colors duration-200
                        ${isCurrent ? 'text-stone-600' : 'text-stone-500'}
                      `}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Empty state component
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-6 ${className}`}>
      <FadeIn>
        {Icon && (
          <Icon className="w-16 h-16 mx-auto text-stone-400 mb-4" />
        )}
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          {title}
        </h3>
        <p className="text-stone-600 mb-6 max-w-md mx-auto">
          {description}
        </p>
        {actionText && onAction && (
          <AnimatedButton onClick={onAction} variant="primary">
            {actionText}
          </AnimatedButton>
        )}
      </FadeIn>
    </div>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ 
  status, 
  children, 
  size = 'md', 
  className = '' 
}: StatusBadgeProps) {
  const statusConfig = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-stone-100 text-stone-800 border-stone-200',
  };
  
  const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full border
        ${statusConfig[status]}
        ${sizeConfig[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Loading button state
interface LoadingButtonProps {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function LoadingButton({
  loading,
  loadingText = 'Loading...',
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: LoadingButtonProps) {
  return (
    <AnimatedButton
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      className={className}
    >
      {loading ? loadingText : children}
    </AnimatedButton>
  );
}