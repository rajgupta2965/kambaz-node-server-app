import * as modulesDao from "./dao.js";

export default function ModuleRoutes(app) {
  const updateModule = async (req, res) => {
    const { moduleId } = req.params;
    const moduleUpdates = req.body;
    const status = await modulesDao.updateModule(moduleId, moduleUpdates);
    res.send(status);
  };

  const deleteModule = async (req, res) => {
    const { moduleId } = req.params;
    const status = await modulesDao.deleteModule(moduleId);
    res.send(status);
  };

  const createLesson = async (req, res) => {
    const { moduleId } = req.params;
    const payload = req.body ?? {};
    const created = await modulesDao.createLesson(moduleId, payload);
    res.json(created);
  };

  const updateLesson = async (req, res) => {
    const { moduleId, lessonId } = req.params;
    const updates = req.body ?? {};
    const status = await modulesDao.updateLesson(moduleId, lessonId, updates);
    res.send(status);
  };

  const deleteLesson = async (req, res) => {
    const { moduleId, lessonId } = req.params;
    const status = await modulesDao.deleteLesson(moduleId, lessonId);
    res.send(status);
  };

  app.put("/api/modules/:moduleId", updateModule);
  app.delete("/api/modules/:moduleId", deleteModule);
  app.post("/api/modules/:moduleId/lessons", createLesson);
  app.put("/api/modules/:moduleId/lessons/:lessonId", updateLesson);
  app.delete("/api/modules/:moduleId/lessons/:lessonId", deleteLesson);
}