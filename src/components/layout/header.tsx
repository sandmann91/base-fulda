import { useEffect, useState } from "react";
import { Flex, HStack, Heading, IconButton, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Instagram, MapPin } from "lucide-react";

const SECTIONS = [
  { id: "club", label: "Club" },
  { id: "events", label: "Events" },
  { id: "awareness", label: "Awareness" },
] as const;

export function Header() {
  // Über dem Hero transparent; sobald gescrollt wird, dunkler Hintergrund,
  // damit Menü und Inhalt nicht ineinanderlaufen.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Flex
      as="header"
      justify="space-between"
      align="center"
      gap={2}
      px={{ base: 4, md: 8 }}
      h="20"
      position="fixed"
      insetX={0}
      top={0}
      zIndex={20}
      bg={scrolled ? "rgba(0, 0, 0, 0.75)" : "transparent"}
      backdropFilter={scrolled ? "blur(8px)" : "none"}
      transition="background 0.3s"
    >
      <Heading as="span" size="md" letterSpacing="wide" flexShrink={0}>
        <Link asChild _hover={{ color: "brand.500" }}>
          <RouterLink to="/">BASE.</RouterLink>
        </Link>
      </Heading>
      <HStack gap={{ base: 0, md: 4 }}>
        {/* Sprungmarken; von Unterseiten aus führen sie zurück zur Startseite an die Stelle */}
        <HStack as="nav" gap={{ base: 3, md: 6 }} mr={{ base: 1, md: 2 }} fontSize={{ base: "xs", md: "sm" }}>
          {SECTIONS.map((section) => (
            <Link
              key={section.id}
              asChild
              color="fg.default"
              textTransform="uppercase"
              letterSpacing="wider"
              _hover={{ color: "brand.500", textDecoration: "none" }}
            >
              <RouterLink to={`/#${section.id}`}>{section.label}</RouterLink>
            </Link>
          ))}
        </HStack>
        <IconButton asChild variant="ghost" color="fg.default" aria-label="Instagram" size={{ base: "sm", md: "md" }}>
          <a href="https://www.instagram.com/base.fulda/" target="_blank" rel="noreferrer">
            <Instagram />
          </a>
        </IconButton>
        <IconButton asChild variant="ghost" color="fg.default" aria-label="Standort" size={{ base: "sm", md: "md" }}>
          <a href="https://maps.app.goo.gl/9uv4p8NgUVRRUzsS8" target="_blank" rel="noreferrer">
            <MapPin />
          </a>
        </IconButton>
      </HStack>
    </Flex>
  );
}
