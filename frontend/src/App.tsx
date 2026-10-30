import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/sidebar.tsx";

import Overview from "./pages/Overview";
import Workflows from "./pages/Workflows";
import Agents from "./pages/Agents";
import Approvals from "./pages/Approvals";
import Recovery from "./pages/Recovery";
import AuditTrail from "./pages/AuditTrail";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/recovery" element={<Recovery />} />
            <Route path="/audit" element={<AuditTrail />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;