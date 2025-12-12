import { Helmet } from "react-helmet-async";
import { useBranding } from "../../contexts/BrandingContext";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export default function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
}: SEOHeadProps) {
  const { settings } = useBranding();

  // Default values from settings or hardcoded fallbacks
  const siteName = settings?.seo?.default_title || "NextMove Cargo";
  const template = settings?.seo?.meta_title_template || "%s | NextMove Cargo";
  const defaultDesc = settings?.seo?.default_description || "NextMove Cargo";
  const defaultKeywords = settings?.seo?.default_keywords || "";
  const defaultImage = settings?.seo?.og_image || settings?.logo_url || "";

  // Computed values
  const pageTitle = title ? template.replace("%s", title) : siteName;
  const metaDesc = description || defaultDesc;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image || defaultImage;
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />

      {/* Google / Search Engine Tags */}
      <meta itemProp="name" content={pageTitle} />
      <meta itemProp="description" content={metaDesc} />
      <meta itemProp="image" content={metaImage} />

      {/* Facebook Meta Tags */}
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />

      {/* PWA / Branding Icons */}
      {settings?.pwa?.icon_url && (
        <>
          <link rel="icon" type="image/png" href={settings.pwa.icon_url} />
        </>
      )}
    </Helmet>
  );
}
