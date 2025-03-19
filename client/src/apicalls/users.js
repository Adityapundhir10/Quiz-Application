const { default: axiosInstance } = require(".");

export const registerUser = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/users/register", payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const loginUser = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/users/login", payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getUserInfo = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axiosInstance.post(
      "/api/users/get-user-info",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// NEW: Update profile picture
export const updateProfilePic = async (formData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axiosInstance.post("/api/users/update-profile-pic", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
