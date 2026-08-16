import { apiRequest, setCsrfToken } from "./client";

export async function login(password: string): Promise<void> {
  const result = await apiRequest<{ ok: true; csrfToken: string }>("auth.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  setCsrfToken(result.csrfToken);
}

export async function logout(): Promise<void> {
  await apiRequest("auth.php", { method: "DELETE", auth: true });
  setCsrfToken(null);
}

export async function me(): Promise<boolean> {
  const result = await apiRequest<{ ok: true; authenticated: boolean }>("auth.php?action=me");
  return result.authenticated;
}
