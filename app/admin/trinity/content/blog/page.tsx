'use client';

import GeneratorForm from '@/components/trinity/generator-form';
import Link from 'next/link';

export default function BlogArticleWriter() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to Trinity AI
      </Link>

      <GeneratorForm
        type="blog"
        title="Blog Article Writer"
        description="Write SEO-optimized blog posts about loc care and styling"
        topicPlaceholder="e.g., How to care for starter locs, 10 loc styles for summer, Washing locs guide..."
        contextPlaceholder="Key points to cover, target keywords, specific information to include..."
        showTone={true}
        showAudience={true}
      />

      {/* SEO Tips */}
      <div className="bg-purple-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-purple-900 mb-3">Blog Article Ideas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-800">Educational</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Loc stages explained</li>
              <li>• Best products for locs</li>
              <li>• Common loc mistakes</li>
              <li>• How often to retwist</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">Lifestyle</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Loc styles for [occasion]</li>
              <li>• Seasonal loc care</li>
              <li>• Loc journey stories</li>
              <li>• Locs in the workplace</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
