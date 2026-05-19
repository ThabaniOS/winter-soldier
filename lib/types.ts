export type Database = {
  public: {
    Tables: {
      weeks: { Row: Week; Insert: WeekInsert; Update: Partial<WeekInsert> }
      strength_targets: { Row: StrengthTarget; Insert: StrengthTargetInsert; Update: Partial<StrengthTargetInsert> }
      strength_sessions: { Row: StrengthSession; Insert: StrengthSessionInsert; Update: Partial<StrengthSessionInsert> }
      strength_logs: { Row: StrengthLog; Insert: StrengthLogInsert; Update: Partial<StrengthLogInsert> }
      running_logs: { Row: RunningLog; Insert: RunningLogInsert; Update: Partial<RunningLogInsert> }
      athletic_sessions: { Row: AthleticSession; Insert: AthleticSessionInsert; Update: Partial<AthleticSessionInsert> }
      sport_sessions: { Row: SportSession; Insert: SportSessionInsert; Update: Partial<SportSessionInsert> }
      meditation_sessions: { Row: MeditationSession; Insert: MeditationSessionInsert; Update: Partial<MeditationSessionInsert> }
      sql_learning_log: { Row: SqlLearningLog; Insert: SqlLearningLogInsert; Update: Partial<SqlLearningLogInsert> }
      books_read: { Row: BookRead; Insert: BookReadInsert; Update: Partial<BookReadInsert> }
      writing_pieces: { Row: WritingPiece; Insert: WritingPieceInsert; Update: Partial<WritingPieceInsert> }
      phase_markers: { Row: PhaseMarker; Insert: PhaseMarkerInsert; Update: Partial<PhaseMarkerInsert> }
    }
  }
}

export type Week = {
  id: number
  week_number: number
  start_date: string
  end_date: string
  identity_score: number | null
  identity_note: string | null
  sleep_note: string | null
  create_consume_note: string | null
  raiis_note: string | null
  blocker_note: string | null
  next_week_priorities: string | null
  reviewed_at: string | null
}
export type WeekInsert = Omit<Week, 'id'>

export type StrengthTarget = {
  id: number
  lift_name: string
  baseline_weight: number | null
  baseline_reps: number | null
  target_weight: number | null
  target_reps: number | null
  target_type: 'weight_for_reps' | 'reps_unbroken' | null
}
export type StrengthTargetInsert = Omit<StrengthTarget, 'id'>

export type StrengthSession = {
  id: number
  week_id: number | null
  session_date: string
  session_type: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | null
  notes: string | null
}
export type StrengthSessionInsert = Omit<StrengthSession, 'id'>

export type StrengthLog = {
  id: number
  session_id: number | null
  lift_name: string
  weight: number | null
  reps: number | null
  set_number: number | null
  notes: string | null
}
export type StrengthLogInsert = Omit<StrengthLog, 'id'>

export type RunningLog = {
  id: number
  week_id: number | null
  run_date: string
  distance_km: number
  notes: string | null
}
export type RunningLogInsert = Omit<RunningLog, 'id'>

export type AthleticSession = {
  id: number
  week_id: number | null
  session_date: string
  activity: string | null
  notes: string | null
}
export type AthleticSessionInsert = Omit<AthleticSession, 'id'>

export type SportSession = {
  id: number
  session_date: string
  sport: 'golf' | 'padel' | null
  notes: string | null
}
export type SportSessionInsert = Omit<SportSession, 'id'>

export type MeditationSession = {
  id: number
  session_start: string
  session_end: string
  technique: '478' | 'box' | 'coherent' | 'calm' | null
  cycles_completed: number | null
  duration_seconds: number | null
}
export type MeditationSessionInsert = Omit<MeditationSession, 'id'>

export type SqlLearningLog = {
  id: number
  log_date: string
  minutes_spent: number
  resource: 'mode' | 'datalemur' | 'supabase' | 'other' | null
  topic: string | null
  notes: string | null
}
export type SqlLearningLogInsert = Omit<SqlLearningLog, 'id'>

export type BookRead = {
  id: number
  title: string
  started_date: string
  finished_date: string | null
  notes: string | null
}
export type BookReadInsert = Omit<BookRead, 'id'>

export type WritingPiece = {
  id: number
  title: string
  type: 'journal' | 'linkedin_post' | 'thabani_os_post' | 'other' | null
  finished_date: string
  link_or_location: string | null
  notes: string | null
}
export type WritingPieceInsert = Omit<WritingPiece, 'id'>

export type PhaseMarker = {
  id: number
  day_number: 0 | 30 | 45 | 60 | 90
  marker_date: string
  reflection_text: string | null
  completed_at: string | null
}
export type PhaseMarkerInsert = Omit<PhaseMarker, 'id'>
