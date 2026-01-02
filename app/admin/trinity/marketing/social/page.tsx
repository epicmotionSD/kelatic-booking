'use client';

import GeneratorForm from '@/components/trinity/generator-form';
import Link from 'next/link';

export default function SocialPostGenerator() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to AI Marketing
      </Link>

      <GeneratorForm
        type="social"
        title="Social Post Generator"
        description="Create engaging Instagram and Facebook posts with hashtags"
        topicPlaceholder="e.g., New starter locs transformation, Summer loc care tips, Holiday booking special..."
        contextPlaceholder="Describe the post: client story, promotion details, specific service to highlight..."
        showTone={true}
        showAudience={true}
      />

      {/* Tips */}
      <div className="bg-purple-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-purple-900 mb-3">Tips for Great Social Posts</h3>
        <ul className="text-purple-800 text-sm space-y-2">
          <li>• Share client transformations (with permission) - they perform best!</li>
          <li>• Use location hashtags for Houston visibility</li>
          <li>• Post styling tips on Tuesdays and Thursdays for highest engagement</li>
          <li>• Include a call-to-action: "Book now", "Link in bio", "DM for availability"</li>
        </ul>
      </div>
    </div>
  );
}
