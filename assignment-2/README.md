# Student Management REST API

**Web Dev III / Unit 2 / Lab Assignment 2**<br>
Node.js + Express.js + Postman · in-class lab · 2.5 marks

A small Express server that keeps a class register in memory and exposes it over five REST endpoints. No database, no Mongoose, no extra libraries — just an array, a router, a custom logger and proper status codes.

---

## Assignment checklist

| Requirement | Where it is implemented |
| --- | --- |
| Create an Express server | `app.js` |
| Student CRUD APIs | `routes/studentRoutes.js` |
| Custom logger middleware | `middleware/logger.js` |
| Modular routing | `app.js` mounts `/students`; routes live in their own file |
| Proper error handling | `200`, `201`, `400`, `404`, plus a `500` safety net |
| Array and JSON data only | `data/students.js` |
| Test the APIs in Postman | `postman/Student_Management_API.postman_collection.json` |
| Required project structure | `routes/`, `middleware/`, `data/`, `app.js` |

**Restrictions respected:** no MongoDB, no MySQL, no Mongoose. Records are a plain JavaScript array and reset when the server restarts. Express is the only dependency.

---

## Project structure

```text
assignment-2/
├─ app.js                  # server, middleware order, 404 + error handler
├─ routes/
│  └─ studentRoutes.js     # all five student endpoints
├─ middleware/
│  └─ logger.js            # custom request logger
├─ data/
│  └─ students.js          # three seed records (in-memory array)
├─ postman/
│  └─ Student_Management_API.postman_collection.json
├─ package.json
└─ README.md
```

The four files required by the assignment are present with the exact names: `app.js`, `studentRoutes.js`, `logger.js`, `students.js`.

---

## Run it

```bash
cd assignment-2
npm install
npm start
```

