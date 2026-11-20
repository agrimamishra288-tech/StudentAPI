// In-memory student records.
// The assignment does not allow a database, so this plain array is the store.
// Restarting the server brings these seed records back.

const students = [
  {
    id: 1,
    name: "Aarav Mehta",
    age: 20,
    course: "B.Tech CSE",
    email: "aarav.mehta@example.com"
  },
  {
    id: 2,
    name: "Ishita Rao",
    age: 21,
    course: "B.Tech IT",
    email: "ishita.rao@example.com"
  },
  {
    id: 3,
    name: "Kabir Nair",
    age: 19,
    course: "BCA",
    email: "kabir.nair@example.com"
  }
];

module.exports = students;
