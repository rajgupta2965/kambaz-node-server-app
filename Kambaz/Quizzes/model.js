import mongoose from "mongoose";
import quizSchema, { UserQuizAttemptSchema } from "./schema.js";
const QuizModel = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
const UserQuizAttemptModel =
  mongoose.models.QuizSubmission ||
  mongoose.model("QuizSubmission", UserQuizAttemptSchema, "quizSubmissions");
export { UserQuizAttemptModel };
export default QuizModel;