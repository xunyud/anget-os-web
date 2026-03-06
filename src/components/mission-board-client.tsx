"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { Mission, MissionInsert, MissionStatus } from "@/types/database";
import {
  addMission,
  fetchMissions,
  transitionMissionStatus,
} from "@/app/missions/actions";
import { MissionBoard } from "./mission-board";
import { MissionDrawer } from "./mission-drawer";
import { MissionDetail } from "./mission-detail";
import { MissionCreateForm } from "./mission-create-form";

type DrawerMode = "closed" | "detail" | "create";

interface MissionBoardClientProps {
  initialMissions: Mission[];
}

export function MissionBoardClient({
  initialMissions,
}: MissionBoardClientProps) {
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("closed");
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);

  // -- Auto-refresh: poll every 5s so board reflects Agent API changes
  const pollRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await fetchMissions();
        setMissions(fresh);
        // Also refresh selectedMission if drawer is open
        setSelectedMission((prev) => {
          if (!prev) return null;
          return fresh.find((m) => m.id === prev.id) ?? prev;
        });
      } catch {
        // Silently ignore poll failures — next tick will retry
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // -- Card click → open detail drawer
  const handleCardClick = useCallback((mission: Mission) => {
    setSelectedMission(mission);
    setDrawerMode("detail");
  }, []);

  // -- "+ New" button → open create drawer
  const handleNewClick = useCallback(() => {
    setSelectedMission(null);
    setDrawerMode("create");
  }, []);

  // -- Close drawer
  const handleClose = useCallback(() => {
    setDrawerMode("closed");
    setSelectedMission(null);
  }, []);

  // -- Status transition via Server Action
  const handleStatusChange = useCallback(
    async (missionId: string, newStatus: MissionStatus) => {
      const mission = missions.find((m) => m.id === missionId);
      if (!mission) return;

      setLoading(true);
      try {
        const { mission: updated, conflict } = await transitionMissionStatus(
          missionId,
          newStatus,
          mission.version,
        );

        if (conflict) {
          alert("Version conflict — another agent modified this mission. Refreshing.");
          window.location.reload();
          return;
        }

        if (updated) {
          setMissions((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m)),
          );
          setSelectedMission((prev) =>
            prev?.id === updated.id ? updated : prev,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [missions],
  );

  // -- Create mission via Server Action
  const handleCreate = useCallback(
    async (insert: MissionInsert) => {
      setLoading(true);
      try {
        const created = await addMission(insert);
        setMissions((prev) => [created, ...prev]);
        handleClose();
      } finally {
        setLoading(false);
      }
    },
    [handleClose],
  );

  const drawerTitle =
    drawerMode === "create"
      ? "New Mission"
      : selectedMission?.title ?? "Mission Detail";

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            AgentOS
          </h1>
          <span className="text-zinc-600">/</span>
          <span className="text-sm text-muted">Missions</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {missions.length} missions
          </span>
          <Link
            href="/dashboard"
            className="rounded-md border border-border bg-zinc-900 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-foreground"
          >
            Dashboard
          </Link>
          <button
            onClick={handleNewClick}
            disabled={loading}
            className="rounded-md border border-border bg-zinc-900 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
          >
            + New
          </button>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-hidden pt-4">
        <MissionBoard missions={missions} onCardClick={handleCardClick} />
      </main>

      {/* Drawer */}
      <MissionDrawer
        open={drawerMode !== "closed"}
        onClose={handleClose}
        title={drawerTitle}
      >
        {drawerMode === "detail" && selectedMission && (
          <MissionDetail
            mission={selectedMission}
            onStatusChange={handleStatusChange}
          />
        )}
        {drawerMode === "create" && (
          <MissionCreateForm onSubmit={handleCreate} onCancel={handleClose} />
        )}
      </MissionDrawer>
    </div>
  );
}
