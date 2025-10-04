import QuizModel, { UserQuizAttemptModel } from "./model.js";
import { v4 as uuidv4 } from "uuid";

const sortMap = (sortBy = "manual", asc = true) => {
  const dir = asc ? 1 : -1;
  switch (sortBy) {
    case "name": return { title: dir, _id: 1 };
    case "available": return { startDate: dir, _id: 1 };
    case "due": return { dueDate: dir, _id: 1 };
    case "points": return { points: dir, title: 1, _id: 1 };
    case "questions": return { questions: dir, title: 1, _id: 1 };
    default: return { _order: dir, _id: 1 };
  }
};

const courseValue = (obj = {}) => obj.course ?? obj.courseId;

export const findQuizzesForCourse = (courseId, { sortBy = "manual", asc = true } = {}) => {
  const q = QuizModel.find({ $or: [{ course: courseId }, { courseId }] })
    .sort(sortMap(sortBy, asc));
  if (["name", "points", "questions"].includes(sortBy)) { q.collation({ locale: "en", numericOrdering: true }); }
  return q;
};

export const findQuizById = (quizId) => QuizModel.findById(quizId);

export const createQuiz = async (payload = {}) => {
  const course = courseValue(payload);
  const count = await QuizModel.countDocuments({ $or: [{ course }, { courseId: course }] });
  const doc = {
    _id: payload._id ?? uuidv4(),
    ...payload,
    course,
    courseId: course,
    _order: typeof payload._order === "number" ? payload._order : count,
  };
  return QuizModel.create(doc);
};

export const copyQuiz = async (quizId) => {
  const src = await QuizModel.findById(quizId);
  if (!src) return null;
  const course = courseValue(src);
  const count = await QuizModel.countDocuments({ $or: [{ course }, { courseId: course }] });
  const clone = {
    ...src.toObject(),
    _id: uuidv4(),
    title: `${src.title} (Copy)`,
    published: false,
    _order: count,
  };
  return QuizModel.create(clone);
};

export const updateQuiz = (quizId, updates = {}) => {
  const course = courseValue(updates);
  const clean = { ...updates };
  if (course !== undefined) {
    clean.course = course;
    clean.courseId = course;
  }
  return QuizModel.findOneAndUpdate({ _id: quizId }, clean, { new: true });
};

export const deleteQuiz = async (quizId) => {
  const res = await QuizModel.deleteOne({ _id: quizId });
  return res.deletedCount === 1;
};

export const deleteManyQuizzes = async (ids = []) => {
  if (!Array.isArray(ids) || !ids.length) return 0;
  const r = await QuizModel.deleteMany({ _id: { $in: ids } });
  return r.deletedCount || 0;
};

export const publishManyQuizzes = async (ids = [], published = true) => {
  if (!Array.isArray(ids) || !ids.length) return 0;
  const r = await QuizModel.updateMany({ _id: { $in: ids } }, { $set: { published: !!published } });
  return r.modifiedCount || 0;
};

export const setPublishAll = async (courseId, published = true) => {
  const r = await QuizModel.updateMany(
    { $or: [{ course: courseId }, { courseId }] },
    { $set: { published: !!published } }
  );
  return r.modifiedCount || 0;
};

export const setManualOrder = async (courseId, orderedIds = []) => {
  if (!Array.isArray(orderedIds) || !orderedIds.length) return 0;
  const ops = orderedIds.map((id, idx) => ({
    updateOne: { filter: { _id: id, $or: [{ course: courseId }, { courseId }] }, update: { $set: { _order: idx } } },
  }));
  const r = await QuizModel.bulkWrite(ops, { ordered: true });
  return r.modifiedCount ?? r.result?.nModified ?? 0;
};

const TYPE_KEYS = { MC: "mc", TF: "tf", FIB: "fib" };
const qbPath = (type) => `questionBank.${TYPE_KEYS[type]}`;

export const getQuestionBank = async (quizId) => {
  const doc = await QuizModel.findById(quizId, { questionBank: 1, _id: 0 });
  return doc?.questionBank ?? { mc: [], tf: [], fib: [] };
};

export const addQuestion = async (quizId, question) => {
  const type = question?.type;
  if (!["MC", "TF", "FIB"].includes(type)) return null;
  const q = { ...question, id: question.id ?? uuidv4(), type };
  if (type === "MC") {
    q.options = (q.options ?? []).map((o) => ({ id: o.id ?? uuidv4(), text: o.text ?? "" }));
  } else if (type === "TF") {
    q.answer = !!q.answer;
  } else if (type === "FIB") {
    q.acceptableAnswers = Array.isArray(q.acceptableAnswers) ? q.acceptableAnswers : [];
  }
  return QuizModel.findOneAndUpdate(
    { _id: quizId },
    { $push: { [qbPath(type)]: q } },
    { new: true }
  );
};

