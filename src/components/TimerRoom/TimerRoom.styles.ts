import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { AppStatus, TimerMode } from "../../types";

export const moveBlob = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -40px) scale(1.1); }
`;

export const Container = styled.div<{
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

export const Blob = styled.div<{
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

export const Card = styled.div<{ isPip?: boolean }>`
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

export const StatusPill = styled.div<{
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

export const TimerDisplay = styled.h1<{
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

export const ConfigGrid = styled.div<{ isPip?: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${(props) => (props.isPip ? "6px" : "10px")};
  margin: ${(props) => (props.isPip ? "0.2rem 0" : "0.5rem 0")};
`;

export const ButtonGroup = styled.div<{ isPip?: boolean }>`
  display: flex;
  gap: ${(props) => (props.isPip ? "6px" : "10px")};
  margin-top: ${(props) => (props.isPip ? "5px" : "10px")};
`;

export const ShareBox = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Divider = styled.div`
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(99, 102, 241, 0.1),
    transparent
  );
  width: 100%;
  margin-top: 1.5rem;
`;

export const IdBadge = styled.button`
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

export const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.4);
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.6);
`;

export const GhostButton = styled.button<{ variant?: "danger" }>`
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

export const UserIndicator = styled.div`
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

export const GhostButtonGroup = styled.div`
  display: flex;
  gap: 4px;
`;
