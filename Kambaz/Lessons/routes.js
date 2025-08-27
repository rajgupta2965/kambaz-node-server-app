import * as lessonsDao from "./dao.js";
export default function LessonRoutes(app) {
  app.put("/api/lessons/:lessonId", (req, res) => {
    const { lessonId } = req.params;
    const ok = lessonsDao.updateLesson(lessonId, req.body ?? {});
    res.json(ok);
  });

  app.delete("/api/lessons/:lessonId", (req, res) => {
    const { lessonId } = req.params;
    const ok = lessonsDao.deleteLesson(lessonId);
    res.json(ok);
  });
}