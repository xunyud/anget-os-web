import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMission, claimMission } from "@/services/missions";
import type { AssigneeType } from "@/types/database";

const VALID_ASSIGNEE_TYPES: AssigneeType[] = [
  "agent_claude",
  "agent_cursor",
  "agent_script",
  "human",
];

/**
 * POST /api/missions/[id]/claim
 * Payload: { assignee_type: AssigneeType, agent_name: string }
 * Claims a todo mission → in_progress with CAS version check.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // --- Parse & validate body ---
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const { assignee_type, agent_name } = body;

    if (!assignee_type || !VALID_ASSIGNEE_TYPES.includes(assignee_type)) {
      return NextResponse.json(
        {
          status: "error",
          message: `assignee_type must be one of: ${VALID_ASSIGNEE_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!agent_name || typeof agent_name !== "string") {
      return NextResponse.json(
        { status: "error", message: "agent_name is required" },
        { status: 400 },
      );
    }

    // --- Fetch current mission ---
    const client = createAdminClient();
    const mission = await getMission(client, id);

    if (!mission) {
      return NextResponse.json(
        { status: "error", message: "Mission not found" },
        { status: 404 },
      );
    }

    if (mission.status !== "todo") {
      return NextResponse.json(
        {
          status: "error",
          message: `Mission is already "${mission.status}", only "todo" missions can be claimed`,
        },
        { status: 409 },
      );
    }

    // --- CAS claim ---
    const updated = await claimMission(
      client,
      id,
      assignee_type,
      mission.version,
    );

    if (!updated) {
      return NextResponse.json(
        {
          status: "conflict",
          message: "Version conflict — another agent claimed this mission",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { status: "ok", mission: updated },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/missions/[id]/claim]", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
