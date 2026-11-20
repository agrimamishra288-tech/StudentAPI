const express = require("express");
const students = require("../data/students");

const router = express.Router();

// New records continue from the highest seeded id (105 -> 106).
let nextId = students.reduce((highest, student) => Math.max(highest, student.id), 100) + 1;

const parseId = (rawId) => {
  if (!/^\d+$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const fail = (res, status, error, details = []) =>
  res.status(status).json({ success: false, error, details });

const invalidId = (res) =>
  fail(res, 400, "Invalid student id", ["Student id must be a positive integer."]);

// Shared validation for POST and PUT.
// Returns { value } when clean, or { errors } when something is wrong.
const validateStudent = (payload, currentId = null) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { errors: ["Request body must be a JSON object."] };
  }

  const errors = [];

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const course = typeof payload.course === "string" ? payload.course.trim() : "";
  const year = Number(payload.year);

  if (!name) {
    errors.push("name is required.");
  } else if (name.length < 2) {
    errors.push("name must be at least 2 characters long.");
  }

  if (!email) {
    errors.push("email is required.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("email must be a valid email address.");
  } else if (
    students.some(
      (student) => student.email.toLowerCase() === email && student.id !== currentId
    )
  ) {
    errors.push("email is already used by another student.");
  }

  if (!course) {
    errors.push("course is required.");
  } else if (course.length < 2) {
    errors.push("course must be at least 2 characters long.");
  }

  if (!Number.isInteger(year) || year < 1 || year > 4) {
    errors.push("year must be a whole number between 1 and 4.");
  }

  if (errors.length > 0) return { errors };

  return { value: { name, email, course, year } };
};

// GET /students
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: `${students.length} student record(s) found`,
    data: students
  });
});

// GET /students/:id
router.get("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return invalidId(res);

  const student = students.find((entry) => entry.id === id);
  if (!student) return fail(res, 404, "Student not found", [`No student exists with id ${id}.`]);

  res.status(200).json({ success: true, message: "Student found", data: student });
});

// POST /students
router.post("/", (req, res) => {
  const { errors, value } = validateStudent(req.body);
  if (errors) return fail(res, 400, "Validation failed", errors);

  const student = { id: nextId, ...value };
  nextId += 1;
  students.push(student);

  res
    .status(201)
    .location(`/students/${student.id}`)
    .json({ success: true, message: "Student created", data: student });
});

// PUT /students/:id
router.put("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return invalidId(res);

  const index = students.findIndex((entry) => entry.id === id);
  if (index === -1) return fail(res, 404, "Student not found", [`No student exists with id ${id}.`]);

  const { errors, value } = validateStudent(req.body, id);
  if (errors) return fail(res, 400, "Validation failed", errors);

  // The id stays the same; only the four editable fields are replaced.
  students[index] = { id, ...value };

  res.status(200).json({ success: true, message: "Student updated", data: students[index] });
});

// DELETE /students/:id
router.delete("/:id", (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return invalidId(res);

  const index = students.findIndex((entry) => entry.id === id);
  if (index === -1) return fail(res, 404, "Student not found", [`No student exists with id ${id}.`]);

  const [removed] = students.splice(index, 1);
  res.status(200).json({ success: true, message: "Student deleted", data: removed });
});

module.exports = router;
