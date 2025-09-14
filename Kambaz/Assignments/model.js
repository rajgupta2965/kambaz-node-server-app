import mongoose from "mongoose";
import assignmentSchema from "./schema.js";
const AssignmentModel = mongoose.model("AssignmentModel", assignmentSchema);
export default AssignmentModel;
