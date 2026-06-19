import { SignUp } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (!authEnabled) {
    return (
      <div className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
        <h1 style={{ fontFamily: "Newsreader, serif", color: "var(--teal)" }}>Sign-up not configured</h1>
        <p style={{ color: "var(--ink-soft)" }}>
          Add the Clerk keys to <code>.env.local</code> to enable accounts.
        </p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24 }}>
      <SignUp />
    </div>
  );
}
