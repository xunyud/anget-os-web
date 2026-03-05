/**
 * Seed script — inserts sample contexts and missions into Supabase.
 * Run with: npx tsx supabase/seed.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Run: source .env.local && npx tsx supabase/seed.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seed() {
  console.log("Seeding contexts...");

  const { data: contexts, error: ctxErr } = await supabase
    .from("contexts")
    .insert([
      {
        title: "Project Architecture Overview",
        content:
          "# AgentOS Architecture\n\nThree subsystems: Mission Scheduler, Context Notebook, Token Ledger.\n\n## Key Patterns\n- Context Flow: input_context → Mission → output_context\n- Optimistic Locking: version CAS on every write\n- SKIP LOCKED: non-blocking Agent queue",
        created_by_type: "human",
      },
      {
        title: "Auth Module Requirements",
        content:
          "# Auth Module PRD\n\n## Goals\n- Supabase Auth integration with Next.js middleware\n- Session refresh on every request\n- Protected routes: /missions, /contexts, /tokens\n\n## Acceptance Criteria\n- Unauthenticated users redirected to /login\n- Service role key access for API routes",
        created_by_type: "human",
      },
      {
        title: "RLS Performance Findings",
        content:
          "# RLS Benchmark Results\n\n## Findings\n- `(select auth.role())` pattern: 100x faster than `auth.role()` on 1M rows\n- FK indexes reduce JOIN time from 200ms to 2ms\n- `missions_queue_idx` composite index enables sub-ms claim queries",
        created_by_type: "agent_script",
      },
    ])
    .select("id");

  if (ctxErr) {
    console.error("Failed to seed contexts:", ctxErr);
    process.exit(1);
  }

  const [archCtx, authCtx, rlsCtx] = contexts!;
  console.log(`  Inserted ${contexts!.length} contexts`);

  console.log("Seeding missions...");

  const { data: missions, error: msnErr } = await supabase
    .from("missions")
    .insert([
      {
        title: "Design database schema for auth module",
        description:
          "Create PostgreSQL schema for user authentication including sessions, tokens, and rate limiting.",
        priority: 0,
        assignee_type: "human",
        status: "completed",
        input_context_id: archCtx.id,
        output_context_id: authCtx.id,
        version: 3,
      },
      {
        title: "Implement Edge Function for mission claiming",
        description:
          "Build the Supabase Edge Function that handles atomic mission claim with SKIP LOCKED.",
        priority: 0,
        assignee_type: "agent_claude",
        status: "in_progress",
        input_context_id: authCtx.id,
        output_context_id: null,
        version: 2,
      },
      {
        title: "Write unit tests for token ledger service",
        description:
          "Cover idempotency, cost calculation, and aggregation queries.",
        priority: 1,
        assignee_type: "agent_cursor",
        status: "reviewing",
        input_context_id: null,
        output_context_id: rlsCtx.id,
        version: 2,
      },
      {
        title: "Set up CI/CD pipeline with GitHub Actions",
        description:
          "Configure build, lint, type-check, and deploy workflows.",
        priority: 2,
        assignee_type: "none",
        status: "todo",
        input_context_id: null,
        output_context_id: null,
        version: 1,
      },
      {
        title: "Create API route for context CRUD",
        description:
          "Next.js API routes for creating, reading, and updating context documents.",
        priority: 1,
        assignee_type: "agent_claude",
        status: "todo",
        input_context_id: archCtx.id,
        output_context_id: null,
        version: 1,
      },
      {
        title: "Integrate Supabase Auth with middleware",
        description:
          "Add Next.js middleware for session refresh and route protection.",
        priority: 1,
        assignee_type: "human",
        status: "in_progress",
        input_context_id: null,
        output_context_id: null,
        version: 2,
      },
      {
        title: "Build token cost dashboard components",
        description:
          "Visualize per-agent and per-mission cost breakdown.",
        priority: 2,
        assignee_type: "none",
        status: "todo",
        input_context_id: null,
        output_context_id: null,
        version: 1,
      },
      {
        title: "Optimize RLS policies for mission queries",
        description:
          "Benchmark and improve RLS performance using (select auth.role()) pattern.",
        priority: 2,
        assignee_type: "agent_script",
        status: "completed",
        input_context_id: null,
        output_context_id: rlsCtx.id,
        version: 4,
      },
      {
        title: "Fix version conflict in concurrent claim",
        description:
          "Race condition when two agents claim the same mission simultaneously.",
        priority: 0,
        assignee_type: "agent_claude",
        status: "failed",
        input_context_id: null,
        output_context_id: null,
        version: 3,
      },
      {
        title: "Document Context Flow architecture",
        description:
          "Write comprehensive docs on input/output context pipeline for onboarding.",
        priority: 3,
        assignee_type: "human",
        status: "reviewing",
        input_context_id: archCtx.id,
        output_context_id: null,
        version: 2,
      },
    ])
    .select("id");

  if (msnErr) {
    console.error("Failed to seed missions:", msnErr);
    process.exit(1);
  }

  console.log(`  Inserted ${missions!.length} missions`);

  // Seed a few token ledger entries
  console.log("Seeding token ledger...");

  const missionIds = missions!.map((m) => m.id);

  const { error: tknErr } = await supabase.from("token_ledger").insert([
    {
      mission_id: missionIds[1],
      agent_name: "claude-opus-4-6",
      input_tokens: 12500,
      output_tokens: 3200,
      total_cost: 0.2145,
    },
    {
      mission_id: missionIds[1],
      agent_name: "claude-opus-4-6",
      input_tokens: 8700,
      output_tokens: 2100,
      total_cost: 0.1485,
    },
    {
      mission_id: missionIds[2],
      agent_name: "cursor-agent",
      input_tokens: 15000,
      output_tokens: 5500,
      total_cost: 0.0615,
    },
    {
      mission_id: missionIds[7],
      agent_name: "benchmark-script",
      input_tokens: 500,
      output_tokens: 200,
      total_cost: 0.001,
    },
  ]);

  if (tknErr) {
    console.error("Failed to seed token ledger:", tknErr);
    process.exit(1);
  }

  console.log("  Inserted 4 token ledger entries");
  console.log("\nSeed complete!");
}

seed();
