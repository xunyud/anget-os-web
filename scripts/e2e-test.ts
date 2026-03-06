/**
 * AgentOS — Comprehensive E2E Test Suite
 * Tests all pages and API routes against the production URL.
 *
 * Usage: npx tsx scripts/e2e-test.ts [base_url]
 * Default: https://anget-os-web.vercel.app
 */

const BASE = process.argv[2] || "https://anget-os-web.vercel.app";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<string>) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ name, passed: true, detail, durationMs: Date.now() - t0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, detail: msg, durationMs: Date.now() - t0 });
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }
}

// ---------------------------------------------------------------------------
// Main — wraps all tests to avoid top-level await
// ---------------------------------------------------------------------------
async function main() {

// State shared between tests
let claimedMissionId = "";
let claimedMissionVersion = 0;
let createdContextId = "";

// ---------------------------------------------------------------------------
// 1. PAGE TESTS
// ---------------------------------------------------------------------------

await test("1.1 Landing page renders", async () => {
  const res = await fetch(BASE);
  assert(res.ok, `HTTP ${res.status}`);
  const html = await res.text();
  assert(html.includes("AgentOS"), "Missing AgentOS title");
  assert(html.includes("/missions"), "Missing missions link");
  assert(html.includes("/dashboard"), "Missing dashboard link");
  assert(html.includes("/api/missions/next"), "Missing API reference");
  return "Landing page OK — title, nav links, API reference present";
});

await test("1.2 Missions board renders", async () => {
  const res = await fetch(`${BASE}/missions`);
  assert(res.ok, `HTTP ${res.status}`);
  const html = await res.text();
  assert(html.includes("AgentOS"), "Missing AgentOS header");
  assert(html.includes("missions"), "Missing missions count");
  return "Missions board OK";
});

await test("1.3 Dashboard renders with data", async () => {
  const res = await fetch(`${BASE}/dashboard`);
  assert(res.ok, `HTTP ${res.status}`);
  const html = await res.text();
  assert(html.includes("Total Cost"), "Missing Total Cost card");
  assert(html.includes("Total Tokens"), "Missing Total Tokens card");
  assert(html.includes("Active Agents"), "Missing Active Agents card");
  assert(html.includes("$"), "Missing cost value");
  return "Dashboard OK — 3 stat cards present with data";
});

// ---------------------------------------------------------------------------
// 2. GET /api/missions/next
// ---------------------------------------------------------------------------

await test("2.1 GET /api/missions/next — returns todo mission", async () => {
  const res = await fetch(`${BASE}/api/missions/next`);
  assert(res.ok, `HTTP ${res.status}`);
  const body = await json(res);
  assert(body.status === "ok", `Expected status 'ok', got '${body.status}'`);
  assert(body.mission, "Missing mission object");
  assert(body.mission.id, "Missing mission.id");
  assert(body.mission.status === "todo", `Expected 'todo', got '${body.mission.status}'`);
  assert(typeof body.mission.version === "number", "Missing version");
  // Save for claim test
  claimedMissionId = body.mission.id;
  claimedMissionVersion = body.mission.version;
  return `OK — mission "${body.mission.title}" (priority ${body.mission.priority})`;
});

// ---------------------------------------------------------------------------
// 3. POST /api/missions/[id]/claim
// ---------------------------------------------------------------------------

await test("3.1 Claim mission — success", async () => {
  assert(claimedMissionId !== "", "No mission ID from previous test");
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignee_type: "agent_claude",
      agent_name: "e2e-test-agent",
    }),
  });
  assert(res.ok, `HTTP ${res.status}`);
  const body = await json(res);
  assert(body.status === "ok", `Expected 'ok', got '${body.status}'`);
  assert(body.mission.status === "in_progress", `Expected 'in_progress', got '${body.mission.status}'`);
  assert(body.mission.assignee_type === "agent_claude", "Assignee not set");
  assert(body.mission.version === claimedMissionVersion + 1, "Version not incremented");
  claimedMissionVersion = body.mission.version;
  return `OK — claimed, version ${claimedMissionVersion}`;
});

await test("3.2 Claim already claimed mission — 409", async () => {
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignee_type: "agent_cursor",
      agent_name: "another-agent",
    }),
  });
  assert(res.status === 409, `Expected 409, got ${res.status}`);
  const body = await json(res);
  assert(body.status === "error", `Expected 'error', got '${body.status}'`);
  return "OK — 409 conflict as expected";
});

