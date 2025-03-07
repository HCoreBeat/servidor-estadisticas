const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

// Configuración de CORS para permitir dominios específicos
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

// Ruta para guardar o actualizar estadísticas
app.post("/guardar-estadistica", (req, res) => {
    const nuevaEstadistica = req.body;

    // Validar que los campos obligatorios estén presentes
    if (!nuevaEstadistica.ip || !nuevaEstadistica.pais || !nuevaEstadistica.fecha_hora_entrada || !nuevaEstadistica.origen) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Leer las estadísticas actuales desde el archivo
    fs.readFile("estadistica.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];

        // Verificar si el usuario ya existe (para determinar si es recurrente)
        const usuarioExistente = estadisticas.find(est => est.ip === nuevaEstadistica.ip);

        // Agregar la nueva estadística con todos los datos
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
            navegador: nuevaEstadistica.navegador || "Desconocido", // Nuevo campo
            sistema_operativo: nuevaEstadistica.sistema_operativo || "Desconocido", // Nuevo campo
            tipo_usuario: usuarioExistente ? "Recurrente" : "Único", // Nuevo campo
            tiempo_promedio_pagina: nuevaEstadistica.tiempo_promedio_pagina || 0 // Nuevo campo
        });

        // Guardar las estadísticas actualizadas
        fs.writeFile("estadistica.json", JSON.stringify(estadisticas, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error guardando el archivo");
            }
            res.send("Estadística guardada correctamente");
        });
    });
});

// Ruta para obtener todas las estadísticas
app.get("/obtener-estadisticas", (req, res) => {
    fs.readFile("estadistica.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];
        res.json(estadisticas);
    });
});

// Ruta para limpiar estadísticas (opcional)
app.delete("/limpiar-estadisticas", (req, res) => {
    fs.writeFile("estadistica.json", JSON.stringify([], null, 2), (err) => {
        if (err) {
            return res.status(500).send("Error al limpiar las estadísticas");
        }
        res.send("Estadísticas limpiadas correctamente");
    });
});

// Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));