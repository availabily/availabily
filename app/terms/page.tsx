import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions — AM or PM?',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      <nav className="px-6 py-5 max-w-3xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-indigo-600">AM</span>
          <span className="text-slate-900"> or </span>
          <span className="text-indigo-600">PM?</span>
        </Link>
      </nav>

      <div className="px-6 py-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using AM or PM? (&quot;the Service&quot;), you agree to be bound by these Terms and
                Conditions. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">2. Description of Service</h2>
              <p>
                AM or PM? provides a scheduling tool that allows users to create an availability page, share
                it with their customers, and receive booking notifications via text message. The Service is
                provided &quot;as is&quot; and we reserve the right to modify or discontinue it at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for
                all activity that occurs under your account. You agree to provide accurate and complete
                information when creating your page and to keep it up to date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">4. Acceptable Use</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Transmit spam, unsolicited messages, or harassing communications</li>
                <li>Infringe upon the intellectual property rights of others</li>
                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                <li>Engage in any activity that disrupts or interferes with the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">5. Text Message Communications</h2>
              <p>
                By using the Service, you consent to receive text messages related to your bookings and
                account activity. Standard message and data rates may apply. You may opt out at any time by
                contacting us or following the opt-out instructions in any message you receive.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">6. Intellectual Property</h2>
              <p>
                All content, features, and functionality of the Service — including but not limited to text,
                graphics, logos, and software — are the exclusive property of AM or PM? and are protected by
                applicable intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">7. Disclaimer of Warranties</h2>
              <p>
                The Service is provided without warranties of any kind, either express or implied, including
                but not limited to implied warranties of merchantability, fitness for a particular purpose,
                or non-infringement. We do not guarantee that the Service will be error-free or uninterrupted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">8. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, AM or PM? shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising out of or related to your use
                of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">9. Changes to Terms</h2>
              <p>
                We may update these Terms and Conditions from time to time. Continued use of the Service after
                any changes constitutes your acceptance of the new terms. We encourage you to review this page
                periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">10. Contact</h2>
              <p>
                If you have any questions about these Terms and Conditions, please contact us at{' '}
                <a href="mailto:hello@amorpm.com" className="text-indigo-600 hover:underline">
                  hello@amorpm.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex gap-4 text-sm">
            <Link href="/privacy" className="text-indigo-600 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/signup" className="text-indigo-600 hover:underline">
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
