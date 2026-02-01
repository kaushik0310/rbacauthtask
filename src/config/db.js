 const mysql = require("mysql2/promise");

// module.exports = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "auth_db",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });


// DB config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
}

const connection = () => {
  pool = mysql.createPool(dbConfig)
  console.log(`DB Connected`, dbConfig.database)
  return pool
}

module.exports = {
  connection
}