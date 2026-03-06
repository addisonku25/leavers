import { type NextRequest, NextResponse } from "next/server";
import { authEndpointLimiter } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  // Skip rate limiting when Redis is unavailable (local dev)
  if (!authEndpointLimiter) {
    return NextResponse.next();
  }

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await authEndpointLimiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
