// Accessibility utilities for better user experience
'use client';

import React, { useEffect, useState } from 'react';

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];

  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus) {
      this.focusStack.push(currentFocus);
    }
    element.focus();
  }

  static popFocus(): void {
    const previousElement = this.focusStack.pop();
    if (previousElement) {
      previousElement.focus();
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private liveRegion: HTMLElement | null = null;

  static getInstance(): ScreenReaderAnnouncer {
    if (!this.instance) {
      this.instance = new ScreenReaderAnnouncer();
    }
    return this.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegion();
    }
  }

  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

// Hook for keyboard navigation
export function useKeyboardNavigation(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const handler = handlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handlers]);
}

// Hook for reduced motion preferences
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for color scheme preference
export function useColorSchemePreference(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
}

// Skip link component for keyboard navigation
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-amber-600 text-white px-4 py-2 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

// ARIA live region hook
export function useAriaLiveRegion() {
  const announcer = ScreenReaderAnnouncer.getInstance();

  return {
    announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announcer.announce(message, priority);
    }
  };
}

// Focus visible utility class
export const focusClasses = {
  button: 'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-50',
  input: 'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
  card: 'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-50',
  link: 'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-sm'
};

// Text scale utilities for readability
export const textScale = {
  xs: 'text-xs leading-4',
  sm: 'text-sm leading-5', 
  base: 'text-base leading-6',
  lg: 'text-lg leading-7',
  xl: 'text-xl leading-8',
  '2xl': 'text-2xl leading-9',
  '3xl': 'text-3xl leading-10'
};

// Color contrast utilities
export const contrastColors = {
  primary: 'text-stone-900 bg-white',
  secondary: 'text-stone-700 bg-stone-50',
  accent: 'text-amber-900 bg-amber-100',
  success: 'text-green-900 bg-green-100',
  warning: 'text-yellow-900 bg-yellow-100',
  error: 'text-red-900 bg-red-100',
  muted: 'text-stone-600 bg-stone-100'
};