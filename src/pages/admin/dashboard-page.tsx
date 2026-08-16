import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Flex, Heading } from "@chakra-ui/react";
import { LogOut, Plus } from "lucide-react";
import { listEvents } from "@/api/events";
import { logout } from "@/api/auth";
import type { EventRecord } from "@/types/event";
import { EventTable } from "@/components/admin/event-table";
import { EventForm } from "@/components/admin/event-form";
import { Seo } from "@/components/seo/seo";

export function DashboardPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [editing, setEditing] = useState<EventRecord | "new" | null>(null);
  const navigate = useNavigate();

  async function reload() {
    const result = await listEvents();
    setEvents(result.events);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/admin/login");
  }

  return (
    <>
      <Seo title="Admin" description="Event-Verwaltung." canonicalPath="/admin" />
      <Container maxW="6xl" pt={24} pb={12}>
        <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
          <Heading size="lg">Events verwalten</Heading>
          <Flex gap={2}>
            <Button onClick={() => setEditing("new")} colorPalette="purple">
              <Plus /> Neues Event
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut /> Abmelden
            </Button>
          </Flex>
        </Flex>

        {editing && (
          <EventForm
            key={editing === "new" ? "new" : editing.id}
            event={editing === "new" ? null : editing}
            onDone={() => {
              setEditing(null);
              reload();
            }}
            onCancel={() => setEditing(null)}
          />
        )}

        <EventTable events={events} onEdit={setEditing} onChange={reload} />
      </Container>
    </>
  );
}
