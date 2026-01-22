
export interface AuthenticationMethod {
  id: number;
  name: string;
}

export interface PreCheckMethod {
  id: number;
  name: string;
}


export interface AcademicEventType {
  id: number;
  name: string;
}


export interface EmployeeApi {
  employee_id: number;
  name: string;
  unique_code: string;
  email: string;
  organization: string;
  department: string;
  designation: string;
}

export interface StudentApi {
  user_id: number;
  full_name: string;
  permanent_registration_number: string;
}


export interface AcademicActivity {
  id: number;
  activity_name: string;

  specialization: string;
  academic_group: string;
  lag: string;

  description: string | null;
  start_date: string;
  end_date: string;
  exam_start_date: string | null;

  amount: number | null;
  amount_refundable: boolean;

  completed_students: number;
  total_students: number;

  employee_list: EmployeeApi[];
  pre_check_methods: PreCheckMethod[];
  authentication_methods: AuthenticationMethod[];

  selection_name: string | null;
  created_by: string;

  students: StudentApi[];
}



export interface AcademicActivityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicActivity[];
}

// Draggable Card Component
export interface DraggableCardProps {
  admitCard: AcademicActivity;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  handleCardClick: (id: number) => void; // ✅ FIX
  handleEdit: (card: AcademicActivity) => void;
  handleDelete: (id: number) => void;
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
  loadingEdit: number | null;

  formatDate: (date?: string | null) => string;
  getDaysAgo: (date?: string | null) => string;
  getDaysUntilExam: (date?: string | null) => number | null;
  getProgressColor: (completed: number, total: number) => string;
  getProgressPercentage: (completed: number, total: number) => number;
  isExamPassed: (date?: string | null) => boolean;
  getExamBadgeColor: (days: number | null) => string;
}

export interface ActivityFormData {
  courseId: number | '';
  courseName: string;
  semester: number | '';
  activityName: string;
  startDate: string;
  endDate: string;
  examDate: string;
  assignedTo: number[];
  selectionName: string
}


export type ActivityPayload = {
  activity_name: string;
  selection_name: string;
  start_date: string;
  end_date: string;
  exam_start_date: string | null;
  employee_ids: string;
  student_ids: string;
  lag_ids: string | null;
  authentication_method_ids: string;
  pre_check_method_ids: string;
} & Partial<{ activity_id: number }>;

export interface StudentAddress {
  address: string;
  address_line_2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface StudentAdmitCard {
  student_id: number;
  full_name: string;
  permanent_registration_number: string;
  mobile: string;
  gender: string;
  course_name: string;
  date_of_birth: string;
  email:string;
  father_name: string;
  mother_name: string;
  blood_group: string | null
  aadhar_number:string,
  total_prechecks: number;
  completed_prechecks: number;
  total_authentications: number;
  completed_authentications: number;

  all_precheck_names: string[];
  completed_precheck_names: string[];

  all_authentication_names: string[];
  completed_authentication_names: string[];

  library_noc_clearance_status: "PENDING" | "COMPLETED" | "REJECTED";

  finger_iso_1: string | null;
  finger_iso_2: string | null;
  finger_iso_3: string | null;

  exceptional_approval: boolean;

  activity_completed: boolean;
  activity_completed_issued_by: string | null;
  activity_completed_issued_at: string | null;

  admit_card_download_count: number;

  no_dues_clearance_count: number;
  library_noc_clearance_count: number;

  admit_cards_list: any[]; // refine later if structure is known
  is_admit_card_available: boolean;
  admit_card_link_info: Record<string, any>;
  address: StudentAddress; // ✅ added address
}


export interface StudentsPagination {
  total_admit_cards: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentAdmitCard[];
}


export interface AdmitCardDetailsResponse {
  id: number;
  activity_name: string;
  selection_name:string | null
  description: string | null;
  start_date: string;
  end_date: string;
  exam_start_date: string | null;

  total_students: number;
  verified_students: number;

  students: StudentsPagination;
}


export interface AuthenticationMethod {
  authentication_type: string;
  completed_count: number;
  total_count: number;
}

export interface PreCheckMethod {
  pre_check_type: string;
  completed_count: number;
  total_count: number;
}

export interface ActivityStats {
  activity_id: number;
  activity_name: string;
  employee_ids: number[];
  total_students: number;
  completed_students: number;
  authentication_methods: AuthenticationMethod[];
  pre_check_methods: PreCheckMethod[];
  students_with_admit_card_count: number;
}


