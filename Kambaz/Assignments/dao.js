import AssignmentModel from "./model.js";
import { v4 as uuidv4 } from "uuid";

export const findAssignmentsForCourse = (courseId) =>
  AssignmentModel.find({ course: courseId });

export const findAssignmentById = (assignmentId) =>
  AssignmentModel.findById(assignmentId);

export const createAssignment = async (assignment) => {
  const newAssignment = {
    _id: assignment._id ?? uuidv4(),
    title: "New Assignment",
    desc: "",
    points: typeof assignment.points === "number" ? assignment.points : 100,
    assignType: assignment.assignType ?? "Assignment",
    grade: assignment.grade ?? "Grade",
    submissionType: assignment.submissionType ?? "Online",
    assignTo: assignment.assignTo ?? "Everyone",
    startDate: assignment.startDate ?? "",
    endDate: assignment.endDate ?? "",
    ...assignment,
  };
  return AssignmentModel.create(newAssignment);
};

export const updateAssignment = (assignmentId, updates = {}) =>
  AssignmentModel.findOneAndUpdate({ _id: assignmentId }, updates, {
    new: true,
  });

export const deleteAssignment = async (assignmentId) => {
  const res = await AssignmentModel.deleteOne({ _id: assignmentId });
  return res.deletedCount === 1;
};
