import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { createClient } from "@supabase/supabase-js";
import styled from "@emotion/styled";
import { css, Global, keyframes } from "@emotion/react";
import { Analytics } from "@vercel/analytics/react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type AppStatus = "idle" | "running" | "paused";
type TimerMode = "focusing" | "break";

interface RoomData {
  room_id: string;
  status: AppStatus;
  mode: TimerMode;
  current_cycle: number;
  total_cycles: number;
  focus_min: number;
  break_min: number;
  remaining_seconds: number | null;
  end_time: string | null;
}

const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const moveBlob = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -40px) scale(1.1); }
`;

const Container = styled.div<{
  mode: TimerMode;
  status: AppStatus;
  isPip?: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: ${(props) => (props.isPip ? "100vh" : "100dvh")};
  width: 100vw;
  position: relative;
  overflow: hidden;
  transition: background-color 1s ease;
  background-color: ${(props) => {
    if (props.status === "idle") return "#f3f0ff";
    return props.mode === "focusing" ? "#fff1f2" : "#f0fdf4";
  }};
  font-family:
    "Pretendard",
    -apple-system,
    sans-serif;
`;

const Blob = styled.div<{
  color: string;
  size: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay: string;
}>`
  position: absolute;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  background: ${(props) => props.color};
  filter: blur(60px);
  border-radius: 50%;
  opacity: 0.6;
  top: ${(props) => props.top};
  left: ${(props) => props.left};
  right: ${(props) => props.right};
  bottom: ${(props) => props.bottom};
  animation: ${moveBlob} 20s infinite alternate ease-in-out;
  animation-delay: ${(props) => props.delay};
  z-index: 0;
`;

const Card = styled.div<{ isPip?: boolean }>`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  padding: ${(props) => (props.isPip ? "1.2rem" : "2rem")};
  border-radius: 3rem;
  width: 90%;
  max-width: 400px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.04),
    inset 0 0 0 2px white;
  text-align: center;
  box-sizing: border-box;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.isPip ? "0.6rem" : "1rem")};
  justify-content: center;
`;

const StatusPill = styled.div<{
  mode: TimerMode;
  status: AppStatus;
  isPip?: boolean;
}>`
  align-self: center;
  padding: ${(props) => (props.isPip ? "0.3rem 0.8rem" : "0.5rem 1.2rem")};
  border-radius: 2rem;
  font-weight: 800;
  font-size: ${(props) => (props.isPip ? "0.65rem" : "0.8rem")};
  background: white;
  color: ${(props) => {
    if (props.status === "paused") return "#94a3b8";
    return props.mode === "focusing" ? "#000000" : "#10b981";
  }};
`;

const TimerDisplay = styled.h1<{
  mode: TimerMode;
  status: AppStatus;
  isPip?: boolean;
}>`
  font-size: ${(props) => (props.isPip ? "6rem" : "6.5rem")};
  font-weight: 900;
  margin: 0;
  line-height: ${(props) => (props.isPip ? "0.9" : "1")};
  color: ${(props) => {
    if (props.status === "paused") return "#94a3b8";
    return props.mode === "focusing" ? "#000000" : "#10b981";
  }};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.05em;
`;

const ConfigGrid = styled.div<{ isPip?: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => (props.isPip ? "6px" : "10px")};
  margin: ${(props) => (props.isPip ? "0.2rem 0" : "0.5rem 0")};
`;

const InputBox = styled.div<{ isPip?: boolean }>`
  background: rgba(255, 255, 255, 0.5);
  padding: ${(props) => (props.isPip ? "6px" : "10px")};
  border-radius: ${(props) => (props.isPip ? "0.8rem" : "1.2rem")};
  border: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  &:focus-within {
    border-color: #c7d2fe;
    background: white;
  }
  label {
    font-size: ${(props) => (props.isPip ? "0.55rem" : "0.65rem")};
    font-weight: 800;
    color: #94a3b8;
    margin-bottom: 2px;
  }
  input {
    width: 100%;
    border: none;
    background: transparent;
    font-size: ${(props) => (props.isPip ? "0.9rem" : "1.1rem")};
    font-weight: 900;
    text-align: center;
    color: #1e293b;
    outline: none;
    appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      appearance: none;
      margin: 0;
    }
  }
`;

const ButtonGroup = styled.div<{ isPip?: boolean }>`
  display: flex;
  gap: ${(props) => (props.isPip ? "6px" : "10px")};
  margin-top: ${(props) => (props.isPip ? "5px" : "10px")};
`;

const ActionButton = styled.button<{
  variant?: "danger" | "success" | "outline" | "primary";
  isPip?: boolean;
}>`
  width: 100%;
  padding: ${(props) => (props.isPip ? "0.9rem" : "1.1rem")};
  border-radius: 1.5rem;
  border: none;
  font-size: ${(props) => (props.isPip ? "1rem" : "1.1rem")};
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${(props) => {
    if (props.variant === "danger") return "#fff1f2";
    if (props.variant === "success") return "#f0fdf4";
    if (props.variant === "outline") return "#f8fafc";
    return "#6366f1";
  }};
  color: ${(props) => {
    if (props.variant === "danger") return "#f43f5e";
    if (props.variant === "success") return "#10b981";
    if (props.variant === "outline") return "#64748b";
    return "white";
  }};
  &:hover {
    transform: translateY(-2px);
    filter: brightness(0.98);
  }
  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const ShareBox = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(99, 102, 241, 0.1),
    transparent
  );
  width: 100%;
