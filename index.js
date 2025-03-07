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

// Validar los datos antes de guardar
function validarDatosEstadistica(estadistica) {
    const camposRequeridos = ["ip", "pais", "fecha_hora_entrada", "origen"];
    return camposRequeridos.every(campo => estadistica.hasOwnProperty(campo));
}

app.post("/guardar-estadistica", (req, res) => {
    const nuevaEstadistica = req.body;

    // Validar los datos requeridos para guardar
    if (!nuevaEstadistica.ip || typeof nuevaEstadistica.duracion_sesion_segundos === "undefined") {
        return res.status(400).json({ error: "Faltan campos obligatorios: 'ip' o 'duracion_sesion_segundos'" });
    }

    // Leer las estadísticas actuales
    fs.readFile("estadistica.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];

        // Buscar si ya existe un registro para la misma IP
        const estadisticaExistente = estadisticas.find(est => est.ip === nuevaEstadistica.ip);

        if (estadisticaExistente) {
            // Si ya existe, actualiza la duración de la sesión
            estadisticaExistente.duracion_sesion_segundos += nuevaEstadistica.duracion_sesion_segundos;
        } else {
            // Si no existe, crea un nuevo registro
            estadisticas.push({
                ip: nuevaEstadistica.ip,
                pais: nuevaEstadistica.pais || "Desconocido",
                fecha_hora_entrada: nuevaEstadistica.fecha_hora_entrada || new Date().toISOString(),
                origen: nuevaEstadistica.origen || "Desconocido",
                duracion_sesion_segundos: nuevaEstadistica.duracion_sesion_segundos
            });
        }

        // Escribe las estadísticas actualizadas
        fs.writeFile("estadistica.json", JSON.stringify(estadisticas, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error guardando el archivo");
            }
            res.send("Duración de sesión actualizada correctamente");
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

// Ruta para limpiar todas las estadísticas (opcional)
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
