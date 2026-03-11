import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

export const moveBlob = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -40px) scale(1.1); }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100dvh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  transition: background-color 1s ease;
  background-color: #f3f0ff;
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

export const Card = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  padding: 2rem;
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
  gap: 1rem;
  justify-content: center;
`;

export const Logo = styled.div`
  font-size: 3rem;
`;

export const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  color: #1e293b;
`;

export const Description = styled.p`
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const DividerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e2e8f0;
`;

export const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: currentColor;
`;

export const DividerText = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
`;
