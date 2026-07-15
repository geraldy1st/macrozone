import { ANALYZE_API_URL } from "@/constants/api";

function getDeleteAccountUrl() {
  if (!ANALYZE_API_URL) {
    return "";
  }

  const base = ANALYZE_API_URL.replace(/\/analyze-meal\/?$/, "");
  return `${base}/delete-account`;
}

export async function deleteUserAccount(accessToken: string) {
  const url = getDeleteAccountUrl();

  if (!url) {
    throw new Error("DELETE_ACCOUNT_NOT_CONFIGURED");
  }

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("DELETE_ACCOUNT_FAILED");
  }
}