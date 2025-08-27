import Database from "../Database/index.js";
import { v4 as uuidv4 } from "uuid";

export const findAssignmentsForCourse = (courseId) =>
  (Database.assignments || []).filter((a) => a.course === courseId);

export const findAssignmentById = (assignmentId) =>
  (Database.assignments || []).find((a) => a._id === assignmentId);

export const createAssignment = (assignment) => {
  const newAssignment = {
    _id: uuidv4(),
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
  Database.assignments = [...(Database.assignments || []), newAssignment];
  return newAssignment;
};

export const updateAssignment = (assignmentId, updates = {}) => {
  const list = Database.assignments || [];
  const idx = list.findIndex((a) => a._id === assignmentId);
  if (idx < 0) return false;
  list[idx] = { ...list[idx], ...updates };
  return list[idx];
};

export const deleteAssignment = (assignmentId) => {
  const before = (Database.assignments || []).length;
  Database.assignments = (Database.assignments || []).filter((a) => a._id !== assignmentId);
  return Database.assignments.length < before;
};
