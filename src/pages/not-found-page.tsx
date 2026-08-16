import { Center, Heading, Text, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Seo } from "@/components/seo/seo";

export function NotFoundPage() {
  return (
    <>
      <Seo title="Seite nicht gefunden" description="Diese Seite existiert nicht." canonicalPath="/404" />
      <Center py={32}>
        <VStack gap={4}>
          <Heading>404</Heading>
          <Text>Diese Seite gibt es nicht.</Text>
          <RouterLink to="/">Zurück zur Startseite</RouterLink>
        </VStack>
      </Center>
    </>
  );
}
