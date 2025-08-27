import * as modulesDao from "./dao.js";
import * as lessonsDao from "../Lessons/dao.js";

export default function ModuleRoutes(app) {
  app.put("/api/modules/:moduleId", async (req, res) => {
    const { moduleId } = req.params;
    const moduleUpdates = req.body;
    const status = await modulesDao.updateModule(moduleId, moduleUpdates);
    res.send(status);
  })

  app.delete("/api/modules/:moduleId", async (req, res) => {
    const { moduleId } = req.params;
    const status = await modulesDao.deleteModule(moduleId);
    res.send(status);
  });

  app.get("/api/modules/:moduleId/lessons", (req, res) => {
    const { moduleId } = req.params;
    const lessons = lessonsDao.findLessonsForModule(moduleId);
    res.json(lessons);
  });

  app.post("/api/modules/:moduleId/lessons", (req, res) => {
    const { moduleId } = req.params;
    const payload = req.body ?? {};
    const created = lessonsDao.createLesson({ ...payload, module: moduleId });
    res.json(created);
  });

}