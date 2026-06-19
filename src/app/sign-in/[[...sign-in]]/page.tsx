import { SignIn } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  if (!authEnabled) {
    return (
      <div className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
        <h1 style={{ fontFamily: "Newsreader, serif", color: "var(--teal)" }}>Sign-in not configured</h1>
        <p style={{ color: "var(--ink-soft)" }}>
          Add the Clerk keys to <code>.env.local</code> to enable login. The app is currently running in open dev mode.
        </p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <SignIn />
    </div>
  );
}
