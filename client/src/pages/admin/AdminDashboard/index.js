import React from "react";
import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <nav className="my-4">
        <ul className="flex gap-4">
          <li>
            <Link to="/admin-dashboard" className="text-blue-500 hover:underline">
              Home
            </Link>
          </li>
          <li>
            <Link to="/admin/exams" className="text-blue-500 hover:underline">
              Exams
            </Link>
          </li>
          {/* You can add more links here if needed */}
        </ul>
      </nav>
      <p>
        Welcome to the admin dashboard. Here you can manage users, exams, and more.
      </p>
    </div>
  );
}

export default AdminDashboard;
