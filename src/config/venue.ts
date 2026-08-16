export const VENUE = {
  name: "BASE. Fulda",
  streetAddress: "Kreuzbergstraße 40",
  postalCode: "36037",
  addressLocality: "Fulda",
  addressCountry: "DE",
} as const;

export function venueJsonLd() {
  return {
    "@type": "Place",
    name: VENUE.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: VENUE.streetAddress,
      postalCode: VENUE.postalCode,
      addressLocality: VENUE.addressLocality,
      addressCountry: VENUE.addressCountry,
    },
  };
}
