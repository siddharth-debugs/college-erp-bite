
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoutes, PublicRoute, } from './ProtectedRoutes';
import Login from '../Pages/Login/Login';
import { ManageStudents } from '../Pages/StudentManagement/Students';
import CommonLayouts from '../Components/CommonLayout';
import { ManageAdmitCard } from '../Pages/ProcessesManagement/AdmitCardManageMent/AdmitCardManagement';
import { StudentsforAdmitcardProcess } from '../Pages/ProcessesManagement/AdmitCardManageMent/StudentsforAdmitcardProcess';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute element={<Login />} />} />
        {/* <Route path="/student" element={<PublicRoute element={<ManageStudents />} />} /> */}
        <Route path="/students" element={<ProtectedRoutes element={<CommonLayouts><ManageStudents /></CommonLayouts>} />} />
        {/* Protected Routes */}

        <Route path="/admitcards" element={<ProtectedRoutes element={<CommonLayouts><ManageAdmitCard /></CommonLayouts>} />} />
        <Route path="/admitcards/:admitCardId" element={<ProtectedRoutes element={<CommonLayouts><StudentsforAdmitcardProcess /></CommonLayouts>} />} />

        {/* Protected Payment Route with Guard */}


        {/* Invalid Payment Link */}


        {/* Catch-all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
