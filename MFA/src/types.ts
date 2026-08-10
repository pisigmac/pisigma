export interface TOTPSetup {
  user_id: string;
  secret: string;
  uri: string;
  backup_codes: string[];
}

export interface TOTPVerifyResult {
  valid: boolean;
  user_id: string;
}

export interface BackupCodes {
  user_id: string;
  codes: string[];
}
