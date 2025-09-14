import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    description: String,
    module: String,
  },
);
const schema = new mongoose.Schema(
  {
    _id: String,
    name: String,
    description: String,
    course: { type: String, ref: "CourseModel" },
    lessons: [lessonSchema],
  },
  { collection: "modules" }
);
export default schema;