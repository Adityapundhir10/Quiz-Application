import { message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { getUserInfo, updateProfilePic } from "../apicalls/users";
import { useDispatch, useSelector } from "react-redux";
import { SetUser } from "../redux/usersSlice.js";
import { useNavigate } from "react-router-dom";
import { HideLoading, ShowLoading } from "../redux/loaderSlice";

function ProtectedRoute({ children }) {
  const { user } = useSelector((state) => state.users);
  const [menu, setMenu] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Ref to the hidden file input
  const fileInputRef = useRef(null);

  const userMenu = [
    {
      title: "Home",
      paths: ["/"],
      onClick: () => navigate("/"),
      icon: <i className="ri-home-line"></i>,
    },
    {
      title: "Reports",
      paths: ["/user/reports"],
      onClick: () => navigate("/user/reports"),
      icon: <i className="ri-bar-chart-line"></i>,
    },
    {
      title: "Logout",
      paths: ["/logout"],
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
      icon: <i className="ri-logout-box-line"></i>,
    },
  ];

  const adminMenu = [
    {
      title: "Home",
      paths: ["/admin-dashboard"],
      onClick: () => navigate("/admin-dashboard"),
      icon: <i className="ri-home-line"></i>,
    },
    {
      title: "Exams",
      paths: ["/admin/exams", "/admin/exams/add"],
      onClick: () => navigate("/admin/exams"),
      icon: <i className="ri-file-list-line"></i>,
    },
    {
      title: "Reports",
      paths: ["/admin/reports"],
      onClick: () => navigate("/admin/reports"),
      icon: <i className="ri-bar-chart-line"></i>,
    },
    {
      title: "Logout",
      paths: ["/logout"],
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/login");
      },
      icon: <i className="ri-logout-box-line"></i>,
    },
  ];

  const getUserData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getUserInfo();
      dispatch(HideLoading());
      if (response.success) {
        dispatch(SetUser(response.data));
        if (response.data.role === "admin" || response.data.isAdmin) {
          setMenu(adminMenu);
        } else {
          setMenu(userMenu);
        }
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
      navigate("/login");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      getUserData();
    } else {
      navigate("/login");
    }
  }, []);

  // Called when user picks a file
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("userId", user._id);
    formData.append("profilePic", file);

    try {
      dispatch(ShowLoading());
      const response = await updateProfilePic(formData);
      dispatch(HideLoading());

      if (response.success) {
        message.success("Profile picture updated!");
        // Update Redux with new user data
        dispatch(SetUser(response.data));
      } else {
        message.error(response.message);
      }
    } catch (err) {
      dispatch(HideLoading());
      message.error(err.message);
    }
  };

  // Programmatically open the hidden file input
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const activeRoute = window.location.pathname;
  const getIsActiveOrNot = (paths) => {
    if (paths.includes(activeRoute)) return true;
    if (activeRoute.includes("/admin/exams/edit") && paths.includes("/admin/exams")) {
      return true;
    }
    if (activeRoute.includes("/user/write-exam") && paths.includes("/user/write-exam")) {
      return true;
    }
    return false;
  };

  return (
    <div className="layout">
      <div className="flex gap-2 w-full h-full h-100">
        <div className="sidebar">
          <div className="menu">
            {menu.map((item, index) => (
              <div
                key={index}
                className={`menu-item ${getIsActiveOrNot(item.paths) && "active-menu-item"}`}
                onClick={item.onClick}
              >
                {item.icon}
                {!collapsed && <span>{item.title}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="body">
          <div className="header flex justify-between">
            {!collapsed ? (
              <i className="ri-close-line" onClick={() => setCollapsed(true)} />
            ) : (
              <i className="ri-menu-line" onClick={() => setCollapsed(false)} />
            )}
            <h1 className="text-2xl text-white">QUIZ Application</h1>
            <div>
              <div className="flex gap-1 items-center">
                <h1 className="text-md text-white">{user?.name}</h1>
              </div>
              {/* Clickable avatar area */}
              <div
                className="user-info"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                }}
                onClick={openFileDialog}
              >
                <img
                  src={user?.profilePic || "avatar.png"}
                  alt="User"
                  style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                />
                <span>
                  Role : {(user?.role === "admin" || user?.isAdmin) ? "Admin" : "User"}
                </span>
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleProfilePicChange}
              />
            </div>
          </div>
          <div className="content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default ProtectedRoute;
