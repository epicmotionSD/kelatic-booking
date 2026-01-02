'use client';

import GeneratorForm from '@/components/trinity/generator-form';
import Link from 'next/link';

export default function VideoScriptGenerator() {
  return (
    <div className="space-y-4">
      <Link
        href="/admin/trinity"
        className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
      >
        ← Back to AI Marketing
      </Link>

      <GeneratorForm
        type="video"
        title="Video Script Generator"
        description="Create scripts for TikTok, Instagram Reels, and YouTube"
        topicPlaceholder="e.g., Starter loc tips, Day in my life as a loctician, Loc retwist timelapse..."
        contextPlaceholder="Video length preference, format (tutorial, vlog, transformation), any trending audio to reference..."
        showTone={true}
        showAudience={true}
      />

      {/* Video Ideas */}
      <div className="bg-purple-50 rounded-xl p-6 mt-6">
        <h3 className="font-semibold text-purple-900 mb-3">Video Content Ideas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-800">TikTok/Reels (15-60s)</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Quick tips</li>
              <li>• Before/after reveals</li>
              <li>• GRWM (loc edition)</li>
              <li>• Trend participation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">YouTube Shorts</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Product reviews</li>
              <li>• Myth busting</li>
              <li>• Style tutorials</li>
              <li>• Client reactions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">Long-form YouTube</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Full tutorials</li>
              <li>• Loc journey updates</li>
              <li>• Q&A sessions</li>
              <li>• Behind the scenes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
