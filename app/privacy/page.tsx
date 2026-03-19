import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'x3o.ai Privacy Policy',
  description: 'Privacy policy for x3o.ai and x3o Intelligence MCP tools.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-zinc-400 mb-8">Effective date: March 19, 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-2">Who we are</h2>
            <p>
              x3o.ai (Sonnier Ventures) provides AI analytics and revenue recovery software, including x3o Intelligence
              MCP tools used with Claude.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Data we process</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Business profile data needed to configure your workspace</li>
              <li>Performance data from connected systems (social, campaign, and funnel metrics)</li>
              <li>Prompt and output data used to generate strategy responses</li>
              <li>Operational logs required for security, debugging, and abuse prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">How we use data</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Deliver analytics, strategy generation, and campaign recommendations</li>
              <li>Operate and improve product reliability and performance</li>
              <li>Protect service integrity and investigate misuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Third-party services</h2>
            <p>
              Depending on your configuration, x3o.ai may process data through providers such as Anthropic, hosting,
              database, and messaging vendors. We only use providers required to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Data sharing and sale</h2>
            <p>
              We do not sell personal data. We share data only with subprocessors needed to run the platform or where
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Security and retention</h2>
            <p>
              We use reasonable technical and organizational safeguards. Data is retained only as long as required for
              service delivery, legal obligations, or legitimate operational needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Your rights</h2>
            <p>
              You can request access, correction, or deletion of your data, subject to legal and operational constraints.
              To submit a request, contact us using the email below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">Contact</h2>
            <p>
              Privacy requests: <a className="text-emerald-400 hover:text-emerald-300" href="mailto:hey@x3o.ai">hey@x3o.ai</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}