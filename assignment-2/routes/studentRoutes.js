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

const fail = (res, status, message) => res.status(status).json({ message });

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
    message: "All students fetched successfully",
    students: students
  });
});

// GET /students/:id
router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return fail(res, 400, "Invalid student id");

  const student = students.find((entry) => entry.id === id);
  if (!student) return fail(res, 404, "Student not found");

  res.status(200).json({
    message: "Student found successfully",
    student: student
  });
});

// POST /students
router.post("/", (req, res) => {
  if (!isValidStudent(req.body)) {
    return fail(res, 400, "Please provide valid name, age, course and email");
  }

  const { name, age, course, email } = req.body;
  const student = { id: nextId, name, age, course, email };
  nextId += 1;
  students.push(student);

  res.status(201).json({
    message: "Student added successfully",
    student: student
  });
});

// PUT /students/:id
router.put("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return fail(res, 400, "Invalid student id");

  const student = students.find((entry) => entry.id === id);
  if (!student) return fail(res, 404, "Student not found");

  if (!isValidStudent(req.body)) {
    return fail(res, 400, "Please provide valid name, age, course and email");
  }

  const { name, age, course, email } = req.body;
  student.name = name;
  student.age = age;
  student.course = course;
  student.email = email;

  res.status(200).json({
    message: "Student updated successfully",
    student: student
  });
});

// DELETE /students/:id
router.delete("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return fail(res, 400, "Invalid student id");

  const index = students.findIndex((entry) => entry.id === id);
  if (index === -1) return fail(res, 404, "Student not found");

  const [removed] = students.splice(index, 1);

  res.status(200).json({
    message: "Student deleted successfully",
    student: removed
  });
});

module.exports = router;
