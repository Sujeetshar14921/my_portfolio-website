import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSeo from '@/components/seo/PageSeo';

export default function PrivacyPage() {
  return (
    <>
      <PageSeo
        title="Privacy Policy | Sujeet Sharma"
        description="Privacy policy for sujeetsharma.in including data collection, use, and contact details."
        canonicalPath="/privacy"
      />

      <section className="min-h-screen bg-surface-50 dark:bg-surface-950 px-6 py-24 sm:px-8 lg:px-12">
        <div className="w-full px-6 md:px-12 lg:px-32">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-500"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="rounded-3xl border border-surface-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-surface-900/70 sm:p-10 lg:p-12">
            <p className="mb-4 text-sm font-mono uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
              Privacy Policy
            </p>
            <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-surface-600 dark:text-surface-400">
              This privacy policy explains how Sujeet Sharma collects, uses, and protects your information when you visit this website.
            </p>

            <div className="mt-10 space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Information we collect</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  We may collect basic information such as your name, email address, and any message you send through the contact form. We also collect anonymous usage data to understand site performance and improve the experience.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">How we use your information</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  Your information is used to respond to your inquiries, improve the website, and send occasional updates when you explicitly opt in.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Cookies and analytics</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  We may use cookies and analytics tools to measure traffic and improve site functionality. You can disable cookies in your browser settings if you prefer.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Data protection</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  We take reasonable measures to protect your information, but no online service can guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Contact</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  If you have any questions about this policy, please contact us at sujeetsharmadc56@gmail.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
