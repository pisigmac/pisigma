export interface ConfigEntry {
  namespace: string;
  key: string;
  value: string;
  version: number;
  updated_at: string;
}

export interface ConfigSnapshot {
  namespace: string;
  entries: ConfigEntry[];
  exported_at: string;
}
