import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Leavers",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: March 6, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Information We Collect</h2>
        <p className="mb-2 text-gray-700">We collect the following information:</p>
        <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-700">
          <li>
            <strong>Account information:</strong> Email address and password
            when you create an account
          </li>
          <li>
            <strong>Search queries:</strong> The companies and roles you search
            for
          </li>
          <li>
            <strong>Usage data:</strong> How you interact with the service,
            including pages visited and features used
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">How We Use Your Data</h2>
        <p className="mb-2 text-gray-700">We use collected information to:</p>
        <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-700">
          <li>Provide career migration insights and search results</li>
          <li>Save searches for registered users</li>
          <li>Improve the quality and relevance of our service</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Data Sources</h2>
        <p className="mb-4 text-gray-700">
          We analyze publicly available professional data to generate aggregated
          career migration patterns. Our insights are derived from information
          that professionals have made publicly accessible.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Data Aggregation</h2>
        <p className="mb-4 text-gray-700">
          All results displayed on Leavers are aggregated and anonymized. No
          individual profiles are shown. Career migration patterns represent
          statistical trends across groups of professionals, not the movements
          of any specific person.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Cookies</h2>
        <p className="mb-4 text-gray-700">
          We use session cookies for authentication purposes. These cookies are
          essential for maintaining your logged-in state and do not track you
          across other websites.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Data Retention</h2>
        <ul className="mb-4 list-disc space-y-1 pl-6 text-gray-700">
          <li>
            <strong>Account data:</strong> Retained until you delete your
            account
          </li>
          <li>
            <strong>Search cache:</strong> Automatically expires after 30 days
          </li>
          <li>
            <strong>Usage data:</strong> Retained in anonymized form for
            service improvement
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Your Rights</h2>
        <p className="mb-4 text-gray-700">
          You have the right to delete your account and all associated data at
          any time. Upon account deletion, we will remove your personal
          information, saved searches, and search history from our systems.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Contact</h2>
        <p className="mb-4 text-gray-700">
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a
            href="mailto:privacy@leavers.app"
            className="text-blue-600 underline hover:text-blue-800"
          >
            privacy@leavers.app
          </a>
          .
        </p>
      </section>
    </div>
  );
}
