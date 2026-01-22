import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid,
  GraduationCap,
  ClipboardCheck,
  Database,
  Calendar,
  BookOpen,
  Menu,
  ChevronDown,
  ChevronRight,
  X,
  ArrowLeftRight,
  Receipt,
  ClipboardList,
  CreditCard,
  Book,
  PlusCircle,
  ListChecks,
  CalendarDays,
  IndianRupee,
  Layers,
  LogOut,
  Users
} from "lucide-react";
import Session from '../Utils/session';
import { useNavigate, useLocation } from 'react-router-dom';

// Custom event system for communication
const SIDEBAR_EVENTS = {
  NAVIGATE: 'sidebar:navigate',
  LOGOUT: 'sidebar:logout',
  STATE_CHANGE: 'sidebar:state-change'
};
interface TooltipProps {
  content: string;
  position?: 'right' | 'top';
  children: ReactNode;
  wrapperClassName?: string;
}

// Tooltip Component (typed)
const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'right',
  children,
  wrapperClassName = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative ${wrapperClassName}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap
            ${position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
            ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};


interface NavItem {
  icon: React.ElementType;
  label: string;
  hasDropdown?: boolean;
  submenu?: (SubmenuItem | NestedSubmenu)[];
  path?: string
}

interface SubmenuItem {
  label: string;
  icon: React.ElementType;
  path: string
}

interface NestedSubmenu {
  label: string;
  icon: React.ElementType;
  items: { label: string; icon: React.ElementType; path: string }[];
}

const navItems: NavItem[] = [
  { icon: LayoutGrid, label: 'Dashboard', path: '' },
  { icon: IndianRupee, label: 'Transactions', path: '' },
  { icon: Users, label: 'Manage Students', path: '/students' },
  {
    icon: ClipboardCheck,
    label: 'Processes',
    hasDropdown: true,
    submenu: [
      { label: 'New Admissions', icon: PlusCircle, path: '' },
      { label: 'Semester Registration', icon: CalendarDays, path: '' },
      { label: 'Back-Paper Registration', icon: ArrowLeftRight, path: '' },
      { label: 'Manage Admit Card', icon: ClipboardList, path: '/admitcards' },
      { label: 'Manage Academics', icon: ListChecks, path: '' }
    ],

  },
  {
    icon: Database,
    label: 'Data Profiles',
    hasDropdown: true,
    submenu: [
      {
        label: 'Course', icon: GraduationCap, items: [
          { label: 'Manage Course', icon: Book, path: '' },
          { label: 'Manage Subject', icon: BookOpen, path: '' }
        ]
      },
      {
        label: 'Fee Structure', icon: IndianRupee, items: [
          { label: 'Fee Structure', icon: CreditCard, path: '' },
          { label: 'Add-on Fee Structure', icon: PlusCircle, path: '' }
        ]
      },
      { label: 'Manage Fee Head', icon: Receipt, path: '' },
      {
        label: 'Process & Events', icon: CalendarDays, items: [
          { label: 'Process Types', icon: Layers, path: '' },
          { label: 'Manage Events', icon: Calendar, path: '' }
        ]
      }
    ]
  },
];

