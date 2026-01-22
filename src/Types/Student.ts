export interface Student {
  id: number;
  enrollmentNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  primaryPhone: string;
  selectedCourse: string;
  semester: string;
  section: string;
  status: 'active' | 'inactive' | 'suspended' | 'graduated';

  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  religion: string;
  fatherName: string;
  motherName: string;

  corrAddress: string;
  corrCity: string;
  corrState: string;
  corrCountry: string;
  corrPincode: string;

  permAddress: string;
  permCity: string;
  permState: string;
  permCountry: string;
  permPincode: string;

  profilePicture: string | null;

  documentStatus: 'complete' | 'incomplete' | 'pending';
  hasPhoto: boolean;
  hasAadhar: boolean;
  hasBloodGroup: boolean;
  hasCaste: boolean;
  aadhar_number:string;
}

export interface Organization {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  name: string;
  alias: string;
  organization: Organization;
  duration: number;
  mode_count: number;
}

export interface Specialization {
  id: number;
  course: Course;
  name: string;
  course_code: string;
  alias: string | null;
  course_specialization: string;
}

export interface AcademicGroup {
  id: number;
  specialization: Specialization;
  name: string;
  intake_limit: number;
  fees: number;
}

export interface LeastAcademicGroup {
  id: number;
  academic_group: AcademicGroup;
  name: string;
  intake_limit: number;
  least_academic_groups: string;
}

export interface ContactNumber {
  id: number;
  student: number;
  contact_type: string;
  country_code: string;
  area_code: string | null;
  number: string;
  is_primary: boolean;
  is_available_on_whatsapp: boolean;
}

export interface StudentConfiguration {
  id: number;
  finger_iso_1: string | null;
  finger_iso_2: string | null;
  finger_iso_3: string | null;
  id_card_photo: string | null;
  id_card_photo_back: string | null;
  id_card_student_picture: string | null;
  valid_from_date: string;
  valid_to_date: string;
}

export interface Address {
  id: number;
  student: number;
  address_type: 'Current' | 'Permanent';
  address: string;
  address_line_2?: string | null;
  city: { id: number; name: string; code?: string | null; state: number };
  state: { id: number; name: string; code?: string | null; country: number };
  country: { id: number; name: string; code?: string | null };
  pincode: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiStudent {
  user_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  lag: LeastAcademicGroup;
  contact_numbers: ContactNumber[];
  latest_photo: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
  profile_picture: string | null;
  permanent_registration_number: string;
  provisional_fees_status: boolean;
  registration_status: boolean;
  fees_payment_status: boolean;
  provisional_academic_group: AcademicGroup;
  admission_status: string | null;
  student_configuration: StudentConfiguration | null;

  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  religion?: string;
  father_name?: string;
  mother_name?: string;
  aadhar_number?: string;
  category?: string;

  addresses?: Address[]; // ✅ Add addresses field
  correspondence_address?: string;
  correspondence_city?: string;
  correspondence_state?: string;
  correspondence_country?: string;
  correspondence_pincode?: string;
  permanent_address?: string;
  permanent_city?: string;
  permanent_state?: string;
  permanent_country?: string;
  permanent_pincode?: string;
  
}




export const transformApiStudentToStudent = (student: ApiStudent): Student => {
  // Get current/correspondence address and permanent address
  const currentAddress: Address | undefined = student.addresses?.find(a => a.address_type === 'Current');
  const permanentAddress: Address | undefined = student.addresses?.find(a => a.address_type === 'Permanent');

  return {
    id: student.user_id,

    enrollmentNo: student.permanent_registration_number || `TEMP-${student.user_id}`,

    firstName: student.first_name ?? "",
    middleName: student.middle_name ?? "",
    lastName: student.last_name ?? "",
    email: student.email ?? "",

    primaryPhone: student.contact_numbers?.find(c => c.is_primary)?.number ?? "N/A",

    selectedCourse: student.lag?.academic_group?.specialization?.course?.alias ?? "N/A",
    semester: student.lag?.academic_group?.name?.replace("Semester ", "") ?? "1",
    section: student.lag?.name?.replace("Section ", "") ?? "A",
    status: student.status ? "active" : "inactive",

    dateOfBirth: student.date_of_birth ?? "",
    gender: student.gender ?? "",
    bloodGroup: student.blood_group ?? "",
    religion: student.religion ?? "",
    fatherName: student.father_name ?? "",
    motherName: student.mother_name ?? "",

    corrAddress: currentAddress?.address ?? student.correspondence_address ?? "",
    corrCity: currentAddress?.city?.name ?? student.correspondence_city ?? "",
    corrState: currentAddress?.state?.name ?? student.correspondence_state ?? "",
    corrCountry: currentAddress?.country?.name ?? student.correspondence_country ?? "India",
    corrPincode: currentAddress?.pincode ?? student.correspondence_pincode ?? "",

    permAddress: permanentAddress?.address ?? currentAddress?.address ?? student.permanent_address ?? "",
    permCity: permanentAddress?.city?.name ?? currentAddress?.city?.name ?? student.permanent_city ?? "",
    permState: permanentAddress?.state?.name ?? currentAddress?.state?.name ?? student.permanent_state ?? "",
    permCountry: permanentAddress?.country?.name ?? currentAddress?.country?.name ?? student.permanent_country ?? "India",
    permPincode: permanentAddress?.pincode ?? currentAddress?.pincode ?? student.permanent_pincode ?? "",

    profilePicture: student.profile_picture,

    documentStatus: student.latest_photo && student.aadhar_number ? "complete" : "incomplete",
    hasPhoto: !!student.profile_picture,
    hasAadhar: !!student.aadhar_number,
    hasBloodGroup: !!student.blood_group,
    hasCaste: !!student.category,
     aadhar_number: student.aadhar_number ?? "", // ✅ Add this line
  };
};
