import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — AM or PM?',
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mb-8">Last updated: March 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">1. Information We Collect</h2>
              <p>When you use AM or PM?, we may collect the following information:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Name and contact details (email address, phone number)</li>
                <li>Your custom handle / page URL</li>
                <li>Availability schedule and timezone preferences</li>
                <li>Booking requests submitted by your customers</li>
                <li>Usage data and log information (e.g., IP address, browser type)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create and manage your availability page</li>
                <li>Send you booking notifications via text message and email</li>
                <li>Communicate with you about your account and the Service</li>
                <li>Improve and develop the Service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">3. Text Message Communications</h2>
              <p>
                We use your phone number to send booking notifications and account-related alerts. By providing
                your phone number, you consent to receive these messages. Standard message and data rates may
                apply. You may opt out at any time by replying STOP to any message or by contacting us directly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">4. Sharing of Information</h2>
              <p>
                We do not sell your personal information. We may share it with trusted third-party service
                providers who assist in operating the Service (such as cloud hosting and SMS providers), under
                strict confidentiality agreements. We may also disclose information when required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">5. Public Availability Pages</h2>
              <p>
                Your availability page (accessible via your custom link) is public by design. This means anyone
                with your link can view your availability and submit a booking request. Please only include
                information you are comfortable sharing publicly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to
                provide the Service. You may request deletion of your account and associated data at any time
                by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">7. Security</h2>
              <p>
                We take reasonable technical and organizational measures to protect your personal information.
                However, no method of transmission over the internet or electronic storage is 100% secure. We
                cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">8. Your Rights</h2>
              <p>
                Depending on your location, you may have rights regarding your personal data, including the
                right to access, correct, or delete your information. To exercise these rights, please contact
                us at the address below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">9. Cookies</h2>
              <p>
                We may use cookies and similar technologies to improve your experience on the Service. You can
                control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes
                by posting a notice on the Service. Continued use of the Service after changes constitutes
                your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">11. Contact</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy, please contact us at{' '}
                <a href="mailto:hello@amorpm.com" className="text-indigo-600 hover:underline">
                  hello@amorpm.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex gap-4 text-sm">
            <Link href="/terms" className="text-indigo-600 hover:underline">
              Terms and Conditions
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
