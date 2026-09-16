import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PeopleDirectory from "./pages/PeopleDirectory";
import ParticipantDetail from "./pages/ParticipantDetail";
import AddParticipant from "./pages/AddParticipant";
import MyProfile from "./pages/MyProfile";
import Projects from "./pages/Projects";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="people" element={<PeopleDirectory />} />
        {/* /people/new must be declared before /people/:id */}
        <Route path="people/new" element={<AddParticipant />} />
        <Route path="people/:id" element={<ParticipantDetail />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="projects" element={<Projects />} />
        <Route path="resources" element={<Resources />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
