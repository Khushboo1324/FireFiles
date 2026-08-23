// Datetime and date values remain transport strings until a UI explicitly converts them.
export type ISODateTimeString = string;
export type ISODateString = string;

export interface ParticipantCompact {
  id: number;
  name: string;
  avatar_url: string | null;
}

export interface Participant extends ParticipantCompact {
  email: string | null;
}

export interface MeetingListItem {
  id: number;
  title: string;
  meeting_date: ISODateTimeString;
  duration_seconds: number;
  media_url: string | null;
  source_type: string;
  participants: ParticipantCompact[];
  short_summary: string | null;
}

export interface MeetingListResponse {
  items: MeetingListItem[];
  total: number;
}

export interface MeetingSummary {
  id: number;
  overview: string;
  short_summary: string | null;
}

export interface TranscriptSegment {
  id: number;
  sequence_index: number;
  start_time_ms: number;
  end_time_ms: number;
  text: string;
  speaker: ParticipantCompact | null;
}

export interface ActionItem {
  id: number;
  sequence_index: number;
  text: string;
  completed: boolean;
  timestamp_ms: number | null;
  assignee: ParticipantCompact | null;
}

export interface Topic {
  id: number;
  name: string;
  sequence_index: number;
}

export interface Chapter {
  id: number;
  title: string;
  summary: string | null;
  start_time_ms: number;
  end_time_ms: number | null;
  sequence_index: number;
}

export interface MeetingDetail {
  id: number;
  title: string;
  meeting_date: ISODateTimeString;
  duration_seconds: number;
  media_url: string | null;
  source_type: string;
  participants: Participant[];
  summary: MeetingSummary | null;
  transcript_segments: TranscriptSegment[];
  action_items: ActionItem[];
  topics: Topic[];
  chapters: Chapter[];
}

export interface MeetingParticipantInput {
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  is_organizer?: boolean;
}

export interface MeetingCreateRequest {
  title: string;
  meeting_date: ISODateTimeString;
  duration_seconds: number;
  media_url?: string | null;
  participants: MeetingParticipantInput[];
}
