import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNextTodoMission } from "@/services/missions";

/**
 * GET /api/missions/next
 * Returns the highest-priority todo mission.
 * When queue is empty, returns 200 with status:"empty" (NOT 404).
 */
export async function GET() {
  try {
    const client = createAdminClient();
    const mission = await getNextTodoMission(client);

    if (!mission) {
      return NextResponse.json(
        {
          status: "empty",
          message: "No pending missions available at the moment.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ status: "ok", mission }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/missions/next]", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
