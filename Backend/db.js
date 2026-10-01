const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// สร้างฟังก์ชัน sql สำหรับรัน Query
const sql = neon(process.env.DATABASE_URL);

module.exports = sql;