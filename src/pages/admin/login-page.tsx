import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Center, Field, Input, Stack } from "@chakra-ui/react";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Seo } from "@/components/seo/seo";

export function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(password);
      navigate("/admin");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Zu viele Fehlversuche. Bitte später erneut versuchen.");
      } else {
        setError("Falsches Passwort.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo title="Admin-Login" description="Anmeldung für den Admin-Bereich." canonicalPath="/admin/login" />
      <Center py={24}>
        <Stack as="form" onSubmit={handleSubmit} gap={4} w="full" maxW="sm" px={4}>
          <Field.Root invalid={!!error}>
            <Field.Label>Passwort</Field.Label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              required
            />
            {error && <Field.ErrorText>{error}</Field.ErrorText>}
          </Field.Root>
          <Button type="submit" loading={loading} colorPalette="purple">
            Anmelden
          </Button>
        </Stack>
      </Center>
    </>
  );
}
