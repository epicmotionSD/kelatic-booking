// Enhanced form components with better UX
'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, X, AlertCircle, Info } from 'lucide-react';
import { focusClasses } from '@/lib/accessibility';
import { AnimatedButton, LoadingSpinner } from '@/lib/animations';

// Enhanced input component with validation feedback
interface EnhancedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  helperText?: string;
  showCharacterCount?: boolean;
}

export function EnhancedInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  success = false,
  disabled = false,
  className = '',
  autoComplete,
  pattern,
  minLength,
  maxLength,
  helperText,
  showCharacterCount = false,
}: EnhancedInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `enhanced-input-${Math.random().toString(36).substr(2, 9)}`;
  
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;
  
  // Validation states
  const hasError = !!error;
  const hasValue = value.length > 0;
  const isValid = hasValue && !hasError;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label 
          htmlFor={inputId}
          className={`
            block text-sm font-medium transition-colors duration-200
            ${hasError ? 'text-red-700' : success ? 'text-green-700' : 'text-stone-700'}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        {showCharacterCount && maxLength && (
          <span className={`text-xs ${
            value.length > maxLength ? 'text-red-500' : 'text-stone-500'
          }`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      
      {/* Input Container */}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type={actualType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-describedby={`
            ${error ? `${inputId}-error` : ''}
            ${helperText ? `${inputId}-helper` : ''}
          `.trim()}
          className={`
            w-full px-4 py-3 text-base border rounded-xl transition-all duration-200
            ${focusClasses.input}
            disabled:bg-stone-50 disabled:cursor-not-allowed
            placeholder:text-stone-400 min-h-[44px]
            ${hasError 
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
              : success 
                ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                : 'border-stone-300'
            }
            ${isFocused ? 'ring-2' : ''}
            ${isPassword ? 'pr-12' : ''}
          `}
        />
        
        {/* Password visibility toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-500 hover:text-stone-700 focus:outline-none focus:text-stone-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        {/* Validation icons */}
        {!isPassword && hasValue && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError ? (
              <X className="w-5 h-5 text-red-500" aria-hidden="true" />
            ) : isValid ? (
              <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Helper text and error messages */}
      {(error || helperText) && (
        <div className="space-y-1">
          {error && (
            <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-start" role="alert">
              <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${inputId}-helper`} className="text-sm text-stone-600 flex items-start">
              <Info className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced textarea component
interface EnhancedTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
  helperText?: string;
  autoResize?: boolean;
}

export function EnhancedTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  rows = 4,
  maxLength,
  helperText,
  autoResize = false,
}: EnhancedTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = `enhanced-textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  // Auto resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, autoResize]);
  
  const hasError = !!error;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label 
          htmlFor={inputId}
          className={`
            block text-sm font-medium transition-colors duration-200
            ${hasError ? 'text-red-700' : 'text-stone-700'}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        {maxLength && (
          <span className={`text-xs ${
            value.length > maxLength ? 'text-red-500' : 'text-stone-500'
          }`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={autoResize ? 1 : rows}
        maxLength={maxLength}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={`
          ${error ? `${inputId}-error` : ''}
          ${helperText ? `${inputId}-helper` : ''}
        `.trim()}
        className={`
          w-full px-4 py-3 text-base border rounded-xl transition-all duration-200 resize-none
          ${focusClasses.input}
          disabled:bg-stone-50 disabled:cursor-not-allowed
          placeholder:text-stone-400
          ${hasError 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-stone-300'
          }
          ${isFocused ? 'ring-2' : ''}
          ${autoResize ? 'overflow-hidden' : ''}
        `}
        style={autoResize ? { minHeight: `${rows * 1.5}rem` } : {}}
      />
      
      {/* Helper text and error messages */}
      {(error || helperText) && (
        <div className="space-y-1">
          {error && (
            <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-start" role="alert">
              <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${inputId}-helper`} className="text-sm text-stone-600 flex items-start">
              <Info className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced select component
interface EnhancedSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

export function EnhancedSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = '',
  helperText,
}: EnhancedSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = `enhanced-select-${Math.random().toString(36).substr(2, 9)}`;
  
  const hasError = !!error;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label 
        htmlFor={inputId}
        className={`
          block text-sm font-medium transition-colors duration-200
          ${hasError ? 'text-red-700' : 'text-stone-700'}
        `}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {/* Select */}
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={`
          ${error ? `${inputId}-error` : ''}
          ${helperText ? `${inputId}-helper` : ''}
        `.trim()}
        className={`
          w-full px-4 py-3 text-base border rounded-xl transition-all duration-200
          ${focusClasses.input}
          disabled:bg-stone-50 disabled:cursor-not-allowed
          min-h-[44px] appearance-none bg-white
          ${hasError 
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-stone-300'
          }
          ${isFocused ? 'ring-2' : ''}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="#9ca3af" d="m2 0-2 2h4zm0 5 2-2h-4z"/></svg>'
          )}")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.7rem center',
          backgroundSize: '0.65rem auto',
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Helper text and error messages */}
      {(error || helperText) && (
        <div className="space-y-1">
          {error && (
            <p id={`${inputId}-error`} className="text-sm text-red-600 flex items-start" role="alert">
              <AlertCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${inputId}-helper`} className="text-sm text-stone-600 flex items-start">
              <Info className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Form wrapper with enhanced UX
interface EnhancedFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  className?: string;
  title?: string;
  description?: string;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  submitDisabled?: boolean;
}

export function EnhancedForm({
  children,
  onSubmit,
  loading = false,
  className = '',
  title,
  description,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  submitDisabled = false,
}: EnhancedFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`} noValidate>
      {/* Form Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold text-stone-900 font-serif">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-stone-600">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Form Fields */}
      <div className="space-y-4">
        {children}
      </div>
      
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
        {onCancel && (
          <AnimatedButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="sm:w-auto w-full order-2 sm:order-1"
          >
            {cancelText}
          </AnimatedButton>
        )}
        <AnimatedButton
          type="submit"
          variant="primary"
          loading={loading}
          disabled={submitDisabled || loading}
          className="sm:w-auto w-full order-1 sm:order-2 sm:ml-auto"
        >
          {submitText}
        </AnimatedButton>
      </div>
    </form>
  );
}