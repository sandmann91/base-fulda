import { Box } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
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
    </Box>
  );
}
