import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that never require a login.
const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// When Clerk keys are present, protect everything except public routes.
const enforce = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});

// Until keys are configured, let every request through (open dev mode).
const passthrough = () => NextResponse.next();

// Next.js 16 "proxy" convention (formerly "middleware").
const proxy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? enforce : passthrough;
export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals and static files, run on everything else
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes
    "/(api|trpc)(.*)",
    // Clerk handshake / auto-proxy path — required for the OAuth session to complete
    "/__clerk/:path*",
  ],
};
