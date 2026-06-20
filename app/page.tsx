import KelaticLanding from '@/components/home/kelatic-landing';
import VitalityLanding from '@/components/home/vitality-landing';
import { getTenantSlug } from '@/lib/tenant/server';

// Tenant slugs that render the Vitality House (commerce) landing page.
const COMMERCE_TENANTS = ['vitality'];

export default async function Home() {
  const slug = await getTenantSlug();
  if (slug && COMMERCE_TENANTS.includes(slug)) {
    return <VitalityLanding />;
  }
  return <KelaticLanding />;
}
