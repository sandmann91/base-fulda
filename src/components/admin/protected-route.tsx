import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { me } from "@/api/auth";

/**
 * Client-seitiges UX-Gate. Die eigentliche Durchsetzung passiert serverseitig
 * in events.php (Auth::requireAuth) — dieser Guard verhindert nur, dass die
 * Dashboard-UI kurz aufblitzt, bevor der Redirect zum Login greift.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    me()
      .then(setAuthenticated)
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return (
      <Center py={24}>
        <Spinner color="brand.500" />
      </Center>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
