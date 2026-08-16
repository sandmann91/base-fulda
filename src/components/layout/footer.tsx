import { Box, Container, Flex, Link, Stack, Text } from "@chakra-ui/react";

export function Footer() {
  return (
    <Box as="footer" bg="brand.500" color="black">
      <Container maxW="6xl" py={8}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          gap={6}
          textAlign={{ base: "center", md: "left" }}
        >
          <Stack gap={1}>
            <Text fontWeight="bold">Base Fulda</Text>
            <Text>Kreuzbergstraße 40, 36037 Fulda</Text>
            <Link href="mailto:kontakt@base-fulda.de">kontakt@base-fulda.de</Link>
          </Stack>
          <Stack gap={1} justify="center">
            <Link href="https://block-barock.de/impressum/" target="_blank" rel="noreferrer">
              Impressum
            </Link>
            <Link href="https://block-barock.de/datenschutz/" target="_blank" rel="noreferrer">
              Datenschutz
            </Link>
          </Stack>
        </Flex>
      </Container>
    </Box>
  );
}
