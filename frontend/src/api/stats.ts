import api from "./axios";
import type { PlatformStatsDTO } from "../types";

export async function getPlatformStats(): Promise<PlatformStatsDTO> {
  const res = await api.get<PlatformStatsDTO>("/api/stats");
  return res.data;
}
