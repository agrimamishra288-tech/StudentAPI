// In-memory student records.
// The assignment does not allow a database, so this plain array is the store.
// Restarting the server brings these seed records back.

const students = [
  {
    id: 101,
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    course: "B.Tech CSE",
    year: 2
  },
  {
    id: 102,
    name: "Ishita Rao",
    email: "ishita.rao@example.com",
    course: "B.Tech IT",
    year: 3
  },
  {
    id: 103,
    name: "Kabir Nair",
    email: "kabir.nair@example.com",
    course: "BCA",
    year: 1
  },
  {
    id: 104,
    name: "Meera Joshi",
    email: "meera.joshi@example.com",
    course: "B.Sc Data Science",
    year: 2
  },
  {
    id: 105,
    name: "Rohan Kapoor",
    email: "rohan.kapoor@example.com",
    course: "BBA",
    year: 4
  }
];

module.exports = students;
