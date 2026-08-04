import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSeo from '@/components/seo/PageSeo';

export default function TermsPage() {
  return (
    <>
      <PageSeo
        title="Terms of Service | Sujeet Sharma"
        description="Terms of service for sujeetsharma.in covering website use and responsibilities."
        canonicalPath="/terms"
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
              Terms of Service
            </p>
            <h1 className="text-3xl font-black tracking-tight text-surface-900 dark:text-white sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-surface-600 dark:text-surface-400">
              By using this website, you agree to the terms below. These terms may be updated from time to time.
            </p>

            <div className="mt-10 space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Use of the website</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  You may use this website for informational and personal purposes. Any misuse, abusive behavior, or unauthorized access is not permitted.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Intellectual property</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  All content, design, and branding on this website belong to Sujeet Sharma unless otherwise stated.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Limitation of liability</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  This site is provided “as is” and we do not guarantee uninterrupted access or error-free performance.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Contact</h2>
                <p className="mt-3 text-base leading-8 text-surface-600 dark:text-surface-400">
                  For questions about these terms, contact sujeetsharmadc56@gmail.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
