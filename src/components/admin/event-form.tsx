import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Button, Field, HStack, Input, Textarea } from "@chakra-ui/react";
import type { EventRecord } from "@/types/event";
import { createEvent, updateEvent } from "@/api/events";
import { ApiError } from "@/api/client";

interface EventFormProps {
  event: EventRecord | null;
  onDone: () => void;
  onCancel: () => void;
}

export function EventForm({ event, onDone, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(event?.date ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [doorsTime, setDoorsTime] = useState(event?.doorsTime ?? "");
  const [price, setPrice] = useState(event?.price ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);

    if (!event && !image) {
      setError("Bitte ein Titelbild hochladen.");
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("date", date);
    formData.set("startTime", startTime);
    formData.set("doorsTime", doorsTime);
    formData.set("price", price);
    if (image) {
      formData.set("image", image);
    }

    setSaving(true);
    try {
      if (event) {
        await updateEvent(event.id, formData);
      } else {
        await createEvent(formData);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? `Fehler: ${err.code}` : "Unbekannter Fehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="md"
      p={6}
      mb={8}
    >
      <HStack gap={4} mb={4} flexWrap="wrap" alignItems="flex-start">
        <Field.Root required flex="1" minW="200px">
          <Field.Label>Titel</Field.Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Datum</Field.Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Beginn</Field.Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </Field.Root>
        <Field.Root>
          <Field.Label>Einlass</Field.Label>
          <Input type="time" value={doorsTime ?? ""} onChange={(e) => setDoorsTime(e.target.value)} />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Preis</Field.Label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="z.B. 10€ oder Eintritt frei"
            required
          />
        </Field.Root>
      </HStack>

      <Field.Root required mb={4}>
        <Field.Label>Beschreibung</Field.Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
      </Field.Root>

      <Field.Root required={!event} mb={4}>
        <Field.Label>Titelbild {event ? "(optional ersetzen)" : ""}</Field.Label>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
      </Field.Root>

      {error && (
        <Box color="red.400" mb={4}>
          {error}
        </Box>
      )}

      <HStack>
        <Button type="submit" colorPalette="purple" loading={saving}>
          Speichern
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Abbrechen
        </Button>
      </HStack>
    </Box>
  );
}
