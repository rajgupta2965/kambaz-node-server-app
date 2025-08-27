const assignment = {
  id: 1, title: "NodeJS Assignment",
  description: "Create a NodeJS server with ExpressJS",
  due: "2021-10-10", completed: false, score: 0,
};
const module = {
  id: "M1",
  name: "Web Dev Module",
  description: "Introduction to React.js",
  course: "CS5610",
};

export default function WorkingWithObjects(app) {
  
  //-------------------------Assignment Object------------------------------
  app.get("/lab5/assignment", (req, res) => {
    res.json(assignment);
  });
  app.get("/lab5/assignment/title", (req, res) => {
    res.json(assignment.title);
  });
  app.get("/lab5/assignment/title/:newTitle", (req, res) => {
    const { newTitle } = req.params;
    assignment.title = newTitle;
    res.json(assignment);
  });
  app.get("/lab5/assignment/score/:score", (req, res) => {
    const { score } = req.params;
    const n = Number(score);
    if (!Number.isNaN(n)) assignment.score = n;
    res.json(assignment);
  });
  app.get("/lab5/assignment/completed/:completed", (req, res) => {
    const v = String(req.params.completed).toLowerCase();
    assignment.completed = v === "true" || v === "1" || v === "yes" || v === "on";
    res.json(assignment);
  });

  //--------------------------Module Object---------------------------
  app.get("/lab5/module", (req, res) => {
    res.json(module);
  });
  app.get("/lab5/module/name", (req, res) => {
    res.json(module.name);
  });
  app.get("/lab5/module/name/:name", (req, res) => {
    module.name = decodeURIComponent(req.params.name);
    res.json(module);
  });
  app.get("/lab5/module/description/:desc", (req, res) => {
    module.description = decodeURIComponent(req.params.desc);
    res.json(module);
  });
};
