import React from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Dashboard from "./pages/Dashboard";
import Home1 from "./pages/Home1";
import EditorRoom from "./pages/EditorRoom";
import UpdateProfilePage from "./pages/UpdateProfilePage";
import SessionHistory from "./pages/SessionHistory";
import Assessments from "./pages/Assessments";
import TakeAssessment from "./pages/TakeAssessment";
import CreateAssessment from "./pages/CreateAssessment";
import StudyGroups from "./pages/StudyGroups";
import CreateStudyGroup from "./pages/CreateStudyGroup";
import StudyGroupDetail from "./pages/StudyGroupDetail";
import Resources from "./pages/Resources";
import TestUpload from "./pages/TestUpload";
import SimpleUploadTest from "./pages/SimpleUploadTest";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  const location = useLocation();
  
  // Hide footer on video calling/editor room pages
  const hideFooter = location.pathname.startsWith('/room/') || location.pathname.startsWith('/join/');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:clerkId" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/join/:roomId" element={<Home1 />} />
        <Route path="/room/:roomId" element={<EditorRoom />} />
        <Route path="/profile/edit" element={<UpdateProfilePage />} />
        <Route path="/sessions" element={<SessionHistory />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/assessments/:id" element={<TakeAssessment />} />
        <Route path="/assessments/create" element={<CreateAssessment />} />
        <Route path="/study-groups" element={<StudyGroups />} />
        <Route path="/study-groups/create" element={<CreateStudyGroup />} />
        <Route path="/study-groups/:id" element={<StudyGroupDetail />} />
        <Route path="/resources" element={
          <ErrorBoundary fallbackMessage="Failed to load resources. Please try again.">
            <Resources />
          </ErrorBoundary>
        } />
        <Route path="/test-upload" element={<TestUpload />} />
        <Route path="/simple-upload" element={<SimpleUploadTest />} />
      </Routes>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default App;
