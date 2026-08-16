import { Box, Heading } from "@chakra-ui/react";

/**
 * Hero-Sektion der Startseite. Bewusst als eigenständige, in sich geschlossene
 * Komponente ohne Props: ein Ersatz-Hero muss nur hier reinjektiert und in
 * HomePage eingesetzt werden, ohne den Rest der Seite anzufassen.
 */
export function VideoHero() {
  return (
    <Box as="section" position="relative" overflow="hidden" py={{ base: 24, md: 40 }}>
      <Box position="absolute" inset={0} zIndex={0} bg="black" aria-hidden>
        <Box
          asChild
          position="absolute"
          inset={0}
          w="full"
          h="full"
          filter="blur(10px) grayscale(1) sepia(1) hue-rotate(230deg) saturate(8) brightness(0.82) contrast(1.2)"
          opacity={0.3}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            style={{ objectFit: "cover", transform: "scale(1.08)", width: "100%", height: "100%" }}
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>
        </Box>
        <Box position="absolute" inset={0} bg="blackAlpha.600" />
      </Box>

      <Box position="relative" zIndex={1} maxW="2xl" mx="auto" px={4}>
        <Heading as="h1" size="6xl" display="inline-block" bg="brand.500" color="black" px={5} py={1}>
          BASE.
        </Heading>
        <Heading
          as="h2"
          size="lg"
          display="block"
          bg="brand.600"
          color="black"
          px={5}
          py={2}
          mt={4}
          w="fit-content"
          ml={{ base: 0, md: 12 }}
        >
          The basement of subculture.
        </Heading>
      </Box>
    </Box>
  );
}
