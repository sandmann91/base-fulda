import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Center, Container, Image, Spinner, Stack, Text } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { NeonHeading } from "@/components/ui/neon-heading";
import { getEvent } from "@/api/events";
import type { EventRecord } from "@/types/event";
import { Seo } from "@/components/seo/seo";
import { venueJsonLd } from "@/config/venue";
import { formatEventDate } from "@/utils/format-date";
import { NotFoundPage } from "./not-found-page";

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Kam man innerhalb der Seite hierher, zurück in der History (inkl. Scroll-Position).
  // Bei Direktaufruf (z.B. geteilter Link) gibt es kein "vorher" -> zur Startseite.
  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/"));

  useEffect(() => {
    if (!slug) return;
    setEvent(null);
    setNotFound(false);
    getEvent(slug)
      .then((result) => setEvent(result.event))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return <NotFoundPage />;
  }

  if (!event) {
    return (
      <Center py={24}>
        <Spinner color="brand.500" />
      </Center>
    );
  }

  const imageUrl = `${window.location.origin}/api/uploads/${event.imageFilename}`;
  const isFree = /frei|free|kostenlos/i.test(event.price);
  const offerPrice = isFree ? "0" : event.price.replace(/[^0-9,.]/g, "").replace(",", ".");
  // Fallback für Meta-Description/Social-Preview, wenn keine Beschreibung gepflegt ist.
  const seoDescription =
    event.description ||
    `${event.title} am ${formatEventDate(event.date)}, Beginn ${event.startTime} Uhr – BASE. Fulda`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: `${event.date}T${event.startTime}:00+02:00`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: venueJsonLd(),
    image: [imageUrl],
    description: seoDescription,
    // Ohne auswertbaren Preis kein Offer — ein leeres price wäre für Google ungültig.
    ...(offerPrice && {
      offers: {
        "@type": "Offer",
        price: offerPrice,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: window.location.href,
      },
    }),
  };

  return (
    <>
      <Seo
        title={event.title}
        description={seoDescription}
        canonicalPath={`/events/${event.slug}`}
        jsonLd={jsonLd}
      />
      <Container maxW="3xl" pt={24} pb={16}>
        <Button variant="ghost" onClick={goBack} mb={6} ml={-4}>
          <ArrowLeft /> Zurück
        </Button>
        {/* Flyer vollständig zeigen: volle Breite, Höhe ergibt sich aus dem Seitenverhältnis, nichts beschnitten */}
        <Image src={imageUrl} alt={event.title} borderRadius="md" mb={8} w="full" h="auto" />
        {/* Etwas kleiner als die Section-Überschriften, da Event-Titel oft länger sind */}
        <NeonHeading as="h1" fontSize={{ base: "3xl", md: "5xl" }} mb={4}>
          {event.title}
        </NeonHeading>
        <Stack gap={2} mb={8} color="white" fontWeight="medium">
          <Text>{formatEventDate(event.date)}</Text>
          <Text>
            Beginn: {event.startTime} Uhr{event.doorsTime ? ` · Einlass: ${event.doorsTime} Uhr` : ""}
          </Text>
          {event.price && <Text>{event.price}</Text>}
        </Stack>
        {event.description && <Text whiteSpace="pre-line">{event.description}</Text>}
      </Container>
    </>
  );
}
