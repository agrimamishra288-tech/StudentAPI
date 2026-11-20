const express = require("express");
const students = require("../data/students");

const router = express.Router();

// New records continue from the highest seeded id (3 -> 4).
let nextId = students.reduce((highest, student) => Math.max(highest, student.id), 0) + 1;

const parseId = (rawId) => {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

// Shared validation for POST and PUT.
const isValidStudent = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;

  const { name, age, course, email } = payload;
  return Boolean(name && course && email) &&
    typeof name === "string" &&
    typeof course === "string" &&
    typeof email === "string" &&
    Number.isInteger(age) &&
    age > 0;
};

// GET /students
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: students.length,
    message: "Student records retrieved.",
    data: students
  });
});

// GET /students/:id
router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return fail(res, 400, "Student id must be a positive whole number.");

  const student = students.find((entry) => entry.id === id);
  if (!student) return fail(res, 404, "No student exists with that id.");

  res.status(200).json({
    success: true,
    message: "Student record retrieved.",
    data: student
  });
});

// POST /students
router.post("/", (req, res) => {
  if (!isValidStudent(req.body)) {
    return fail(res, 400, "Provide a name, age, course and email. Age must be a positive whole number.");
  }

  const { name, age, course, email } = req.body;
  const student = { id: nextId, name, age, course, email };
  nextId += 1;
  students.push(student);

  res.status(201).json({
    success: true,
    message: "Student record created.",
    data: student
  });
});

// PUT /students/:id
router.put("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return fail(res, 400, "Student id must be a positive whole number.");

  const student = students.find((entry) => entry.id === id);
  if (!student) return fail(res, 404, "No student exists with that id.");

  if (!isValidStudent(req.body)) {
    return fail(res, 400, "Provide a name, age, course and email. Age must be a positive whole number.");
  }

  const { name, age, course, email } = req.body;
  student.name = name;
  student.age = age;
  student.course = course;
  student.email = email;

  res.status(200).json({
    success: true,
    message: "Student record updated.",
    data: student
  });
});

// DELETE /students/:id
router.delete("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return fail(res, 400, "Student id must be a positive whole number.");

  const index = students.findIndex((entry) => entry.id === id);
  if (index === -1) return fail(res, 404, "No student exists with that id.");

  const [removed] = students.splice(index, 1);

  res.status(200).json({
    success: true,
    message: "Student record deleted.",
    data: removed
  });
});

module.exports = router;
