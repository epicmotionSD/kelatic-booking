'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Business, BusinessSettings } from './index';

interface BusinessContextType {
  business: Business | null;
  settings: BusinessSettings | null;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType>({
  business: null,
  settings: null,
  isLoading: true,
});

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext must be used within a BusinessProvider');
  }
  return context;
}

export function useBusiness() {
  const { business } = useBusinessContext();
  if (!business) {
    throw new Error('useBusiness must be used within a tenant route');
  }
  return business;
}

export function useBusinessSettings() {
  const { settings } = useBusinessContext();
  return settings;
}

interface BusinessProviderProps {
  children: ReactNode;
  business: Business | null;
  settings: BusinessSettings | null;
}

export function BusinessProvider({
  children,
  business,
  settings,
}: BusinessProviderProps) {
  return (
    <BusinessContext.Provider
      value={{
        business,
        settings,
        isLoading: false,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

// CSS variable injection for theming
export function BusinessThemeStyle({ business }: { business: Business }) {
  const cssVariables = `
    :root {
      --brand-primary: ${business.primary_color};
      --brand-secondary: ${business.secondary_color};
      --brand-accent: ${business.accent_color};
      --brand-font: ${business.font_family}, system-ui, sans-serif;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: cssVariables }} />;
}
