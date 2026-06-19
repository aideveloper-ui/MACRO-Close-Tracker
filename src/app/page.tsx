import { getOwners, getPeriods, getTasks } from "@/lib/data";
import { getAccess } from "@/lib/auth";
import TrackerApp from "@/components/TrackerApp";

// Always render fresh from the database (no static caching).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [owners, periods, access] = await Promise.all([
    getOwners(),
    getPeriods(),
    getAccess(),
  ]);
  const initialPeriodId = periods[0]?.id ?? null;
  const initialTasks = initialPeriodId ? await getTasks(initialPeriodId) : [];

  return (
    <TrackerApp
      owners={owners}
      initialPeriods={periods}
      initialPeriodId={initialPeriodId}
      initialTasks={initialTasks}
      authEnabled={access.authEnabled}
      canEdit={access.canEdit}
      userName={access.name}
      role={access.role}
    />
  );
}
