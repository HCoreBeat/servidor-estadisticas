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

// Ruta para guardar estadísticas
app.post("/guardar-estadistica", (req, res) => {
    const nuevaEstadistica = req.body;

    // Lee las estadísticas actuales desde el archivo JSON
    fs.readFile("estadisticas.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        // Si el archivo está vacío o no existe, inicializa como un arreglo vacío
        const estadisticas = data ? JSON.parse(data) : [];

        // Agregar la nueva estadística al arreglo
        estadisticas.push(nuevaEstadistica);

        // Guardar las estadísticas actualizadas en el archivo
        fs.writeFile("estadisticas.json", JSON.stringify(estadisticas, null, 2), (err) => {
            if (err) {
                return res.status(500).send("Error guardando el archivo");
            }
            res.send("Estadística guardada correctamente");
        });
    });
});

// Ruta para obtener estadísticas
app.get("/obtener-estadisticas", (req, res) => {
    fs.readFile("estadisticas.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        // Si el archivo está vacío, devolver un arreglo vacío
        const estadisticas = data ? JSON.parse(data) : [];
        res.json(estadisticas);
    });
});

// Ruta para limpiar estadísticas (opcional)
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
