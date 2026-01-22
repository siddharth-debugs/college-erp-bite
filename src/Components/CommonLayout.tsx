
import type { ReactNode } from 'react';

import { Menu } from "lucide-react";
import { Sidebar } from "./SideBar";

interface CommonLayoutsProps {
  children: ReactNode;
}

const CommonLayouts = ({ children }: CommonLayoutsProps) => {
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <button
          // onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
          style={{ backgroundColor: 'white' }}
        >
          <Menu className="w-6 h-6" style={{ color: '#7f56da' }} />
        </button>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CommonLayouts;
