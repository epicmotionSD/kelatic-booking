'use client';

import GeneratorForm from '@/components/trinity/generator-form';
import Link from 'next/link';

export default function EmailCampaignCreator() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to Trinity AI
      </Link>

      <GeneratorForm
        type="email"
        title="Email Campaign Creator"
        description="Create promotional emails and newsletters for your clients"
        topicPlaceholder="e.g., Holiday booking special, New service announcement, Re-engagement campaign..."
        contextPlaceholder="What's the promotion? Any discounts, deadlines, or special offers to include..."
        showTone={true}
        showAudience={true}
      />

      {/* Email Types */}
      <div className="bg-purple-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-purple-900 mb-3">Email Campaign Ideas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-800">Promotional</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• New service launch</li>
              <li>• Holiday specials</li>
              <li>• Flash sales</li>
              <li>• Bundle deals</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">Engagement</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• "We miss you!" (inactive clients)</li>
              <li>• Birthday emails</li>
              <li>• Loc anniversary</li>
              <li>• Referral requests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
