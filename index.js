const express = require("express");
const app = express();
// let port = 7000;
// app.get("/", (req, res) => {
//   res.send("Hello World");
// });

const tourRoutes = require("./routes/tourRoutes");

app.use(express.json());
app.use('/api', tourRoutes);


// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
