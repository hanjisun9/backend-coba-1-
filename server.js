require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ================= TEST API =================
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send("<h1>Backend running</h1>");
});

// ================= ADMIN =================

app.post("/admin/register", async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    username = username.trim().toLowerCase();

    const cek = await pool.query(
      "SELECT * FROM admin WHERE LOWER(username) = $1",
      [username]
    );

    if (cek.rows.length > 0) {
      return res.status(409).json({ message: "Admin sudah ada" });
    }

    await pool.query(
      "INSERT INTO admin (username, password) VALUES ($1, $2)",
      [username, password]
    );

    res.status(201).json({ message: "Register berhasil" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ADMIN (buat cek DB)
app.get("/admin/login", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM admin");
    res.json(result.rows);
  } catch (err) {
    console.error("GET ADMIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN ADMIN
app.post("/admin/login", async (req, res) => {  // ← ubah endpoint jadi /admin/login
  try {
    let { username, password } = req.body;

    // validasi
    if (!username || !password) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    username = String(username).trim().toLowerCase(); // ← tambah toLowerCase()

    console.log("Login attempt:", { username, password }); // ← debugging

    // Gunakan LOWER() untuk case-insensitive search
    const result = await pool.query(
      "SELECT * FROM admin WHERE LOWER(TRIM(username)) = $1",
      [username]
    );

    console.log("Query result:", result.rows); // ← debugging

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Admin tidak ditemukan" });
    }

    if (result.rows[0].password !== password) {
      return res.status(401).json({ message: "Password salah" });
    }

    res.json({
      message: "Login sukses",
      admin: {
        id: result.rows[0].id,
        username: result.rows[0].username
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/admin/logout", (req, res) => {
  res.json({ message: "Logout berhasil" });
});


// ================= PRODUCTS =================
app.get("/products", async (req, res) => {
  const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
  res.json(result.rows);
});

app.post("/products", async (req, res) => {
  const { name, price, image_url, description } = req.body;
  const result = await pool.query("INSERT INTO products (name, price, image_url, description) VALUES ($1,$2,$3,$4) RETURNING *", [name, price, image_url, description]);
  res.json(result.rows[0]);
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, image_url, description } = req.body;
  await pool.query("UPDATE products SET name=$1, price=$2, image_url=$3, description=$4 WHERE id=$5", [name, price, image_url, description, id]);
  res.json({ message: "Produk diupdate" });
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM products WHERE id=$1", [id]);
  res.json({ message: "Produk dihapus" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
