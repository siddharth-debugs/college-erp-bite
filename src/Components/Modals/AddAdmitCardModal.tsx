import { useState, useEffect, useMemo } from 'react';
import { X, Save, Search, Users, CheckCircle2, UserCheck, Maximize2, Minimize2, Circle } from 'lucide-react';
import Select from 'react-select';

import { GetData, Postdata } from '../../API/GlobalApi';
import type { AcademicActivity, ActivityFormData, ActivityPayload } from '../../Types/AdmitCard';
import Notifier from '../../Utils/notifier';

// Date validation: Start date must be current date or later
// Server-side deployment disabled - using client-side only
interface AddAdmitCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: {
    id: string;
    courseName: string;
    semester: string;
    activityName: string;
    startDate: string;
    endDate: string;
    examDate: string;
    assignedTo: number[];
    courseId?: string;
  };
  preloadedCourses?: any[];
  preloadedEmployees?: any[];
  admitCard?: AcademicActivity | null;
}



export interface Course {
  id: number;
  name: string;
  alias: string;
  // additional fields for display
  semesterCount?: number;
  mode?: 'Semester' | 'Year';
}

export interface Student {
  id: number; // map from user_id
  name: string; // map from full_name
  registrationNo: string; // permanent_registration_number
  mobile: string;
  email: string;
  balance: number;
}

export interface Employee {
  id: number;           // map from employee_id
  name: string;
  designation: string;
  uniqueCode?: string;  // optional
  email?: string;       // optional
  organization?: string; // optional
  department?: string;   // optional
}

export interface Lag {
  id: number;
  name: string;
  students: Student[];
}


export interface AcademicGroup {
  id: number;
  name: string; // "Semester 1"
  lags: Lag[];
}

export interface SpecializationResponse {
  id: number;
  full_name: string;
  course_code: string;
  academic_year: string;
  academic_groups: AcademicGroup[];
}


