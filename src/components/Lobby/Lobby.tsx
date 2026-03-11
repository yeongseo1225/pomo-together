import React, { useState } from "react";
import { generateRoomId } from "../../utils";
import { ActionButton, InputBox } from "../common";
import * as S from "./Lobby.styles";

interface LobbyProps {
  onJoin: (id: string) => void;
}

export default function Lobby({ onJoin }: LobbyProps) {
  const [inputId, setInputId] = useState("");
  return (
    <S.Container>
      <S.Blob
        color="#ddd6fe"
        size="450px"
        top="-100px"
        left="-150px"
        delay="0s"
      />
      <S.Blob
        color="#fecdd3"
        size="350px"
        bottom="-50px"
        right="-100px"
        delay="-5s"
      />
      <S.Card>
        <S.Logo>🍅</S.Logo>
        <S.Title>Pomogether</S.Title>
        <S.Description>함께라면 더 깊이 몰입할 수 있어요</S.Description>
        <ActionButton
          variant="primary"
          onClick={() => onJoin(generateRoomId())}>
          새 방 만들기
        </ActionButton>
        <S.DividerWrapper>
          <S.DividerLine />
          <S.DividerText>OR</S.DividerText>
          <S.DividerLine />
        </S.DividerWrapper>
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
      </S.Card>
    </S.Container>
  );
}
