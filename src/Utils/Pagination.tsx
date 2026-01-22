export type PaginationItem = number | "dots";

/**
 * Generates pagination page numbers with dots
 * Example: [1, 2, 3, "dots", 9, 10]
 */
export const getPaginationPages = (
  pageCount: number
): PaginationItem[] => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages: PaginationItem[] = [];

  // First pages
  pages.push(1, 2, 3);

  // Dots
  pages.push("dots");

  // Last pages
  pages.push(pageCount - 1, pageCount);

  return pages;
};





interface PaginationProps {
  pages: PaginationItem[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  pages,
  currentPage,
  onPageChange,
}) => {
  return (
    <div className="flex items-center gap-1">
      {pages.map((item, index) =>
        item === "dots" ? (
          <span
            key={`dots-${index}`}
            className="px-2 text-gray-400 select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded border text-xs sm:text-sm font-medium transition ${currentPage === item
                ? "bg-[#7f56da] text-white border-[#7f56da]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
          >
            {item}
          </button>
        )
      )}
    </div>
  );
};

export default Pagination;
