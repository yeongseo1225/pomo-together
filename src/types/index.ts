export type AppStatus = "idle" | "running" | "paused";
export type TimerMode = "focusing" | "break";

export interface RoomData {
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
