import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContext } from "@/services/contexts";

/**
 * GET /api/contexts/[id]
 * Returns a single context document by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const client = createAdminClient();
    const context = await getContext(client, id);

    if (!context) {
      return NextResponse.json(
        { status: "error", message: "Context not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ status: "ok", context }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/contexts/[id]]", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
