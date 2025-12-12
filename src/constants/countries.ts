export interface CountryMapping {
  code: string;
  names: {
    en: string;
    fr: string;
    ar?: string;
    [key: string]: string | undefined;
  };
}

export const COUNTRY_MAPPINGS: Record<string, CountryMapping> = {
  CN: {
    code: "CN",
    names: {
      en: "China",
      fr: "Chine",
      ar: "الصين",
    },
  },
  SN: {
    code: "SN",
    names: {
      en: "Senegal",
      fr: "Sénégal",
      ar: "السنغال",
    },
  },
  TR: {
    code: "TR",
    names: {
      en: "Turkey",
      fr: "Turquie",
      ar: "تركيا",
    },
  },
  FR: {
    code: "FR",
    names: {
      en: "France",
      fr: "France",
    },
  },
  AE: {
    code: "AE",
    names: {
      en: "Dubai",
      fr: "Dubaï",
    },
  },
  US: {
    code: "US",
    names: {
      en: "United States",
      fr: "États-Unis",
    },
  },
};

/**
 * Normalizes a country name input (FR, AR, etc.) to its English reference name (Database standard)
 */
export const normalizeCountryName = (displayName: string): string => {
  if (!displayName) return "";

  // Search through all mappings
  const entry = Object.values(COUNTRY_MAPPINGS).find((country) =>
    Object.values(country.names).some(
      (name) => name?.toLowerCase() === displayName.toLowerCase(),
    ),
  );

  // Return English name if found, otherwise return original (fallback)
  return entry ? entry.names.en : displayName;
};

/**
 * Gets the ISO code for a given country name
 */
export const getCountryCode = (displayName: string): string | null => {
  if (!displayName) return null;

  const entry = Object.values(COUNTRY_MAPPINGS).find((country) =>
    Object.values(country.names).some(
      (name) => name?.toLowerCase() === displayName.toLowerCase(),
    ),
  );

  return entry ? entry.code : null;
};
