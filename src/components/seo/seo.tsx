import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
  canonicalPath: string;
  /** Absolute URL des Vorschaubilds; Standard ist das allgemeine Social-Preview-Bild. */
  image?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "BASE. Fulda";
const SITE_ORIGIN = "https://base-fulda.de";

// Die gleichen Tags setzt public/event.php serverseitig für Event-Seiten — bei Änderungen dort mitziehen.
export function Seo({ title, description, canonicalPath, image, jsonLd }: SeoProps) {
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image ?? `${SITE_ORIGIN}/social-preview.jpg`} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
