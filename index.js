const express = require("express");
const fs = require("fs");
const app = express();


const cors = require("cors");

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

    // Lee las estadísticas actuales
    fs.readFile("estadisticas.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        // Convertir el archivo JSON a un array o iniciar como vacío
        const estadisticas = data ? JSON.parse(data) : [];

        // Verifica si ya existe un registro para la IP del usuario
        const estadisticaExistente = estadisticas.find(est => est.ip === nuevaEstadistica.ip);

        if (estadisticaExistente) {
            // Actualiza la duración de la sesión o campos adicionales si ya existe
            estadisticaExistente.duracion_sesion_segundos += nuevaEstadistica.duracion_sesion_segundos || 0;

            // Si hay nuevos datos adicionales (como compras), los agregamos
            if (nuevaEstadistica.compras) {
                estadisticaExistente.compras = estadisticaExistente.compras || [];
                estadisticaExistente.compras.push(...nuevaEstadistica.compras);
                estadisticaExistente.precio_compra_total = (estadisticaExistente.precio_compra_total || 0) + nuevaEstadistica.precio_compra_total;
            }
        } else {
            // Crea un nuevo registro si no existe
            estadisticas.push(nuevaEstadistica);
        }

        // Escribe las estadísticas actualizadas en el archivo
        fs.writeFile("estadisticas.json", JSON.stringify(estadisticas, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error guardando el archivo");
            }
            res.send("Estadística guardada o actualizada correctamente");
        });
    });
});

// Ruta para obtener estadísticas
app.get("/obtener-estadisticas", (req, res) => {
    fs.readFile("estadisticas.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        // Convertir el archivo JSON a un array y devolverlo
        const estadisticas = data ? JSON.parse(data) : [];
        res.json(estadisticas);
    });
});

// Ruta para limpiar estadísticas (opcional, para pruebas)
app.delete("/limpiar-estadisticas", (req, res) => {
    fs.writeFile("estadisticas.json", JSON.stringify([], null, 2), (err) => {
        if (err) {
            return res.status(500).send("Error al limpiar las estadísticas");
        }
        res.send("Estadísticas limpiadas correctamente");
    });
});

// Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
