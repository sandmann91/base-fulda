import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Center, Container, Heading, Image, Spinner, Stack, Text } from "@chakra-ui/react";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: `${event.date}T${event.startTime}:00+02:00`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: venueJsonLd(),
    image: [imageUrl],
    description: event.description,
    offers: {
      "@type": "Offer",
      price: isFree ? "0" : event.price.replace(/[^0-9,.]/g, "").replace(",", "."),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: window.location.href,
    },
  };

  return (
    <>
      <Seo
        title={event.title}
        description={event.description}
        canonicalPath={`/events/${event.slug}`}
        jsonLd={jsonLd}
      />
      <Container maxW="3xl" py={16}>
        <Image
          src={imageUrl}
          alt={event.title}
          borderRadius="md"
          mb={8}
          w="full"
          maxH="480px"
          style={{ objectFit: "cover" }}
        />
        <Heading as="h1" size="2xl" mb={4}>
          {event.title}
        </Heading>
        <Stack gap={2} mb={8} color="brand.500" fontWeight="medium">
          <Text>{formatEventDate(event.date)}</Text>
          <Text>
            Beginn: {event.startTime} Uhr{event.doorsTime ? ` · Einlass: ${event.doorsTime} Uhr` : ""}
          </Text>
          <Text>{event.price}</Text>
        </Stack>
        <Text whiteSpace="pre-line">{event.description}</Text>
      </Container>
    </>
  );
}
