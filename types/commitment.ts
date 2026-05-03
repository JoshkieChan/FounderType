export type CommitmentStatus = 'active' | 'completed' | 'abandoned';

export interface Commitment {
  // Identification & Ownership
  id: string;
  user_id: string;
  
  // Core Content
  commitment_text: string;
  daily_action: string | null;
  founder_type: string;
  
  // Timestamps (ISO 8601 UTC)
  created_at: string;
  deadline: string; 
  completed_at: string | null;
  abandoned_at: string | null;
  edited_at: string | null;
  
  // State & Progress
  status: CommitmentStatus;
  check_ins: string[]; // Array of "YYYY-MM-DD"
  
  // Invariants (Required but Nullable)
  days_completed: number | null; 
  abandoned_on_day: number | null; 
}
