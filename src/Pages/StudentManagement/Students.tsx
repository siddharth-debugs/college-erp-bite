import { useState, useEffect } from 'react';

import {
    Search, Filter, Download, Grid3x3, List,
    Edit2, UserX, MoreVertical, Users,
    UserCheck, Phone,
    Mail, MapPin,
    Calendar, BookOpen,
    AlertCircle, CheckCircle2, XCircle, Clock, X, ChevronLeft, ChevronRight, Copy, CheckCircle, User, UserCircle2, CreditCard as IdCard, Fingerprint, UserMinus, Droplet, Home, UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Notifier from '../../Utils/notifier';
import { GetData } from '../../API/GlobalApi';
 
import { transformApiStudentToStudent, type ApiStudent, type Student } from '../../Types/Student';
import { itemsPerPageOptions } from '../../Types/Common';
import { useDebounce } from '../../Utils/SearchDebouneHooks';


interface ApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ApiStudent[];
}

export function ManageStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCourse, setFilterCourse] = useState<string>('all');
    const [filterDocStatus, setFilterDocStatus] = useState<string>('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeCardMenu, setActiveCardMenu] = useState<number | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const pageCounts = Math.ceil(totalCount / itemsPerPage);

    const fetchStudents = async (
        page: number,
        search: string,
        pageSize: number = itemsPerPage
    ): Promise<void> => {
        setIsLoading(true);
        try {
            let url = `students/get-students/?page=${page}&page_size=${pageSize}`;
            if (search.trim()) {
                // Encode and replace spaces with '+'
                const encodedSearch = encodeURIComponent(search.trim()).replace(/%20/g, '+');
                url += `&search=${encodedSearch}`;
            }
            const data: ApiResponse = await GetData(url);
            const transformedStudents: Student[] = data.results.map(
                (student: ApiStudent) => transformApiStudentToStudent(student)
            );
            setStudents(transformedStudents);
            setTotalCount(data.count);

        } catch (error) {
            console.error("Error fetching students:", error);
            // Notifier.error("Failed to load students");
            setStudents([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
            console.log("🔚 fetchStudents finished");
        }
    };


    useEffect(() => {
        fetchStudents(currentPage, debouncedSearch, itemsPerPage);
    }, [currentPage, debouncedSearch, itemsPerPage]);



    const handleSearchChange = (value: string): void => {
        setCurrentPage(1); // reset to first page on search
        setSearchQuery(value); // effect will trigger API automatically
    };
    // const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    // Called when a row is clicked
    const handleRowClick = async (studentId: number) => {
        try {
            // setIsDetailsLoading(true);
            const res: ApiStudent = await GetData(`students/get-students/${studentId}/`);
            const student: Student = transformApiStudentToStudent(res);
            setSelectedStudent(student);
        } catch (err) {
            console.error("Error fetching student:", err);
            Notifier.error("Failed to load student details");
        } finally {
            // setIsDetailsLoading(false);
        }
    };


    const getPaginationPages = (): (number | 'dots')[] => {
        if (pageCounts <= 5) {
            return Array.from({ length: pageCounts }, (_, i) => i + 1);
        }

        const pages: (number | 'dots')[] = [];

        // First pages
        pages.push(1, 2, 3);

        // Dots if needed
        if (pageCounts > 5) {
            pages.push('dots');
        }

        // Last pages
        pages.push(pageCounts - 1, pageCounts);

        return pages;
    };

    const getDocumentStatusBadge = (status: string) => {
        const config = {
            complete: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', text: 'Complete' },
            incomplete: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', text: 'Incomplete' },
            pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Pending' },
        };
        return config[status as keyof typeof config] || config.pending;
    };

    const handleEdit = (student: Student) => {
        toast.info(`Edit student: ${student.firstName} ${student.lastName}`);
        // TODO: Navigate to edit form
    };

    // const handleViewProfile = (student: Student) => {
    //     toast.info(`View profile: ${student.firstName} ${student.lastName}`);
    //     // TODO: Open profile modal
    // };

    // const handleDisable = (student: Student) => {
    //     if (confirm(`Are you sure you want to ${student.status === 'active' ? 'disable' : 'activate'} this student?`)) {
    //         toast.success(`Student ${student.status === 'active' ? 'disabled' : 'activated'} successfully`);
    //         // TODO: Update student status
    //     }
    // };

    // const handlePrintIDCard = (student: Student) => {
    //     toast.info(`Printing ID card for: ${student.firstName} ${student.lastName}`);
    //     // TODO: Generate and print ID card
    // };

    // const handleCancelAdmission = (student: Student) => {
    //     if (confirm(`Are you sure you want to cancel admission for ${student.firstName} ${student.lastName}? This action cannot be undone.`)) {
    //         toast.error('Admission cancelled');
    //         // TODO: Cancel admission
    //     }
    // };

    // const handleMissingDocuments = (student: Student) => {
    //     toast.info(`Checking missing documents for: ${student.firstName} ${student.lastName}`);
    //     // TODO: Open missing documents modal
    // };

    const handleToggleStatus = (student: Student) => {
        const newStatus = student.status === 'active' ? 'inactive' : 'active';
        if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this student?`)) {
            toast.success(`Student ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            // TODO: Update student status in backend
        }
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

    const handleCopyPhone = (phone: string) => {
        try {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = phone;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedField(`phone-${phone}`);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error('Failed to copy phone number:', error);
        }
    };

    const handleCopyEmail = (email: string) => {
        try {
            // Create a temporary textarea element
            const textarea = document.createElement('textarea');
            textarea.value = email;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedField(`email-${email}`);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error('Failed to copy email:', error);
        }
    };





    // const handleCopyAddress = (address: string) => {
    //     try {
    //         const textarea = document.createElement('textarea');
    //         textarea.value = address;
    //         textarea.style.position = 'fixed';
    //         textarea.style.opacity = '0';
    //         document.body.appendChild(textarea);
    //         textarea.select();
    //         document.execCommand('copy');
    //         document.body.removeChild(textarea);
    //         setCopiedField(`address-${address}`);
    //         setTimeout(() => setCopiedField(null), 2000);
    //     } catch (error) {
    //         console.error('Failed to copy address:', error);
    //     }
    // };

    return (

        <div className="flex flex-col bg-white w-full h-full overflow-hidden">
            {/* Main Content Area with Side Panel */}
            <div className="flex-1 overflow-hidden flex">
                {/* Left Section - Header, Search, Filters, and Table */}
                <div className={`flex flex-col ${selectedStudent ? 'hidden md:flex md:w-[70%]' : 'flex w-full'}`}>
                    {/* Page Header */}
                    <div className="flex flex-col pb-3 px-4 sm:px-6 pt-4 border-b border-gray-200 bg-white flex-shrink-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold" style={{ color: '#7f56da' }}>
                            Manage Students
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            View and manage all student records
                        </p>
                    </div>
                    {/* Search and Filters */}
                    <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search Bar */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

                                <input
                                    type="text"
                                    placeholder="Search by name, enrollment no, email, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)} // ✅ use handler
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                />

                                {searchQuery && (
                                    <button
                                        onClick={() => handleSearchChange('')} // ✅ clear input
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>


                            {/* View Toggle and Actions */}
                            <div className="flex items-center gap-2">
                                {/* Filter Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    >
                                        <Filter className="w-4 h-4" />
                                    </button>

                                    {showFilterDropdown && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                                                    <select
                                                        value={filterStatus}
                                                        onChange={(e) => setFilterStatus(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="all">All Status</option>
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                        <option value="suspended">Suspended</option>
                                                        <option value="graduated">Graduated</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Course</label>
                                                    <select
                                                        value={filterCourse}
                                                        onChange={(e) => setFilterCourse(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="all">All Courses</option>
                                                        <option value="B.Ed">B.Ed</option>
                                                        <option value="D.El.Ed">D.El.Ed</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Documents</label>
                                                    <select
                                                        value={filterDocStatus}
                                                        onChange={(e) => setFilterDocStatus(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="all">All</option>
                                                        <option value="complete">Complete</option>
                                                        <option value="incomplete">Incomplete</option>
                                                        <option value="pending">Pending</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setFilterStatus('all');
                                                        setFilterCourse('all');
                                                        setFilterDocStatus('all');
                                                    }}
                                                    className="w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                >
                                                    Clear Filters
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* View Toggle */}
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => {
                                            setViewMode("card");
                                            setSelectedStudent(null); // Close side panel when switching to card view
                                        }}
                                        className={`px-3 py-1.5 rounded transition-colors flex items-center justify-center ${viewMode === "card"
                                            ? "bg-white text-[#7f56da] shadow-sm"
                                            : "text-gray-600 hover:text-[#7f56da]"
                                            }`}
                                        title="Card View"
                                    >
                                        <Grid3x3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`px-3 py-1.5 rounded transition-colors flex items-center justify-center ${viewMode === "list"
                                            ? "bg-white text-[#7f56da] shadow-sm"
                                            : "text-gray-600 hover:text-[#7f56da]"
                                            }`}
                                        title="List View"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => toast.info('Export functionality coming soon')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading students...</p>
                                </div>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">No students found</p>
                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                                </div>
                            </div>
                        ) : viewMode === 'card' ? (
                            /* Card View */
                            <div className="p-6 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {students.map((student) => {
                                        const docStatus = getDocumentStatusBadge(student.documentStatus);
                                        const StatusIcon = docStatus.icon;

                                        return (
                                            <div key={student.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow relative">
                                                {/* Status Badge - Corner Badge (Half In, Half Out) */}
                                                <div className="absolute -top-2 -right-2 z-10">
                                                    {student.status === 'active' ? (
                                                        <div className="w-5 h-5 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center transition-all shadow-md">
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 bg-gray-400 flex items-center justify-center transition-all shadow-md">
                                                            <XCircle className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>


                                                {/* Three Dot Menu - Top Right */}
                                                <div className="absolute top-2 right-2 z-20">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveCardMenu(activeCardMenu === student.id ? null : student.id);
                                                        }}
                                                        className="p-1 hover:bg-white/20 rounded transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-white" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {activeCardMenu === student.id && (
                                                        <>
                                                            {/* Backdrop to close menu */}
                                                            <div
                                                                className="fixed inset-0 z-30"
                                                                onClick={() => setActiveCardMenu(null)}
                                                            />

                                                            {/* Menu */}
                                                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-40">
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveCardMenu(null);
                                                                            handleEdit(student);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2 transition-colors"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                        Edit Profile
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveCardMenu(null);
                                                                            handleToggleStatus(student);
                                                                        }}
                                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center gap-2 transition-colors ${student.status === 'active'
                                                                            ? 'text-red-600 hover:text-red-700'
                                                                            : 'text-green-600 hover:text-green-700'
                                                                            }`}
                                                                    >
                                                                        {student.status === 'active' ? (
                                                                            <>
                                                                                <UserX className="w-4 h-4" />
                                                                                Disable Profile
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <UserCheck className="w-4 h-4" />
                                                                                Enable Profile
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Card Header */}
                                                <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white overflow-hidden rounded-t-xl">
                                                    {/* Breathing circles background animation */}
                                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                                        <div className="absolute w-24 h-24 bg-white/5 rounded-full -top-8 -left-8 animate-[pulse_8s_ease-in-out_infinite] transition-all duration-1000"></div>
                                                        <div className="absolute w-20 h-20 bg-white/3 rounded-full top-8 right-12 animate-[pulse_10s_ease-in-out_infinite_1s] transition-all duration-1000"></div>
                                                        <div className="absolute w-16 h-16 bg-white/5 rounded-full bottom-4 right-16 animate-[pulse_12s_ease-in-out_infinite_2s] transition-all duration-1000"></div>
                                                        <div className="absolute w-14 h-14 bg-white/3 rounded-full -bottom-6 -left-4 animate-[pulse_10s_ease-in-out_infinite_1.5s] transition-all duration-1000"></div>
                                                    </div>

                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-sm font-medium">{student.enrollmentNo}</span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleCopyEnrollmentNo(student.enrollmentNo);
                                                                    }}
                                                                    className="p-0.5 hover:bg-white/10 rounded transition-colors"
                                                                    title="Copy Enrollment No"
                                                                >
                                                                    {copiedField === `enrollmentNo-${student.enrollmentNo}` ? (
                                                                        <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                                                                    ) : (
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {/* <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                                                {student.firstName[0]}{student.lastName[0]}
                                                            </div> */}
                                                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30 overflow-hidden">
                                                                {student.profilePicture ? (
                                                                    <img
                                                                        src={student.profilePicture}
                                                                        alt={`${student.firstName} ${student.lastName}`}
                                                                        className="w-full h-full object-cover rounded-full"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        {student.firstName[0]}
                                                                        {student.lastName[0]}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-lg truncate">
                                                                    {student.firstName} {student.middleName} {student.lastName}
                                                                </h3>
                                                                <p className="text-sm text-purple-100 truncate">{student.selectedCourse}</p>
                                                                <p className="text-xs text-purple-100 mt-0.5">Sem {student.semester} / Sec {student.section}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-6 space-y-3">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 text-purple-600 flex-shrink-0 mr-2" />
                                                        <span className="flex-1">{student.primaryPhone}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyPhone(student.primaryPhone);
                                                            }}
                                                            className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors flex-shrink-0 ml-1"
                                                            title="Copy Phone Number"
                                                        >
                                                            {copiedField === `phone-${student.primaryPhone}` ? (
                                                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="pt-3 border-t border-gray-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-medium text-gray-600">Document Status</span>
                                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${docStatus.bg}`}>
                                                                <StatusIcon className={`w-3 h-3 ${docStatus.color}`} />
                                                                <span className={docStatus.color}>{docStatus.text}</span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div className={`flex flex-col items-center p-2 rounded-lg ${student.hasPhoto ? 'bg-green-50' : 'bg-red-50'}`}>
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${student.hasPhoto ? 'bg-green-200' : 'bg-red-200'}`}>
                                                                    {student.hasPhoto ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                                                                </div>
                                                                <span className="text-[10px] font-medium text-gray-600 mt-1">Photo</span>
                                                            </div>
                                                            <div className={`flex flex-col items-center p-2 rounded-lg ${student.hasAadhar ? 'bg-green-50' : 'bg-red-50'}`}>
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${student.hasAadhar ? 'bg-green-200' : 'bg-red-200'}`}>
                                                                    {student.hasAadhar ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                                                                </div>
                                                                <span className="text-[10px] font-medium text-gray-600 mt-1">Aadhar</span>
                                                            </div>
                                                            <div className={`flex flex-col items-center p-2 rounded-lg ${student.hasBloodGroup ? 'bg-green-50' : 'bg-red-50'}`}>
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${student.hasBloodGroup ? 'bg-green-200' : 'bg-red-200'}`}>
                                                                    {student.hasBloodGroup ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                                                                </div>
                                                                <span className="text-[10px] font-medium text-gray-600 mt-1">Blood</span>
                                                            </div>
                                                            <div className={`flex flex-col items-center p-2 rounded-lg ${student.hasCaste ? 'bg-green-50' : 'bg-red-50'}`}>
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${student.hasCaste ? 'bg-green-200' : 'bg-red-200'}`}>
                                                                    {student.hasCaste ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <XCircle className="w-4 h-4 text-red-700" />}
                                                                </div>
                                                                <span className="text-[10px] font-medium text-gray-600 mt-1">Caste</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <table className="w-full">
                                    <thead className="sticky top-0 z-30">
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                                                Student's Name / ID
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                                                Course
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                                                Contacts
                                            </th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                                                Profile Status
                                            </th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                                        <span className="ml-3 text-gray-600">Loading students...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : students.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                                    No students found
                                                </td>
                                            </tr>
                                        ) : (
                                            students.map((student, index) => (
                                                <tr
                                                    key={student.id}
                                                    onClick={() => handleRowClick(student.id)}
                                                    className={`cursor-pointer transition-colors border-l-4 ${selectedStudent?.id === student.id
                                                        ? 'border-l-[#7f56da] bg-purple-50'
                                                        : 'border-l-transparent hover:bg-gray-100'
                                                        }`}
                                                    style={{
                                                        backgroundColor: selectedStudent?.id === student.id
                                                            ? '#f8f5ff'
                                                            : index % 2 === 0
                                                                ? '#fff'
                                                                : '#f9f9f9'
                                                    }}
                                                >

                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-sm">
                                                                {student.profilePicture ? (
                                                                    <img
                                                                        src={student.profilePicture}
                                                                        alt={`${student.firstName} ${student.lastName}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        {student.firstName[0]}
                                                                        {student.lastName[0]}
                                                                    </>
                                                                )}
                                                            </div>


                                                            <div className="flex-1">
                                                                <div className="text-sm font-semibold normal-case" style={{ color: '#7f56da' }}>
                                                                    {student.firstName} {student.middleName} {student.lastName}
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-600 font-mono">{student.enrollmentNo}</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCopyEnrollmentNo(student.enrollmentNo);
                                                                        }}
                                                                        className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors"
                                                                        title="Copy Enrollment No"
                                                                    >
                                                                        {copiedField === `enrollmentNo-${student.enrollmentNo}` ? (
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
                                                        <div className="text-sm text-gray-700">{student.selectedCourse}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Sem {student.semester} / Sec {student.section}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <Phone className="inline w-3 h-3 mr-1" />{student.primaryPhone}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopyPhone(student.primaryPhone);
                                                                }}
                                                                className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors"
                                                                title="Copy Phone Number"
                                                            >
                                                                {copiedField === `phone-${student.primaryPhone}` ? (
                                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-0.5">
                                                            <Mail className="inline w-3 h-3 mr-1" />{student.email}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCopyEmail(student.email);
                                                                }}
                                                                className="p-0.5 text-gray-400 hover:text-purple-600 rounded transition-colors"
                                                                title="Copy Email"
                                                            >
                                                                {copiedField === `email-${student.email}` ? (
                                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.status === 'active'
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                                }`}>
                                                                {student.status === 'active' ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleStatus(student);
                                                                }}
                                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${student.status === 'active' ? 'bg-[#7f56da]' : 'bg-gray-300'
                                                                    }`}
                                                                title={student.status === 'active' ? 'Active' : 'Inactive'}
                                                            >
                                                                <span
                                                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${student.status === 'active' ? 'translate-x-5' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(student);
                                                                }}
                                                                className="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between flex-shrink-0">

                        {/* Left side - Showing X to Y of Z records */}
                        <div className="flex items-center gap-3 flex-nowrap overflow-x-auto">

                            <span className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
                            </span>

                            {/* Items per page selector */}
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

                        {/* Right side - Pagination controls */}
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>


                            {getPaginationPages().map((item, index) =>
                                item === 'dots' ? (
                                    <span
                                        key={`dots-${index}`}
                                        className="px-2 text-gray-400"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => setCurrentPage(item)}
                                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border text-xs sm:text-sm font-medium ${currentPage === item
                                            ? 'bg-[#7f56da] text-white border-[#7f56da]'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {item}
                                    </button>

                                )
                            )}

                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === pageCounts}
                                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border transition-colors ${currentPage === 1
                                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
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
                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/30 overflow-hidden">
                                        {selectedStudent.profilePicture ? (
                                            <img
                                                src={selectedStudent.profilePicture}
                                                alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        ) : (
                                            <>
                                                {selectedStudent.firstName[0]}
                                                {selectedStudent.lastName[0]}
                                            </>
                                        )}
                                    </div>

                                    {/* Status Indicator Badge - Top Right (Half In, Half Out) */}
                                    <div className="absolute -top-0.5 -right-0.5 z-10">
                                        {selectedStudent.status === 'active' ? (
                                            <div className="w-5 h-5 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center transition-all shadow-md">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-400 bg-gray-400 flex items-center justify-center transition-all shadow-md">
                                                <XCircle className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Student Name */}
                                <h4 className="text-base font-bold text-white text-center leading-tight">
                                    {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.lastName}
                                </h4>

                                {/* Registration Number with Copy */}
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="text-xs font-mono text-white/90">{selectedStudent.enrollmentNo}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyEnrollmentNo(selectedStudent.enrollmentNo);
                                        }}
                                        className="p-0.5 hover:bg-white/20 rounded transition-colors"
                                        title="Copy Enrollment No"
                                    >
                                        {copiedField === `enrollmentNo-${selectedStudent.enrollmentNo}` ? (
                                            <CheckCircle className="w-3 h-3 text-green-300" />
                                        ) : (
                                            <Copy className="w-3 h-3 text-white/70" />
                                        )}
                                    </button>
                                </div>

                                {/* Course, Semester & Section Info */}
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs font-medium text-white/80">{selectedStudent.selectedCourse}</span>
                                        <span className="text-xs text-white/60">•</span>
                                        <span className="text-xs text-white/80">Sem {selectedStudent.semester}</span>
                                        <span className="text-xs text-white/60">•</span>
                                        <span className="text-xs text-white/80">Sec {selectedStudent.section}</span>
                                    </div>
                                </div>

                                {/* Quick Action Buttons */}
                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        onClick={() => window.location.href = `tel:${selectedStudent.primaryPhone}`}
                                        className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/30"
                                        title="Call"
                                    >
                                        <Phone className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            // TODO: Implement view complete profile functionality
                                            toast.info('View complete profile functionality coming soon');
                                        }}
                                        className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/30"
                                        title="View Complete Profile"
                                    >
                                        <UserCircle2 className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            // TODO: Implement ID card print functionality
                                            toast.info('ID Card print functionality coming soon');
                                        }}
                                        className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/30"
                                        title="Print ID Card"
                                    >
                                        <IdCard className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            // TODO: Implement biometric functionality
                                            toast.info('Biometric functionality coming soon');
                                        }}
                                        className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/30"
                                        title="Biometric Action"
                                    >
                                        <Fingerprint className="w-5 h-5 text-white" />
                                    </button>
                                    {false && (
                                        <button
                                            onClick={() => window.open(`https://wa.me/${selectedStudent?.primaryPhone.replace(/\D/g, '')}`, '_blank')}
                                            className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/30"
                                            title="WhatsApp"
                                        >
                                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            // TODO: Implement cancel admission functionality
                                            if (window.confirm('Are you sure you want to cancel this student\'s admission?')) {
                                                toast.success('Admission cancelled successfully');
                                            }
                                        }}
                                        className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/30"
                                        title="Cancel Admission"
                                    >
                                        <UserMinus className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Personal Details with Icons */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {/* Two Column Grid for compact fields */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {/* Gender */}
                                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <UserCircle className="w-4 h-4 text-[#7f56da]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Gender</p>
                                            <p className="text-xs font-semibold text-gray-900 truncate">{selectedStudent.gender}</p>
                                        </div>
                                    </div>

                                    {/* Blood Group */}
                                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Droplet className="w-4 h-4 text-[#7f56da]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Blood Group</p>
                                            <p className="text-xs font-semibold text-gray-900 truncate">{selectedStudent.bloodGroup || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Date of Birth & Religion - Two Columns */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {/* Date of Birth */}
                                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="w-4 h-4 text-[#7f56da]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Date of Birth</p>
                                            <p className="text-xs font-semibold text-gray-900 truncate">
                                                {new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Religion */}
                                    <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-4 h-4 text-[#7f56da]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Religion</p>
                                            <p className="text-xs font-semibold text-gray-900 truncate">{selectedStudent.religion || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Father's Name - Full Width */}
                                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-[#7f56da]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Father's Name</p>
                                        <p className="text-xs font-semibold text-gray-900">{selectedStudent.fatherName}</p>
                                    </div>
                                </div>

                                {/* Mother's Name - Full Width */}
                                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-[#7f56da]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Mother's Name</p>
                                        <p className="text-xs font-semibold text-gray-900">{selectedStudent.motherName}</p>
                                    </div>
                                </div>

                                {/* Correspondence Address */}
                                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-4 h-4 text-[#7f56da]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Correspondence Address</p>
                                        <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                                            {selectedStudent.corrAddress}, {selectedStudent.corrCity}, {selectedStudent.corrState}, {selectedStudent.corrCountry || 'India'} - {selectedStudent.corrPincode}
                                        </p>
                                    </div>
                                </div>

                                {/* Permanent Address */}
                                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <Home className="w-4 h-4 text-[#7f56da]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Permanent Address</p>
                                        <p className="text-xs font-semibold text-gray-900 leading-relaxed">
                                            {selectedStudent.permAddress || selectedStudent.corrAddress}, {selectedStudent.permCity || selectedStudent.corrCity}, {selectedStudent.permState || selectedStudent.corrState}, {selectedStudent.permCountry || selectedStudent.corrCountry || 'India'} - {selectedStudent.permPincode || selectedStudent.corrPincode}
                                        </p>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
