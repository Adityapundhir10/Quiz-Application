import React, { useState, useEffect } from "react";
import {
  Form,
  message,
  Modal,
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  Upload,
  Row,
  Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { addQuestionToExam, editQuestionById } from "../../../apicalls/exams";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";

const { Option } = Select;

function AddEditQuestion({
  showAddEditQuestionModal,
  setShowAddEditQuestionModal,
  refreshData,
  examId,
  selectedQuestion,
  setSelectedQuestion,
  questionNumber, // For question numbering display
}) {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState(selectedQuestion?.type || "");

  useEffect(() => {
    if (selectedQuestion) {
      form.setFieldsValue({
        ...selectedQuestion,
        // Set image as a fileList if available
        image: selectedQuestion.image
          ? [
              {
                uid: "-1",
                name: "image.png",
                status: "done",
                url: selectedQuestion.image,
              },
            ]
          : [],
      });
      setQuestionType(selectedQuestion.type);
    } else {
      form.resetFields();
      setQuestionType("");
    }
  }, [selectedQuestion, form]);

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoading());

      // Process uploaded image if any
      let imagePath = "";
      if (values.image && Array.isArray(values.image) && values.image.length > 0) {
        if (values.image[0].url) {
          imagePath = values.image[0].url;
        } else if (values.image[0].response && values.image[0].response.success) {
          imagePath = `/uploads/${values.image[0].response.file.filename}`;
        }
      }
      console.log("Extracted imagePath:", imagePath);

      // Build payload common to all question types
      let payload = {
        name: values.name,
        type: values.type,
        exam: examId,
        image: imagePath,
        marks: Number(values.marks), // Ensure marks is numeric
      };

      if (values.type === "MCQ" || values.type === "MSQ") {
        payload.options = {
          A: values.A,
          B: values.B,
          C: values.C,
          D: values.D,
        };
        if (values.type === "MCQ") {
          payload.correctOption = values.correctOption;
        } else {
          payload.correctOptions = values.correctOptions;
        }
      } else if (values.type === "NAT") {
        // Modified NAT: Save minimum and maximum acceptable answers
        payload.natMin = Number(values.natMin);
        payload.natMax = Number(values.natMax);
      } else if (values.type === "TrueFalse") {
        payload.correctOption = values.correctOption;
      } else if (values.type === "Matching") {
        // Save matching pairs as entered by admin
        payload.matching = {
          A1: values.A1,
          A2: values.A2,
          A3: values.A3,
          A4: values.A4,
          B1: values.B1,
          B2: values.B2,
          B3: values.B3,
          B4: values.B4,
        };
        // Save matching options (MCQ style)
        payload.matchingOptions = {
          A: values.matchOptionA,
          B: values.matchOptionB,
          C: values.matchOptionC,
          D: values.matchOptionD,
        };
        // Save the correct matching option selection
        payload.matchCorrectOption = values.matchCorrectOption;
      }

      console.log("Payload being sent:", payload);

      let response;
      if (selectedQuestion) {
        response = await editQuestionById({
          ...payload,
          questionId: selectedQuestion._id,
        });
      } else {
        response = await addQuestionToExam(payload);
      }
      if (response.success) {
        message.success(response.message);
        refreshData();
        setShowAddEditQuestionModal(false);
      } else {
        message.error(response.message);
      }
      setSelectedQuestion(null);
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const normFile = (e) => {
    console.log("Upload event:", e);
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  return (
    <Modal
      title={selectedQuestion ? "Edit Question" : "Add Question"}
      visible={showAddEditQuestionModal}
      footer={null}
      onCancel={() => {
        setShowAddEditQuestionModal(false);
        setSelectedQuestion(null);
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          name: selectedQuestion?.name,
          type: selectedQuestion?.type,
          marks: selectedQuestion?.marks || 1,
          A: selectedQuestion?.options?.A,
          B: selectedQuestion?.options?.B,
          C: selectedQuestion?.options?.C,
          D: selectedQuestion?.options?.D,
          correctOption: selectedQuestion?.correctOption,
          correctOptions: selectedQuestion?.correctOptions,
          // For NAT questions: use natMin and natMax instead of a single answer
          natMin: selectedQuestion?.natMin,
          natMax: selectedQuestion?.natMax,
          A1: selectedQuestion?.matching?.A1,
          A2: selectedQuestion?.matching?.A2,
          A3: selectedQuestion?.matching?.A3,
          A4: selectedQuestion?.matching?.A4,
          B1: selectedQuestion?.matching?.B1,
          B2: selectedQuestion?.matching?.B2,
          B3: selectedQuestion?.matching?.B3,
          B4: selectedQuestion?.matching?.B4,
          matchOptionA: selectedQuestion?.matchingOptions?.A,
          matchOptionB: selectedQuestion?.matchingOptions?.B,
          matchOptionC: selectedQuestion?.matchingOptions?.C,
          matchOptionD: selectedQuestion?.matchingOptions?.D,
          matchCorrectOption: selectedQuestion?.matchCorrectOption,
          image: selectedQuestion?.image
            ? [
                {
                  uid: "-1",
                  name: "image.png",
                  status: "done",
                  url: selectedQuestion.image,
                },
              ]
            : [],
        }}
      >
        <Form.Item
          name="name"
          label={`Question (No. ${questionNumber})`}
          rules={[{ required: true, message: "Please enter the question" }]}
        >
          <Input.TextArea rows={3} style={{ fontSize: "14px" }} />
        </Form.Item>

        {/* Marks Dropdown */}
        <Form.Item
          name="marks"
          label="Marks"
          rules={[{ required: true, message: "Please select marks for this question" }]}
        >
          <Select placeholder="Select marks" style={{ fontSize: "14px" }}>
            <Option value={1}>1</Option>
            <Option value={2}>2</Option>
            <Option value={5}>5</Option>
          </Select>
        </Form.Item>

        {/* Question Type */}
        <Form.Item
          name="type"
          label="Question Type"
          rules={[{ required: true, message: "Please select a question type" }]}
        >
          <Select placeholder="Select question type" onChange={(value) => setQuestionType(value)} style={{ fontSize: "14px" }}>
            <Option value="NAT">NAT (Numerical Answer Type)</Option>
            <Option value="MCQ">MCQ (Multiple Choice Question)</Option>
            <Option value="MSQ">MSQ (Multiple Select Question)</Option>
            <Option value="TrueFalse">True/False</Option>
            <Option value="Matching">Matching</Option>
          </Select>
        </Form.Item>

        {/* Image Upload */}
        <Form.Item
          label="Upload Image (optional)"
          name="image"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload name="file" action="/upload" listType="picture">
            <Button icon={<UploadOutlined />} style={{ fontSize: "14px" }}>Click to upload</Button>
          </Upload>
        </Form.Item>
        {/* If an image is already uploaded, show a small clickable thumbnail */}
        {selectedQuestion?.image && (
          <div style={{ marginTop: "8px" }}>
            <a href={selectedQuestion.image} target="_blank" rel="noopener noreferrer">
              <img
                src={selectedQuestion.image}
                alt="Uploaded"
                style={{ maxWidth: "80px", cursor: "pointer", border: "1px solid #ccc", padding: "2px" }}
              />
            </a>
          </div>
        )}

        {/* Conditional Fields */}
        {questionType === "MCQ" && (
          <>
            <div className="flex gap-3">
              <Form.Item
                name="A"
                label="Option A"
                rules={[{ required: true, message: "Option A is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
              <Form.Item
                name="B"
                label="Option B"
                rules={[{ required: true, message: "Option B is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
            </div>
            <div className="flex gap-3">
              <Form.Item
                name="C"
                label="Option C"
                rules={[{ required: true, message: "Option C is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
              <Form.Item
                name="D"
                label="Option D"
                rules={[{ required: true, message: "Option D is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
            </div>
            <Form.Item
              name="correctOption"
              label="Correct Option"
              rules={[{ required: true, message: "Select the correct option" }]}
            >
              <Radio.Group style={{ fontSize: "14px" }}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
                <Radio value="C">C</Radio>
                <Radio value="D">D</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}

        {questionType === "MSQ" && (
          <>
            <div className="flex gap-3">
              <Form.Item
                name="A"
                label="Option A"
                rules={[{ required: true, message: "Option A is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
              <Form.Item
                name="B"
                label="Option B"
                rules={[{ required: true, message: "Option B is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
            </div>
            <div className="flex gap-3">
              <Form.Item
                name="C"
                label="Option C"
                rules={[{ required: true, message: "Option C is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
              <Form.Item
                name="D"
                label="Option D"
                rules={[{ required: true, message: "Option D is required" }]}
              >
                <Input style={{ fontSize: "14px" }} />
              </Form.Item>
            </div>
            <Form.Item
              name="correctOptions"
              label="Correct Options"
              rules={[{ required: true, message: "Select correct options" }]}
            >
              <Checkbox.Group
                options={[
                  { label: "A", value: "A" },
                  { label: "B", value: "B" },
                  { label: "C", value: "C" },
                  { label: "D", value: "D" },
                ]}
                style={{ fontSize: "14px" }}
              />
            </Form.Item>
          </>
        )}

        {questionType === "NAT" && (
          <>
            <Form.Item
              name="natMin"
              label="Minimum Acceptable Answer"
              rules={[{ required: true, message: "Enter the minimum acceptable answer" }]}
            >
              <Input type="number" style={{ fontSize: "14px" }} />
            </Form.Item>
            <Form.Item
              name="natMax"
              label="Maximum Acceptable Answer"
              rules={[{ required: true, message: "Enter the maximum acceptable answer" }]}
            >
              <Input type="number" style={{ fontSize: "14px" }} />
            </Form.Item>
          </>
        )}

        {questionType === "TrueFalse" && (
          <Form.Item
            name="correctOption"
            label="Correct Answer"
            rules={[{ required: true, message: "Select the correct answer" }]}
          >
            <Radio.Group style={{ fontSize: "14px" }}>
              <Radio value="True">True</Radio>
              <Radio value="False">False</Radio>
            </Radio.Group>
          </Form.Item>
        )}

        {questionType === "Matching" && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="A1"
                  label="Set A - Option 1"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set A - Option 1" style={{ fontSize: "14px" }} />
                </Form.Item>
                <Form.Item
                  name="A2"
                  label="Set A - Option 2"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set A - Option 2" style={{ fontSize: "14px" }} />
                </Form.Item>
                <Form.Item
                  name="A3"
                  label="Set A - Option 3"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set A - Option 3" style={{ fontSize: "14px" }} />
                </Form.Item>
                <Form.Item
                  name="A4"
                  label="Set A - Option 4"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set A - Option 4" style={{ fontSize: "14px" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="B1"
                  label="Set B - Option 1"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set B - Option 1" style={{ fontSize: "14px" }} />
                </Form.Item>
                <Form.Item
                  name="B2"
                  label="Set B - Option 2"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set B - Option 2" style={{ fontSize: "14px" }} />
                </Form.Item>
                <Form.Item
                  name="B3"
                  label="Set B - Option 3"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set B - Option 3" style={{ fontSize: "14px" }} />
                </Form.Item>
                <Form.Item
                  name="B4"
                  label="Set B - Option 4"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Enter value for Set B - Option 4" style={{ fontSize: "14px" }} />
                </Form.Item>
              </Col>
            </Row>
            <h3 style={{ fontSize: "14px" }}>Matching Options (MCQ style)</h3>
            <Form.Item
              name="matchOptionA"
              label="Option A"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Enter option text (e.g., P-4)" style={{ fontSize: "14px" }} />
            </Form.Item>
            <Form.Item
              name="matchOptionB"
              label="Option B"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Enter option text (e.g., Q-3)" style={{ fontSize: "14px" }} />
            </Form.Item>
            <Form.Item
              name="matchOptionC"
              label="Option C"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Enter option text (e.g., R-1)" style={{ fontSize: "14px" }} />
            </Form.Item>
            <Form.Item
              name="matchOptionD"
              label="Option D"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Enter option text (e.g., S-2)" style={{ fontSize: "14px" }} />
            </Form.Item>
            <Form.Item
              name="matchCorrectOption"
              label="Correct Matching Option"
              rules={[{ required: true, message: "Select the correct matching option" }]}
            >
              <Radio.Group style={{ fontSize: "14px" }}>
                <Radio value="A">A</Radio>
                <Radio value="B">B</Radio>
                <Radio value="C">C</Radio>
                <Radio value="D">D</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}

        <div className="flex justify-end mt-2 gap-3">
          <Button
            type="default"
            onClick={() => {
              setShowAddEditQuestionModal(false);
              setSelectedQuestion(null);
            }}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            Save Question
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default AddEditQuestion;
