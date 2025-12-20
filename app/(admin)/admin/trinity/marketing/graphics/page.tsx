'use client';

import GeneratorForm from '@/components/trinity/generator-form';
import Link from 'next/link';

export default function PromoGraphicsGenerator() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to Trinity AI
      </Link>

      <GeneratorForm
        type="graphics"
        title="Promo Graphics Copy"
        description="Generate copy for flyers, stories, and promotional graphics"
        topicPlaceholder="e.g., December booking special, New Year discount, Service highlight..."
        contextPlaceholder="Details about the promotion: prices, dates, any specific terms..."
        showTone={true}
        showAudience={false}
      />

      {/* Copy Format */}
      <div className="bg-purple-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-purple-900 mb-3">What You'll Get</h3>
        <div className="text-sm text-purple-800 space-y-3">
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium">Headline</p>
            <p className="text-gray-600">Bold, attention-grabbing (3-7 words)</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium">Subheadline</p>
            <p className="text-gray-600">Supporting message (1 line)</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium">Bullet Points</p>
            <p className="text-gray-600">2-3 key benefits or details</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="font-medium">CTA Text</p>
            <p className="text-gray-600">Button or action text</p>
          </div>
        </div>
      </div>
    </div>
  );
}