export function Sidebar() {
  // Internal state management
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('transactions');
  const [userName, setUserName] = useState(Session.get('userName'));
  const [userEmail, setUserEmail] = useState(Session.get('email'));
  const location = useLocation();
 
  // Type guard to check if an object is SubmenuItem
  const isSubmenuItem = (obj: SubmenuItem | NestedSubmenu): obj is SubmenuItem => {
    return (obj as SubmenuItem).path !== undefined;
  };

  // Determine which top-level menu should be expanded based on current path
  const getExpandedMenuFromPath = (): string | null => {
    for (const item of navItems) {
      if (!item.submenu) continue;

      for (const sub of item.submenu) {
        if ('items' in sub && sub.items) {
          // NestedSubmenu
          if (sub.items.some(nested => nested.path === location.pathname)) {
            return item.label;
          }
        } else if (isSubmenuItem(sub)) {
          // SubmenuItem
          if (sub.path === location.pathname) {
            return item.label;
          }
        }
      }
    }
    return null;
  };

  // Determine which submenu (nested) should be expanded
  const getExpandedSubmenuFromPath = (): string | null => {
    for (const item of navItems) {
      if (!item.submenu) continue;

      for (const sub of item.submenu) {
        if ('items' in sub && sub.items) {
          if (sub.items.some(nested => nested.path === location.pathname)) {
            return sub.label;
          }
        }
      }
    }
    return null;
  };


  const [expandedMenu, setExpandedMenu] = useState<string | null>(getExpandedMenuFromPath());
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(getExpandedSubmenuFromPath());

  // Re-run when location changes
  useEffect(() => {
    setExpandedMenu(getExpandedMenuFromPath());
    setExpandedSubmenu(getExpandedSubmenuFromPath());
  }, [location.pathname]);


  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hoverTimeoutRef = useRef<number | null>(null);
  const [isUserProfileExpanded, setIsUserProfileExpanded] = useState(false);

  // Listen for external state updates via custom events
  useEffect(() => {
    const handleStateChange = (e: CustomEvent) => {
      const { type, payload } = e.detail;
      switch (type) {
        case 'SET_ACTIVE_VIEW':
          setActiveView(payload);
          break;
        case 'SET_USER_INFO':
          setUserName(payload.name);
          setUserEmail(payload.email);
          break;
        case 'TOGGLE_SIDEBAR':
          setIsOpen(prev => !prev);
          break;
        case 'TOGGLE_COLLAPSE':
          setIsCollapsed(prev => !prev);
          break;
      }
    };

    window.addEventListener(SIDEBAR_EVENTS.STATE_CHANGE, handleStateChange as EventListener);
    return () => {
      window.removeEventListener(SIDEBAR_EVENTS.STATE_CHANGE, handleStateChange as EventListener);
    };
  }, []);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Calculate position when hoveredMenu changes
  useEffect(() => {
    if (hoveredMenu && buttonRefs.current[hoveredMenu]) {
      const rect = buttonRefs.current[hoveredMenu]!.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right + 4,
      });
    } else {
      setMenuPosition(null);
    }
  }, [hoveredMenu]);

  const handleMouseEnter = (label: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredMenu(label);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredMenu(null);
    }, 150);
  };

  const handleMenuClick = (label: string) => {
    if (label === expandedMenu) {
      setExpandedMenu(null);
      setExpandedSubmenu(null);
    } else {
      setExpandedMenu(label);
      setExpandedSubmenu(null);
    }
  };

  const handleSubmenuClick = (label: string) => {
    if (label === expandedSubmenu) {
      setExpandedSubmenu(null);
    } else {
      setExpandedSubmenu(label);
    }
  };

  const handleItemClick = (label: string) => {
    const viewMap: Record<string, string> = {
      'Dashboard': 'manageAdmission',
      'Transactions': 'transactions',
      'Manage Students': 'manageStudents',
      'Fee Collection': 'feeCollection',
      'Receipts': 'receipts',
      'Student Ledger': 'studentLedger',
      'Fee Reports': 'feeReports',
      'Due Reports': 'dueReports',
      'New Admissions': 'courseRegistration',
      'Semester Registration': 'semesterRegistration',
      'Back-Paper Registration': 'backPaperRegistration',
      'Manage Admit Card': 'manageAdmitCard',
      'Manage Academics': 'manageAcademics',
      'Process Types': 'manageEvent',
      'Manage Events': 'manageEvents',
      'Manage Course': 'manageCourse',
      'Manage Subject': 'manageSubject',
      'Fee Structure': 'feeStructure',
      'Add-on Fee Structure': 'addonFeeStructure',
      'Manage Fee Head': 'manageFeeHead',
    };

    const view = viewMap[label] || 'transactions';
    setActiveView(view);

    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent(SIDEBAR_EVENTS.NAVIGATE, {
      detail: { view }
    }));

    setIsOpen(false);
  };



  const navigateTo = (path?: string) => {
    if (!path) return;
    navigate(path);
    setIsOpen(false); // close sidebar on mobile
  };

  const isActive = (path?: string) => {
    return path ? location.pathname === path : false;
  };
  const navigate = useNavigate()
  const handleLogout = () => {
    // Dispatch logout event

    Session.remove('token')
    navigate('/login')
  };

  // const isActive = (label: string) => {
  //   const viewMap: Record<string, string> = {
  //     'Dashboard': 'manageAdmission',
  //     'Transactions': 'transactions',
  //     'Manage Students': 'manageStudents',
  //     'Fee Collection': 'feeCollection',
  //     'Receipts': 'receipts',
  //     'Student Ledger': 'studentLedger',
  //     'Fee Reports': 'feeReports',
  //     'Due Reports': 'dueReports',
  //     'New Admissions': 'courseRegistration',
  //     'Semester Registration': 'semesterRegistration',
  //     'Back-Paper Registration': 'backPaperRegistration',
  //     'Manage Admit Card': 'manageAdmitCard',
  //     'Manage Academics': 'manageAcademics',
  //     'Process Types': 'manageEvent',
  //     'Manage Events': 'manageEvents',
  //     'Manage Course': 'manageCourse',
  //     'Manage Subject': 'manageSubject',
  //     'Fee Structure': 'feeStructure',
  //     'Add-on Fee Structure': 'addonFeeStructure',
  //     'Manage Fee Head': 'manageFeeHead',
  //   };

  //   return viewMap[label] === activeView;
  // };

  const isParentActive = (item: NavItem) => {
    if (!item.submenu) return false;

    for (const subItem of item.submenu) {
      if ('items' in subItem && subItem.items) {
        for (const nestedItem of subItem.items) {
          if (isActive(nestedItem.label)) return true;
        }
      } else {
        if (isActive(subItem.label)) return true;
      }
    }
    return false;
  };


  const handelCollapsed = () => setIsCollapsed(!isCollapsed)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:static`}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <span className="text-2xl lg:text-3xl font-bold" style={{ letterSpacing: '0.05em' }}>
              <span style={{ color: '#7f56da' }}>IM</span>
              <span className="text-blue-600">ROS</span>
            </span>
          )}
          {/* {isCollapsed && (
            <div className="flex flex-col items-center justify-center w-full gap-2">
              <button
                onClick={() => setIsCollapsed(false)}
                className="lg:hidden p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <Menu className="w-4 h-4" style={{ color: '#7f56da' }} />
              </button>
              <span className="text-2xl font-bold" style={{ letterSpacing: '0.05em' }}>
                <span style={{ color: '#7f56da' }}>IM</span>
              </span>
            </div>
          )} */}

          {isCollapsed && (
            <div className="flex flex-col items-center justify-center w-full gap-2">
              {/* Mobile/Tablet collapse button for collapsed state */}
              {handelCollapsed && (
                <button
                  onClick={handelCollapsed}
                  className="lg:hidden p-1.5 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Expand sidebar"
                > 
                  <Menu className="w-4 h-4" style={{ color: '#7f56da' }} />
                </button>
              )}
              <span className="text-2xl font-bold" style={{ letterSpacing: '0.05em' }}>
                <span style={{ color: '#7f56da' }}>IM</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden"
          >
            <X className="w-6 h-6" style={{ color: '#7f56da' }} />
          </button>
          {handelCollapsed && !isCollapsed && (
            <button
              onClick={handelCollapsed}
              className="lg:hidden p-2 hover:bg-purple-50 rounded-lg transition-colors"
              title="Collapse sidebar"
            > 
              <Menu className="w-5 h-5" style={{ color: '#7f56da' }} />
            </button>
          )}
        </div>

        {/* Navigation - Scrollable */}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <div key={item.label} className="mb-1 relative">
              {isCollapsed ? (
                <div
                  onMouseEnter={() => item.hasDropdown && handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Tooltip content={item.label} position="right" wrapperClassName="w-full">
                    <button
                      ref={(el) => {
                        if (item.hasDropdown) {
                          buttonRefs.current[item.label] = el;
                        }
                      }}
                      onClick={() => {
                        if (item.label === 'Dashboard') {
                          handleItemClick(item.label);
                        } else if (item.label === 'Transactions') {
                          handleItemClick(item.label);
                        } else if (item.label === 'Manage Students') {
                          handleItemClick(item.label);
                        } else if (item.hasDropdown && item.submenu && item.submenu.length > 0) {
                          const firstItem = item.submenu[0];
                          if ('items' in firstItem && firstItem.items && firstItem.items.length > 0) {
                            handleItemClick(firstItem.items[0].label);
                          } else {
                            handleItemClick(firstItem.label);
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-all ${(item.label === 'Dashboard' && activeView === 'manageAdmission') ||
                        (item.label === 'Transactions' && activeView === 'transactions') ||
                        (item.label === 'Manage Students' && activeView === 'manageStudents') ||
                        isParentActive(item)
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (item.hasDropdown) {
                      handleMenuClick(item.label);
                    } else {
                      navigateTo(item.path);
                    }
                  }}
                  // className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${(activeView === 'manageAdmission' && item.label === 'Dashboard') ||
                  //   (activeView === 'transactions' && item.label === 'Transactions') ||
                  //   (activeView === 'manageStudents' && item.label === 'Manage Students')
                  //   ? 'bg-purple-50 text-purple-700 font-medium'
                  //   : 'text-gray-700 hover:bg-gray-50'
                  //   }`}

                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isActive(item.path)
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {item.hasDropdown && (
                    expandedMenu === item.label ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )
                  )}
                </button>
              )}

              {/* Dropdown Menu */}
              {!isCollapsed && item.hasDropdown && expandedMenu === item.label && (
                <div className="ml-3 mt-1 space-y-1">
                  {item.submenu?.map((subItem) => {
                    if ('icon' in subItem && !('items' in subItem)) {
                      return (
                        <button
                          key={subItem.label}
                          // onClick={() => navigateTo(subItem.path)}
                          // className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive(subItem.label)
                          //   ? 'bg-purple-50 text-purple-700 font-medium'
                          //   : 'text-gray-600 hover:bg-gray-50'
                          //   }`}
                          onClick={() => navigateTo(subItem.path)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive(subItem.path)
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </button>
                      );
                    } else {
                      return (
                        <div key={subItem.label} className="mb-1">
                          <button
                            onClick={() => handleSubmenuClick(subItem.label)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <subItem.icon className="w-4 h-4" />
                              <span className="font-medium">{subItem.label}</span>
                            </div>
                            {expandedSubmenu === subItem.label ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          {expandedSubmenu === subItem.label && (
                            <div className="ml-3 mt-1 space-y-1">
                              {subItem.items.map((nestedItem) => (
                                <button
                                  key={nestedItem.label}
                                  onClick={() => navigateTo(nestedItem.path)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive(nestedItem.path)
                                    ? 'bg-purple-50 text-purple-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                  <nestedItem.icon className="w-4 h-4" />
                                  <span>{nestedItem.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        {userName && (
          <div className="border-t border-gray-200 p-3 flex-shrink-0">
            {isCollapsed ? (
              <Tooltip content={`${userName} - Logout`} position="right">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2.5 hover:bg-red-50 rounded-lg transition-colors group"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                </button>
              </Tooltip>
            ) : (
              <div>
                <button
                  onClick={() => setIsUserProfileExpanded(!isUserProfileExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7f56da] to-[#6d49c5] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{userName}</span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                  {isUserProfileExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>

                {isUserProfileExpanded && (
                  <div className="ml-3 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Desktop collapse button */}
        <div className="hidden lg:block border-t border-gray-200 p-3 flex-shrink-0">
          <Tooltip content={isCollapsed ? 'Expand Menu' : 'Collapse Menu'} position="right">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center px-3 py-2.5 hover:bg-purple-50 rounded-lg transition-colors group"
            >
              <Menu className="w-8 h-8 group-hover:scale-110 transition-transform" style={{ color: '#7f56da' }} />
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* Floating Submenu Portal */}
      {hoveredMenu && menuPosition && createPortal(
        <div
          className="fixed z-[99999] pointer-events-auto"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          onMouseEnter={() => handleMouseEnter(hoveredMenu)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white shadow-xl border border-gray-200 rounded-lg py-2 min-w-[220px] animate-fadeIn">
            {navItems.find(item => item.label === hoveredMenu)?.submenu?.map((subItem) => {
              if ('icon' in subItem && !('items' in subItem)) {
                return (
                  <button
                    key={subItem.label}
                    onClick={() => handleItemClick(subItem.label)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-all ${isActive(subItem.label)
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <subItem.icon className="w-4 h-4" />
                    <span>{subItem.label}</span>
                  </button>
                );
              } else {
                return (
                  <div key={subItem.label} className="px-2 py-1">
                    <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700">
                      <subItem.icon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {subItem.items.map((nestedItem) => (
                        <button
                          key={nestedItem.label}
                          onClick={() => handleItemClick(nestedItem.label)}
                          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-all ${isActive(nestedItem.label)
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <nestedItem.icon className="w-4 h-4" />
                          <span>{nestedItem.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}