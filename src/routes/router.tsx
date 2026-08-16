import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/root-layout";
import { ProtectedRoute } from "@/components/admin/protected-route";
import { HomePage } from "@/pages/home-page";
import { EventDetailPage } from "@/pages/event-detail-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { LoginPage } from "@/pages/admin/login-page";
import { DashboardPage } from "@/pages/admin/dashboard-page";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/events/:slug", element: <EventDetailPage /> },
      { path: "/admin/login", element: <LoginPage /> },
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
