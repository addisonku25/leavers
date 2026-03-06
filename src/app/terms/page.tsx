import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Leavers",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: March 6, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Acceptance of Terms</h2>
        <p className="mb-4 text-gray-700">
          By accessing or using Leavers, you agree to be bound by these Terms of
          Service. If you do not agree to these terms, please do not use the
          service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Description of Service</h2>
        <p className="mb-4 text-gray-700">
          Leavers provides career migration intelligence by analyzing publicly
          available professional data. The service generates aggregated patterns
          showing where professionals go after leaving companies and roles,
          helping users make informed career decisions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">User Accounts</h2>
        <p className="mb-4 text-gray-700">
          You may create an account to access additional features such as saved
          searches. You are responsible for maintaining the confidentiality of
          your login credentials and for all activities that occur under your
          account. We reserve the right to terminate accounts that violate these
          terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Acceptable Use</h2>
        <p className="mb-2 text-gray-700">You agree not to:</p>
        <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-700">
          <li>Scrape, crawl, or otherwise extract data from the service programmatically</li>
          <li>Use automated tools or bots to access the service</li>
          <li>Redistribute, resell, or republish data obtained from the service</li>
          <li>Attempt to reverse-engineer or interfere with the service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Data Accuracy</h2>
        <p className="mb-4 text-gray-700">
          Information displayed on Leavers is aggregated from publicly available
          sources and is approximate in nature. We do not guarantee the accuracy,
          completeness, or timeliness of any information. Career migration
          patterns are statistical summaries and should not be treated as
          definitive career advice.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Limitation of Liability</h2>
        <p className="mb-4 text-gray-700">
          Leavers is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind, either express or
          implied. To the fullest extent permitted by law, we disclaim all
          warranties, including implied warranties of merchantability, fitness
          for a particular purpose, and non-infringement. We shall not be liable
          for any indirect, incidental, special, or consequential damages
          arising from your use of the service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Changes to Terms</h2>
        <p className="mb-4 text-gray-700">
          We may update these Terms of Service from time to time. We will notify
          users of material changes by updating the &ldquo;Last updated&rdquo;
          date at the top of this page. Your continued use of the service after
          changes are posted constitutes your acceptance of the revised terms.
        </p>
      </section>
    </div>
  );
}
