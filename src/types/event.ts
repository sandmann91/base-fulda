export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** ISO-Datum, z. B. "2026-08-16" */
  date: string;
  /** Beginn, z. B. "22:00" */
  startTime: string;
  /** Einlass, z. B. "21:00" — optional */
  doorsTime: string | null;
  /** z. B. "10€" oder "Eintritt frei" */
  price: string;
  imageFilename: string;
  createdAt: string;
  updatedAt: string;
}
