import { Button, HStack, Table } from "@chakra-ui/react";
import { Pencil, Trash2 } from "lucide-react";
import type { EventRecord } from "@/types/event";
import { deleteEvent } from "@/api/events";
import { formatEventDate } from "@/utils/format-date";

interface EventTableProps {
  events: EventRecord[];
  onEdit: (event: EventRecord) => void;
  onChange: () => void;
}

export function EventTable({ events, onEdit, onChange }: EventTableProps) {
  async function handleDelete(event: EventRecord) {
    if (!window.confirm(`"${event.title}" wirklich löschen?`)) {
      return;
    }
    await deleteEvent(event.id);
    onChange();
  }

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Datum</Table.ColumnHeader>
          <Table.ColumnHeader>Titel</Table.ColumnHeader>
          <Table.ColumnHeader>Preis</Table.ColumnHeader>
          <Table.ColumnHeader />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {events.map((event) => (
          <Table.Row key={event.id}>
            <Table.Cell>{formatEventDate(event.date)}</Table.Cell>
            <Table.Cell>{event.title}</Table.Cell>
            <Table.Cell>{event.price}</Table.Cell>
            <Table.Cell>
              <HStack justify="flex-end">
                <Button size="sm" variant="ghost" onClick={() => onEdit(event)} aria-label="Bearbeiten">
                  <Pencil />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => handleDelete(event)}
                  aria-label="Löschen"
                >
                  <Trash2 />
                </Button>
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
