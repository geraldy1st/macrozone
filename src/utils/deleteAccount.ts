import { DELETE_ACCOUNT_API_URL } from "@/constants/api";

export class DeleteAccountError extends Error {
  code: "NOT_CONFIGURED" | "UNAUTHORIZED" | "FAILED" | "NOT_DEPLOYED";

  constructor(code: DeleteAccountError["code"], message?: string) {
    super(message ?? code);
    this.name = "DeleteAccountError";
    this.code = code;
  }
}

export async function deleteUserAccount(accessToken: string) {
  if (!DELETE_ACCOUNT_API_URL) {
    throw new DeleteAccountError(
      "NOT_CONFIGURED",
      "DELETE_ACCOUNT_NOT_CONFIGURED",
    );
  }

  if (!accessToken) {
    throw new DeleteAccountError("UNAUTHORIZED", "DELETE_ACCOUNT_UNAUTHORIZED");
  }

  let response: Response;

  try {
    response = await fetch(DELETE_ACCOUNT_API_URL, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  } catch {
    throw new DeleteAccountError("FAILED", "DELETE_ACCOUNT_NETWORK");
  }

  if (response.status === 401) {
    throw new DeleteAccountError("UNAUTHORIZED", "DELETE_ACCOUNT_UNAUTHORIZED");
  }

  // Vercel returns HTML 404 when the serverless function was never deployed.
  if (response.status === 404) {
    throw new DeleteAccountError("NOT_DEPLOYED", "DELETE_ACCOUNT_NOT_DEPLOYED");
  }

  if (!response.ok) {
    throw new DeleteAccountError("FAILED", "DELETE_ACCOUNT_FAILED");
  }
}
