import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../api/supabase";
import { AppStatus, TimerMode, RoomData } from "../../types";
import { ActionButton, InputBox } from "../common";
import * as S from "./TimerRoom.styles";

interface TimerRoomProps {
  roomId: string;
  onLeave: () => void;
}

export default function TimerRoom({ roomId, onLeave }: TimerRoomProps) {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [userCount, setUserCount] = useState(1);
  const [config, setConfig] = useState({ focus: 25, break: 5, cycles: 4 });
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const channelRef = useRef<any>(null);

  const fetchRoom = useCallback(async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle();
    if (data) {
      setRoomData(data);
      setConfig({
        focus: data.focus_min,
        break: data.break_min,
        cycles: data.total_cycles,
      });
    } else {
      const { data: upserted } = await supabase
        .from("rooms")
        .upsert(
          [
            {
              room_id: roomId,
              status: "idle",
              mode: "focusing",
              current_cycle: 1,
              total_cycles: 4,
              focus_min: 25,
              break_min: 5,
            },
          ],
          { onConflict: "room_id" },
        )
        .select()
        .single();
      if (upserted) setRoomData(upserted);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`room:${roomId}`, {
        config: { broadcast: { self: true }, presence: { key: sessionId } },
      })
      .on("broadcast", { event: "status_sync" }, ({ payload }) =>
        setRoomData(payload),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => setRoomData(payload.new as RoomData),
      )
      .on("presence", { event: "sync" }, () =>
        setUserCount(Object.keys(channel.presenceState()).length),
      )
      .subscribe(
        async (s) =>
          s === "SUBSCRIBED" &&
          (await channel.track({
            online_at: new Date(),
            session_id: sessionId,
          })),
      );
    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [roomId]);

  const handleAutoTransition = useCallback(async () => {
    if (!roomData || roomData.status !== "running") return;
    let nMode: TimerMode = roomData.mode === "focusing" ? "break" : "focusing";
    let nCycle =
      roomData.mode === "break"
        ? roomData.current_cycle + 1
        : roomData.current_cycle;
    let nStatus: AppStatus =
      nMode === "focusing" && nCycle > roomData.total_cycles
        ? "idle"
        : "running";
    const duration =
      nMode === "focusing" ? roomData.focus_min : roomData.break_min;
    const endTime =
      nStatus === "idle"
        ? null
        : new Date(Date.now() + duration * 60 * 1000).toISOString();
    const newState = {
      ...roomData,
      status: nStatus,
      mode: nMode,
      current_cycle: nCycle,
      end_time: endTime,
      remaining_seconds: null,
    };
    channelRef.current?.send({
      type: "broadcast",
      event: "status_sync",
      payload: newState,
    });
    await supabase.from("rooms").update(newState).eq("room_id", roomId);
  }, [roomData, roomId]);

  useEffect(() => {
    let timer: number;
    if (roomData?.status === "running" && roomData.end_time) {
      timer = window.setInterval(() => {
        const remaining = Math.max(
          0,
          Math.floor(
            (new Date(roomData.end_time!).getTime() - Date.now()) / 1000,
          ),
        );
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          handleAutoTransition();
        }
      }, 100);
    } else if (
      roomData?.status === "paused" &&
      roomData.remaining_seconds !== null
    ) {
      setTimeLeft(roomData.remaining_seconds);
    } else {
      setTimeLeft((roomData?.status === "idle" ? config.focus : 0) * 60);
    }
    return () => clearInterval(timer);
  }, [roomData, config, handleAutoTransition]);

  const syncState = async (status: AppStatus, updates: any = {}) => {
    const isIdle = status === "idle";
    const duration = updates.mode === "break" ? config.break : config.focus;
    let endTime =
      status === "running"
        ? new Date(
            Date.now() + (updates.remaining || duration * 60) * 1000,
          ).toISOString()
        : null;
    const newState = {
      room_id: roomId,
      status,
      mode: isIdle ? "focusing" : roomData?.mode || "focusing",
      current_cycle: isIdle ? 1 : roomData?.current_cycle || 1,
      total_cycles: config.cycles,
      focus_min: config.focus,
      break_min: config.break,
      end_time: endTime,
      remaining_seconds: isIdle ? null : updates.pausedTime || null,
    };
    channelRef.current?.send({
      type: "broadcast",
      event: "status_sync",
      payload: newState,
    });
    await supabase.from("rooms").update(newState).eq("room_id", roomId);
  };

  const handlePause = async () => {
    const newState = {
      ...roomData,
      status: "paused",
      remaining_seconds: timeLeft,
      end_time: null,
    };
    channelRef.current?.send({
      type: "broadcast",
      event: "status_sync",
      payload: newState,
    });
    await supabase
      .from("rooms")
      .update({ status: "paused", remaining_seconds: timeLeft, end_time: null })
      .eq("room_id", roomId);
  };

  useEffect(() => {
    if (pipWindow && roomData) {
      const currentBg =
        roomData.status === "idle"
          ? "#f3f0ff"
          : roomData.mode === "focusing"
            ? "#fff1f2"
            : "#f0fdf4";
      pipWindow.document.body.style.backgroundColor = currentBg;
    }
  }, [pipWindow, roomData]);

  const togglePip = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }
    if (!("documentPictureInPicture" in window)) {
      alert("PIP 미지원 브라우저입니다.");
      return;
    }

    const pipWidth = 400;
    const pipHeight = 280;

    const win = await (window as any).documentPictureInPicture.requestWindow({
      width: pipWidth,
      height: pipHeight,
    });

    setTimeout(() => {
      win.resizeTo(pipWidth, pipHeight);
    }, 50);

    win.document.body.style.margin = "0";
    win.document.body.style.display = "flex";
    win.document.body.style.alignItems = "center";
    win.document.body.style.justifyContent = "center";
    win.document.body.style.overflow = "hidden";

    [...document.styleSheets].forEach((ss) => {
      try {
        const style = document.createElement("style");
        style.textContent = [...ss.cssRules].map((r) => r.cssText).join("");
        win.document.head.appendChild(style);
      } catch (e) {
        if (ss.href) {
          const l = document.createElement("link");
          l.rel = "stylesheet";
          l.href = ss.href;
          win.document.head.appendChild(l);
        }
      }
    });
    win.onpagehide = () => setPipWindow(null);
    setPipWindow(win);
  };

  if (!roomData)
    return (
      <S.Container mode="focusing" status="idle">
        Loading...
      </S.Container>
    );

  const content = (isPip: boolean) => (
    <S.Container mode={roomData.mode} status={roomData.status} isPip={isPip}>
      <S.Blob
        color={roomData.mode === "focusing" ? "#fecdd3" : "#bbf7d0"}
        size="300px"
        top="-20px"
        right="-20px"
        delay="0s"
      />
      <S.Blob
        color="#ddd6fe"
        size="250px"
        bottom="-20px"
        left="-20px"
        delay="-4s"
      />

      <S.Card isPip={isPip}>
        <S.StatusPill mode={roomData.mode} status={roomData.status} isPip={isPip}>
          {roomData.status === "paused"
            ? "일시정지됨"
            : `${roomData.mode.toUpperCase()} ${roomData.current_cycle}/${roomData.total_cycles}`}
        </S.StatusPill>

        <S.TimerDisplay
          mode={roomData.mode}
          status={roomData.status}
          isPip={isPip}>
          {`${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`}
        </S.TimerDisplay>

        {roomData.status === "idle" ? (
          <>
            <S.ConfigGrid isPip={isPip}>
              <InputBox isPip={isPip}>
                <label>집중</label>
                <input
                  type="number"
                  value={config.focus}
                  onChange={(e) =>
                    setConfig({ ...config, focus: Number(e.target.value) })
                  }
                />
              </InputBox>
              <InputBox isPip={isPip}>
                <label>휴식</label>
                <input
                  type="number"
                  value={config.break}
                  onChange={(e) =>
                    setConfig({ ...config, break: Number(e.target.value) })
                  }
                />
              </InputBox>
              <InputBox isPip={isPip}>
                <label>사이클</label>
                <input
                  type="number"
                  value={config.cycles}
                  onChange={(e) =>
                    setConfig({ ...config, cycles: Number(e.target.value) })
                  }
                />
              </InputBox>
            </S.ConfigGrid>
            <S.ButtonGroup isPip={isPip}>
              <ActionButton
                variant="primary"
                isPip={isPip}
                onClick={() => syncState("running")}>
                사이클 시작하기
              </ActionButton>
            </S.ButtonGroup>
          </>
        ) : (
          <S.ButtonGroup isPip={isPip}>
            {roomData.status === "running" ? (
              <ActionButton
                variant="outline"
                isPip={isPip}
                onClick={handlePause}>
                일시정지
              </ActionButton>
            ) : (
              <ActionButton
                variant="success"
                isPip={isPip}
                onClick={() =>
                  syncState("running", {
                    remaining: roomData.remaining_seconds,
                  })
                }>
                다시 시작
              </ActionButton>
            )}
            <ActionButton
              variant="danger"
              isPip={isPip}
              onClick={() => syncState("idle")}>
              중단하기
            </ActionButton>
          </S.ButtonGroup>
        )}

        {!isPip && (
          <>
            <S.Divider />
            <S.ShareBox>
              <S.IdBadge
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  alert("방 번호가 복사되었습니다!");
                }}>
                <span>ROOM ID</span>
                <strong>{roomId}</strong>
              </S.IdBadge>

              <S.ActionRow>
                <S.UserIndicator>
                  <div className="dot" />
                  <span>{userCount} Active</span>
                </S.UserIndicator>

                <S.GhostButtonGroup>
                  <S.GhostButton
                    onClick={() => {
                      const shareUrl =
                        window.location.origin +
                        window.location.pathname +
                        "?room=" +
                        roomId;
                      navigator.clipboard.writeText(shareUrl);
                      alert("참여 링크가 복사되었습니다!");
                    }}>
                    Share
                  </S.GhostButton>
                  <S.GhostButton onClick={togglePip}>PIP</S.GhostButton>
                  <S.GhostButton variant="danger" onClick={onLeave}>
                    Exit
                  </S.GhostButton>
                </S.GhostButtonGroup>
              </S.ActionRow>
            </S.ShareBox>
          </>
        )}
      </S.Card>
    </S.Container>
  );

  return pipWindow
    ? createPortal(content(true), pipWindow.document.body)
    : content(false);
}
