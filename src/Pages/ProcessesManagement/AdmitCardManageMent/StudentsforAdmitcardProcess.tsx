import { useState, useEffect } from 'react';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Users,

  Phone,
  Mail,

  Calendar,
  BookOpen,
  CheckCircle2,
  XCircle,
  User,
  FileText,

  CreditCard as IdCard,
  Fingerprint,
  Droplet,
  Home,
  UserCircle,
  Download,
  Printer,

  Shield,
  CheckCircle,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import type { ActivityStats, AdmitCardDetailsResponse, StudentAdmitCard } from '../../../Types/AdmitCard';
import { GetData } from '../../../API/GlobalApi';
import Notifier from '../../../Utils/notifier';
import Pagination, { getPaginationPages } from '../../../Utils/Pagination'; 
import { itemsPerPageOptions } from '../../../Types/Common'; 
import { useDebounce } from '../../../Utils/SearchDebouneHooks';


export function StudentsforAdmitcardProcess() {
  const [activity, setActivity] = useState<AdmitCardDetailsResponse | null>(null);
  const [students, setStudents] = useState<StudentAdmitCard[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<StudentAdmitCard | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const pageCounts = Math.ceil(totalCount / itemsPerPage);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { admitCardId } = useParams<{ admitCardId: string }>();
  const cardId = admitCardId ? Number(admitCardId) : null;

  interface Filters {
    noDues?: string;
    libraryNOC?: string;
    issueStatus?: string;
    cardAvailability?: string;
  }

  const [filters, setFilters] = useState<Filters>({});

  const handleFilterChange = (key: keyof Filters, value?: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value && value !== 'all' ? value : undefined, // only keep if not 'all'
    }));
  };

  const fetchAdmitCards = async (
    page: number,
    search: string,
    pageSize: number = itemsPerPage
  ): Promise<void> => {
    setIsLoading(true);
    try {
      let url = `academics/activities/${cardId}/?page=${page}&page_size=${pageSize}`;
      if (search.trim()) {
        // Encode and replace spaces with '+'
        // const encodedSearch = encodeURIComponent(search.trim()).replace(/%20/g, '+');
        // url += `&search=${encodedSearch}`;
        const encodedSearch = encodeURIComponent(search.trim()).replace(/%20/g, '+');
        url += `&search=${encodedSearch}`;
      }

      // Add filters dynamically
      // Object.entries(filters).forEach(([key, value]) => {
      //   if (value !== undefined) {
      //     switch (key) {
      //       case 'noDues':
      //         url += `&sort_by=pending&sort_type=no_dues_clearance`;
      //         break;
      //       case 'libraryNOC':
      //         url += `&sort_by=pending&sort_type=library_noc_clearance`;
      //         break;
      //       case 'issueStatus':
      //         url += `&admit_card_status=${value}`;
      //         break;
      //       case 'cardAvailability':
      //         url += `&admit_card_available=${value === 'yes' ? 'true' : 'false'}`;
      //         break;
      //     }
      //   }
      // });

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          switch (key) {
            case 'noDues':
              url += `&sort_by=${value}&sort_type=no_dues_clearance`;
              break;

            case 'libraryNOC':
              url += `&sort_by=${value}&sort_type=library_noc_clearance`;
              break;

            case 'issueStatus':
              url += `&admit_card_status=${value}`;
              break;

            case 'cardAvailability':
              url += `&admit_card_available=${value === 'yes' ? 'true' : 'false'}`;
              break;
          }
        }
      });


      const data: AdmitCardDetailsResponse = await GetData(url);
      setActivity(data);
      setStudents(data.students.results);
      setTotalCount(data.students.count);

    } catch (error) {
      console.error("Error fetching students:", error);
      //  Notifier.error(error)
      setActivity(null);
      setStudents([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
      console.log("🔚 fetchAdmitcard finished");
    }
  };


  const fetchActivityStats = async (activityId: number) => {
    try {
      const data: ActivityStats = await GetData(`academics/activities/stats/?activity_id=${activityId}`);
      setActivityStats(data);
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      Notifier.error("Failed to load activity stats");
    }
  };


  useEffect(() => {
    if (cardId) {
      fetchActivityStats(cardId);
      fetchAdmitCards(currentPage, debouncedSearch, itemsPerPage);
    }
  }, [currentPage, debouncedSearch, itemsPerPage, filters, cardId]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);


  const pages = getPaginationPages(pageCounts);

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const handleCopyEnrollmentNo = (enrollmentNo: string) => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = enrollmentNo;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(`enrollmentNo-${enrollmentNo}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy enrollment number:', error);
    }
  };


  const getStatusBadge = (status: boolean) => {
    switch (status) {
      case true:
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: 'Issued',
          icon: <CheckCircle2 className="w-3 h-3 text-current" />,
        };

      case false:
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Not Issued',
          icon: <XCircle className="w-3 h-3 text-current" />,
        };

      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: 'Unknown',
          icon: <XCircle className="w-3 h-3 text-current" />,
        };
    }
  };




  interface SelectOption {
    value: string;
    label: string;
  }

  // Example options
  const noDuesOptions: SelectOption[] = [
    // { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
  ];

  const libraryNOCOptions: SelectOption[] = [
    // { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
  ];

  const issueStatusOptions: SelectOption[] = [
    // { value: 'all', label: 'All' },
    { value: 'issued', label: 'Issued' },
    { value: 'not-issued', label: 'Not Issued' },
  ];

  const cardAvailabilityOptions: SelectOption[] = [
    // { value: 'all', label: 'All' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];



  // No Dues
  const noDuesStats = activityStats?.pre_check_methods.find(
    (p) => p.pre_check_type === "No Dues Clearance"
  );
  const noDuesCompleted = noDuesStats?.completed_count || 0;
  const noDuesTotal = noDuesStats?.total_count || 1;
  const noDuesPending = noDuesTotal - noDuesCompleted;
  const noDuesProgress = Math.round((noDuesCompleted / noDuesTotal) * 100);

  // Library NOC
  const libraryNOCStats = activityStats?.pre_check_methods.find(
    (p) => p.pre_check_type === "Library NOC Clearance"
  );
  const libraryNOCCompleted = libraryNOCStats?.completed_count || 0;
  const libraryNOCTotal = libraryNOCStats?.total_count || 1;
  const libraryNOCPending = libraryNOCTotal - libraryNOCCompleted;
  const libraryNOCProgress = Math.round((libraryNOCCompleted / libraryNOCTotal) * 100);


  // Calculate progress and pending
  const totalStudents = activityStats?.total_students || 1;
  const completedStudents = activityStats?.completed_students || 0;
  const pendingStudents = totalStudents - completedStudents;
  const progressPercent = Math.round((completedStudents / totalStudents) * 100);



  const navigate = useNavigate()


  return (
    <div className="flex flex-col bg-white w-full h-full overflow-hidden">
      {/* Main Content Area with Side Panel */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Section - Header, Search, Filters, and Table */}
        <div className={`flex flex-col h-full ${selectedStudent ? 'hidden md:flex md:w-[70%]' : 'flex w-full'}`}>
          {/* Page Header */}
          <div className="flex flex-col pb-3 px-4 sm:px-6 pt-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}

                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Go Back"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: '#7f56da' }} />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold" style={{ color: '#7f56da' }}>
                    Students - Admit Card Process
                  </h1>

                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                    {activity?.activity_name}
                    {activity?.selection_name ? ` (${activity.selection_name})` : ''}

                  </p>
                </div>
              </div>
            </div>

            {/* Information Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
              {/* Important Dates Widget */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Important Dates</h3>
                  </div>

                  <div className="space-y-1.5">
                    {/* Start and End Date in one row */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/20">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-1 h-1 rounded-full bg-green-300"></div>
                          <div className="text-[10px] text-white/80">Start</div>
                        </div>
                        <div className="text-xs font-bold text-white pl-2.5">{formatDate(activity?.start_date)}</div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/20">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-1 h-1 rounded-full bg-red-300"></div>
                          <div className="text-[10px] text-white/80">End</div>
                        </div>
                        <div className="text-xs font-bold text-white pl-2.5">{formatDate(activity?.end_date)}</div>
                      </div>
                    </div>

                    {/* Exam Start in new row */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/20">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-1 h-1 rounded-full bg-yellow-300"></div>
                        <div className="text-[10px] text-white/80">Exam Start</div>
                      </div>
                      <div className="text-xs font-bold text-white pl-2.5">{formatDate(activity?.exam_start_date)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admit Card Issued Widget */}
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-lg p-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <IdCard className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Admit Card</h3>
                      <p className="text-[10px] text-white/70">Students</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-end gap-1.5">
                      <div className="text-2xl font-bold text-white leading-none">{activity?.verified_students}</div>
                      <div className="text-xs text-white/80 mb-0.5">/{activity?.total_students}</div>
                    </div>
                    <div className="text-[10px] text-white/70">Completed</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/20 rounded-full h-1.5 mb-2 overflow-hidden backdrop-blur-sm">
                    <div className="bg-white h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/20">
                      <div className="text-[10px] text-white/70">Not Issued</div>
                      <div className="text-base font-bold text-white leading-none">{pendingStudents}</div>
                    </div>
                    <div className="bg-green-500/30 backdrop-blur-sm rounded-md p-1.5 border border-green-300/30">
                      <div className="text-[10px] text-white/90">Progress</div>
                      <div className="text-base font-bold text-white leading-none">{progressPercent}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-lg p-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Admit Card Availability</h3>
                      <p className="text-[10px] text-white/70">Status</p>
                    </div>
                  </div>

                  {/* Large Circle Stats */}
                  <div className="flex items-center justify-around mb-2">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mb-1">
                        <div className="text-base font-bold text-white">{activityStats?.students_with_admit_card_count}</div>
                      </div>
                      <div className="text-[9px] text-white/80 font-medium">Available</div>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mb-1">
                        <div className="text-base font-bold text-white">
                          {(activityStats?.total_students || 0) - (activityStats?.students_with_admit_card_count || 0)}

                        </div>
                      </div>
                      <div className="text-[9px] text-white/80 font-medium">Unavailable</div>
                    </div>
                  </div>

                  {/* Alert Badge */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-md p-1.5 border border-white/30 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 text-white" />
                    <span className="text-[10px] text-white font-medium">Need processing</span>
                  </div>
                </div>
              </div>

              {/* No Dues Clearance Widget */}
              <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-lg p-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">No Dues</h3>
                      <p className="text-[10px] text-white/70">Clearance</p>
                    </div>
                  </div>

                  <div className="mb-1.5">
                    <div className="flex items-end gap-1.5">
                      <div className="text-2xl font-bold text-white leading-none">{noDuesCompleted}</div>
                      <div className="text-xs text-white/80 mb-0.5">/ {noDuesTotal}</div>
                    </div>
                    <div className="text-[10px] text-white/70">Cleared</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/20 rounded-full h-1.5 mb-2 overflow-hidden backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-white to-yellow-200 h-full rounded-full transition-all" style={{ width: `${noDuesProgress}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/20">
                      <div className="text-[10px] text-white/70">Pending</div>
                      <div className="text-base font-bold text-white leading-none">{noDuesPending}</div>
                    </div>
                    <div className="flex-1 bg-yellow-500/30 backdrop-blur-sm rounded-md p-1.5 border border-yellow-300/30">
                      <div className="text-[10px] text-white/90">Progress</div>
                      <div className="text-base font-bold text-white leading-none">{noDuesProgress}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Library NOC Clearance Widget */}
              <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-lg p-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <BookOpen className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Library NOC</h3>
                      <p className="text-[10px] text-white/70">Clearance</p>
                    </div>
                  </div>

                  <div className="mb-1.5">
                    <div className="flex items-end gap-1.5">
                      <div className="text-2xl font-bold text-white leading-none">{libraryNOCCompleted}</div>
                      <div className="text-xs text-white/80 mb-0.5">/ {libraryNOCTotal}</div>
                    </div>
                    <div className="text-[10px] text-white/70">Cleared</div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white/20 rounded-full h-1.5 mb-2 overflow-hidden backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-white to-green-200 h-full rounded-full transition-all" style={{ width: `${libraryNOCProgress}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-md p-1.5 border border-white/20">
                      <div className="text-[10px] text-white/70">Pending</div>
                      <div className="text-base font-bold text-white leading-none">{libraryNOCPending}</div>
                    </div>
                    <div className="flex-1 bg-green-500/30 backdrop-blur-sm rounded-md p-1.5 border border-green-300/30">
                      <div className="text-[10px] text-white/90">Progress</div>
                      <div className="text-base font-bold text-white leading-none">{libraryNOCProgress}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
            <div className="flex items-end gap-3 flex-wrap">
              {/* Search Bar - First */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Search</label>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* No Dues Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">No Dues</label>
         
                <select
                  value={filters.noDues ?? ""}
                  className="w-40 pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  onChange={(e) => {
                    handleFilterChange("noDues", e.target.value);
                  }}
                >
                    <option value="">All</option>
                  {noDuesOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

              </div>

              {/* Library NOC Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Library NOC</label>
                

                <select
                  value={filters.libraryNOC ?? ""}
                  className="w-40 pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  onChange={(e) => {
                    handleFilterChange("libraryNOC", e.target.value);
                  }}
                >  <option value="">All</option>
                  {libraryNOCOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Status Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Issue Status</label>
               
                <select
                  value={filters.issueStatus ?? ""}
                  className="w-40 pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  onChange={(e) => {
                    handleFilterChange("issueStatus", e.target.value);
                  }}
                >  <option value="">All</option>
                  {issueStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Availability Filter */}
               <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-700 font-medium">Card Availability</label>
             
                <select
                  value={filters.cardAvailability ?? ""}
                  className="w-40 pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  onChange={(e) => {
                    handleFilterChange("cardAvailability", e.target.value);
                  }}
                >  <option value="">All</option>
                  {cardAvailabilityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Link - Right after Card Availability */}
              {Object.values(filters).some(v => v !== undefined) && (
                <button
                  onClick={() => setFilters({})} // reset all filters
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#7f56da' }}
                >
                  Clear Filters
                </button>
              )}

              {/* Spacer to push Download to the right */}
              <div className="flex-1"></div>

              {/* Download Button - Right corner */}
              <button
                onClick={() => toast.info('Export functionality coming soon')}
                className="px-4 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student List/Table */}
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {/* <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div> */}
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading admit card's students...</p>
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No admit card's  students found</p>
                <p className="text-gray-500 text-sm">
                  {searchQuery || Object.values(filters).some(v => v !== undefined)
                    ? 'Try adjusting your search or filters'
                    : 'No students available for this admit card process'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student/Reg No
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Course/Sem
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Flow Check
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Card Availability
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Issued By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const statusBadge = getStatusBadge(student.activity_completed);

                      const hasNoDues = student.all_precheck_names.includes("No Dues Clearance");
                      const isNoDuesCompleted = student.completed_precheck_names.includes("No Dues Clearance");


                      const hasLibraryNOC = student.all_precheck_names.includes("Library NOC Clearance");
                      const isLibraryNOCCompleted = student.completed_precheck_names.includes("Library NOC Clearance");

                      return (
                        <tr
                          key={student.student_id}
                          onClick={() => setSelectedStudent(student)}
                          className={`cursor-pointer transition-colors border-l-4 ${selectedStudent?.student_id === student.student_id
                            ? 'border-l-[#7f56da] bg-purple-50'
                            : 'border-l-transparent hover:bg-gray-100'
                            }`}
                          style={{
                            backgroundColor: selectedStudent?.student_id === student.student_id
                              ? '#f8f5ff'
                              : index % 2 === 0
                                ? '#fff'
                                : '#f9f9f9'
                          }}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {student.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold normal-case" style={{ color: '#7f56da' }}>
                                  {student.full_name}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-600 font-mono">{student.permanent_registration_number}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyEnrollmentNo(student.permanent_registration_number);
                                    }}
                                    className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors"
                                    title="Copy Enrollment No"
                                  >
                                    {copiedField === `enrollmentNo-${student.permanent_registration_number}` ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {/* <div className="text-sm font-medium text-gray-900">{activity?.activity_name}</div> */}
                            {/* <div className="text-xs text-gray-500">{student.course_name}</div> */}
                            <div className="text-sm font-medium text-gray-900">{student.course_name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  {student.exceptional_approval ? (
                                    <>
                                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Shield className="w-3 h-3 text-amber-600" />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-600">No Dues</span>
                                        <span className="text-xs text-amber-600 font-semibold">
                                          (Exceptional Approval)
                                        </span>
                                      </div>
                                    </>
                                  ) : hasNoDues ? (
                                    isNoDuesCompleted ? (
                                      <>
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                                        </div>
                                        <span className="text-xs text-gray-600">No Dues</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                          <X className="w-3 h-3 text-red-600" />
                                        </div>
                                        <span className="text-xs text-gray-600">No Dues</span>
                                      </>
                                    )
                                  ) : null}
                                </div>

                              </div>
                              <div className="flex items-center gap-2">
                                {hasLibraryNOC ? (
                                  isLibraryNOCCompleted ? (
                                    <>
                                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                      </div>
                                      <span className="text-xs text-gray-600">Library NOC</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                        <X className="w-3 h-3 text-red-600" />
                                      </div>
                                      <span className="text-xs text-gray-600">Library NOC</span>
                                    </>
                                  )
                                ) : null}
                              </div>

                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {student.is_admit_card_available ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="w-3 h-3" />
                                No
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.activity_completed_issued_by ?? '—'}
                            </div>

                            {student.activity_completed_issued_at && (
                              <div className="text-xs text-gray-500">
                                {formatDate(student.activity_completed_issued_at)} {new Date(student.activity_completed_issued_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>



              <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                {/* Left side - Showing X to Y of Z records */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
                  </span>

                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">



                    <div className="flex items-center gap-2">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="pl-2 pr-8 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#7f56da]/20 focus:border-[#7f56da]"
                      >{itemsPerPageOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      </select>

                    </div>
                  </div>
                </div>

                {/* Right side - Pagination controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>


                  <Pagination
                    pages={pages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                  />

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pageCounts}
                    className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Student Info Panel - Side Panel Style */}
        {selectedStudent && (
          <div className="w-full md:w-[30%] h-full p-[15px] flex flex-col">
            <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 flex flex-col overflow-hidden shadow-xl rounded-xl h-full">
              {/* Student Photo and Basic Info with Close Button */}
              <div className="p-4 border-b border-purple-300 flex flex-col items-center flex-shrink-0 bg-[#7f56da] relative rounded-t-xl">
                {/* Close Button - Top Right */}
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="absolute top-2 right-2 p-1.5 hover:bg-purple-700 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Large Circular Photo */}
                <div className="relative mb-3">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30">
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                  {/* Status Indicator Badge */}
                  <div className="absolute -top-0.5 -right-0.5 z-10">
                    {selectedStudent?.activity_completed ? (
                      <div className="w-5 h-5 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center transition-all shadow-md">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-red-600 bg-red-600 flex items-center justify-center transition-all shadow-md">
                        <XCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Registration */}
                <h3 className="text-lg font-bold text-white text-center mb-0.5">
                  {selectedStudent.full_name}
                </h3>
                <p className="text-xs text-purple-100 mb-2">
                  {selectedStudent.permanent_registration_number}
                </p>

                {/* Status Badge */}
                {(() => {
                  const statusBadge = getStatusBadge(selectedStudent.activity_completed);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                      {statusBadge.icon}
                      {statusBadge.label}
                    </span>
                  );
                })()}
              </div>

              {/* Scrollable Details */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Admit Card Info Section */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <IdCard className="w-4 h-4" style={{ color: '#7f56da' }} />
                    Admit Card Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Admit Card Number</div>
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {/* {selectedStudent.admitCardNumber || 'Not Generated'} */}
                        </div>
                      </div>
                    </div>

                    {selectedStudent.activity_completed_issued_at && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500">Issued Date</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {formatDate(selectedStudent.activity_completed_issued_at)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4" style={{ color: '#7f56da' }} />
                    Personal Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Gender</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedStudent.gender}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Date of Birth</div>
                        <div className="text-sm font-semibold text-gray-900">{formatDate(selectedStudent.date_of_birth)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Father's Name</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedStudent.father_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Mother's Name</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedStudent.mother_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Droplet className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Blood Group</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedStudent.blood_group ? selectedStudent.blood_group : "N/A"}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Fingerprint className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Aadhar Number</div>
                        <div className="text-sm font-semibold text-gray-900 font-mono">{selectedStudent.aadhar_number ? selectedStudent.aadhar_number : "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Phone className="w-4 h-4" style={{ color: '#7f56da' }} />
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Phone Number</div>
                        <div className="text-sm font-semibold text-gray-900">{selectedStudent.mobile}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="text-sm font-semibold text-gray-900 break-all">{selectedStudent.email}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Home className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">Address</div>
                        {/* <div className="text-sm font-semibold text-gray-900">{selectedStudent.address}</div> */}
                        <div className="text-sm text-gray-600 mt-0.5">
                          {selectedStudent.address.city}, {selectedStudent.address.state} - {selectedStudent.address.pincode}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-purple-200 bg-white flex-shrink-0 rounded-b-xl">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toast.info('Print admit card functionality coming soon')}
                    className="px-4 py-2 bg-[#7f56da] text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => toast.info('Download admit card functionality coming soon')}
                    className="px-4 py-2 bg-white border-2 border-[#7f56da] text-[#7f56da] rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}