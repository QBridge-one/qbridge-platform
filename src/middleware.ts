// ============================================================
// src/middleware.ts
// Runs at the edge before route handlers.
//
// Behavior:
//   - Protects /ops/**, /workspace/**, /api/team/**, /api/wallet/**.
//   - Tags request with `x-qbridge-plane` based on path or referer
//     so server code can resolve the right plane in dev memory mode
//     and as a hint for plane-aware redirects in Clerk mode.
//   - Public routes: landing, sign-in, sign-up, identity webhook.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const OPS_PATHS = /^\/ops(\/|$)/;
const WORKSPACE_PATHS = /^\/workspace(\/|$)/;
const PUBLIC_PATHS = /^\/(api\/webhooks\/.*|_next\/.*|favicon\.ico|sign-in|sign-up|$|landing\/.*)/;

const isProtectedRoute = createRouteMatcher([
  "/ops(.*)",
  "/workspace(.*)",
  "/api/team/(.*)",
  "/api/wallet/(.*)",
  "/api/session",
]);

function planeFor(req: NextRequest): "ops" | "issuer" | null {
  const pathname = req.nextUrl.pathname;
  if (OPS_PATHS.test(pathname)) return "ops";
  if (WORKSPACE_PATHS.test(pathname)) return "issuer";
  if (pathname.startsWith("/api/")) {
    const referer = req.headers.get("referer") ?? "";
    try {
      const u = new URL(referer);
      if (OPS_PATHS.test(u.pathname)) return "ops";
      if (WORKSPACE_PATHS.test(u.pathname)) return "issuer";
    } catch {
      // bad / missing referer — leave plane null
    }
  }
  return null;
}

const IDENTITY_PROVIDER = (process.env.IDENTITY_PROVIDER ?? "memory").toLowerCase();

export default IDENTITY_PROVIDER === "clerk"
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        const a = await auth();
        if (!a.userId) {
          // Send unauthenticated users to Clerk's sign-in.
          return a.redirectToSignIn({ returnBackUrl: req.url });
        }
      }
      const plane = planeFor(req);
      const headers = new Headers(req.headers);
      if (plane) headers.set("x-qbridge-plane", plane);
      return NextResponse.next({ request: { headers } });
    })
  : (function memoryMiddleware(req: NextRequest) {
      const plane = planeFor(req);
      const headers = new Headers(req.headers);
      if (plane) headers.set("x-qbridge-plane", plane);
      return NextResponse.next({ request: { headers } });
    });

export const config = {
  matcher: [
    // Run on everything except static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    // Always run on API routes.
    "/(api|trpc)(.*)",
  ],
};

export { OPS_PATHS, WORKSPACE_PATHS, PUBLIC_PATHS };
