import styled from "@emotion/styled";

export const ActionButton = styled.button<{
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

export const InputBox = styled.div<{ isPip?: boolean }>`
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
