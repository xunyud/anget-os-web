import { createAdminClient } from "@/lib/supabase/admin";
import { getMissions } from "@/services/missions";
import { MissionBoardClient } from "@/components/mission-board-client";

export const metadata = {
  title: "Missions — AgentOS",
};

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const client = createAdminClient();
  const missions = await getMissions(client);

  return <MissionBoardClient initialMissions={missions} />;
}
