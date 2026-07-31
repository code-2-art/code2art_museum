export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "published";

export type SubmissionType =
  | "artwork"
  | "project"
  | "prompt_skill"
  | "course"
  | "history"
  | "profile";

export type SubmissionRow = {
  id: number;
  user_id: string;
  status: SubmissionStatus;
  submission_type: SubmissionType;
  title: string;
  creator_name: string;
  creation_year: string | null;
  summary: string;
  process_notes: string | null;
  tools: string[];
  source_links: string[];
  license: string;
  rights_confirmed: boolean;
  review_note: string | null;
  published_record_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmissionMediaRow = {
  id: number;
  submission_id: number;
  user_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      submissions: {
        Row: SubmissionRow;
        Insert: {
          user_id: string;
          status?: SubmissionStatus;
          submission_type: SubmissionType;
          title: string;
          creator_name: string;
          creation_year?: string | null;
          summary: string;
          process_notes?: string | null;
          tools?: string[];
          source_links?: string[];
          license?: string;
          rights_confirmed?: boolean;
          submitted_at?: string | null;
        };
        Update: Partial<Pick<SubmissionRow,
          | "status"
          | "submission_type"
          | "title"
          | "creator_name"
          | "creation_year"
          | "summary"
          | "process_notes"
          | "tools"
          | "source_links"
          | "license"
          | "rights_confirmed"
          | "submitted_at"
        >>;
        Relationships: [];
      };
      submission_media: {
        Row: SubmissionMediaRow;
        Insert: {
          submission_id: number;
          user_id: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
        };
        Update: never;
        Relationships: [];
      };
      submission_reviews: {
        Row: {
          id: number;
          submission_id: number;
          reviewer_id: string;
          from_status: string | null;
          to_status: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          submission_id: number;
          reviewer_id: string;
          from_status?: string | null;
          to_status: string;
          note?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      review_submission: {
        Args: {
          p_submission_id: number;
          p_to_status: "in_review" | "changes_requested" | "approved" | "rejected";
          p_note?: string | null;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
