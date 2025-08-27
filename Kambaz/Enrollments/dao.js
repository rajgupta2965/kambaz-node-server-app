import { v4 as uuidv4 } from "uuid";
import Database from "../Database/index.js";

export function enrollUserInCourse(userId, courseId) {
  const exists = (Database.enrollments || []).some(
    (e) => e.user === userId && e.course === courseId
  );
  if (exists) return null;
  const rec = { _id: uuidv4(), user: userId, course: courseId };
  Database.enrollments = [...(Database.enrollments || []), rec];
  return rec;
}

export function unenrollUserFromCourse(userId, courseId) {
  const before = (Database.enrollments || []).length;
  Database.enrollments = (Database.enrollments || []).filter(
    (e) => !(e.user === userId && e.course === courseId)
  );
  return Database.enrollments.length < before;
}