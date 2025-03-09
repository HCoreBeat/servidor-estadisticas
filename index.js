const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

// Configuración de CORS
const allowedOrigins = ["https://www.asereshops.com", "https://hcorebeat.github.io"];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("No permitido por CORS"));
        }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

// Middleware para procesar JSON
app.use(express.json());

// Ruta persistente para guardar estadísticas
const directoryPath = "/app/data"; // Directorio del volumen persistente
const filePath = `${directoryPath}/estadistica.json`;

// Crear el directorio si no existe (útil localmente)
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

// Ruta para guardar estadísticas
app.post("/guardar-estadistica", (req, res) => {
    const nuevaEstadistica = req.body;

    // Validar campos obligatorios
    if (!nuevaEstadistica.ip || !nuevaEstadistica.pais || !nuevaEstadistica.fecha_hora_entrada || !nuevaEstadistica.origen) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Leer y actualizar el archivo estadistica.json
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];
        const usuarioExistente = estadisticas.find(est => est.ip === nuevaEstadistica.ip);

        estadisticas.push({
            ip: nuevaEstadistica.ip,
            pais: nuevaEstadistica.pais,
            fecha_hora_entrada: nuevaEstadistica.fecha_hora_entrada,
            origen: nuevaEstadistica.origen,
            afiliado: nuevaEstadistica.afiliado || "Ninguno",
            duracion_sesion_segundos: nuevaEstadistica.duracion_sesion_segundos || 0,
            tiempo_carga_pagina_ms: nuevaEstadistica.tiempo_carga_pagina_ms || 0,
            nombre_comprador: nuevaEstadistica.nombre_comprador || "N/A",
            telefono_comprador: nuevaEstadistica.telefono_comprador || "N/A",
            correo_comprador: nuevaEstadistica.correo_comprador || "N/A",
            compras: nuevaEstadistica.compras || [],
            precio_compra_total: nuevaEstadistica.precio_compra_total || 0,
            navegador: nuevaEstadistica.navegador || "Desconocido",
            sistema_operativo: nuevaEstadistica.sistema_operativo || "Desconocido",
            tipo_usuario: usuarioExistente ? "Recurrente" : "Único",
            tiempo_promedio_pagina: nuevaEstadistica.tiempo_promedio_pagina || 0
        });

        fs.writeFile(filePath, JSON.stringify(estadisticas, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error guardando el archivo");
            }
            res.send("Estadística guardada correctamente");
        });
    });
});

// Ruta para obtener estadísticas
app.get("/obtener-estadisticas", (req, res) => {
    fs.readFile(filePath, "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];
        res.json(estadisticas);
    });
});

// Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
