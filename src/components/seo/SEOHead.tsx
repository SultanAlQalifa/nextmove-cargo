import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const { settings } = useBranding();

  // 1. Branding Settings (Admin overrides)
  // These take precedence if configured, otherwise we fall back to translation files
  // Note: We only fallback to translation file if Branding doesn't cover it.

  // Site Name
  const siteName = settings?.seo?.default_title || t("seo.defaultTitle");

  // Title Template
  const template = settings?.seo?.meta_title_template || "%s | NextMove Cargo";

  // Description
  // If no detailed description is passed, use Branding Default, else Translation Default
  const defaultDesc = settings?.seo?.default_description || t("seo.defaultDescription");

  // Keywords
  const defaultKeywords = settings?.seo?.default_keywords || t("seo.keywords");

  // Image
  const defaultImage = settings?.seo?.og_image || settings?.logo_url || "";

  // 2. Computed values
  // Formatting the title: If a specific page title is provided, use it with template.
  // Otherwise, strictly use the siteName (which is now key-based).
  const pageTitle = title ? template.replace("%s", title) : siteName;
  const metaDesc = description || defaultDesc;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image || defaultImage;
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* HTML Attributes for Language & Direction */}
      <html lang={i18n.language} dir={i18n.dir()} />

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
