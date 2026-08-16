import { useEffect, useState } from "react";
import { Center, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { listEvents } from "@/api/events";
import type { EventRecord } from "@/types/event";
import { EventCard } from "./event-card";

export function EventList() {
  const [events, setEvents] = useState<EventRecord[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listEvents({ upcoming: true })
      .then((result) => setEvents(result.events))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <Text color="fg.muted">Events konnten nicht geladen werden.</Text>;
  }

  if (!events) {
    return (
      <Center py={12}>
        <Spinner color="brand.500" />
      </Center>
    );
  }

  if (events.length === 0) {
    return <Text color="fg.muted">Aktuell keine Events anstehend.</Text>;
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={6}>
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </SimpleGrid>
  );
}
