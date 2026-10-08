import { Box } from "@chakra-ui/react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./header";
import { Footer } from "./footer";

export function RootLayout() {
  return (
    <Box minH="100dvh" display="flex" flexDirection="column">
      <Header />
      <Box as="main" flex="1">
        <Outlet />
      </Box>
      <Footer />
      {/* Neue Seiten oben öffnen, bei "Zurück" die alte Scroll-Position wiederherstellen */}
      <ScrollRestoration />
    </Box>
  );
}
