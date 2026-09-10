import { NextResponse } from "next/server";

export function apiError(
  message = "Research data is temporarily unavailable. Please try again in a moment.",
  status = 503,
) {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message = "Invalid request") {
  return apiError(message, 400);
}
