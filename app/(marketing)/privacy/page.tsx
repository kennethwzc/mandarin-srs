/**
 * Privacy Policy Page
 *
 * GDPR-compliant privacy policy template.
 * IMPORTANT: Review and customize this template with your legal team.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Mandarin SRS',
  description: 'Learn how we collect, use, and protect your data when you use Mandarin SRS.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to Mandarin SRS. We respect your privacy and are committed to protecting your
            personal data. This privacy policy explains how we collect, use, and safeguard your
            information when you use our spaced repetition learning platform.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">2. Information We Collect</h2>

          <h3 className="mt-4 text-xl font-semibold">2.1 Information You Provide</h3>
          <ul>
            <li>
              <strong>Account Information:</strong> Email address, password (encrypted), and
              username
            </li>
            <li>
              <strong>Learning Data:</strong> Your progress, review history, lesson completions, and
              study statistics
            </li>
            <li>
              <strong>User Content:</strong> Any notes or custom content you create
            </li>
          </ul>

          <h3 className="mt-4 text-xl font-semibold">2.2 Automatically Collected Information</h3>
          <ul>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, time spent (only if you
              consent to analytics)
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating system, screen resolution
            </li>
            <li>
              <strong>Log Data:</strong> IP address, access times, error logs
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
          <p>We use your data to:</p>
          <ul>
            <li>Provide and maintain our learning platform</li>
            <li>Personalize your learning experience with the SRS algorithm</li>
            <li>Send you important service updates and notifications</li>
            <li>Improve our platform through analytics (only with your consent)</li>
            <li>Detect and prevent abuse or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">4. Data Storage</h2>
          <p>Your data is stored securely using industry-standard encryption:</p>
          <ul>
            <li>
              <strong>Database:</strong> Hosted on Supabase (AWS) with encryption at rest and in
              transit
            </li>
            <li>
              <strong>Authentication:</strong> Passwords are hashed and never stored in plain text
            </li>
            <li>
              <strong>Location:</strong> Data centers in [Your Region - e.g., US East Coast]
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">5. Data Sharing</h2>
          <p>
            <strong>We do not sell your personal data.</strong> We only share data in these limited
            circumstances:
          </p>
          <ul>
            <li>
              <strong>Service Providers:</strong> Supabase (database), Vercel (hosting), PostHog
              (analytics - if consented)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to protect our rights
            </li>
            <li>
              <strong>Business Transfers:</strong> In case of merger or acquisition (you would be
              notified)
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">6. Cookies & Tracking</h2>
          <p>We use cookies for:</p>
          <ul>
            <li>
              <strong>Essential Cookies:</strong> Authentication and session management (required)
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Understanding how you use our platform (optional -
              requires consent)
            </li>
          </ul>
          <p>
            You can manage your cookie preferences through the cookie banner or in your browser
            settings.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">7. Your Rights (GDPR)</h2>
          <p>If you are in the EU/EEA, you have the right to:</p>
          <ul>
            <li>
              <strong>Access:</strong> Request a copy of your personal data
            </li>
            <li>
              <strong>Rectification:</strong> Correct inaccurate data
            </li>
            <li>
              <strong>Erasure:</strong> Request deletion of your data (&quot;right to be
              forgotten&quot;)
            </li>
            <li>
              <strong>Portability:</strong> Export your data in a machine-readable format
            </li>
            <li>
              <strong>Restriction:</strong> Limit how we process your data
            </li>
            <li>
              <strong>Objection:</strong> Object to certain data processing
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Opt out of analytics at any time
            </li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">8. Data Retention</h2>
          <ul>
            <li>
              <strong>Active Accounts:</strong> We retain your data as long as your account is
              active
            </li>
            <li>
              <strong>Deleted Accounts:</strong> Data is deleted within 30 days of account deletion
            </li>
            <li>
              <strong>Backups:</strong> Backup copies are retained for 90 days for disaster recovery
            </li>
            <li>
              <strong>Legal Hold:</strong> Some data may be retained longer if required by law
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">9. Children&apos;s Privacy</h2>
          <p>
            Our service is not intended for children under 13 (or 16 in the EU). We do not knowingly
            collect data from children. If you believe a child has provided us with personal data,
            please contact us immediately.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">10. International Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside your country of
            residence. We ensure appropriate safeguards are in place (e.g., Standard Contractual
            Clauses for EU data).
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">11. Security</h2>
          <p>We protect your data using:</p>
          <ul>
            <li>HTTPS encryption for all data in transit</li>
            <li>Database encryption at rest</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication</li>
            <li>Secure password hashing (bcrypt)</li>
          </ul>
          <p>
            However, no method is 100% secure. If you discover a security vulnerability, please
            report it to <a href="mailto:security@yourdomain.com">security@yourdomain.com</a>
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">12. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant
            changes by:
          </p>
          <ul>
            <li>Posting the new policy on this page</li>
            <li>Updating the &quot;Last updated&quot; date</li>
            <li>Sending you an email notification (for material changes)</li>
          </ul>
          <p>
            Your continued use of our service after changes constitutes acceptance of the updated
            policy.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">13. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or how we handle your data, please
            contact us:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>
            </li>
            <li>
              <strong>Address:</strong> [Your Business Address]
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">14. Supervisory Authority (EU/EEA)</h2>
          <p>
            If you are in the EU/EEA and believe we have violated your privacy rights, you have the
            right to lodge a complaint with your local data protection authority.
          </p>
        </section>
      </div>
    </div>
  )
}
