require("dotenv").config();
const app = require("./app");

app.listen(9766, () =>
  console.log("Server running on port 9766")
);
