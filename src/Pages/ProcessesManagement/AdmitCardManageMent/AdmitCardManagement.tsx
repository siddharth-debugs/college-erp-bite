import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  X,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2,
  User,
  UserCheck,
  Edit2,
  Trash2,
  Calendar,

} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { AddAdmitCardModal } from "../../../Components/Modals/AddAdmitCardModal";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { AcademicActivity, DraggableCardProps } from "../../../Types/AdmitCard";
import { GetData } from "../../../API/GlobalApi";
import Pagination, { getPaginationPages } from "../../../Utils/Pagination";
import { itemsPerPageOptions } from "../../../Types/Common"; 
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../../Utils/SearchDebouneHooks";





function DraggableCard({
  admitCard,
  index,
  moveCard,
  handleCardClick,
  handleEdit,
  handleDelete,
  openMenuId,
  setOpenMenuId,
  loadingEdit,
  formatDate,
  getDaysAgo,
  getDaysUntilExam,
  getProgressColor,
  getProgressPercentage,
  isExamPassed,
}: DraggableCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "CARD",
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveCard(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  drag(drop(ref));

  const daysUntilExam = getDaysUntilExam(admitCard.exam_start_date);
  const examPassed = isExamPassed(admitCard.exam_start_date);

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : examPassed ? 0.5 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        ...(isDragging && {
          transform: "scale(1.05) rotate(2deg)",
          transition: "transform 0.2s ease",
        }),
      }}
      className={`bg-white rounded-xl border transition-shadow relative ${examPassed
        ? "border-gray-300 opacity-50 grayscale"
        : isDragging
          ? "border-purple-500 shadow-2xl ring-4 ring-purple-300 ring-opacity-50"
          : "border-gray-200 hover:shadow-lg hover:border-purple-300"
        }`}
    >
      {/* Three-dot menu in top right corner */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuId(
              openMenuId === admitCard.id ? null : admitCard.id,
            );
          }}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Options"
        >
          {loadingEdit === admitCard.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <MoreVertical className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Dropdown Menu */}
        {openMenuId === admitCard.id && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-30"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(null);
              }}
            />

            {/* Menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-40">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    if (examPassed) return;   // 🔒 hard stop
                    handleEdit(admitCard);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(null);
                    if (examPassed) return;   // 🔒 hard stop
                    handleDelete(admitCard.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Card Header with Gradient */}
      <div onClick={() => handleCardClick(admitCard.id)} className="cursor-pointer">
        <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-4 text-white overflow-hidden rounded-t-xl">
          {/* Breathing circles background animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-24 h-24 bg-white/5 rounded-full -top-8 -left-8 animate-[pulse_8s_ease-in-out_infinite]"></div>
            <div className="absolute w-20 h-20 bg-white/3 rounded-full top-8 right-12 animate-[pulse_10s_ease-in-out_infinite_1s]"></div>
            <div className="absolute w-16 h-16 bg-white/5 rounded-full bottom-4 right-16 animate-[pulse_12s_ease-in-out_infinite_2s]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <span className="text-sm font-medium">
                  Admit Card
                </span>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1 line-clamp-2 min-h-[3.5rem]">
              {admitCard.activity_name}
              {admitCard.selection_name && (<span className="text-sm font-medium">
                ({admitCard.selection_name})
              </span>)}
            </h3>

            {/* Cards issued with progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>
                  {admitCard.completed_students} /{" "}
                  {admitCard.total_students} cards issued
                </span>
                <span className="font-semibold">
                  {getProgressPercentage(
                    admitCard.completed_students,
                    admitCard.total_students,
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(admitCard.completed_students, admitCard.total_students)}`}
                  style={{
                    width: `${getProgressPercentage(admitCard.completed_students, admitCard.total_students)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {/* Assigned To & Created By */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <UserCheck className="w-4 h-4 text-purple-600 flex-shrink-0 mr-2" />
              <span className="font-medium text-gray-700 mr-1.5">
                Assigned to:
              </span>
              <span className="flex-1 truncate">
                {admitCard.employee_list?.length
                  ? admitCard.employee_list.map(e => e.name).join(", ")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 text-purple-600 flex-shrink-0 mr-2" />
              <span className="font-medium text-gray-700 mr-1.5">
                Created by:
              </span>
              <span className="flex-1 truncate">
                {admitCard.created_by}
              </span>
            </div>
          </div>

          {/* Date Range */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">
                Period
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">
              {formatDate(admitCard.start_date)} –{" "}
              {formatDate(admitCard.end_date)}
            </div>
          </div>

          {/* Exam Date */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm flex-1">
                <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mr-2" />
                <span className="font-medium text-gray-700 mr-1.5">
                  Exam Date:
                </span>
                <span className="text-gray-600">
                  {formatDate(admitCard.exam_start_date)}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${daysUntilExam !== null && daysUntilExam < 0
                  ? "bg-gray-100 text-gray-600"
                  : daysUntilExam !== null && daysUntilExam <= 3
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                  }`}
              >
                {getDaysAgo(admitCard.exam_start_date)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AcademicActivityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AcademicActivity[];
}



export function ManageAdmitCard() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [admitCards, setAdmitCards] = useState<AcademicActivity[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const pageCounts = Math.ceil(totalCount / itemsPerPage);
  const [viewMode, setViewMode] = useState<"card" | "list">(
    "card",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [loadingEdit, _setLoadingEdit] = useState<number | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);


  const fetchAdmitCards = async (
    page: number,
    search: string,
    pageSize: number = itemsPerPage
  ): Promise<void> => {
    setIsLoading(true);
    try {
      let url = `academics/activities/?page=${page}&page_size=${pageSize}`;
      if (search.trim()) {
        // Encode and replace spaces with '+'
        const encodedSearch = encodeURIComponent(search.trim()).replace(/%20/g, '+');
        url += `&search=${encodedSearch}`;
      }
      const data: AcademicActivityResponse = await GetData(url);

      setAdmitCards(data.results);
      setTotalCount(data.count);
    } catch (error) {
      console.error("Error fetching admit card:", error);
      setAdmitCards([]);
      setTotalCount(0);
      // Notifier.error("Failed to load students");
    } finally {
      setIsLoading(false);

      console.log("🔚 fetchAdmitcard finished");
    }
  };


  useEffect(() => {
    fetchAdmitCards(currentPage, debouncedSearch, itemsPerPage);
  }, [currentPage, debouncedSearch, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);


  const pages = getPaginationPages(pageCounts);


  // Helper function to format date
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };


  // Helper function to calculate days ago/remaining
  const getDaysAgo = (dateString?: string | null) => {
    if (!dateString) return "—";
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - examDate.getTime();
    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24),
    );

    if (diffDays > 0) {
      return `${diffDays} days ago`;
    } else if (diffDays === 0) {
      return "Today";
    } else {
      return `in ${Math.abs(diffDays)} days`;
    }
  };

  // Helper function to calculate days until exam
  const getDaysUntilExam = (dateString?: string | null): number | null => {
    if (!dateString) return null;

    const examDate = new Date(dateString);
    const today = new Date();

    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };


  // Helper function to get exam badge color
  // const getExamBadgeColor = (days: number) => {
  //   if (days > 0) return "bg-green-400";
  //   if (days === 0) return "bg-blue-400";
  //   return "bg-red-400";
  // };

  // Helper function to get exam badge color
  const getExamBadgeColor = (days: number | null) => {
    if (days === null) return "bg-gray-400"; // optional fallback
    if (days > 0) return "bg-green-400";
    if (days === 0) return "bg-blue-400";
    return "bg-red-400";
  };



  // Get progress color based on percentage
  const getProgressColor = (issued: number, total: number) => {
    const percentage = (issued / total) * 100;
    if (percentage >= 90) return "bg-green-400";
    if (percentage >= 70) return "bg-blue-400";
    if (percentage >= 50) return "bg-yellow-400";
    return "bg-orange-400";
  };

  // Get progress percentage
  const getProgressPercentage = (
    issued: number,
    total: number,
  ) => {
    return Math.round((issued / total) * 100);
  };

  // Helper function to check if exam is passed
  const isExamPassed = (dateString?: string | null): boolean => {
    if (!dateString) return false; // or true depending on your UX

    const examDate = new Date(dateString);
    const today = new Date();

    // Normalize time to avoid same-day issues
    examDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return examDate < today;
  };

  const navigate = useNavigate()
  const handleCardClick = (id: number) => {
    navigate(`/admitcards/${id}`)
    console.log("Admit card clicked", id);
    //  setSelectedAdmitCard(card);
  };

  const [editAdmitCard, setEditAdmitCard] = useState<AcademicActivity | null>(null);

  const handleEdit = (card: AcademicActivity) => {
    console.log("Edit admit card:", card);
    setEditAdmitCard(card);
    setShowAddModal(true)
    // TODO: Implement edit modal
  };

  const handleDelete = (id: number) => {
    console.log("Delete admit card:", id);
    // TODO: Implement delete confirmation
  };

  const handleAddNewClick = () => {
    console.log("Add new admit card");
    setEditAdmitCard(null); // 👈 ADD MODE
    setShowAddModal(true);
  };

  // Handle drag and drop reordering
  const moveCard = (dragIndex: number, hoverIndex: number) => {
    const updatedCards = [...admitCards];
    const draggedItem = updatedCards[dragIndex];
    updatedCards.splice(dragIndex, 1);
    updatedCards.splice(hoverIndex, 0, draggedItem);
    setAdmitCards(updatedCards);
  };




  return (
    <div className="flex flex-col bg-white w-full h-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col pb-3 px-4 sm:px-6 pt-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h1
          className="text-lg sm:text-xl lg:text-2xl font-semibold"
          style={{ color: "#7f56da" }}
        >
          Manage Admit Cards
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Generate and track admit cards for examinations
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
              placeholder="Search by course, assigned person, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("card")}
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
              onClick={handleAddNewClick}
              className="px-4 py-2 bg-[#7f56da] hover:bg-[#6941c0] text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admit cards...</p>
          </div>
        </div>
      ) : admitCards.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 mb-4">
            {searchQuery
              ? "No admit cards found matching your search"
              : "No admit cards available"}
          </div>
        </div>
      ) : viewMode === "card" ? (
        /* Card View */
        <>
          <DndProvider backend={HTML5Backend} >
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {admitCards.map((admitCard, index) => (
                  <DraggableCard
                    key={admitCard.id}
                    admitCard={admitCard}
                    index={index}
                    moveCard={moveCard}
                    handleCardClick={handleCardClick}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    loadingEdit={loadingEdit}
                    formatDate={formatDate}
                    getDaysAgo={getDaysAgo}
                    getDaysUntilExam={getDaysUntilExam}
                    getExamBadgeColor={getExamBadgeColor}
                    getProgressColor={getProgressColor}
                    getProgressPercentage={getProgressPercentage}
                    isExamPassed={isExamPassed}
                  />
                ))}
              </div>
            </div>
          </DndProvider>


        </>
      ) : (
        /* List View */
        <>
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-30">
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Course Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Cards Issued
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Assigned To
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Created By
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Period
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Exam Date
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admitCards.map((admitCard, index) => {
                  const examPassed = isExamPassed(admitCard.exam_start_date);
                  const daysUntilExam = getDaysUntilExam(admitCard.exam_start_date);
                  return (
                    <tr
                      key={admitCard.id}
                      onClick={() => handleCardClick(admitCard.id)}
                      className={`cursor-pointer transition-colors hover:bg-gray-100 ${examPassed ? 'text-gray-400' : ''}`}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                      }}
                    >
                      <td className="py-3 px-4">
                        <div
                          className={`text-sm font-semibold normal-case ${examPassed ? '' : ''}`}
                          style={{ color: examPassed ? "#9ca3af" : "#7f56da" }}
                        >
                          {admitCard.activity_name}

                        </div>
                        {admitCard.selection_name && (
                          <div
                            className="text-sm font-semibold normal-case"
                            style={{ color: examPassed ? "#9ca3af" : "#7f56da" }}
                          >
                            {admitCard.selection_name}
                          </div>
                        )}

                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          {admitCard.completed_students} /{" "}
                          {admitCard.total_students}
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${examPassed ? 'bg-gray-300' : getProgressColor(admitCard.completed_students, admitCard.total_students)}`}
                            style={{
                              width: `${getProgressPercentage(admitCard.completed_students, admitCard.total_students)}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {admitCard.employee_list?.length
                          ? admitCard.employee_list.map(emp => emp.name).join(", ")
                          : "—"}

                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {admitCard.created_by}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-600">
                          {formatDate(admitCard.start_date)} –{" "}
                          {formatDate(admitCard.end_date)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-700">
                          {formatDate(admitCard.exam_start_date)}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${examPassed
                          ? 'bg-gray-50 text-gray-400 border border-gray-200'
                          : daysUntilExam !== null && daysUntilExam <= 3
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                          }`}>
                          {getDaysAgo(admitCard.exam_start_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (examPassed) return;   // 🔒 hard stop
                              handleEdit(admitCard);
                            }}
                            disabled={examPassed}
                            className={`p-1.5 rounded transition-colors ${examPassed
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-purple-600 hover:bg-purple-100'
                              }`}
                            title={examPassed ? "Disabled" : "Edit"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              if (examPassed) return;   // 🔒 hard stop
                              e.stopPropagation();
                              // handleDelete(admitCard.id);
                            }}
                            disabled={examPassed}
                            className={`p-1.5 rounded transition-colors ${examPassed
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-100'
                              }`}
                            title={examPassed ? "Disabled" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>


        </>
      )}
      {/* Pagination - Always visible and sticky at bottom for List View */}
      <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between flex-shrink-0">
        {/* Left side - Showing X to Y of Z records */}
        <div className="flex items-center gap-4">
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

      {/* Add Admit Card Modal */}
      {showAddModal && (
        <AddAdmitCardModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          admitCard={editAdmitCard}
          onSave={async () => {
            setShowAddModal(false);
            await fetchAdmitCards(currentPage, searchQuery, itemsPerPage);
            // TODO: Refresh data after save
          }}
        />
      )}
    </div>
  );
}