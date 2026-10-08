import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { RootLayout } from "@/components/layout/root-layout";
import { HomePage } from "@/pages/home-page";
import { EventDetailPage } from "@/pages/event-detail-page";
import { NotFoundPage } from "@/pages/not-found-page";

// Experimentelle Hero-Variante ohne Seiten-Chrome — nur zum Ausprobieren/Abstimmen.
// Nur im Dev-Modus registriert; im Produktions-Build fällt der Code komplett raus.
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: "/hero-lab",
        lazy: async () => {
          const { OrbitalTextRevealHero } = await import("@/components/hero/orbital-text-reveal-hero");
          return { Component: OrbitalTextRevealHero };
        },
      },
    ]
  : [];

export const router = createBrowserRouter([
  ...devRoutes,
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/events/:slug", element: <EventDetailPage /> },
      // Admin-Seiten als eigene Chunks: normale Besucher laden den Admin-Code nie.
      {
        path: "/admin/login",
        lazy: async () => {
          const { LoginPage } = await import("@/pages/admin/login-page");
          return { Component: LoginPage };
        },
      },
      {
        path: "/admin",
        lazy: async () => {
          const [{ ProtectedRoute }, { DashboardPage }] = await Promise.all([
            import("@/components/admin/protected-route"),
            import("@/pages/admin/dashboard-page"),
          ]);
          return {
            element: (
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            ),
          };
        },
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
