const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
app.use(express.static(__dirname));

// --- 2. CONFIGURACIÓN DE BASE DE DATOS (OPTIMIZADA) ---
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD, 
    database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    connectTimeout: 10000 
});

db.connect(err => {
    if (err) {
        console.error('❌ Error de conexión a la base de datos:', err.message);
        return;
    }
    console.log('✅ Base de datos conectada correctamente');
});

// --- 3. RUTAS DE NAVEGACIÓN ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 4. API REPARTIDORES (CRUD COMPLETO) ---

// Obtener todos
app.get('/api/repartidores', (req, res) => {
    const sql = "SELECT * FROM repartidores";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Consultar uno solo (Para el botón Consultar)
app.get('/api/repartidores/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM repartidores WHERE id_repartidor = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) res.json(results[0]);
        else res.status(404).json({ error: "Repartidor no encontrado" });
    });
});

// Registrar (POST)
app.post('/api/repartidores', (req, res) => {
    const { id_pizzeria, nombre, apellidos, tel, sueldo } = req.body;
    const sql = 'INSERT INTO repartidores (id_pizzeria, nombre, apellidos, tel, sueldo) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [id_pizzeria || 1, nombre, apellidos, tel, sueldo], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Repartidor guardado exitosamente' });
    });
});

// Modificar (PUT) - ESTA FALTABA
app.put('/api/repartidores/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, tel, sueldo } = req.body;
    const sql = 'UPDATE repartidores SET nombre = ?, apellidos = ?, tel = ?, sueldo = ? WHERE id_repartidor = ?';
    db.query(sql, [nombre, apellidos, tel, sueldo, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Repartidor actualizado correctamente' });
    });
});

// Eliminar (DELETE) - ESTA FALTABA
app.delete('/api/repartidores/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM repartidores WHERE id_repartidor = ?';
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Repartidor eliminado' });
    });
});

// --- 5. OTRAS RUTAS API ---

app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM pizzerias WHERE correo_admin = ? AND password_hash = ?';
    db.query(sql, [correo, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (results.length > 0) res.json({ success: true, user: results[0].correo_admin });
        else res.status(401).json({ success: false, error: "Credenciales incorrectas" });
    });
});

// (Rutas de clientes y pedidos se mantienen igual, asegúrate de que usen /api/...)

// --- 6. PUERTO ---
const PORT = process.env.PORT || 8080; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor activo en puerto: ${PORT}`);
});