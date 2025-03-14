import React, { useEffect, useState } from "react";
import PageTitle from "../../../components/PageTitle";
import { message, Table } from "antd";
import { useDispatch } from "react-redux";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { getAllReportsByUser, deleteReport } from "../../../apicalls/reports";
import moment from "moment";

function UserReports() {
  const [reportsData, setReportsData] = useState([]);
  const dispatch = useDispatch();

  // Function to delete a report
  const handleDelete = async (reportId) => {
    try {
      dispatch(ShowLoading());
      const response = await deleteReport(reportId);
      dispatch(HideLoading());
      if (response.success) {
        message.success("Report deleted successfully");
        // Remove the deleted report from the state
        setReportsData(reportsData.filter((report) => report._id !== reportId));
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: "Exam Name",
      dataIndex: "examName",
      render: (text, record) => <>{record.exam.name}</>,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (text, record) => (
        <>{moment(record.createdAt).format("DD-MM-YYYY hh:mm:ss")}</>
      ),
    },
    {
      title: "Total Marks",
      dataIndex: "totalMarks",
      render: (text, record) => <>{record.exam.totalMarks}</>,
    },
    {
      title: "Passing Marks",
      dataIndex: "passingMarks",
      render: (text, record) => <>{record.exam.passingMarks}</>,
    },
    {
      title: "Obtained Marks",
      dataIndex: "obtainedMarks",
      render: (text, record) => <>{record.result.correctAnswers.length}</>,
    },
    {
      title: "Verdict",
      dataIndex: "verdict",
      render: (text, record) => <>{record.result.verdict}</>,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <button
          className="text-red-500 font-bold"
          onClick={() => handleDelete(record._id)}
        >
          X
        </button>
      ),
    },
  ];

  const getData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getAllReportsByUser();
      if (response.success) {
        setReportsData(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(HideLoading());
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      <PageTitle title="Reports" />
      <div className="divider"></div>
      <Table columns={columns} dataSource={reportsData} rowKey="_id" />
    </div>
  );
}

export default UserReports;
