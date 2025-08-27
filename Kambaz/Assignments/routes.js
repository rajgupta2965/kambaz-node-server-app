import * as dao from "./dao.js";

export default function AssignmentRoutes(app) {
  app.get("/api/courses/:courseId/assignments", (req, res) => {
    const { courseId } = req.params;
    res.json(dao.findAssignmentsForCourse(courseId));
  });

  app.get("/api/assignments/:assignmentId", (req, res) => {
    const { assignmentId } = req.params;
    const a = dao.findAssignmentById(assignmentId);
    if (!a) return res.sendStatus(404);
    res.json(a);
  });

  app.post("/api/courses/:courseId/assignments", (req, res) => {
    const { courseId } = req.params;
    const payload = req.body ?? {};
    const created = dao.createAssignment({ ...payload, course: courseId });
    res.json(created);
  });

  app.put("/api/assignments/:assignmentId", (req, res) => {
    const { assignmentId } = req.params;
    const updated = dao.updateAssignment(assignmentId, req.body ?? {});
    res.json(updated);
  });

  app.delete("/api/assignments/:assignmentId", (req, res) => {
    const { assignmentId } = req.params;
    const ok = dao.deleteAssignment(assignmentId);
    res.json(ok);
  });
}
