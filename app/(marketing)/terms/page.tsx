/**
 * Terms of Service Page
 *
 * Terms and conditions for using Mandarin SRS.
 * IMPORTANT: Review and customize this template with your legal team.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Mandarin SRS',
  description: 'Terms and conditions for using Mandarin SRS.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold">Terms of Service</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Mandarin SRS (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please
            do not use the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">2. Description of Service</h2>
          <p>
            Mandarin SRS is a spaced repetition learning platform designed to help users learn
            Mandarin Chinese through systematic review and practice. The Service includes:
          </p>
          <ul>
            <li>HSK vocabulary and character lessons</li>
            <li>Spaced repetition algorithm (SRS) for optimal learning</li>
            <li>Progress tracking and statistics</li>
            <li>Review sessions and quizzes</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">3. User Accounts</h2>

          <h3 className="mt-4 text-xl font-semibold">3.1 Registration</h3>
          <p>To use the Service, you must:</p>
          <ul>
            <li>Be at least 13 years old (or 16 in the EU)</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Verify your email address</li>
          </ul>

          <h3 className="mt-4 text-xl font-semibold">3.2 Account Responsibilities</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>All activities that occur under your account</li>
            <li>Maintaining the confidentiality of your password</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>

          <h3 className="mt-4 text-xl font-semibold">3.3 Account Termination</h3>
          <p>We reserve the right to suspend or terminate your account if:</p>
          <ul>
            <li>You violate these Terms</li>
            <li>You engage in fraudulent or illegal activity</li>
            <li>Your account has been inactive for over 2 years</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">4. Acceptable Use Policy</h2>

          <h3 className="mt-4 text-xl font-semibold">4.1 You May:</h3>
          <ul>
            <li>Use the Service for personal, non-commercial learning</li>
            <li>Create and save custom notes for your learning</li>
            <li>Share your progress with others (if we add this feature)</li>
          </ul>

          <h3 className="mt-4 text-xl font-semibold">4.2 You May Not:</h3>
          <ul>
            <li>Scrape, crawl, or download content from the Service without permission</li>
            <li>Reverse engineer, decompile, or attempt to extract the source code</li>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Interfere with or disrupt the Service or servers/networks connected to it</li>
            <li>Impersonate any person or entity or falsely state your affiliation</li>
            <li>Upload viruses, malware, or any code of a destructive nature</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Create multiple accounts to abuse the Service</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">5. Intellectual Property Rights</h2>

          <h3 className="mt-4 text-xl font-semibold">5.1 Our Content</h3>
          <p>
            All content on the Service (lessons, vocabulary, interface design, etc.) is owned by
            Mandarin SRS or licensed to us. This content is protected by copyright, trademark, and
            other intellectual property laws.
          </p>

          <h3 className="mt-4 text-xl font-semibold">5.2 Your Content</h3>
          <p>
            You retain ownership of any content you create (e.g., notes, custom cards). By using the
            Service, you grant us a license to store, display, and process your content solely to
            provide the Service.
          </p>

          <h3 className="mt-4 text-xl font-semibold">5.3 License to Use</h3>
          <p>
            We grant you a limited, non-exclusive, non-transferable license to access and use the
            Service for personal learning purposes only.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">6. Payment Terms (If Applicable)</h2>
          <p>
            <em>
              Note: Currently, Mandarin SRS is free. This section applies if we add paid features in
              the future.
            </em>
          </p>

          <h3 className="mt-4 text-xl font-semibold">6.1 Pricing</h3>
          <ul>
            <li>Subscription fees are billed in advance on a recurring basis</li>
            <li>Prices are subject to change with 30 days notice</li>
            <li>All fees are non-refundable unless required by law</li>
          </ul>

          <h3 className="mt-4 text-xl font-semibold">6.2 Cancellation</h3>
          <ul>
            <li>You may cancel your subscription at any time</li>
            <li>Cancellation takes effect at the end of the current billing period</li>
            <li>You will retain access until the end of your paid period</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">7. Disclaimers</h2>

          <h3 className="mt-4 text-xl font-semibold">7.1 &quot;As Is&quot; Service</h3>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied, including but not limited to:
          </p>
          <ul>
            <li>Accuracy, reliability, or completeness of content</li>
            <li>Uninterrupted or error-free operation</li>
            <li>Fitness for a particular purpose</li>
          </ul>

          <h3 className="mt-4 text-xl font-semibold">7.2 Educational Content</h3>
          <p>
            While we strive for accuracy, we do not guarantee that all learning content is
            error-free or complete. Learning outcomes depend on individual effort and circumstances.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Mandarin SRS shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, including:
          </p>
          <ul>
            <li>Loss of profits, data, or use</li>
            <li>Interruption of business</li>
            <li>Damage to devices</li>
          </ul>
          <p>
            Our total liability shall not exceed the amount you paid us in the past 12 months (or
            $100 if you have not paid us anything).
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Mandarin SRS from any claims, damages, or
            expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your use or misuse of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">10. Privacy</h2>
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>
            . Please review it to understand how we collect, use, and protect your data.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">11. Modifications to Service</h2>
          <p>We reserve the right to:</p>
          <ul>
            <li>Modify or discontinue the Service (or any part of it)</li>
            <li>Change these Terms at any time</li>
            <li>Add or remove features</li>
          </ul>
          <p>
            We will notify you of material changes via email or in-app notification. Your continued
            use of the Service after changes constitutes acceptance.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">12. Termination</h2>
          <p>Either party may terminate this agreement at any time. Upon termination:</p>
          <ul>
            <li>Your right to use the Service immediately ceases</li>
            <li>Your data may be deleted after 30 days (see Privacy Policy)</li>
            <li>
              Sections that by their nature should survive (e.g., limitations of liability) remain
              in effect
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Your
            Jurisdiction - e.g., &quot;the State of California, United States&quot;], without regard
            to conflict of law principles.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">14. Dispute Resolution</h2>
          <p>
            In the event of a dispute, you agree to first contact us at{' '}
            <a href="mailto:legal@yourdomain.com">legal@yourdomain.com</a> to attempt an informal
            resolution. If we cannot resolve the dispute within 30 days, either party may pursue
            formal legal action.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">15. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision
            shall be limited or eliminated to the minimum extent necessary, and the remaining
            provisions shall remain in full force and effect.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">16. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between
            you and Mandarin SRS regarding the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">17. Contact Information</h2>
          <p>If you have questions about these Terms, please contact us:</p>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:legal@yourdomain.com">legal@yourdomain.com</a>
            </li>
            <li>
              <strong>Address:</strong> [Your Business Address]
            </li>
          </ul>
        </section>

        <section className="mt-8 border-t pt-8">
          <p className="text-sm text-muted-foreground">
            <strong>Important Legal Notice:</strong> This is a template. Please have these Terms
            reviewed by a qualified attorney before using them in production. Legal requirements
            vary by jurisdiction and your specific use case.
          </p>
        </section>
      </div>
    </div>
  )
}