export function AddAdmitCardModal({ isOpen, onClose, onSave, initialData, admitCard }: AddAdmitCardModalProps) {
  const isEditMode = Boolean(admitCard?.id);
  console.log("admitcard", admitCard)
  const [formData, setFormData] = useState<ActivityFormData>({
    courseId: '',
    courseName: '',
    semester: '',
    activityName: '',
    startDate: '',
    endDate: '',
    examDate: '',
    assignedTo: [] as number[],
    selectionName: ''
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [academicGroups, setAcademicGroups] = useState<AcademicGroup[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [saving, setSaving] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullView, setIsFullView] = useState(false);


  console.log("isEditMode", isEditMode)

  const fetchAcademicGroupsForEdit = async (courseId: number) => {
    if (!courseId) return;

    setSemesterOptions([]);
    setStudents([]);
    setAcademicGroups([]);

    const res: AcademicGroup[] = await GetData(
      `finance/specializations/${courseId}/academic-groups/`
    );

    setAcademicGroups(res);

    setSemesterOptions(
      res.map(group => ({
        value: group.id,
        label: group.name
      }))
    );
  };
  const getActivityForEdit = async (activityId: number) => {
    const res = await GetData(
      `academics/activities/update/?activity_id=${activityId}`
    );

    const data = res;

    // 1️⃣ Set form data (same keys as CREATE)
    setFormData(prev => ({
      ...prev,
      courseId: data.specialization?.id ?? '',
      courseName: data.specialization?.course ?? '',
      semester: data.academic_group ?? '',
      activityName: data.activity_name ?? '',
      startDate: data.start_date ?? '',
      endDate: data.end_date ?? '',
      examDate: data.exam_start_date ?? '',
      assignedTo: data.employee_list?.map(
        (emp: any) => emp.employee_id
      ) ?? [],
      selectionName: data.selection_name ?? ''
    }));

    // 2️⃣ Fetch academic groups (IMPORTANT)
    await fetchAcademicGroupsForEdit(data.specialization?.id);

    // 3️⃣ Pre-select students from API
    setSelectedStudents(
      data.students?.map((stu: any) => stu.user_id) ?? []
    );
  };

  useEffect(() => {
    if (admitCard?.id) {
      // 🔴 EDIT MODE
      getActivityForEdit(admitCard.id);
    }
  }, [admitCard]);


  useEffect(() => {
    const fetchCourses = async () => {
      const res = await GetData("academics/get-all-courses-unpaginated/");
      if (Array.isArray(res?.data)) {
        setCourses(res.data);

        setCourseOptions(
          res.data.map((course: Course) => ({
            value: course.id,
            label: course.name
          }))
        );
      }
    };

    fetchCourses();
  }, []);

  const handleCourseChange = async (option: any) => {
    const courseId = option?.value || "";

    setFormData(prev => ({
      ...prev,
      courseId,
      courseName: option?.label ?? '',
      semester: '' // reset semester when course changes
    }));

    setSemesterOptions([]);
    setStudents([]);
    setAcademicGroups([]);

    if (!courseId) return;

    const res: AcademicGroup[] = await GetData(
      `finance/specializations/${courseId}/academic-groups/`
    );

    console.log("res ===", res);

    // Save academic groups directly
    setAcademicGroups(res);

    // Build semester dropdown
    setSemesterOptions(
      res.map(group => ({
        value: group.id, // number
        label: group.name
      }))
    );

  };


  useEffect(() => {
    if (!formData.semester) {
      setStudents([]);
      setSelectedStudents([]); // clear selection
      setStudentCount(0);
      return;
    }

    const selectedGroup = academicGroups.find(
      group => group.id === formData.semester
    );

    if (!selectedGroup) {
      setStudents([]);
      setSelectedStudents([]);
      setStudentCount(0);
      return;
    }

    const semesterStudents: Student[] = selectedGroup.lags.flatMap(lag =>
      lag.students.map((stu: any) => ({
        id: stu.user_id,
        name: stu.full_name,
        registrationNo: stu.permanent_registration_number,
        mobile: stu.mobile_number,
        email: stu.email,
        balance: stu.balance
      }))
    );

    // Update students
    setStudents(semesterStudents);

    // Update total count
    setStudentCount(semesterStudents.length);

    // Pre-select all students
    if (!isEditMode) {
      setSelectedStudents(semesterStudents.map(s => s.id));
    }
  }, [formData.semester, academicGroups, isEditMode]);



  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();

    return students.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.registrationNo.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);


  const getHelpdeskPerson = async () => {
    const res = await GetData("staff/unpaginated-employee-list/");
    if (res?.employees) {
      const mappedEmployees: Employee[] = res.employees.map((emp: any) => ({
        id: emp.employee_id,
        name: emp.name,
        designation: emp.designation,
        uniqueCode: emp.unique_code,
        email: emp.email,
        organization: emp.organization,
        department: emp.department
      }));
      setEmployees(mappedEmployees);
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    getHelpdeskPerson();
  }, []);


  const employeeOptions = useMemo(() => {
    return employees.map(employee => ({
      value: employee.id,
      label: `${employee.name} - ${employee.designation}`,
      employeeData: employee, // optional if you need full object
    }));
  }, [employees]);



  // Auto-populate Process Name based on course, semester, and student selection
  useEffect(() => {
    // If course or semester is not selected, reset activityName
    if (!formData.courseName || !formData.semester) {
      setFormData(prev => ({
        ...prev,
        activityName: ''
      }));
      return;
    }

    // Get the semester name from semesterOptions
    const semesterOption = semesterOptions.find(opt => opt.value === formData.semester);
    const semesterLabel = semesterOption ? semesterOption.label : '';

    let newActivityName = `${formData.courseName} - ${semesterLabel}`;

    // If all students selected, append " - All"
    if (studentCount > 0 && selectedStudents.length === studentCount) {
      newActivityName += ' - All';
    }

    setFormData(prev => ({
      ...prev,
      activityName: newActivityName
    }));
  }, [formData.courseName, formData.semester, selectedStudents.length, studentCount, semesterOptions]);








  // Custom styles for react-select
  const customStyles = useMemo(() => ({
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '42px',
      borderColor: state.isFocused ? '#7f56da' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(127, 86, 218, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#7f56da'
      }
    }),
    valueContainer: (base: any) => ({
      ...base,
      minHeight: '42px',
      padding: '0 8px'
    }),
    input: (base: any) => ({
      ...base,
      margin: '0',
      padding: '0'
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '42px'
    }),
    menu: (base: any) => ({
      ...base,
      width: 'max-content',
      minWidth: '100%',
      zIndex: 9999
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    }),
    menuList: (base: any) => ({
      ...base,
      maxHeight: '250px'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isDisabled
        ? '#f9fafb'
        : state.isSelected
          ? '#7f56da'
          : state.isFocused
            ? '#f3f0ff'
            : 'white',
      color: state.isDisabled
        ? '#9ca3af'
        : state.isSelected
          ? 'white'
          : '#222f3e',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      '&:active': {
        backgroundColor: state.isDisabled ? '#f9fafb' : '#7f56da'
      }
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: '#f3f0ff',
      borderRadius: '6px'
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: '#7f56da',
      fontWeight: '500'
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: '#7f56da',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#7f56da',
        color: 'white'
      }
    })
  }), []);



  const handleEmployeesChange = (options: any) => {
    const selectedIds = options ? options.map((opt: any) => opt.value) : [];
    setFormData(prev => ({ ...prev, assignedTo: selectedIds }));
  };



  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Handle individual student selection
  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Check if all filtered students are selected
  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id));

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }, []);


  // 🔐 Activity defaults (UI independent)
  // Define possible keys for type safety
  type AuthMethodKey = 'OTP' | 'BIOMETRIC';
  type PreCheckKey = 'NO_DUES' | 'NOC' | 'LIBRARY_NOC';

  // Type for the config
  interface ActivitySecurityConfig {
    authentication_method_ids: Record<AuthMethodKey, number>;
    pre_check_method_ids: Record<PreCheckKey, number>;
    defaultAuthentication: AuthMethodKey[];
    defaultPreChecks: PreCheckKey[];
  }

  // Config object
  const ACTIVITY_SECURITY_CONFIG: ActivitySecurityConfig = {
    authentication_method_ids: {
      OTP: 1,
      BIOMETRIC: 2,
    },
    pre_check_method_ids: {
      NO_DUES: 1,
      NOC: 2,
      LIBRARY_NOC: 3,
    },

    // ✅ Defaults always sent when UI is hidden
    defaultAuthentication: ['OTP'],          // only OTP
    defaultPreChecks: ['NO_DUES', 'LIBRARY_NOC'],
  };

  // Map default authentication keys to ids
  const authentication_method_ids: string = ACTIVITY_SECURITY_CONFIG.defaultAuthentication
    .map(key => ACTIVITY_SECURITY_CONFIG.authentication_method_ids[key])
    .join(',');

  // Map default pre-check keys to ids
  const pre_check_method_ids: string = ACTIVITY_SECURITY_CONFIG.defaultPreChecks
    .map(key => ACTIVITY_SECURITY_CONFIG.pre_check_method_ids[key])
    .join(',');


  const extractError = (err: any) => {
    if (typeof err === 'string') return err;

    if (typeof err === 'object') {
      const firstKey = Object.keys(err)[0];
      return err[firstKey]?.[0];
    }

    return 'Something went wrong';
  };


  const handleSave = async () => {

    console.log("formdata===", formData)
    // Validation
    if (!formData.courseId) {
      Notifier.error('Please select a course');
      return;
    }
    if (!formData.semester) {
      Notifier.error('Please select a semester');
      return;
    }
    if (!formData.activityName.trim()) {
      Notifier.error('Please enter activity name');
      return;
    }
    // if (!formData.selectionName.trim()) {
    //   Notifier.error('Please enter Selection name');
    //   return;
    // }
    if (!formData.startDate) {
      Notifier.error('Please select start date');
      return;
    }
    if (!formData.endDate) {
      Notifier.error('Please select end date');
      return;
    }
    if (!formData.examDate) {
      Notifier.error('Please select exam date');
      return;
    }
    if (formData.assignedTo.length === 0) {
      Notifier.error('Please assign at least one employee');
      return;
    }

    // Validate dates - Normalize all dates to start of day for accurate comparison
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(formData.endDate);
    endDate.setHours(0, 0, 0, 0);

    const examDate = new Date(formData.examDate);
    examDate.setHours(0, 0, 0, 0);

    // Check if start date is in the past (before today)
    if (startDate < todayDate) {
      Notifier.error('Start date cannot be in the past. Please select current date onwards.');
      return;
    }

    // Check if end date is before or equal to start date
    if (endDate <= startDate) {
      Notifier.error('End date must be after start date');
      return;
    }

    // Check if exam date is before start date
    if (examDate < startDate) {
      Notifier.error('Exam start date cannot be before start date');
      return;
    }
    console.log('Saving admit card:', formData);

    try {
      setSaving(true);
      const payload: ActivityPayload = {
        // 🔹 Activity details
        activity_name: formData.activityName,
        selection_name: formData.selectionName,
        // activity_event_type: selectedActivityType?.value || null,
        start_date: formData.startDate,
        end_date: formData.endDate,
        exam_start_date: formData.examDate || null,

        // 🔹 Assignment
        employee_ids: formData.assignedTo.join(','),  // array of IDs to comma-separated string

        // 🔹 Students
        student_ids: selectedStudents.join(','),

        // 🔹 Semester / LAG
        lag_ids: formData.semester ? String(formData.semester) : null,

        authentication_method_ids,
        pre_check_method_ids,
      };
      console.log('Saving admit card:', formData);
      let res;
      if (admitCard?.id) {
        // 🔹 EDIT mode → use update API
        payload.activity_id = admitCard.id;
        res = await Postdata(
          `academics/activities/update/`,
          payload
        );
        if (res?.message?.toLowerCase().includes('success')) {
          Notifier.success(res.message);

        } else {
          Notifier.error(extractError(res));
        }
      } else {
        // 🔹 CREATE mode → use normal API
        res = await Postdata("academics/activities/", payload);
        if (res?.id) {
          Notifier.success("Activity Created Successfully!");
        } else {
          Notifier.error(extractError(res));
        }
      }
      // Notifier.success('Admit card created successfully!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving admit card:', error);
      // Notifier.error(error instanceof Error ? error.message : 'Failed to save admit card');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Full View Modal - Separate full-screen overlay */}
      {isFullView && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center"
          onClick={() => setIsFullView(false)}
        >
          <div
            className="bg-white w-screen h-screen overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Full View Header - Compact */}
            <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-bold leading-tight">Student Selection - Full View</h2>
                  <p className="text-xs text-purple-100 leading-tight">
                    {formData.courseName} • {formData.semester}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFullView(false)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all backdrop-blur-sm font-medium text-sm"
              >
                <Minimize2 className="w-4 h-4" />
                Minimize
              </button>
            </div>

            {/* Full View Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search and Controls - Compact */}
              <div className="px-6 py-3 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by student name or registration number..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f56da] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Stats Card - Compact */}
                  <div className="flex items-center gap-4 px-4 py-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 uppercase">Total</div>
                      <div className="text-lg font-bold" style={{ color: '#7f56da' }}>{studentCount}</div>
                    </div>
                    <div className="h-8 w-px bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 uppercase">Selected</div>
                      <div className="text-lg font-bold text-green-600">{selectedStudents.length}</div>
                    </div>
                    <div className="h-8 w-px bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 uppercase">Filtered</div>
                      <div className="text-lg font-bold text-blue-600">{filteredStudents.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Select All Bar - Compact */}
              <div className="px-6 py-2.5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded-md border-2 border-gray-400 text-[#7f56da] focus:ring-2 focus:ring-[#7f56da] focus:ring-offset-2 cursor-pointer transition-all"
                    />
                    <div>
                      <span className="text-sm font-bold group-hover:text-[#7f56da] transition-colors" style={{ color: '#222f3e' }}>
                        Select All Students
                      </span>
                      <span className="text-xs text-gray-600 ml-2">
                        ({filteredStudents.length} students)
                      </span>
                    </div>
                  </label>
                  <button
                    onClick={() => setSelectedStudents([])}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Student Grid */}
              <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
                {filteredStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {filteredStudents.map((student, _index) => {
                      const isSelected = selectedStudents.includes(student.id);

                      return (
                        <label
                          key={student.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 border-2 shadow-sm hover:shadow-md ${isSelected
                            ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-400 shadow-purple-200'
                            : 'bg-white border-gray-200 hover:border-purple-300'
                            }`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStudentToggle(student.id)}
                            className="w-4 h-4 rounded-md border-2 border-gray-400 text-[#7f56da] focus:ring-2 focus:ring-[#7f56da] focus:ring-offset-2 cursor-pointer transition-all flex-shrink-0"
                          />

                          {/* Student Info */}
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <div className="text-sm font-bold truncate" style={{ color: '#222f3e' }}>
                              {student.name}
                            </div>
                            <div className="text-xs font-mono text-gray-500 flex-shrink-0">
                              ({student.registrationNo})
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                        <Users className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold text-gray-600 mb-2">
                        {searchQuery ? 'No students found' : 'No students available'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {searchQuery
                          ? 'Try adjusting your search terms'
                          : 'Students will appear here once data is available'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Full View Footer */}
              <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white border-t border-purple-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="text-lg font-bold leading-tight">
                        {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''} Selected
                      </div>
                      <div className="text-xs text-purple-100 leading-tight">
                        Ready to add to admit card process
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFullView(false)}
                    className="px-4 py-1.5 bg-white text-purple-700 hover:bg-purple-50 rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg"
                  >
                    Done - Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <h2 className="text-xl font-semibold" style={{ color: '#7f56da' }}>
              {initialData ? 'Edit Admit Card Process' : 'Add New Admit Card Process'}
            </h2>
            <button
              onClick={() => {
                if (!saving) onClose();
              }}

              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Course and Semester Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                    Select Course <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={courseOptions}
                    value={courseOptions.find(opt => opt.value === formData.courseId) || null}
                    onChange={handleCourseChange}
                    styles={customStyles}
                    placeholder="Select Course"
                    isClearable
                    noOptionsMessage={() => courses.length === 0 ? 'No courses available' : 'No matching courses'}
                  />
                  {courses.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {courses.length} course{courses.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>

                {/* Semester Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                    Select Semester <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={semesterOptions}
                    value={semesterOptions.find(opt => opt.value === formData.semester) || null}
                    onChange={(option: any) => setFormData(prev => ({ ...prev, semester: option ? option.value : '' }))}
                    styles={customStyles}
                    placeholder="Select Semester"
                    isClearable
                    isDisabled={!formData.courseId}
                  />
                  {semesterOptions.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {semesterOptions.length} {semesterOptions.length === 1 ? 'semester' : 'semesters'} available
                    </p>
                  )}
                  {/* {selectedCourse && (
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedCourse.semesterCount ?? 0}{' '}
                      {selectedCourse.mode === 'Semester' ? 'semesters' : 'years'} available
                    </p>
                  )} */}

                </div>
              </div>

              {/* Show Students Toggle and Count - Only show when semester is selected */}
              {formData.semester && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
                  {/* Header Section - All elements vertically centered with same height */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Left Section - Icon and Title */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm flex-shrink-0">
                        <Users className="w-5 h-5" style={{ color: '#7f56da' }} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="text-base font-semibold leading-tight" style={{ color: '#222f3e' }}>
                          Student Selection
                        </h3>
                        <p className="text-xs text-gray-600 leading-tight mt-0.5">
                          {selectedStudents.length > 0
                            ? `${selectedStudents.length} student${selectedStudents.length > 1 ? 's' : ''} selected`
                            : 'Select students for this admit card'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Right Section - Count Badge and Toggle Button */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Student Count Badge */}
                      <div className="flex items-center h-10 px-4 bg-white rounded-lg border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#7f56da' }} />
                          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Total Students:</span>
                          <span className="text-xl font-bold leading-none" style={{ color: '#7f56da' }}>{studentCount}</span>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowStudents(!showStudents)}
                        className="flex items-center justify-center h-10 px-5 rounded-lg font-medium text-sm transition-all shadow-sm whitespace-nowrap"
                        style={{
                          backgroundColor: showStudents ? '#7f56da' : 'white',
                          color: showStudents ? 'white' : '#7f56da',
                          border: '2px solid #7f56da'
                        }}
                      >
                        {showStudents ? 'Hide Students' : 'Show Students'}
                      </button>

                      {/* Full View Button - Only show when students are visible */}
                      {showStudents && (
                        <button
                          type="button"
                          onClick={() => setIsFullView(true)}
                          className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg font-medium text-sm transition-all shadow-sm whitespace-nowrap bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Maximize2 className="w-4 h-4" />
                          Full View
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Student List - Only show when toggle is ON */}
                  {showStudents && (
                    <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                      {/* Search Bar with Icon */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-white border-b-2 border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by student name or registration number..."
                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f56da] focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Select All Header */}
                      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-purple-50 border-b-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-5 h-5 rounded-md border-2 border-gray-400 text-[#7f56da] focus:ring-2 focus:ring-[#7f56da] focus:ring-offset-2 cursor-pointer transition-all"
                            />
                            <span className="text-sm font-semibold group-hover:text-[#7f56da] transition-colors" style={{ color: '#222f3e' }}>
                              Select All Students
                            </span>
                          </label>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border-2 shadow-sm" style={{ borderColor: '#7f56da' }}>
                            <span className="text-xs font-medium text-gray-600">Selected:</span>
                            <span className="text-lg font-bold" style={{ color: '#7f56da' }}>
                              {selectedStudents.length}
                            </span>
                            <span className="text-xs text-gray-400">/</span>
                            <span className="text-sm font-medium text-gray-600">
                              {filteredStudents.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Student List */}
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {filteredStudents.length > 0 ? (
                          <div>
                            {filteredStudents.map((student, index) => {
                              const isSelected = selectedStudents.includes(student.id);

                              return (
                                <label
                                  key={student.id}
                                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${isSelected
                                    ? 'bg-purple-50 hover:bg-purple-100'
                                    : 'hover:bg-gray-50'
                                    }`}
                                >
                                  {/* Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleStudentToggle(student.id)}
                                    className="w-4 h-4 rounded-md border-2 border-gray-400 text-[#7f56da] focus:ring-2 focus:ring-[#7f56da] focus:ring-offset-2 cursor-pointer transition-all flex-shrink-0"
                                  />

                                  {/* Student Info - Inline */}
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <div className="text-sm font-semibold truncate" style={{ color: '#222f3e' }}>
                                      {student.name}
                                    </div>
                                    <div className="text-xs font-mono text-gray-500 flex-shrink-0">
                                      ({student.registrationNo})
                                    </div>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                                        ✓
                                      </span>
                                    )}
                                  </div>

                                  {/* Student Number Badge */}
                                  <div className="text-xs font-medium text-gray-400 flex-shrink-0">
                                    #{index + 1}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                              <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-1">
                              {searchQuery ? 'No students found' : 'No students available'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {searchQuery
                                ? 'Try adjusting your search terms'
                                : 'Students will appear here once data is available'
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer with Selection Count */}
                      <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-white border-t-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium" style={{ color: '#222f3e' }}>
                              {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected for admit card
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedStudents([])}
                            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Details Section */}


              {/* Activity Name */}
              <div>
                <h3 className="text-base font-semibold mb-4" style={{ color: '#222f3e' }}>
                  Process Details
                </h3>

                {/* Process Name - Display as text (always disabled) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                    Process Name <span className="text-red-500">*</span>
                  </label>
                  <p className="text-base font-semibold mb-1" style={{ color: '#222f3e' }}>
                    {formData.activityName || 'Process name will be generated based on course and semester'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-generated process name based on course and semester selection
                  </p>
                </div>

                {/* Selection Name - Only show when not all students are selected */}
                {selectedStudents.length > 0 && selectedStudents.length < studentCount && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                      Selection Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.selectionName}
                      onChange={(e) => setFormData(prev => ({ ...prev, selectionName: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f56da] focus:border-transparent"
                      placeholder="Enter selection name (e.g., Group A, Morning Batch, etc.)"
                    />
                    <p className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                      <Circle className="w-3 h-3 fill-current" />
                      Required: Not all students selected ({selectedStudents.length}/{studentCount})
                    </p>
                  </div>
                )}
              </div>


              {/* Activity Timeline Section */}
              <div>
                <h3 className="text-base font-semibold mb-4" style={{ color: '#222f3e' }}>
                  Process Timeline
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f56da] focus:border-transparent"
                      min={today}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f56da] focus:border-transparent"
                      min={formData.startDate}
                    />
                  </div>

                  {/* Exam Start Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                      Exam Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.examDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, examDate: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7f56da] focus:border-transparent"
                      min={formData.startDate}
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div>
                <h3 className="text-base font-semibold mb-4" style={{ color: '#222f3e' }}>
                  Assignment
                </h3>

                {/* Assign Employees */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#222f3e' }}>
                    Assign Employees <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={employeeOptions}
                    value={employeeOptions.filter(opt => formData.assignedTo.includes(opt.value))}
                    onChange={handleEmployeesChange}
                    styles={customStyles}
                    placeholder="-- Select Employee --"
                    isMulti
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You can assign multiple employees for this activity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#7f56da' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}