export const updateQuestion = async (quizId, type, questionId, updates = {}) => {
  if (!["MC", "TF", "FIB"].includes(type)) return null;
  const u = { ...updates };
  if (type === "MC" && Array.isArray(u.options)) {
    u.options = u.options.map((o) => ({ id: o.id ?? uuidv4(), text: o.text ?? "" }));
  }
  if (type === "TF" && "answer" in u) {
    u.answer = !!u.answer;
  }
  if (type === "FIB" && u.acceptableAnswers && !Array.isArray(u.acceptableAnswers)) {
    u.acceptableAnswers = [String(u.acceptableAnswers)];
  }

  const setDoc = {};
  Object.entries(u).forEach(([k, v]) => {
    setDoc[`${qbPath(type)}.$[q].${k}`] = v;
  });

  return QuizModel.findOneAndUpdate(
    { _id: quizId },
    { $set: setDoc },
    { new: true, arrayFilters: [{ "q.id": questionId }] }
  );
};

export const deleteQuestion = async (quizId, type, questionId) => {
  if (!["MC", "TF", "FIB"].includes(type)) return null;
  return QuizModel.findOneAndUpdate(
    { _id: quizId },
    { $pull: { [qbPath(type)]: { id: questionId } } },
    { new: true }
  );
};

export const addMcOption = async (quizId, questionId, option = {}) => {
  const opt = { id: option.id ?? uuidv4(), text: option.text ?? "" };
  return QuizModel.findOneAndUpdate(
    { _id: quizId },
    { $push: { "questionBank.mc.$[q].options": opt } },
    { new: true, arrayFilters: [{ "q.id": questionId }] }
  );
};

export const updateMcOption = async (quizId, questionId, optionId, updates = {}) => {
  const setDoc = {};
  if (typeof updates.text === "string") setDoc["questionBank.mc.$[q].options.$[o].text"] = updates.text;
  if (updates.id) setDoc["questionBank.mc.$[q].options.$[o].id"] = updates.id;
  return QuizModel.findOneAndUpdate(
    { _id: quizId },
    { $set: setDoc },
    { new: true, arrayFilters: [{ "q.id": questionId }, { "o.id": optionId }] }
  );
};

export const deleteMcOption = async (quizId, questionId, optionId) => {
  return QuizModel.findOneAndUpdate(
    { _id: quizId },
    { $pull: { "questionBank.mc.$[q].options": { id: optionId } } },
    { new: true, arrayFilters: [{ "q.id": questionId }] }
  );
};

const _indexQuizQuestions = (quizDoc) => {
  const idx = new Map();
  if (!quizDoc?.questionBank) return idx;
  for (const q of quizDoc.questionBank.mc || []) {
    idx.set(q.id, {
      type: "MC",
      points: Number.isFinite(q.points) ? q.points : 0,
      correctOptionId: q.correct,
    });
  }
  for (const q of quizDoc.questionBank.tf || []) {
    idx.set(q.id, {
      type: "TF",
      points: Number.isFinite(q.points) ? q.points : 0,
      correctOptionId: q.answer ? "TRUE" : "FALSE",
    });
  }
  for (const q of quizDoc.questionBank.fib || []) {
    idx.set(q.id, {
      type: "FIB",
      points: Number.isFinite(q.points) ? q.points : 0,
      acceptableAnswers: Array.isArray(q.acceptableAnswers) ? q.acceptableAnswers : [],
    });
  }
  return idx;
};

const _norm = (s) => (s ?? "").toString().trim().toLowerCase();
const _fibCorrect = (acceptable = [], text = "") => !!text && acceptable.some((a) => _norm(a) === _norm(text));

