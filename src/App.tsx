import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import Statistics from "./pages/Statistics";

function App() {
  const isLoggedIn = !!localStorage.getItem("token");
  const isAdminLoggedIn = !!localStorage.getItem("adminToken");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            isAdminLoggedIn ? <AdminPanel /> : <Navigate to="/admin-login" />
          }
        />
        <Route path="/istatistikler" element={<Statistics />} />
        <Route
          path="/"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
