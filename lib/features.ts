/**
 * Feature flags for Kelatic Booking
 * Enables/disables features based on environment config or business plan
 */

export const FEATURES = {
  SMS_ENABLED: process.env.NEXT_PUBLIC_SMS_ENABLED === 'true',
  EMAIL_ENABLED: true, // Always available
  VOICE_ENABLED: false, // Future feature
  MULTI_CHANNEL: false, // SMS + Email in same campaign
} as const

export type FeatureName = keyof typeof FEATURES

/**
 * Check if a feature is enabled globally
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  return FEATURES[feature]
}

/**
 * Check if a feature is enabled for a specific business
 * This allows us to enable SMS for specific businesses (like Kelatic)
 * even if globally disabled
 */
export function isFeatureEnabledForBusiness(
  feature: FeatureName,
  businessPlan?: string,
  businessId?: string
): boolean {
  // Check global flag first
  const globalEnabled = FEATURES[feature]

  // SMS can be enabled for specific businesses
  if (feature === 'SMS_ENABLED') {
    // Enable for Kelatic (pilot customer)
    if (businessId === 'f0c07a53-c001-486b-a30d-c1102b4dfadf') {
      return true
    }

    // Enable for Enterprise plan customers
    if (businessPlan === 'enterprise') {
      return true
    }

    // Enable for Professional plan with SMS addon
    if (businessPlan === 'professional' && globalEnabled) {
      return true
    }

    return globalEnabled
  }

  return globalEnabled
}

/**
 * Get feature status with upgrade info
 */
export interface FeatureStatus {
  enabled: boolean
  reason?: string
  upgradeRequired?: boolean
  upgradePath?: string
}

export function getFeatureStatus(
  feature: FeatureName,
  businessPlan?: string,
  businessId?: string
): FeatureStatus {
  const enabled = isFeatureEnabledForBusiness(feature, businessPlan, businessId)

  if (enabled) {
    return { enabled: true }
  }

  if (feature === 'SMS_ENABLED') {
    return {
      enabled: false,
      reason: 'SMS requires Professional plan or higher',
      upgradeRequired: true,
      upgradePath: '/dashboard/settings/upgrade-sms',
    }
  }

  return { enabled: false, reason: 'Feature not available' }
}
