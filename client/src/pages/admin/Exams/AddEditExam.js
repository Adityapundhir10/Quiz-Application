import { Col, Form, message, Row, Table, Tabs } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  addExam,
  deleteQuestionById,
  editExamById,
  getExamById,
} from "../../../apicalls/exams";
import PageTitle from "../../../components/PageTitle";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import AddEditQuestion from "./AddEditQuestion";

const { TabPane } = Tabs;

function AddEditExam() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();

  const [examData, setExamData] = useState(null);
  const [showAddEditQuestionModal, setShowAddEditQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Fetch Exam Data
  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({ examId: params.id });
      dispatch(HideLoading());

      if (response.success) {
        setExamData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, [params.id]);

  // Handle Exam Form Submission
  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());
      let response;

      if (params.id) {
        response = await editExamById({ ...values, examId: params.id });
      } else {
        response = await addExam(values);
      }

      dispatch(HideLoading());

      if (response.success) {
        message.success(response.message);
        navigate("/admin/exams");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // Delete Question
  const deleteQuestion = async (questionId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteQuestionById({ questionId, examId: params.id });
      dispatch(HideLoading());

      if (response.success) {
        message.success(response.message);
        getExamData();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  // Table Columns for Questions
  const questionsColumns = [
    {
      title: "Question Number",
      dataIndex: "name",
      render: (text, record, index) => <span>{index + 1}</span>,
    },
    {
      title: "Options",
      dataIndex: "options",
      render: (text, record) => (
        record.options
          ? Object.keys(record.options).map((key) => (
              <div key={key}>
                {key}: {record.options[key]}
              </div>
            ))
          : <span>N/A</span>
      ),
    },
    {
      title: "Correct Option",
      dataIndex: "correctOption",
      render: (text, record) => record.options
        ? `${record.correctOption}: ${record.options[record.correctOption] || ""}`
        : record.correctOption || "",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <div className="flex gap-2">
          <i className="ri-pencil-line" onClick={() => {
            setSelectedQuestion(record);
            setShowAddEditQuestionModal(true);
          }}></i>
          <i className="ri-delete-bin-line" onClick={() => deleteQuestion(record._id)}></i>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title={params.id ? "Edit Exam" : "Add Exam"} />
      <div className="divider"></div>

      {(examData || !params.id) && (
        <Form layout="vertical" onFinish={onFinish} initialValues={examData}>
          <Tabs defaultActiveKey="1">
            <TabPane tab="Exam Details" key="1">
              <Row gutter={[10, 10]}>
                {["name", "duration", "totalMarks", "passingMarks"].map((field) => (
                  <Col span={8} key={field}>
                    <Form.Item label={field.replace(/^\w/, (c) => c.toUpperCase())} name={field}>
                      <input type="text" />
                    </Form.Item>
                  </Col>
                ))}
                <Col span={8}>
                  <Form.Item label="Category" name="category">
                    <select>
                      <option value="">Select Category</option>
                      <option value="GATE">GATE</option>
                      <option value="ESE">ESE(IES)</option>
                      <option value="IAS">IAS</option>
                    </select>
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex justify-end gap-2">
                <button className="primary-outlined-btn" type="button" onClick={() => navigate("/admin/exams")}>
                  Cancel
                </button>
                <button className="primary-contained-btn" type="submit">Save</button>
              </div>
            </TabPane>

            {params.id && (
              <TabPane tab="Questions" key="2">
                <div className="flex justify-end">
                  <button className="primary-outlined-btn" type="button" onClick={() => setShowAddEditQuestionModal(true)}>
                    Add Question
                  </button>
                </div>
                <Table columns={questionsColumns} dataSource={examData?.questions || []} rowKey="_id" />
              </TabPane>
            )}
          </Tabs>
        </Form>
      )}

      {showAddEditQuestionModal && (
        <AddEditQuestion
          setShowAddEditQuestionModal={setShowAddEditQuestionModal}
          showAddEditQuestionModal={showAddEditQuestionModal}
          examId={params.id}
          refreshData={getExamData}
          selectedQuestion={selectedQuestion}
          setSelectedQuestion={setSelectedQuestion}
          questionNumber={
            examData && examData.questions
              ? selectedQuestion
                ? examData.questions.findIndex((q) => q._id === selectedQuestion._id) + 1
                : examData.questions.length + 1
              : 1
          }
        />
      )}
    </div>
  );
}

export default AddEditExam;
