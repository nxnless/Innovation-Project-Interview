import { useEffect, useState } from 'react';
import './App.css';

const empty = { employee_id: '', name: '', company_id: '' };

async function api(url, method = 'GET', body) {
  url = process.env.REACT_APP_API_URL + url;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
  return data;
}

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');

  const loadEmployees = (q = search) =>
    api(`/employees?company_name=${encodeURIComponent(q)}`)
      .then(setEmployees)
      .catch((e) => setMsg(e.message));

  useEffect(() => {
    api('/companies').then(setCompanies).catch((e) => setMsg(e.message));
    loadEmployees('');
    // eslint-disable-next-line
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api(`/employees/${form.employee_id}`, 'PUT', form);
      else await api('/employees', 'POST', form);
      setMsg(editing ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มพนักงานแล้ว');
      setForm(empty);
      setEditing(false);
      loadEmployees();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const edit = (emp) => {
    setForm({ employee_id: emp.employee_id, name: emp.name, company_id: emp.company_id || '' });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('ลบพนักงานคนนี้?')) return;
    await api(`/employees/${id}`, 'DELETE');
    loadEmployees();
  };

  return (
    <main className="page">
      <h1>ทะเบียนพนักงาน</h1>
      {msg && <p className="msg" role="status">{msg}</p>}

      <section>
        <h2>{editing ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</h2>
        <form onSubmit={save} className="row">
          <label>
            รหัสพนักงาน
            <input
              value={form.employee_id}
              disabled={editing}
              required
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            />
          </label>
          <label>
            ชื่อ
            <input
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            บริษัทที่สังกัด
            <select
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            >
              <option value="">— ไม่ระบุ —</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_name} ({c.company_id})
                </option>
              ))}
            </select>
          </label>
          <button type="submit">{editing ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}</button>
          {editing && (
            <button type="button" className="ghost" onClick={() => { setForm(empty); setEditing(false); }}>
              ยกเลิก
            </button>
          )}
        </form>
      </section>

      <section>
        <h2>ค้นหาพนักงานตามบริษัท</h2>
        <form className="row" onSubmit={(e) => { e.preventDefault(); loadEmployees(); }}>
          <label>
            ชื่อบริษัท
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="เว้นว่าง = ทั้งหมด" />
          </label>
          <button type="submit">ค้นหา</button>
        </form>

        {employees.length === 0 ? (
          <p className="empty">ไม่พบพนักงาน ลองเปลี่ยนชื่อบริษัทที่ค้นหา</p>
        ) : (
          <table>
            <thead>
              <tr><th>รหัส</th><th>ชื่อ</th><th>บริษัท</th><th></th></tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employee_id}>
                  <td>{emp.employee_id}</td>
                  <td>{emp.name}</td>
                  <td>{emp.company_name || '—'} <small>{emp.company_id}</small></td>
                  <td className="actions">
                    <button className="ghost" onClick={() => edit(emp)}>แก้ไข</button>
                    <button className="ghost danger" onClick={() => remove(emp.employee_id)}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}