`;

const IdBadge = styled.button`
  align-self: center;
  background: rgba(99, 102, 241, 0.05);
  border: 1px dashed rgba(99, 102, 241, 0.3);
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-size: 0.65rem;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.05em;
  }
  strong {
    font-size: 0.9rem;
    font-weight: 900;
    color: #6366f1;
    letter-spacing: 0.1em;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.1);
    border-style: solid;
    transform: translateY(-1px);
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.4);
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
`;

const GhostButton = styled.button<{ variant?: "danger" }>`
  background: transparent;
  border: none;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  color: ${(props) => (props.variant === "danger" ? "#f43f5e" : "#64748b")};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.variant === "danger" ? "rgba(244, 63, 94, 0.08)" : "white"};
    color: ${(props) => (props.variant === "danger" ? "#e11d48" : "#6366f1")};
  }
`;

const UserIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 8px;

  .dot {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    animation: pulse 2s infinite;
  }
  span {
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }
`;

function Lobby({ onJoin }: { onJoin: (id: string) => void }) {
  const [inputId, setInputId] = useState("");
  return (
    <Container mode="focusing" status="idle">
      <Blob
        color="#ddd6fe"
        size="450px"
        top="-100px"
        left="-150px"
        delay="0s"
      />
      <Blob
        color="#fecdd3"
        size="350px"
        bottom="-50px"
        right="-100px"
        delay="-5s"
      />
      <Card>
        <div style={{ fontSize: "3rem" }}>🍅</div>
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: 900,
            margin: "0",
            color: "#1e293b",
          }}>
          Pomogether
        </h2>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}>
          함께라면 더 깊이 몰입할 수 있어요
        </p>
        <ActionButton
          variant="primary"
          onClick={() => onJoin(generateRoomId())}>
          새 방 만들기
        </ActionButton>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#e2e8f0",
          }}>
          <div style={{ flex: 1, height: "1px", background: "currentColor" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 800 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "currentColor" }} />
        </div>
        <InputBox>
          <input
            placeholder="방 ID 입력"
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && inputId && onJoin(inputId)}
          />
        </InputBox>
        <ActionButton
          variant="outline"
          onClick={() => inputId && onJoin(inputId)}>
          ID로 입장하기
        </ActionButton>
      </Card>
    </Container>
  );
}

function TimerRoom({
  roomId,
  onLeave,
}: {
  roomId: string;
  onLeave: () => void;
}) {
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
  }, [roomData, config]);

  const handleAutoTransition = async () => {
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
  };

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

  // PIP 창의 배경색을 실시간으로 동기화하는 Effect
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
      <Container mode="focusing" status="idle">
        Loading...
      </Container>
    );

  const content = (isPip: boolean) => (
    <Container mode={roomData.mode} status={roomData.status} isPip={isPip}>
      <Blob
        color={roomData.mode === "focusing" ? "#fecdd3" : "#bbf7d0"}
        size="300px"
        top="-20px"
        right="-20px"
        delay="0s"
      />
      <Blob
        color="#ddd6fe"
        size="250px"
        bottom="-20px"
        left="-20px"
        delay="-4s"
      />

      <Card isPip={isPip}>
        <StatusPill mode={roomData.mode} status={roomData.status} isPip={isPip}>
          {roomData.status === "paused"
            ? "일시정지됨"
            : `${roomData.mode.toUpperCase()} ${roomData.current_cycle}/${roomData.total_cycles}`}
        </StatusPill>

        <TimerDisplay
          mode={roomData.mode}
          status={roomData.status}
          isPip={isPip}>
          {`${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`}
        </TimerDisplay>

        {roomData.status === "idle" ? (
          <>
            <ConfigGrid isPip={isPip}>
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
            </ConfigGrid>
            <ButtonGroup isPip={isPip}>
              <ActionButton
                variant="primary"
                isPip={isPip}
                onClick={() => syncState("running")}>
                사이클 시작하기
              </ActionButton>
            </ButtonGroup>
          </>
        ) : (
          <ButtonGroup isPip={isPip}>
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
          </ButtonGroup>
        )}

        {!isPip && (
          <>
            <Divider style={{ marginTop: "1.5rem" }} />
            <ShareBox>
              <IdBadge
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  alert("방 번호가 복사되었습니다!");
                }}>
                <span>ROOM ID</span>
                <strong>{roomId}</strong>
              </IdBadge>

              <ActionRow>
                <UserIndicator>
                  <div className="dot" />
                  <span>{userCount} Active</span>
                </UserIndicator>

                <div style={{ display: "flex", gap: "4px" }}>
                  <GhostButton
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
                  </GhostButton>
                  <GhostButton onClick={togglePip}>PIP</GhostButton>
                  <GhostButton variant="danger" onClick={onLeave}>
                    Exit
                  </GhostButton>
                </div>
              </ActionRow>
            </ShareBox>
          </>
        )}
      </Card>
    </Container>
  );

  return pipWindow
    ? createPortal(content(true), pipWindow.document.body)
    : content(false);
}

export default function App() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get("room"),
  );
  return (
    <>
      <Global
        styles={css`
          @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #f8fafc;
          }
          * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
          }
        `}
      />
      <Analytics />
      {currentRoom ? (
        <TimerRoom
          roomId={currentRoom}
          onLeave={() => {
            window.history.pushState({}, "", "/");
            setCurrentRoom(null);
          }}
        />
      ) : (
        <Lobby
          onJoin={(id) => {
            window.history.pushState({}, "", `?room=${id}`);
            setCurrentRoom(id);
          }}
        />
      )}
    </>
  );
}
