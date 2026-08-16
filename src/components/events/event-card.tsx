import { Box, Heading, Image, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { EventRecord } from "@/types/event";
import { formatEventDate } from "@/utils/format-date";

export function EventCard({ event }: { event: EventRecord }) {
  return (
    <Box
      asChild
      display="block"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="md"
      overflow="hidden"
      bg="blackAlpha.400"
      transition="transform 0.2s, border-color 0.2s"
      _hover={{ transform: "translateY(-4px)", borderColor: "brand.500" }}
    >
      <RouterLink to={`/events/${event.slug}`}>
        <Image
          src={`/api/uploads/${event.imageFilename}`}
          alt={event.title}
          aspectRatio={4 / 3}
          w="full"
          style={{ objectFit: "cover" }}
        />
        <Stack gap={1} p={4}>
          <Text fontSize="sm" color="brand.500">
            {formatEventDate(event.date)} · {event.startTime} Uhr
          </Text>
          <Heading as="h3" size="md">
            {event.title}
          </Heading>
          <Text color="fg.muted">{event.price}</Text>
        </Stack>
      </RouterLink>
    </Box>
  );
}
