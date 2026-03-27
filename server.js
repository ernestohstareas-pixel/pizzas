const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS ---
// Servir archivos directamente desde la raíz donde está server.js
app.use(express.static(__dirname));

// --- 2. CONFIGURACIÓN DE BASE DE DATOS (OPTIMIZADA PARA RAILWAY) ---
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

// --- 3. RUTAS DE NAVEGACIÓN (FRONTEND) ---
// Ruta raíz: envía el index.html que está en tu repositorio principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Si intentas acceder a /login, asegúrate de que el archivo existe
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// --- 4. API (LOGIN Y CRUD) ---

app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM pizzerias WHERE correo_admin = ? AND password_hash = ?';
    db.query(sql, [correo, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (results.length > 0) res.json({ success: true, user: results[0].correo_admin });
        else res.status(401).json({ success: false, error: "Credenciales incorrectas" });
    });
});

app.get('/api/repartidores', (req, res) => {
    const sql = "SELECT id_repartidor, nombre, apellidos, tel, sueldo FROM repartidores";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/repartidores', (req, res) => {
    const { id_pizzeria, nombre, apellidos, tel, sueldo } = req.body;
    const sql = 'INSERT INTO repartidores (id_pizzeria, nombre, apellidos, tel, sueldo) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [id_pizzeria || 1, nombre, apellidos, tel, sueldo], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Repartidor guardado exitosamente' });
    });
});

app.get('/api/clientes', (req, res) => {
    const sql = "SELECT id_cliente, nombre_completo, direccion, telefono FROM clientes";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/clientes', (req, res) => {
    const { id_pizzeria, nombre_completo, direccion, telefono } = req.body;
    const sql = 'INSERT INTO clientes (id_pizzeria, nombre_completo, direccion, telefono) VALUES (?, ?, ?, ?)';
    db.query(sql, [id_pizzeria || 1, nombre_completo, direccion, telefono], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente guardado exitosamente' });
    });
});

app.get('/api/pedidos', (req, res) => {
    const fecha = req.query.fecha;
    let sql = `
        SELECT 
            p.id_pedido, 
            p.id_cliente, 
            c.nombre_completo, 
            DATE_FORMAT(p.fecha, '%Y-%m-%d') as fecha, 
            p.total 
        FROM pedidos p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente`;
    
    let params = [];
    if (fecha) {
        sql += " WHERE DATE(p.fecha) = ?";
        params.push(fecha);
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/pedidos', (req, res) => {
    const { id_pizzeria, id_cliente, id_repartidor, total, detalles } = req.body;
    const fecha = new Date().toISOString().split('T')[0];
    const sql = 'INSERT INTO pedidos (id_pizzeria, id_cliente, id_repartidor, detalles, total, fecha) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [id_pizzeria || 1, id_cliente, id_repartidor, detalles, total, fecha], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Venta registrada con éxito' });
    });
});

app.get('/api/bonos/consulta/:id', (req, res) => {
    const id_repartidor = req.params.id;
    const sql = `
        SELECT 
            r.nombre, 
            r.apellidos, 
            r.sueldo,
            (SELECT COUNT(*) FROM pedidos p WHERE p.id_repartidor = r.id_repartidor AND p.fecha >= DATE_SUB(CURDATE(), INTERVAL 5 DAY)) AS pedidos
        FROM repartidores r
        WHERE r.id_repartidor = ?`;

    db.query(sql, [id_repartidor], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length > 0) {
            res.json({
                nombre: result[0].nombre,
                apellidos: result[0].apellidos,
                pedidos: result[0].pedidos,
                sueldo: result[0].sueldo,
                periodo: "Últimos 5 días"
            });
        } else {
            res.status(404).json({ error: "Repartidor no encontrado" });
        }
    });
});

// --- 5. PUERTO DINÁMICO ---
// IMPORTANTE: Railway usa el puerto que le asigne la variable de entorno PORT
const PORT = process.env.PORT || 8080; 
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de Easy Pizza activo en puerto: ${PORT}`);
});