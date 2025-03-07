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

    // Validar los datos requeridos para guardar
    if (!nuevaEstadistica.ip || !nuevaEstadistica.pais || !nuevaEstadistica.fecha_hora_entrada || !nuevaEstadistica.origen) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Leer las estadísticas actuales desde el archivo
    fs.readFile("estadistica.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];

        // Agregar la nueva estadística al arreglo existente
        estadisticas.push({
            ip: nuevaEstadistica.ip,
            pais: nuevaEstadistica.pais,
            fecha_hora_entrada: nuevaEstadistica.fecha_hora_entrada,
            origen: nuevaEstadistica.origen,
            afiliado: nuevaEstadistica.afiliado || "Ninguno", // Aseguramos que el afiliado esté incluido
            duracion_sesion_segundos: nuevaEstadistica.duracion_sesion_segundos || 0
        });

        // Escribir las estadísticas actualizadas en el archivo
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
