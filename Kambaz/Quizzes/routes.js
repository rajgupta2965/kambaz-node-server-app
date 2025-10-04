import * as dao from "./dao.js";

export default function QuizRoutes(app) {
  const findQuizzesForCourse = async (req, res) => {
    const { courseId } = req.params;
    const sortBy = (req.query.sort || req.query.sortBy || "manual").toString();
    const asc = (req.query.asc ?? "true").toString() !== "false";
    const list = await dao.findQuizzesForCourse(courseId, { sortBy, asc });
    res.json(list);
  };

  const findQuizById = async (req, res) => {
    const q = await dao.findQuizById(req.params.quizId);
    if (!q) return res.sendStatus(404);
    res.json(q);
  };

  const createQuiz = async (req, res) => {
    const { courseId } = req.params;
    const payload = req.body ?? {};
    const created = await dao.createQuiz({ ...payload, course: payload.course ?? courseId });
    res.json(created);
  };

  const copyQuiz = async (req, res) => {
    const copy = await dao.copyQuiz(req.params.quizId);
    if (!copy) return res.sendStatus(404);
    res.json(copy);
  };

  const updateQuiz = async (req, res) => {
    const updated = await dao.updateQuiz(req.params.quizId, req.body ?? {});
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  };

  const deleteQuiz = async (req, res) => {
    const ok = await dao.deleteQuiz(req.params.quizId);
    res.json({ deleted: ok });
  };

  const deleteMany = async (req, res) => {
    const { ids } = req.body || {};
    const deleted = await dao.deleteManyQuizzes(Array.isArray(ids) ? ids : []);
    res.json({ deleted });
  };

  const publishMany = async (req, res) => {
    const { ids, published } = req.body || {};
    const modified = await dao.publishManyQuizzes(Array.isArray(ids) ? ids : [], !!published);
    res.json({ modified });
  };

  const publishAll = async (req, res) => {
    const modified = await dao.setPublishAll(req.params.courseId, true);
    res.json({ modified });
  };
  const unpublishAll = async (req, res) => {
    const modified = await dao.setPublishAll(req.params.courseId, false);
    res.json({ modified });
  };

  const reorder = async (req, res) => {
    const { courseId } = req.params;
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds) || !orderedIds.length) {
      return res.status(400).json({ error: "orderedIds array is required" });
    }
    const modified = await dao.setManualOrder(courseId, orderedIds);
    res.json({ modified });
  };

  const getQuestionBank = async (req, res) => {
    const { quizId } = req.params;
    const bank = await dao.getQuestionBank(quizId);
    if (!bank) return res.sendStatus(404);
    res.json(bank);
  };

  const createQuestion = async (req, res) => {
    const { quizId } = req.params;
    const payload = req.body || {};
    const updated = await dao.addQuestion(quizId, payload);
    if (!updated) return res.status(400).json({ error: "Invalid question type" });
    res.json(updated);
  };

  const updateQuestion = async (req, res) => {
    const { quizId, type, questionId } = req.params;
    const updates = req.body || {};
    const updated = await dao.updateQuestion(quizId, type, questionId, updates);
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  };

  const deleteQuestion = async (req, res) => {
    const { quizId, type, questionId } = req.params;
    const updated = await dao.deleteQuestion(quizId, type, questionId);
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  };

  const addMcOption = async (req, res) => {
    const { quizId, questionId } = req.params;
    const updated = await dao.addMcOption(quizId, questionId, req.body || {});
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  };

  const updateMcOption = async (req, res) => {
    const { quizId, questionId, optionId } = req.params;
    const updated = await dao.updateMcOption(quizId, questionId, optionId, req.body || {});
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  };

  const deleteMcOption = async (req, res) => {
    const { quizId, questionId, optionId } = req.params;
    const updated = await dao.deleteMcOption(quizId, questionId, optionId);
    if (!updated) return res.sendStatus(404);
    res.json(updated);
  };

  const saveAttempt = async (req, res) => {
    try {
      const { quizId } = req.params;
      const { userId, courseId, quizType, records = [], scoreOverride } = req.body || {};
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const result = await dao.saveQuizAttempt({
        userId,
        quizId,
        courseId,
        quizType,
        records,
        scoreOverride,
      });
      res.json(result);
    } catch (err) {
      console.error("saveAttempt error:", err);
      if (err && err.code === "ATTEMPTS_EXCEEDED") {
        return res.status(403).json({ error: "Attempts exceeded", ...(err.meta || {}) });
      }
      res.status(500).json({ error: "Failed to save attempt" });
    }
  };

  const getAttempts = async (req, res) => {
    try {
      const { quizId, userId: userIdParam } = req.params;
      const userId = userIdParam || req.query.userId;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const data = await dao.getQuizAttempts(userId, quizId);
      res.json(data);
    } catch (err) {
      console.error("getAttempts error:", err);
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  };

  app.get("/api/courses/:courseId/quizzes", findQuizzesForCourse);
  app.get("/api/quizzes/:quizId", findQuizById);
  app.post("/api/courses/:courseId/quizzes", createQuiz);
  app.post("/api/quizzes/:quizId/copy", copyQuiz);
  app.put("/api/quizzes/:quizId", updateQuiz);
  app.delete("/api/quizzes/:quizId", deleteQuiz);
  app.post("/api/quizzes/bulk-delete", deleteMany);
  app.post("/api/quizzes/bulk-publish", publishMany);
  app.post("/api/courses/:courseId/quizzes/publish-all", publishAll);
  app.post("/api/courses/:courseId/quizzes/unpublish-all", unpublishAll);
  app.post("/api/courses/:courseId/quizzes/reorder", reorder);
  app.get("/api/quizzes/:quizId/questions", getQuestionBank);
  app.post("/api/quizzes/:quizId/questions", createQuestion);
  app.put("/api/quizzes/:quizId/questions/:type/:questionId", updateQuestion);
  app.delete("/api/quizzes/:quizId/questions/:type/:questionId", deleteQuestion);
  app.post("/api/quizzes/:quizId/questions/MC/:questionId/options", addMcOption);
  app.put("/api/quizzes/:quizId/questions/MC/:questionId/options/:optionId", updateMcOption);
  app.delete("/api/quizzes/:quizId/questions/MC/:questionId/options/:optionId", deleteMcOption);
  app.post("/api/quizzes/:quizId/attempts", saveAttempt);
  app.get("/api/quizzes/:quizId/attempts", getAttempts);
  app.get("/api/quizzes/:quizId/attempts/:userId", getAttempts);
}
