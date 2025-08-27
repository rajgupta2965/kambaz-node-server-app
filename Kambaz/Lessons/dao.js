import Database from "../Database/index.js";
import { v4 as uuidv4 } from "uuid";

export const findLessonsForModule = (moduleId) => {
  const mod = (Database.modules || []).find((m) => m._id === moduleId);
  return mod?.lessons ?? [];
};

export const createLesson = (lesson) => {
  const moduleId = lesson.module;
  const mod = (Database.modules || []).find((m) => m._id === moduleId);
  if (!mod) throw new Error("Module not found");
  if (!Array.isArray(mod.lessons)) mod.lessons = [];
  const newLesson = {
    _id: uuidv4(),
    name: lesson.name ?? "New Lesson",
    description: lesson.description ?? "",
    module: moduleId,
  };
  mod.lessons.push(newLesson);
  return newLesson;
};

export const updateLesson = (lessonId, updates) => {
  for (const m of Database.modules || []) {
    if (Array.isArray(m.lessons)) {
      const l = m.lessons.find((x) => x._id === lessonId);
      if (l) {
        Object.assign(l, updates);
        return true;
      }
    }
  }
  return false;
};

export const deleteLesson = (lessonId) => {
  for (const m of Database.modules || []) {
    if (Array.isArray(m.lessons)) {
      const before = m.lessons.length;
      m.lessons = m.lessons.filter((x) => x._id !== lessonId);
      if (m.lessons.length < before) return true;
    }
  }
  return false;
};
