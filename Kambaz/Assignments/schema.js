import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    _id: { type: String },
    course: { type: String, index: true },
    title: { type: String, default: "New Assignment" },
    desc: { type: String, default: "" },
    points: { type: Number, default: 100 },
    assignType: { type: String, default: "Assignment" },
    grade: { type: String, default: "Grade" },
    submissionType: { type: String, default: "Online" },
    assignTo: { type: String, default: "Everyone" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
  },
  { collection: "assignments" }
);

export default assignmentSchema;
