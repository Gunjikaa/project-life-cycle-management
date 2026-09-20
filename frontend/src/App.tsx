import LifecyclePipeline from "./pages/LifecyclePipeline";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CreateProject from "./pages/CreateProject";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
  return (
    <BrowserRouter>
        <Routes>
  <Route path="/login" element={<Login />} />

  <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

  <Route
  path="/projects"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Projects />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

  <Route
  path="/projects/create"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <CreateProject />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/projects/:id"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <ProjectDetails />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/lifecycle"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <LifecyclePipeline />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
  <Route
    path="*"
    element={<Navigate to="/login" replace />}
  />
</Routes>
    </BrowserRouter>
  );
}

export default App;