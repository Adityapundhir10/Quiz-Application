import { Form, message, Upload, Button } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../apicalls/users";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { UploadOutlined } from '@ant-design/icons';

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      // Create FormData to include the file upload
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("password", values.password);
      // Check if a file was uploaded for profilePic
      if (values.profilePic && values.profilePic.file) {
        formData.append("profilePic", values.profilePic.file.originFileObj);
      }
      const response = await registerUser(formData);
      dispatch(HideLoading());
      if (response.success) {
        message.success(response.message);
        navigate("/login");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-primary">
      <div className="card w-400 p-3 bg-white">
        <div className="flex flex-col">
          <h1 className="text-2xl">
            QUIZ - REGISTER <i className="ri-user-add-line"></i>
          </h1>
          <div className="divider"></div>
          <Form layout="vertical" className="mt-2" onFinish={onFinish}>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <input type="text" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: "Email is required" }]}
            >
              <input type="text" />
            </Form.Item>
            <Form.Item name="profilePic" label="Profile Picture">
              <Upload name="profilePic" maxCount={1}>
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <input type="password" />
            </Form.Item>
            <div className="flex flex-col gap-2">
              <button type="submit" className="primary-contained-btn mt-2 w-100">
                Register
              </button>
              <Link to="/login">Already a member? Login</Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Register;
