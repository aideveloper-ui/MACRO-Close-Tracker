import { currentUser } from "@clerk/nextjs/server";
import { getOwners } from "./data";
import type { Role } from "./types";

// Auth is active only when Clerk keys are present. Until then the app runs
// open (dev mode) so the build keeps working before the client provides keys.
export const authEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export interface Access {
  authEnabled: boolean;
  signedIn: boolean;
  email: string | null;
  name: string | null;
  role: Role;
  canEdit: boolean;
}

export async function getAccess(): Promise<Access> {
  // No Clerk configured → open dev mode, full edit access.
  if (!authEnabled) {
    return { authEnabled: false, signedIn: false, email: null, name: null, role: "admin", canEdit: true };
  }

  const u = await currentUser().catch(() => null);
  if (!u) {
    return { authEnabled: true, signedIn: false, email: null, name: null, role: "viewer", canEdit: false };
  }

  const email =
    u.primaryEmailAddress?.emailAddress ??
    u.emailAddresses?.[0]?.emailAddress ??
    null;
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || email;

  // Map the signed-in user to an owner record to determine their role.
  // Unmatched users default to "editor" during the sample-data phase.
  const owners = await getOwners();
  const match = email
    ? owners.find((o) => o.email?.toLowerCase() === email.toLowerCase())
    : undefined;
  const role: Role = match?.role ?? "editor";

  return { authEnabled: true, signedIn: true, email, name, role, canEdit: role !== "viewer" };
}
