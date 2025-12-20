'use client';

import GeneratorForm from '@/components/trinity/generator-form';
import Link from 'next/link';

export default function ClientEducationCreator() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to Trinity AI
      </Link>

      <GeneratorForm
        type="education"
        title="Client Education Creator"
        description="Create aftercare guides and educational materials for clients"
        topicPlaceholder="e.g., Starter loc aftercare, How to wrap locs at night, Swimming with locs..."
        contextPlaceholder="Specific service this relates to, any products you recommend, common questions from clients..."
        showTone={false}
        showAudience={false}
      />

      {/* Education Materials */}
      <div className="bg-purple-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-purple-900 mb-3">Educational Content Ideas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-800">Aftercare Guides</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Starter loc first 30 days</li>
              <li>• Post-retwist care</li>
              <li>• Color treatment aftercare</li>
              <li>• Style maintenance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">FAQ Sheets</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Loc journey timeline</li>
              <li>• Product recommendations</li>
              <li>• When to come back</li>
              <li>• Common concerns</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-purple-700">
          Tip: Print these as handouts or send as follow-up emails after appointments!
        </p>
      </div>
    </div>
  );
}
