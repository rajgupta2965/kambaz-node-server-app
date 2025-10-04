import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const mcSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["MC"], default: "MC", required: true },
    id: { type: String, required: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    points: { type: Number, default: 4, min: 0 },
    options: { type: [optionSchema], default: [] },
    correct: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const tfSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["TF"], default: "TF", required: true },
    id: { type: String, required: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    points: { type: Number, default: 2, min: 0 },
    answer: { type: Boolean, default: undefined, required: true },
  },
  { _id: false }
);

const fibSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["FIB"], default: "FIB", required: true },
    id: { type: String, required: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    points: { type: Number, default: 2, min: 0 },
    acceptableAnswers: { type: [String], default: [], set: arr => Array.from(new Set((arr || []).map(s => String(s).toLowerCase().trim()).filter(s => s.length)))},

  },
  { _id: false }
);

const questionBankSchema = new mongoose.Schema(
  {
    mc: { type: [mcSchema], default: [] },
    tf: { type: [tfSchema], default: [] },
    fib: { type: [fibSchema], default: [] },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    _id: { type: String },
    course: { type: String, index: true },
    courseId: { type: String, index: true },
    title: { type: String, default: "New Quiz", index: true },
    desc: { type: String, default: "" },
    submissionType: { type: String, default: "Online" },
    gradeType: { type: String, default: "Grade" },
    assignType: { type: String, default: "Quizzes" },
    quizType: { type: String, enum: ["Graded Quiz", "Practice Quiz", "Graded Survey", "Ungraded Survey"], default: "Graded Quiz", index: true,},
    points: { type: Number, default: 100, index: true },
    questions: { type: Number, default: 10, index: true },
    timeLimit: { type: Number, default: 20, min: 0 },
    showOneQuestion: { type: Boolean, default: true },
    showAnswers: { type: Boolean, default: false },
    showAnswersWhen: { type: String, enum: ["afterEach", "atEnd"], default: "atEnd" },
    shuffleQuestions: { type: Boolean, default: true }, 
    shuffleAnswers: { type: Boolean, default: true },
    lockQuestionsAfterAnswering: { type: Boolean, default: false },
    multipleAttempts: { type: Boolean, default: false },
    noOfAttempts: { type: Number, default: 1, min: 1 },
    webcamRequired: { type: Boolean, default: false },
    accessCode: { type: String, trim: true, default: "" },
    assignTo: { type: String, default: "Everyone" },
    startDate: { type: String, default: "", index: true },
    dueDate: { type: String, default: "", index: true },
    endDate: { type: String, default: "", index: true },
    published: { type: Boolean, default: false, index: true },
    _order: { type: Number, default: 0, index: true },
    questionBank: { type: questionBankSchema, default: () => ({}) },
  },
  { collection: "quizzes", timestamps: true }
);
quizSchema.index({ course: 1, _order: 1 });

function computeTotals(qb = { mc: [], tf: [], fib: [] }) {
  const qCount = (qb.mc?.length || 0) + (qb.tf?.length || 0) + (qb.fib?.length || 0);
  const sum = (arr, field = "points") =>
    (arr || []).reduce((acc, q) => acc + (Number.isFinite(q?.[field]) ? q[field] : 0), 0);
  const pTotal = sum(qb.mc) + sum(qb.tf) + sum(qb.fib);
  return { qCount, pTotal };
}

quizSchema.pre("save", function (next) {
  const { qCount, pTotal } = computeTotals(this.questionBank);
  this.questions = qCount;
  this.points = pTotal;
  next();
});

quizSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() || {};
  if (update.questionBank || (update.$set && update.$set.questionBank)) {
    const qb = update.questionBank || update.$set?.questionBank || { mc: [], tf: [], fib: [] };
    const { qCount, pTotal } = computeTotals(qb);
    update.$set = { ...(update.$set || {}), questions: qCount, points: pTotal };
    this.setUpdate(update);
    return next();
  }
  const doc = await this.model.findOne(this.getQuery()).lean();
  if (doc) {
    const { qCount, pTotal } = computeTotals(doc.questionBank);
    update.$set = { ...(update.$set || {}), questions: qCount, points: pTotal };
    this.setUpdate(update);
  }
  next();
});
export default quizSchema;

export const AttemptRecordSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionType: { type: String, enum: ["MC", "TF", "FIB"], required: true },
    questionPoints: { type: Number, default: 0 },
    correctOptionId: { type: String },
    userOptionId: { type: String },
    acceptableAnswers: [{ type: String }],
    userText: { type: String },
  },
  { _id: false }
);

AttemptRecordSchema.pre("validate", function (next) {
  const t = this.questionType;
  if (t === "MC" || t === "TF") {
    if (typeof this.userOptionId === "undefined") this.userOptionId = null;
    this.acceptableAnswers = undefined;
    this.userText = undefined;
  } else if (t === "FIB") {
    if (!Array.isArray(this.acceptableAnswers)) this.acceptableAnswers = [];
    if (typeof this.userText === "undefined") this.userText = "";
    this.correctOptionId = undefined;
    this.userOptionId = undefined;
  }
  next();
});

export const UserQuizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    quizzes: [
      {
        quizId: { type: String, required: true, index: true },
        courseId: { type: String, required: true },
        quizType: {
          type: String,
          enum: ["Graded Quiz", "Practice Quiz", "Graded Survey", "Ungraded Survey"],
          required: true,
        },
        totalQuestions: { type: Number, default: 0 },
        totalPoints: { type: Number, default: 0 },
        attempts: [
          {
            attemptId: { type: String, required: true },
            submittedAt: { type: Date, default: Date.now },
            score: { type: Number, default: 0 },
            records: [AttemptRecordSchema],
          },
        ],
      },
    ],
  },
  { collection: "quizSubmissions", timestamps: true }
);
