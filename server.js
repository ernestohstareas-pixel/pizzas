const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
// Esto asegura que index.html y los demás archivos se sirvan desde la raíz
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
// (Tus rutas de repartidores están correctas, se mantienen igual)
app.get('/api/repartidores', (req, res) => {
    const sql = "SELECT * FROM repartidores";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/repartidores/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM repartidores WHERE id_repartidor = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) res.json(results[0]);
        else res.status(404).json({ error: "Repartidor no encontrado" });
    });
});

app.post('/api/repartidores', (req, res) => {
    const { id_pizzeria, nombre, apellidos, tel, sueldo } = req.body;
    const sql = 'INSERT INTO repartidores (id_pizzeria, nombre, apellidos, tel, sueldo) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [id_pizzeria || 1, nombre, apellidos, tel, sueldo], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Repartidor guardado exitosamente' });
    });
});

app.put('/api/repartidores/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, tel, sueldo } = req.body;
    const sql = 'UPDATE repartidores SET nombre = ?, apellidos = ?, tel = ?, sueldo = ? WHERE id_repartidor = ?';
    db.query(sql, [nombre, apellidos, tel, sueldo, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Repartidor actualizado' });
    });
});

app.delete('/api/repartidores/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM repartidores WHERE id_repartidor = ?';
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Repartidor eliminado' });
    });
});

// --- 5. API CLIENTES (NUEVA - NECESARIA PARA TU FORMULARIO) ---

app.get('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM clientes WHERE id_cliente = ?";
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) res.json(results[0]);
        else res.status(404).json({ error: "Cliente no encontrado" });
    });
});

app.post('/api/clientes', (req, res) => {
    const { id_cliente, id_pizzeria, nombre_completo, direccion, telefono } = req.body;
    const sql = 'INSERT INTO clientes (id_cliente, id_pizzeria, nombre_completo, direccion, telefono) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [id_cliente, id_pizzeria || 1, nombre_completo, direccion, telefono], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Cliente registrado correctamente' });
    });
});

app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { nombre_completo, direccion, telefono } = req.body;
    const sql = 'UPDATE clientes SET nombre_completo = ?, direccion = ?, telefono = ? WHERE id_cliente = ?';
    db.query(sql, [nombre_completo, direccion, telefono, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Cliente actualizado' });
    });
});

app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM clientes WHERE id_cliente = ?';
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Cliente eliminado' });
    });
});

// --- 6. LOGIN ---
app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM pizzerias WHERE correo_admin = ? AND password_hash = ?';
    db.query(sql, [correo, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (results.length > 0) res.json({ success: true, user: results[0].correo_admin });
        else res.status(401).json({ success: false, error: "Credenciales incorrectas" });
    });
});

// --- 7. PUERTO ---
// '0.0.0.0' es vital para que Railway pueda exponer el servicio externamente
const PORT = process.env.PORT || 8080; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor activo en puerto: ${PORT}`);
});