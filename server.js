const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// --- CONFIGURACIÓN DE BASE DE DATOS PARA LA NUBE ---
// Cuando subas a Railway, ellos te darán estos datos.
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '', 
    database: process.env.MYSQLDATABASE || 'pizzas',
    port: process.env.MYSQLPORT || 3306
});

db.connect(err => {
    if (err) return console.error('❌ Error de conexión:', err.message);
    console.log('✅ Base de datos conectada correctamente');
});

// --- RUTA PRINCIPAL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// --- LOGIN ---
app.post('/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM pizzerias WHERE correo_admin = ? AND password_hash = ?';
    db.query(sql, [correo, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (results.length > 0) res.json({ success: true });
        else res.status(401).json({ success: false, error: "Credenciales incorrectas" });
    });
});

// --- REPARTIDORES ---
app.get('/repartidores', (req, res) => {
    const sql = "SELECT id_repartidor, nombre, apellidos, tel, sueldo FROM repartidores";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/repartidores', (req, res) => {
    const { id_repartidor, id_pizzeria, nombre, apellidos, tel, sueldo } = req.body;
    const sql = 'INSERT INTO repartidores (id_repartidor, id_pizzeria, nombre, apellidos, tel, sueldo) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [id_repartidor, id_pizzeria, nombre, apellidos, tel, sueldo], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Repartidor guardado exitosamente' });
    });
});

// --- CLIENTES ---
app.get('/clientes', (req, res) => {
    const sql = "SELECT id_cliente, nombre_completo, direccion, telefono FROM clientes";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/clientes', (req, res) => {
    const { id_cliente, id_pizzeria, nombre_completo, direccion, telefono } = req.body;
    const sql = 'INSERT INTO clientes (id_cliente, id_pizzeria, nombre_completo, direccion, telefono) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [id_cliente, id_pizzeria, nombre_completo, direccion, telefono], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente guardado exitosamente' });
    });
});

// --- PEDIDOS (VENTAS Y CONSULTAS) ---
app.get('/pedidos', (req, res) => {
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

app.post('/pedidos', (req, res) => {
    const { id_pedido, id_pizzeria, id_cliente, id_repartidor, total, detalles } = req.body;
    const fecha = new Date().toISOString().split('T')[0];
    const sql = 'INSERT INTO pedidos (id_pedido, id_pizzeria, id_cliente, id_repartidor, detalles, total, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)';
    
    db.query(sql, [id_pedido, id_pizzeria, id_cliente, id_repartidor, detalles, total, fecha], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Venta registrada con éxito' });
    });
});

app.get('/pedidos/:id', (req, res) => {
    const sql = 'SELECT * FROM pedidos WHERE id_pedido = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length > 0) res.json(result[0]); 
        else res.status(404).json({ error: "No encontrado" });
    });
});

app.delete('/pedidos/:id', (req, res) => {
    const sql = 'DELETE FROM pedidos WHERE id_pedido = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Pedido eliminado correctamente' });
    });
});

// --- BONOS ---
app.get('/bonos/consulta/:id', (req, res) => {
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

// --- PUERTO DINÁMICO ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en puerto: ${PORT}`);
});