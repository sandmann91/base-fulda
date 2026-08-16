import { Flex, HStack, Heading, IconButton, Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Instagram, MapPin } from "lucide-react";

export function Header() {
  return (
    <Flex
      as="header"
      justify="space-between"
      align="center"
      px={{ base: 4, md: 8 }}
      h="20"
      position="fixed"
      insetX={0}
      top={0}
      zIndex={20}
      bg="transparent"
    >
      <Heading as="span" size="md" letterSpacing="wide">
        <Link asChild _hover={{ color: "brand.500" }}>
          <RouterLink to="/">BASE.</RouterLink>
        </Link>
      </Heading>
      <HStack gap={1}>
        <IconButton asChild variant="ghost" color="fg.default" aria-label="Instagram">
          <a href="https://www.instagram.com/base.fulda/" target="_blank" rel="noreferrer">
            <Instagram />
          </a>
        </IconButton>
        <IconButton asChild variant="ghost" color="fg.default" aria-label="Standort">
          <a href="https://maps.app.goo.gl/9uv4p8NgUVRRUzsS8" target="_blank" rel="noreferrer">
            <MapPin />
          </a>
        </IconButton>
      </HStack>
    </Flex>
  );
}
