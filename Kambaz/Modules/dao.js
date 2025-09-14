import model from "./model.js";
import { v4 as uuidv4 } from "uuid";

export function findModulesForCourse(courseId) {
  return model.find({ course: courseId });
};

export function createModule(module) {
  const newModule = { ...module, _id: uuidv4() };
  return model.create(newModule);
};

export function updateModule(moduleId, moduleUpdates) {
  return model.updateOne({ _id: moduleId }, moduleUpdates);
};

export function deleteModule(moduleId) {
  return model.deleteOne({ _id: moduleId });
};

export async function createLesson(moduleId, lesson = {}) {
  const newLesson = {
    _id: lesson._id ?? uuidv4(),
    name: lesson.name ?? "New Lesson",
    description: lesson.description ?? "",
    module: moduleId,
  };
  await model.updateOne(
    { _id: moduleId },
    { $push: { lessons: newLesson } }
  );
  return newLesson;
}

export function updateLesson(moduleId, lessonId, lessonUpdates = {}) {
  const { _id, module, ...rest } = lessonUpdates;
  const $set = Object.entries({ ...rest, module: moduleId }).reduce(
    (acc, [k, v]) => {
      acc[`lessons.$[l].${k}`] = v;
      return acc;
    },
    {}
  );
  return model.updateOne(
    { _id: moduleId },
    { $set },
    { arrayFilters: [{ "l._id": lessonId }] }
  );
}

export function deleteLesson(moduleId, lessonId) {
  return model.updateOne(
    { _id: moduleId },
    { $pull: { lessons: { _id: lessonId } } }
  );
}