export const saveQuizAttempt = async ({
  userId,
  quizId,
  courseId,
  quizType,
  records = [],
  scoreOverride,
}) => {
  if (!userId || !quizId) throw new Error("userId and quizId are required");
  const quizDoc = await QuizModel.findById(quizId);
  if (!quizDoc) throw new Error("Quiz not found");
  const existing = await UserQuizAttemptModel.findOne(
    { userId, "quizzes.quizId": quizId },
    { "quizzes.$": 1, _id: 0 }
  ).lean();

  const existingAttempts = existing?.quizzes?.[0]?.attempts?.length || 0;
  const allowMulti = !!quizDoc.multipleAttempts;
  const maxAttempts = Number.isFinite(quizDoc.noOfAttempts) && quizDoc.noOfAttempts > 0 ? quizDoc.noOfAttempts : 1;

  if (!allowMulti && existingAttempts >= 1) {
    const err = new Error("Attempt limit reached");
    err.code = "ATTEMPTS_EXCEEDED";
    err.meta = { totalAttempts: existingAttempts, maxAttempts: 1 };
    throw err;
  }
  if (allowMulti && existingAttempts >= maxAttempts) {
    const err = new Error("Attempt limit reached");
    err.code = "ATTEMPTS_EXCEEDED";
    err.meta = { totalAttempts: existingAttempts, maxAttempts };
    throw err;
  }

  const qIndex = _indexQuizQuestions(quizDoc);
  const enriched = [];
  let score = 0;
  let maxScore = 0;
  for (const r of records) {
    const meta = qIndex.get(r.questionId);
    if (!meta) continue;
    maxScore += meta.points;
    if (meta.type === "MC" || meta.type === "TF") {
      const rec = {
        questionId: r.questionId,
        questionType: meta.type,
        questionPoints: meta.points,
        correctOptionId: meta.correctOptionId,
        userOptionId: r.selectedOptionId ?? null,
      };
      enriched.push(rec);
      if (rec.userOptionId && rec.userOptionId === rec.correctOptionId) {
        score += meta.points;
      }
    } else if (meta.type === "FIB") {
      const rec = {
        questionId: r.questionId,
        questionType: "FIB",
        questionPoints: meta.points,
        acceptableAnswers: meta.acceptableAnswers || [],
        userText: r.fibText ?? "",
      };
      enriched.push(rec);
      if (_fibCorrect(rec.acceptableAnswers, rec.userText)) {
        score += meta.points;
      }
    }
  }

  const attemptId = uuidv4();
  const attempt = {
    attemptId,
    submittedAt: new Date(),
    score: Number.isFinite(scoreOverride) ? scoreOverride : score,
    records: enriched,
  };

  let userDoc = await UserQuizAttemptModel.findOne({ userId });

  if (!userDoc) {
    userDoc = await UserQuizAttemptModel.create({
      userId,
      quizzes: [
        {
          quizId,
          courseId,
          quizType,
          totalQuestions: quizDoc.questions ?? 0,
          totalPoints: quizDoc.points ?? maxScore,
          attempts: [attempt],
        },
      ],
    });
  } else {
    const qIdx = userDoc.quizzes.findIndex((q) => q.quizId === quizId);
    if (qIdx === -1) {
      userDoc.quizzes.push({
        quizId,
        courseId,
        quizType,
        totalQuestions: quizDoc.questions ?? 0,
        totalPoints: quizDoc.points ?? maxScore,
        attempts: [attempt],
      });
    } else {
      userDoc.quizzes[qIdx].courseId = courseId;
      userDoc.quizzes[qIdx].quizType = quizType;
      userDoc.quizzes[qIdx].totalQuestions = quizDoc.questions ?? userDoc.quizzes[qIdx].totalQuestions ?? 0;
      userDoc.quizzes[qIdx].totalPoints = quizDoc.points ?? userDoc.quizzes[qIdx].totalPoints ?? maxScore;
      userDoc.quizzes[qIdx].attempts.push(attempt);
    }
    await userDoc.save();
  }

  const savedQuiz = (userDoc.quizzes || []).find((q) => q.quizId === quizId);
  const totalAttempts = savedQuiz?.attempts?.length ?? 1;
  const maxScoreAcrossAttempts = Math.max(
    ...((savedQuiz?.attempts || []).map((a) => Number(a.score) || 0)),
    Number.isFinite(attempt.score) ? attempt.score : 0
  );

  return {
    attemptId,
    score: attempt.score,
    maxScore,
    totalAttempts,
    maxScoreAcrossAttempts,
  };
};

export const getQuizAttempts = async (userId, quizId) => {
  const doc = await UserQuizAttemptModel.findOne(
    { userId, "quizzes.quizId": quizId },
    { "quizzes.$": 1, _id: 0 }
  ).lean();
  const quiz = doc?.quizzes?.[0];
  if (!quiz) {
    return {
      attempts: [],
      totalAttempts: 0,
      maxScoreAcrossAttempts: 0,
      lastAttempt: null,
      lastScore: 0,
      meta: null,
    };
  }
  const attempts = quiz.attempts || [];
  const totalAttempts = attempts.length;
  const maxScoreAcrossAttempts = attempts.reduce((m, a) => Math.max(m, Number(a.score) || 0), 0);
  const lastAttempt = totalAttempts ? attempts[totalAttempts - 1] : null;
  const lastScore = lastAttempt ? (Number(lastAttempt.score) || 0) : 0;

  return {
    attempts,
    totalAttempts,
    maxScoreAcrossAttempts,
    lastAttempt,
    lastScore,
    meta: {
      quizId: quiz.quizId,
      courseId: quiz.courseId,
      quizType: quiz.quizType,
      totalQuestions: quiz.totalQuestions,
      totalPoints: quiz.totalPoints,
    },
  };
};