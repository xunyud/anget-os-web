import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMission, submitMission } from "@/services/missions";
import { createContext } from "@/services/contexts";
import { recordTokenUsage } from "@/services/token-ledger";

const MAX_CONTENT_LENGTH = 50_000;

/**
 * POST /api/missions/[id]/submit
 * Payload: {
 *   content: string,
 *   token_usage: { input: number, output: number, agent_name: string }
 * }
 * Creates context → updates mission (output_context_id + status→reviewing) → records tokens.
 * Agent cap: can only advance to "reviewing", never "completed".
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

    const { content, token_usage } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { status: "error", message: "content is required and must be a string" },
        { status: 400 },
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          status: "error",
          message: `content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters (got ${content.length})`,
        },
        { status: 400 },
      );
    }

    if (!token_usage || typeof token_usage !== "object") {
      return NextResponse.json(
        { status: "error", message: "token_usage object is required" },
        { status: 400 },
      );
    }

    const { input, output, agent_name } = token_usage;

    if (typeof input !== "number" || typeof output !== "number") {
      return NextResponse.json(
        { status: "error", message: "token_usage.input and token_usage.output must be numbers" },
        { status: 400 },
      );
    }

    if (!agent_name || typeof agent_name !== "string") {
      return NextResponse.json(
        { status: "error", message: "token_usage.agent_name is required" },
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

    if (mission.status !== "in_progress") {
      return NextResponse.json(
        {
          status: "error",
          message: `Mission is "${mission.status}", only "in_progress" missions can be submitted`,
        },
        { status: 409 },
      );
    }

    // --- 1. Create output context ---
    const context = await createContext(client, {
      title: `Output: ${mission.title}`,
      content,
      created_by_type: mission.assignee_type === "none" ? "human" : mission.assignee_type,
    });

    // --- 2. Update mission: output_context_id + status → reviewing (CAS) ---
    const updated = await submitMission(
      client,
      id,
      context.id,
      mission.version,
    );

    if (!updated) {
      return NextResponse.json(
        {
          status: "conflict",
          message: "Version conflict — mission was modified by another agent",
        },
        { status: 409 },
      );
    }

    // --- 3. Record token usage ---
    // Estimate cost: rough approximation, callers can override via ledger API later
    const estimatedCost = (input * 0.000003 + output * 0.000015);
    await recordTokenUsage(client, {
      mission_id: id,
      agent_name,
      input_tokens: input,
      output_tokens: output,
      total_cost: Math.round(estimatedCost * 1_000_000) / 1_000_000, // 6 decimal places
    });

    return NextResponse.json(
      {
        status: "ok",
        mission: updated,
        context_id: context.id,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/missions/[id]/submit]", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
