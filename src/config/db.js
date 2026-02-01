 const mysql = require("mysql2/promise");


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
  console.log(`DB Connected ${process.env.DB_NAME}`)
  return pool
}

module.exports = {
  connection
}