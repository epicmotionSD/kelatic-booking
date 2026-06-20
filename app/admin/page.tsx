import RevenueMigrationDashboard from '@/components/dashboard/revenue-migration-dashboard';
import CommerceDashboard from '@/components/dashboard/commerce-dashboard';
import { getTenantSlug } from '@/lib/tenant/server';

// Tenant slugs that use the simplified commerce dashboard.
const COMMERCE_TENANTS = ['vitality'];

export default async function AdminDashboard() {
  const slug = await getTenantSlug();
  if (slug && COMMERCE_TENANTS.includes(slug)) {
    return <CommerceDashboard />;
  }
  return <RevenueMigrationDashboard maxWidthClass="max-w-none mx-0" />;
}
