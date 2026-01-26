require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// TEST API
app.get("/", (req, res) => {
  res.json({ message: "Backend jalan 🔥" });
});

// ================= ADMIN =================
app.post("/admin/login", async (req, res) => {
  const { id_admin, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM admins WHERE id_admin=$1 AND password=$2",
    [id_admin, password]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ message: "Login gagal" });
  }

  res.json({ message: "Login sukses" });
});

// ================= PRODUCTS =================
app.get("/products", async (req, res) => {
  const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
  res.json(result.rows);
});

app.post("/products", async (req, res) => {
  const { name, price, image_url, description } = req.body;

  const result = await pool.query(
    "INSERT INTO products (name, price, image_url, description) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, price, image_url, description]
  );

  res.json(result.rows[0]);
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, image_url, description } = req.body;

  await pool.query(
    "UPDATE products SET name=$1, price=$2, image_url=$3, description=$4 WHERE id=$5",
    [name, price, image_url, description, id]
  );

  res.json({ message: "Produk diupdate" });
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM products WHERE id=$1", [id]);
  res.json({ message: "Produk dihapus" });
});

app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);
