const express = require('express');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
const sql = neon(process.env.DATABASE_URL);


app.use(cors({ origin: 'http://localhost:5000' }));   // เพิ่ม
app.use(express.json());

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// รายชื่อบริษัท (ใช้ใส่ dropdown)
app.get('/companies', wrap(async (req, res) => {
  res.json(await sql`SELECT company_id, company_name FROM "Company" ORDER BY company_name`);
}));

// เพิ่มบริษัท
app.post('/companies', wrap(async (req, res) => {
  const { company_id, company_name, detail, role } = req.body;
  if (!company_id || !company_name)
    return res.status(400).json({ error: 'ต้องระบุ company_id และ company_name' });
  const rows = await sql`
    INSERT INTO "Company" (company_id, company_name, detail, role)
    VALUES (${company_id}, ${company_name}, ${detail || null}, ${role || null})
    RETURNING *`;
  res.status(201).json(rows[0]);
}));

// ค้นหาพนักงานตามชื่อบริษัท (?company_name=...) ถ้าไม่ส่งมา = ทั้งหมด
app.get('/employees', wrap(async (req, res) => {
  const q = (req.query.company_name || '').trim();
  const rows = await sql`
    SELECT e.employee_id, e.name, e.company_id, c.company_name
    FROM "Employee" e
    LEFT JOIN "Company" c ON c.company_id = e.company_id
    WHERE ${q} = '' OR c.company_name ILIKE '%' || ${q} || '%'
    ORDER BY c.company_name, e.name`;
  res.json(rows);
}));

// เพิ่มพนักงาน (เก็บบริษัทเป็นรหัส)
app.post('/employees', wrap(async (req, res) => {
  const { employee_id, name, company_id } = req.body;
  if (!employee_id || !name)
    return res.status(400).json({ error: 'ต้องระบุ employee_id และ name' });
  const rows = await sql`
    INSERT INTO "Employee" (employee_id, name, company_id)
    VALUES (${employee_id}, ${name}, ${company_id || null})
    RETURNING *`;
  res.status(201).json(rows[0]);
}));

// แก้ไขข้อมูลพนักงาน / ย้ายบริษัท ได้ตลอดเวลา
app.put('/employees/:id', wrap(async (req, res) => {
  const { name, company_id } = req.body;
  const rows = await sql`
    UPDATE "Employee"
    SET name = ${name}, company_id = ${company_id || null}
    WHERE employee_id = ${req.params.id}
    RETURNING *`;
  if (!rows.length) return res.status(404).json({ error: 'ไม่พบพนักงาน' });
  res.json(rows[0]);
}));

// ลบพนักงาน
app.delete('/employees/:id', wrap(async (req, res) => {
  await sql`DELETE FROM "Employee" WHERE employee_id = ${req.params.id}`;
  res.status(204).end();
}));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));