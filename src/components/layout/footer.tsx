import { useState } from "react";
import { Box, Container, Flex, HStack, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { Heart, Instagram, Mail, MapPin } from "lucide-react";

const linkStyle = {
  color: "fg.default",
  _hover: { color: "brand.500", textDecoration: "none" },
  transition: "color 0.2s",
} as const;

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={2} align={{ base: "center", md: "flex-start" }}>
      <Text fontSize="xs" letterSpacing="widest" textTransform="uppercase" color="brand.500" mb={1}>
        {title}
      </Text>
      {children}
    </Stack>
  );
}

/**
 * Easter Egg: kaum sichtbares Herz unten rechts. Bei Hover (Desktop) bzw. Tippen (Handy)
 * leuchtet es auf und klappt die Signatur aus.
 */
function MadeWithLove() {
  const [revealed, setRevealed] = useState(false);

  return (
    <HStack
      as="button"
      gap={2}
      cursor="default"
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onClick={() => setRevealed((value) => !value)}
      aria-label="Made with love by Tobias Pitzer"
      fontSize="xs"
      color="fg.muted"
    >
      <Box
        as="span"
        overflow="hidden"
        whiteSpace="nowrap"
        maxW={revealed ? "260px" : "0"}
        opacity={revealed ? 1 : 0}
        transition="max-width 0.5s ease, opacity 0.4s ease"
      >
        Made with
      </Box>
      <Box
        as="span"
        display="inline-flex"
        color={revealed ? "brand.500" : "fg.muted"}
        opacity={revealed ? 1 : 0.15}
        transition="opacity 0.4s ease, color 0.4s ease"
        style={revealed ? { filter: "drop-shadow(0 0 6px rgba(168, 85, 247, 0.9))" } : undefined}
      >
        <Heart size={14} fill={revealed ? "currentColor" : "none"} />
      </Box>
      <Box
        as="span"
        overflow="hidden"
        whiteSpace="nowrap"
        maxW={revealed ? "260px" : "0"}
        opacity={revealed ? 1 : 0}
        transition="max-width 0.5s ease, opacity 0.4s ease"
      >
        by Tobias Pitzer
      </Box>
    </HStack>
  );
}

export function Footer() {
  return (
    <Box as="footer" bg="#0a0a0a" position="relative" fontSize="sm">
      {/* Leuchtende Neon-Kante statt vollflächigem Lila */}
      <Box
        position="absolute"
        top={0}
        insetX={0}
        h="1px"
        bgGradient="to-r"
        gradientFrom="transparent"
        gradientVia="brand.500"
        gradientTo="transparent"
        style={{ boxShadow: "0 0 12px 1px rgba(168, 85, 247, 0.6)" }}
      />

      <Container maxW="6xl" pt={12} pb={6}>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={10} textAlign={{ base: "center", md: "left" }} mb={10}>
          <FooterColumn title="Club">
            <Text fontFamily="heading" fontSize="2xl" color="white" lineHeight="1">
              BASE.
            </Text>
            <Text color="fg.muted">
              Kreuzbergstraße 40
              <br />
              36037 Fulda
            </Text>
          </FooterColumn>

          <FooterColumn title="Kontakt">
            <Link href="mailto:kontakt@base-fulda.de" {...linkStyle}>
              <Mail size={16} /> kontakt@base-fulda.de
            </Link>
            <Link href="https://www.instagram.com/base.fulda/" target="_blank" rel="noreferrer" {...linkStyle}>
              <Instagram size={16} /> @base.fulda
            </Link>
            <Link href="https://maps.app.goo.gl/9uv4p8NgUVRRUzsS8" target="_blank" rel="noreferrer" {...linkStyle}>
              <MapPin size={16} /> Anfahrt
            </Link>
          </FooterColumn>

          <FooterColumn title="Rechtliches">
            <Link href="https://block-barock.de/impressum/" target="_blank" rel="noreferrer" {...linkStyle}>
              Impressum
            </Link>
            <Link href="https://block-barock.de/datenschutz/" target="_blank" rel="noreferrer" {...linkStyle}>
              Datenschutz
            </Link>
          </FooterColumn>
        </SimpleGrid>

        <Flex
          borderTopWidth="1px"
          borderColor="whiteAlpha.100"
          pt={6}
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          gap={3}
        >
          <Text fontSize="xs" color="fg.muted">
            © {new Date().getFullYear()} BASE. Fulda
          </Text>
          <MadeWithLove />
        </Flex>
      </Container>
    </Box>
  );
}