Server: [http://localhost:3000](http://localhost:3000)<br>
Root route: `GET /` returns `Student Management REST API is Running`

To reset the register, stop and restart the server. The three seed students come back.

---

## API reference

Base URL: `http://localhost:3000`

| Method | Endpoint | What it does | Success | Failure |
| --- | --- | --- | --- | --- |
| `GET` | `/students` | List every student | `200 OK` | — |
| `GET` | `/students/:id` | Read one student by id | `200 OK` | `400` invalid id, `404` not found |
| `POST` | `/students` | Create a student | `201 Created` | `400` validation |
| `PUT` | `/students/:id` | Replace a student's details | `200 OK` | `400` invalid id/body, `404` not found |
| `DELETE` | `/students/:id` | Remove a student | `200 OK` | `400` invalid id, `404` not found |

### Student object

```json
{
  "id": 1,
  "name": "Aarav Mehta",
  "age": 20,
  "course": "B.Tech CSE",
  "email": "aarav.mehta@example.com"
}
```

`POST` and `PUT` require `name`, `age`, `course` and `email`. The `id` is assigned by the server.

Validation rules:

- `name`, `course` and `email` must be non-empty strings.
- `age` must be a whole number greater than 0.

### Response shape

Success with one student:

```json
{
  "message": "Student added successfully",
  "student": {
    "id": 4,
    "name": "Nisha Verma",
    "age": 20,
    "course": "B.Tech CSE",
    "email": "nisha.verma@example.com"
  }
}
```

Success with a list:

```json
{
  "message": "All students fetched successfully",
  "students": []
}
```

Failure:

```json
{
  "message": "Student not found"
}
```

---

## Examples

### GET /students → 200

```json
{
  "message": "All students fetched successfully",
  "students": [
    {
      "id": 1,
      "name": "Aarav Mehta",
      "age": 20,
      "course": "B.Tech CSE",
      "email": "aarav.mehta@example.com"
    },
    {
      "id": 2,
      "name": "Ishita Rao",
      "age": 21,
      "course": "B.Tech IT",
      "email": "ishita.rao@example.com"
    },
    {
      "id": 3,
      "name": "Kabir Nair",
      "age": 19,
      "course": "BCA",
      "email": "kabir.nair@example.com"
    }
  ]
}
```

### POST /students → 201

```http
POST /students
Content-Type: application/json
```

```json
{
  "name": "Nisha Verma",
  "age": 20,
  "course": "B.Tech CSE",
  "email": "nisha.verma@example.com"
}
```

```json
{
  "message": "Student added successfully",
  "student": {
    "id": 4,
    "name": "Nisha Verma",
    "age": 20,
    "course": "B.Tech CSE",
    "email": "nisha.verma@example.com"
  }
}
```

### POST /students → 400

```json
{
  "message": "Please provide valid name, age, course and email"
}
```

### GET /students/1 → 200

```json
{
  "message": "Student found successfully",
  "student": {
    "id": 1,
    "name": "Aarav Mehta",
    "age": 20,
    "course": "B.Tech CSE",
    "email": "aarav.mehta@example.com"
  }
}
```

### PUT /students/4 → 200

```json
{
  "message": "Student updated successfully",
  "student": {
    "id": 4,
    "name": "Nisha Verma",
    "age": 21,
    "course": "BCA",
    "email": "nisha.verma@example.com"
  }
}
```

### DELETE /students/4 → 200

```json
{
  "message": "Student deleted successfully",
  "student": {
    "id": 4,
    "name": "Nisha Verma",
    "age": 21,
    "course": "BCA",
    "email": "nisha.verma@example.com"
  }
}
```

### GET /students/9999 → 404

```json
{
  "message": "Student not found"
}
```

### GET /students/abc → 400

```json
{
  "message": "Invalid student id"
}
```

Malformed JSON is caught by the central error handler and returned as `400 Invalid JSON body` instead of crashing the server. Unknown routes return `404 Route not found`.

---

## Middleware order

```js
app.use(logger);                             // custom logger
app.use(express.json());                     // JSON body parser
app.get("/", ...);                           // simple home route
app.use("/students", studentRoutes);         // modular router
app.use((req, res) => { /* 404 */ });        // unmatched routes
app.use((err, req, res, next) => { /* 400 for bad JSON, 500 fallback */ });
```

The logger prints the method, path, final status, duration, and the body of `POST`/`PUT` requests:

```text
  STUDENT MANAGEMENT REST API
  Web Dev III - Unit 2 - Lab Assignment 2
  http://localhost:3000
  3 seed records in memory - no database

23:39:02  GET    /students                    200     2.3 ms
23:39:07  POST   /students                    400     2.7 ms
          body {"name":"Test","age":0,"course":"BCA","email":"t@example.com"}
23:39:07  POST   /students                    201     1.8 ms
          body {"name":"Nisha Verma","age":20,"course":"B.Tech CSE","email":"nisha.verma@example.com"}
23:39:10  GET    /students/4                  200     1.2 ms
23:39:11  PUT    /students/4                  200     2.6 ms
23:39:11  DELETE /students/4                  200     1.1 ms
23:39:11  GET    /students/9999               404     0.5 ms
```

---

## Testing in Postman

1. Start the server with `npm start`.
2. In Postman: **Import** → choose `postman/Student_Management_API.postman_collection.json`.
3. Open **CRUD - run in order** and send the requests from top to bottom. The create request saves the new id in a collection variable, so read, update and delete all use the same record.
4. Run **Error handling** to see the `400` and `404` responses.

The collection contains 11 requests with basic test assertions. The `baseUrl` collection variable is already set to `http://localhost:3000`.

| Folder | Requests | Expected |
| --- | --- | --- |
| CRUD - run in order | get all, get one, create, get created, update, delete | `200`, `200`, `201`, `200`, `200`, `200` |
| Error handling | invalid id, missing fields, malformed JSON, missing student, unknown route | `400`, `400`, `400`, `404`, `404` |

---

## Verification

Checked by hand with `curl`:

| Check | Result |
| --- | --- |
| `GET /` | `200 Student Management REST API is Running` |
| `GET /students` | `200`, returns 3 records |
| `GET /students/1` | `200` |
| `GET /students/abc` | `400 Invalid student id` |
| `GET /students/9999` | `404 Student not found` |
| `POST /students` valid body | `201`, new id assigned |
| `POST /students` empty body | `400` |
| `PUT /students/4` valid body | `200`, same id, updated fields |
| `PUT /students/9999` | `404` |
| `DELETE /students/4` | `200`, record returned |
| `DELETE /students/4` again | `404` |
| Malformed JSON body | `400 Invalid JSON body` |
| Unknown route | `404 Route not found` |

---

## Notes

- Data is intentionally in memory. This follows the assignment restriction and means the three seed students return after every server restart.
- The Postman collection and this README are additions around the required server; the required Express API itself uses only `app.js`, `routes/`, `middleware/` and `data/`.
- No authentication, database, UI, or persistence layer is included because none was requested.

Built by **Agrima Mishra** for Web Dev III, Unit 2.
