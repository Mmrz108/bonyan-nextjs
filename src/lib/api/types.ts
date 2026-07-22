export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type ProjectType =
  | "residential"
  | "commercial"
  | "infrastructure"
  | "industrial"
  | "mixed_use"
  | "other";

export type ProjectMemberRole =
  | "project_manager"
  | "supervisor"
  | "inspector"
  | "reviewer"
  | "viewer"
  | "contractor";

export type StageStatus = "not_started" | "in_progress" | "completed";

export type ProjectLocation = {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  country_code: string;
  postal_code: string;
  latitude: string | null;
  longitude: string | null;
  geofence_radius_m: number | null;
  is_primary: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  id: string;
  user: string;
  user_email: string;
  member_role: ProjectMemberRole;
  is_active: boolean;
  joined_at: string;
  left_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  description: string;
  client: string | null;
  client_name: string | null;
  contract: string | null;
  contract_reference: string | null;
  status: ProjectStatus;
  project_type: ProjectType;
  location: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  start_date: string | null;
  expected_completion_date: string | null;
  client_user: string | null;
  locations: ProjectLocation[];
  members: ProjectMember[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Lightweight list row — same serializer shape as detail. */
export type ProjectListItem = Project;

export type ProjectStage = {
  id: string;
  project: string;
  name: string;
  name_ar: string;
  description: string;
  order: number;
  status: StageStatus;
  start_date: string | null;
  completion_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectWritePayload = {
  code: string;
  name: string;
  name_ar?: string;
  description?: string;
  contract: string;
  client?: string | null;
  status: ProjectStatus;
  project_type: ProjectType;
  location?: string;
  address?: string;
  latitude?: string | null;
  longitude?: string | null;
  start_date?: string | null;
  expected_completion_date?: string | null;
  client_user?: string | null;
  locations?: Array<Partial<ProjectLocation> & { name: string }>;
  members?: Array<{
    user: string;
    member_role: ProjectMemberRole;
    is_active?: boolean;
  }>;
};

export type StageWritePayload = {
  name: string;
  name_ar?: string;
  description?: string;
  order: number;
  status: StageStatus;
  start_date?: string | null;
  completion_date?: string | null;
};

export type ContractStatus =
  | "draft"
  | "active"
  | "suspended"
  | "completed"
  | "cancelled";

export type Contract = {
  id: string;
  client: string;
  client_name: string | null;
  reference_code: string;
  title: string;
  title_ar: string;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  planned_visits_per_month: number | null;
  scope_summary: string;
  notes: string;
  commercial_notes: string;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteVisitStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type SiteVisit = {
  id: string;
  project: string;
  project_name: string;
  project_stage: string | null;
  stage_name: string | null;
  assigned_to: string;
  assigned_to_email: string;
  title: string;
  scheduled_date: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  status: SiteVisitStatus;
  latitude: string | null;
  longitude: string | null;
  notes: string;
  check_in_time: string | null;
  check_out_time: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SiteVisitListItem = SiteVisit;

export type SiteVisitWritePayload = {
  project: string;
  project_stage?: string | null;
  assigned_to: string;
  title?: string;
  scheduled_date?: string | null;
  notes?: string;
  latitude?: string | null;
  longitude?: string | null;
};

export type SiteVisitListParams = {
  search?: string;
  status?: SiteVisitStatus | "";
  project?: string;
  scheduled_after?: string;
  scheduled_before?: string;
  assigned_to?: string;
  ordering?: string;
  page?: number;
};

export type ChecklistStatus = "draft" | "in_progress" | "completed";
export type ChecklistResultValue = "pass" | "fail" | "not_applicable";

export type InspectionChecklistItem = {
  id: string;
  order: number;
  code: string;
  prompt: string;
  prompt_ar: string;
  help_text: string;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
};

export type InspectionResult = {
  id: string;
  item: string;
  item_order: number;
  item_prompt: string;
  result: ChecklistResultValue;
  notes: string;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InspectionChecklist = {
  id: string;
  is_template: boolean;
  code: string;
  title: string;
  title_ar: string;
  description: string;
  version: number;
  is_active: boolean;
  project: string | null;
  site_visit: string | null;
  site_visit_title: string | null;
  template: string | null;
  status: ChecklistStatus;
  notes: string;
  completed_at: string | null;
  completed_by: string | null;
  items: InspectionChecklistItem[];
  results: InspectionResult[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type IssuePhoto = {
  id: string;
  issue: string;
  storage_key: string;
  file_name: string;
  content_type: string;
  byte_size: number;
  caption: string;
  taken_at: string | null;
  latitude: string | null;
  longitude: string | null;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  client_generated_id: string | null;
  download_url: string;
  created_at: string;
  updated_at: string;
};

export type ReportStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "sent";

export type PdfStatus = "none" | "queued" | "generating" | "ready" | "failed";
export type PdfLanguage = "en" | "ar" | "bilingual";

export type ReportStatusHistoryItem = {
  id: string;
  from_status: ReportStatus | null;
  to_status: ReportStatus;
  note: string;
  changed_by: string | null;
  changed_at: string;
};

export type ReportAttachment = {
  id: string;
  report: string;
  file_name: string;
  content_type: string;
  byte_size: number;
  caption: string;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  download_url: string;
  created_at: string;
  updated_at: string;
};

export type ReportSignatureKind = "supervisor" | "client" | "approval";

export type ReportSignature = {
  id: string;
  report: string;
  kind: ReportSignatureKind;
  file_name: string;
  content_type: string;
  byte_size: number;
  content_sha256: string;
  signer: string | null;
  signer_user_email: string | null;
  signer_name: string;
  signer_email: string;
  signer_title: string;
  signed_at: string;
  statement: string;
  download_url: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportListItem = {
  id: string;
  site_visit: string;
  site_visit_title: string;
  project: string;
  project_name: string;
  title: string;
  summary: string;
  status: ReportStatus;
  author: string | null;
  author_email: string | null;
  allowed_transitions: ReportStatus[];
  pdf_status: PdfStatus;
  pdf_language: PdfLanguage;
  pdf_generated_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Report = ReportListItem & {
  review_notes: string;
  rejection_reason: string;
  submitted_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  sent_by: string | null;
  updated_by: string | null;
  status_history: ReportStatusHistoryItem[];
  attachments: ReportAttachment[];
  signatures: ReportSignature[];
  pdf_file_name: string;
  pdf_byte_size: number;
  pdf_error: string;
  pdf_task_id: string;
  project_info?: {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    status?: string;
  } | null;
  site_visit_info?: {
    id: string;
    title: string;
    scheduled_date?: string | null;
    status?: string;
    assigned_to_email?: string;
  } | null;
  inspector?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  issues?: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
  }>;
  checklist_results?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
};

export type ReportPdfStatus = {
  id: string;
  pdf_status: PdfStatus;
  pdf_language: PdfLanguage;
  pdf_file_name: string;
  pdf_byte_size: number;
  pdf_generated_at: string | null;
  pdf_error: string;
  pdf_task_id: string;
};

export type ReportListParams = {
  search?: string;
  status?: ReportStatus | "";
  project?: string;
  site_visit?: string;
  ordering?: string;
  page?: number;
};

export type ReportWritePayload = {
  site_visit: string;
  title: string;
  summary?: string;
};

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export type Issue = {
  id: string;
  site_visit: string;
  site_visit_title: string;
  project: string;
  project_name: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  created_by: string | null;
  created_by_email: string | null;
  assigned_to: string | null;
  assigned_to_email: string | null;
  due_date: string | null;
  resolved_at: string | null;
  allowed_transitions: IssueStatus[];
  created_at: string;
  updated_at: string;
};

export type IssueListItem = Issue;

export type IssueWritePayload = {
  site_visit: string;
  title: string;
  description?: string;
  severity: IssueSeverity;
  assigned_to?: string | null;
  due_date?: string | null;
};

export type DashboardMetrics = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  upcomingSiteVisits: number;
  pendingReports: number;
  openIssues: number;
  overdueIssues: number;
};

export type DashboardData = {
  metrics: DashboardMetrics;
  recentSiteVisits: SiteVisitListItem[];
  upcomingSiteVisits: SiteVisitListItem[];
};

export type ProjectListParams = {
  search?: string;
  status?: ProjectStatus | "";
  project_type?: ProjectType | "";
  ordering?: string;
  page?: number;
};
