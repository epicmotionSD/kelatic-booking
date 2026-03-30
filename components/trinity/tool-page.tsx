'use client';

import Link from 'next/link';
import GeneratorForm from '@/components/trinity/generator-form';

interface TrinityToolPageProps {
  type: 'social' | 'email' | 'blog' | 'video' | 'education' | 'graphics';
  title: string;
  description: string;
  topicPlaceholder: string;
  contextPlaceholder?: string;
  showTone?: boolean;
  showAudience?: boolean;
  brand?: string;
  children?: React.ReactNode;
}

export default function TrinityToolPage({
  type,
  title,
  description,
  topicPlaceholder,
  contextPlaceholder,
  showTone = true,
  showAudience = true,
  brand,
  children,
}: TrinityToolPageProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to AI Marketing
      </Link>

      <GeneratorForm
        type={type}
        title={title}
        description={description}
        topicPlaceholder={topicPlaceholder}
        contextPlaceholder={contextPlaceholder}
        showTone={showTone}
        showAudience={showAudience}
        brand={brand}
      />

      {children}
    </div>
  );
}