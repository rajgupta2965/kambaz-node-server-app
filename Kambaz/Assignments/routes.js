import * as dao from "./dao.js";

export default function AssignmentRoutes(app) {
  const findAssignmentsForCourse = async (req, res) => {
    const { courseId } = req.params;
    const list = await dao.findAssignmentsForCourse(courseId);
    res.json(list);
  };

  const findAssignmentById = async (req, res) => {
    const { assignmentId } = req.params;
    const a = await dao.findAssignmentById(assignmentId);
    if (!a) return res.sendStatus(404);
    res.json(a);
  };

  const createAssignment = async (req, res) => {
    const { courseId } = req.params;
    const payload = req.body ?? {};
    const created = await dao.createAssignment({ ...payload, course: courseId });
    res.json(created);
  };

  const updateAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const updated = await dao.updateAssignment(assignmentId, req.body ?? {});
    res.json(updated);
  };

  const deleteAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const ok = await dao.deleteAssignment(assignmentId);
    res.json(ok);
  };

  app.get("/api/courses/:courseId/assignments", findAssignmentsForCourse);
  app.get("/api/assignments/:assignmentId", findAssignmentById);
  app.post("/api/courses/:courseId/assignments", createAssignment);
  app.put("/api/assignments/:assignmentId", updateAssignment);
  app.delete("/api/assignments/:assignmentId", deleteAssignment);
}