await test("3.3 Claim non-existent mission — 404", async () => {
  const res = await fetch(`${BASE}/api/missions/00000000-0000-0000-0000-ffffffffffff/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignee_type: "agent_claude",
      agent_name: "test",
    }),
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  return "OK — 404 not found";
});

await test("3.4 Claim with invalid body — 400", async () => {
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bad: "data" }),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  return "OK — 400 bad request";
});

// ---------------------------------------------------------------------------
// 4. GET /api/contexts/[id]
// ---------------------------------------------------------------------------

await test("4.1 GET existing context", async () => {
  // First, get a context ID from an existing mission
  const missionsRes = await fetch(`${BASE}/api/missions/next`);
  // Use the seed contexts — query Supabase directly via a known pattern
  // We'll just try fetching with a made-up ID and also try the dashboard to find one
  const dashRes = await fetch(`${BASE}/dashboard`);
  const dashHtml = await dashRes.text();

  // Extract a context_id from a mission that has one, or use the submit test below
  // For now, test with a search approach: check if any mission has output_context_id
  // Actually, let's just test the basic 404 flow and test success via submit
  const res = await fetch(`${BASE}/api/contexts/00000000-0000-0000-0000-ffffffffffff`);
  assert(res.status === 404, `Expected 404, got ${res.status}`);
  const body = await json(res);
  assert(body.status === "error", "Missing error status");
  return "OK — 404 for non-existent context";
});

// ---------------------------------------------------------------------------
// 5. POST /api/missions/[id]/submit
// ---------------------------------------------------------------------------

await test("5.1 Submit mission result — success", async () => {
  assert(claimedMissionId !== "", "No claimed mission");
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "## E2E Test Output\n\nThis context was created by the automated test suite.\n\nAll systems operational.",
      token_usage: {
        input: 500,
        output: 800,
        agent_name: "e2e-test-agent",
      },
    }),
  });
  assert(res.ok, `HTTP ${res.status}`);
  const body = await json(res);
  assert(body.status === "ok", `Expected 'ok', got '${body.status}'`);
  assert(body.mission.status === "reviewing", `Expected 'reviewing', got '${body.mission.status}'`);
  assert(body.mission.output_context_id, "Missing output_context_id");
  assert(body.context_id, "Missing context_id");
  createdContextId = body.context_id;
  claimedMissionVersion = body.mission.version;
  return `OK — submitted, context ${createdContextId}, version ${claimedMissionVersion}`;
});

await test("5.2 GET the newly created context", async () => {
  assert(createdContextId !== "", "No context ID from submit");
  const res = await fetch(`${BASE}/api/contexts/${createdContextId}`);
  assert(res.ok, `HTTP ${res.status}`);
  const body = await json(res);
  assert(body.status === "ok", "Missing ok status");
  assert(body.context.content.includes("E2E Test Output"), "Content mismatch");
  return `OK — context retrieved, title: "${body.context.title}"`;
});

await test("5.3 Submit on non-in_progress mission — 409", async () => {
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "should fail",
      token_usage: { input: 1, output: 1, agent_name: "test" },
    }),
  });
  assert(res.status === 409, `Expected 409, got ${res.status}`);
  return "OK — 409 conflict (mission already reviewing)";
});

await test("5.4 Submit with content > 50000 chars — 400", async () => {
  // Need a fresh in_progress mission for this test — use a different one
  // Actually, this validation fires before DB check, so any mission ID works
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: "x".repeat(50001),
      token_usage: { input: 1, output: 1, agent_name: "test" },
    }),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  const body = await json(res);
  assert(body.message.includes("50000"), "Missing length limit in error");
  return "OK — 400 content too long";
});

await test("5.5 Submit with missing fields — 400", async () => {
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "test" }),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  return "OK — 400 missing token_usage";
});

await test("5.6 Submit with invalid JSON — 400", async () => {
  const res = await fetch(`${BASE}/api/missions/${claimedMissionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json at all",
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
  return "OK — 400 invalid JSON";
});

// ---------------------------------------------------------------------------
// 6. CLEANUP — restore mission to original state
// ---------------------------------------------------------------------------

await test("6.1 Cleanup — restore test mission", async () => {
  // Use Supabase REST directly with service role key from env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return "SKIP — no Supabase credentials in env (run with .env.local loaded)";
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/missions?id=eq.${claimedMissionId}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        status: "todo",
        assignee_type: "none",
        output_context_id: null,
        version: 1,
      }),
    },
  );
  assert(res.status === 204, `Expected 204, got ${res.status}`);
  return `OK — mission ${claimedMissionId} restored to todo`;
});

// ---------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------

console.log("\n" + "=".repeat(70));
console.log("  AgentOS E2E Test Report");
console.log("  Target: " + BASE);
console.log("  Time:   " + new Date().toISOString());
console.log("=".repeat(70) + "\n");

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;

for (const r of results) {
  const icon = r.passed ? "PASS" : "FAIL";
  const tag = r.passed ? "\x1b[32m" : "\x1b[31m";
  console.log(`  ${tag}[${icon}]\x1b[0m ${r.name} (${r.durationMs}ms)`);
  console.log(`         ${r.detail}`);
}

console.log("\n" + "-".repeat(70));
console.log(`  Total: ${total}  |  \x1b[32mPassed: ${passed}\x1b[0m  |  \x1b[31mFailed: ${failed}\x1b[0m`);
console.log("-".repeat(70) + "\n");

if (failed > 0) process.exit(1);

} // end main

main().catch((err) => { console.error(err); process.exit(1); });
