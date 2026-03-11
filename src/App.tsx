import React, { useState } from "react";
import { Global, css } from "@emotion/react";
import { Analytics } from "@vercel/analytics/react";
import Lobby from "./components/Lobby";
import TimerRoom from "./components/TimerRoom";

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
