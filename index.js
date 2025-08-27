import "dotenv/config";
import express from "express";
import Hello from "./Hello.js";
import Lab5 from "./Lab5/index.js";
import cors from "cors";
import session from "express-session";
import UserRoutes from "./Kambaz/Users/routes.js";
import CourseRoutes from "./Kambaz/Courses/routes.js";
import ModuleRoutes from "./Kambaz/Modules/routes.js";
import LessonRoutes from "./Kambaz/Lessons/routes.js";
import AssignmentRoutes from "./Kambaz/Assignments/routes.js";

const app = express();
app.use(
 cors({
   credentials: true,
   origin: process.env.NETLIFY_URL || "http://localhost:5173",
 })
);

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "kambaz",
  resave: false,
  saveUninitialized: false,
};

if (process.env.NODE_ENV === "production") {
  sessionOptions.proxy = true;
  sessionOptions.cookie = {
    sameSite: "none",
    secure: true,
    ...(process.env.NODE_SERVER_DOMAIN ? { domain: process.env.NODE_SERVER_DOMAIN } : {}),
  };
}

app.use(session(sessionOptions));
app.use(express.json());

UserRoutes(app);
CourseRoutes(app);
ModuleRoutes(app);
LessonRoutes(app);
AssignmentRoutes(app);
Lab5(app);
Hello(app);

app.listen(process.env.PORT || 4000)
