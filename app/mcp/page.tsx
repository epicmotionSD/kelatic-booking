import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'x3o Intelligence MCP Plugin',
  description:
    'Install x3o Intelligence for Claude and use 15 tools to generate live, data-informed growth strategy for service businesses.',
};

export default function MCPPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-emerald-400 text-sm font-semibold tracking-wide uppercase">x3o Intelligence</p>
          <h1 className="text-4xl font-bold mt-2">MCP Plugin</h1>
          <p className="text-zinc-300 mt-4 leading-relaxed">
            x3o Intelligence gives Claude 15 tools to act as a live AI business analyst for small service businesses,
            starting with beauty salons and loc specialists.
          </p>
          <p className="text-zinc-400 mt-3 leading-relaxed">
            First customer: KeLatic Hair Lounge (Houston, TX), with a documented 18.5× ROI on the $297/mo subscription.
          </p>
        </div>

        <section className="mb-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Plugin Links</h2>
          <ul className="space-y-3 text-zinc-200">
            <li>
              <span className="text-zinc-400">Plugin homepage:</span>{' '}
              <a className="text-emerald-400 hover:text-emerald-300" href="https://x3o.ai/mcp">
                https://x3o.ai/mcp
              </a>
            </li>
            <li>
              <span className="text-zinc-400">Privacy policy:</span>{' '}
              <a className="text-emerald-400 hover:text-emerald-300" href="https://x3o.ai/privacy">
                https://x3o.ai/privacy
              </a>
            </li>
            <li>
              <span className="text-zinc-400">Plugin repository:</span>{' '}
              <a
                className="text-emerald-400 hover:text-emerald-300"
                href="https://github.com/sonnierventures/x3o-intelligence-mcp-server"
              >
                https://github.com/sonnierventures/x3o-intelligence-mcp-server
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Plugin Description</h2>
          <p className="text-zinc-300 leading-relaxed">
            x3o Intelligence gives Claude 15 tools to act as a live AI business analyst for small service businesses —
            starting with beauty salons and loc specialists. Pull real social metrics, competitor intelligence, campaign
            performance, booking funnel analysis, hashtag radar, influencer matching, and Google Ads migration tracking.
            Then ask Claude any business question and get a structured strategy with tactics, KPIs, timeline, and risks —
            all with your actual business data injected automatically.
          </p>
          <p className="text-zinc-300 leading-relaxed mt-4">
            Built for the 28M US small businesses that cannot afford a $10K/mo enterprise BI stack. First customer:
            KeLatic Hair Lounge (Houston, TX) — documented 18.5× ROI on the $297/mo subscription.
          </p>
          <p className="text-zinc-300 leading-relaxed mt-4">
            Requires ANTHROPIC_API_KEY for AI strategy tools. Data tools run without additional API calls.
          </p>
        </section>

        <section className="mb-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Tool Domains (15 Tools)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 p-4">
              <h3 className="font-semibold text-emerald-400 mb-2">Strategy</h3>
              <ul className="text-zinc-300 space-y-1 text-sm">
                <li>x3o_get_business_overview</li>
                <li>x3o_generate_ai_strategy</li>
                <li>x3o_generate_content_calendar</li>
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-800 p-4">
              <h3 className="font-semibold text-emerald-400 mb-2">Social</h3>
              <ul className="text-zinc-300 space-y-1 text-sm">
                <li>x3o_get_social_metrics</li>
                <li>x3o_get_hashtag_radar</li>
                <li>x3o_get_influencer_radar</li>
                <li>x3o_get_booking_funnel</li>
                <li>x3o_get_revenue_attribution</li>
                <li>x3o_get_google_ads_migration_status</li>
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-800 p-4">
              <h3 className="font-semibold text-emerald-400 mb-2">Competitors</h3>
              <ul className="text-zinc-300 space-y-1 text-sm">
                <li>x3o_get_competitor_intel</li>
                <li>x3o_generate_swot_analysis</li>
                <li>x3o_generate_counter_strategy</li>
              </ul>
            </div>
            <div className="rounded-lg border border-zinc-800 p-4">
              <h3 className="font-semibold text-emerald-400 mb-2">Campaigns</h3>
              <ul className="text-zinc-300 space-y-1 text-sm">
                <li>x3o_get_ghost_revival_status</li>
                <li>x3o_generate_campaign_copy</li>
                <li>x3o_calculate_campaign_roi</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Install Instructions</h2>
          <div className="space-y-4 text-zinc-300">
            <p>
              Recommended distribution for Claude plugin submission: publish to npm as
              {' '}
              <span className="text-emerald-400">@sonnierventures/x3o-intelligence-mcp</span>.
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Publish package and verify package visibility is public.</li>
              <li>Set ANTHROPIC_API_KEY in your runtime environment.</li>
              <li>Install from npm in Claude Code using your MCP install flow.</li>
              <li>Alternatively, install directly from the public GitHub repository link.</li>
            </ol>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Example Use Cases</h2>
          <ol className="list-decimal pl-6 space-y-3 text-zinc-300 leading-relaxed">
            <li>
              What should KeLatic Hair Lounge focus on this month? Calls x3o_get_business_overview and returns social
              summary, active campaigns, top actions, and Google Ads migration status.
            </li>
            <li>
              How do we beat Houston Loc Fairy on Yelp? Calls x3o_get_competitor_intel and x3o_generate_counter_strategy
              for a 90-day playbook with tactics, KPIs, and risks.
            </li>
            <li>
              Write ghost revival SMS for my 90-day inactive loc clients. Calls x3o_generate_campaign_copy for a
              4-message Hummingbird cadence with TCPA opt-out in Day 1.
            </li>
            <li>
              What is my booking funnel drop-off? Calls x3o_get_booking_funnel and flags the lowest-converting stage.
            </li>
            <li>
              Is a 200-client reactivation campaign worth it at a $160 average ticket? Calls x3o_calculate_campaign_roi
              and returns projected revenue, net gain, ROI multiplier, and payback days.
            </li>
            <li>
              Build a 2-week Instagram and TikTok content calendar focused on loc education. Calls
              x3o_generate_content_calendar with hooks, CTA, estimated reach, and timing.
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}