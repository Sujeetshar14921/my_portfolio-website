import { Helmet } from 'react-helmet-async';

type SchemaObject = Record<string, unknown> | Record<string, unknown>[];

interface PageSeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  schema?: SchemaObject;
}

const SITE_URL = 'https://www.sujeetsharma.in';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

function normalizeCanonical(path?: string) {
  if (!path) return SITE_URL;
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function PageSeo({
  title,
  description,
  canonicalPath,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  schema,
}: PageSeoProps) {
  const canonical = normalizeCanonical(canonicalPath);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Sujeet Sharma" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:url" content={canonical} />

      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}