const express = require("express");
const fs = require("fs");
const app = express();
const cors = require("cors");

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

// Función para leer el archivo de estadísticas
const leerEstadisticas = () => {
    try {
        const data = fs.readFileSync("estadistica.json", "utf8");
        return data ? JSON.parse(data) : [];
    } catch (err) {
        if (err.code === "ENOENT") {
            // Si el archivo no existe, retorna un array vacío
            return [];
        }
        throw err; // Lanza otros errores
    }
};

// Función para escribir el archivo de estadísticas
const escribirEstadisticas = (estadisticas) => {
    fs.writeFileSync("estadistica.json", JSON.stringify(estadisticas, null, 2), "utf8");
};

// Ruta para guardar o actualizar estadísticas
app.post("/guardar-estadistica", (req, res) => {
    const nuevaEstadistica = req.body;

    // Validar campos obligatorios
    if (!nuevaEstadistica.ip || !nuevaEstadistica.duracion_sesion_segundos) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        // Lee las estadísticas actuales
        const estadisticas = leerEstadisticas();

        // Busca si ya existe una estadística para la IP del usuario
        const estadisticaExistente = estadisticas.find(est => est.ip === nuevaEstadistica.ip);

        if (estadisticaExistente) {
            // Actualiza la duración de la sesión
            estadisticaExistente.duracion_sesion_segundos += nuevaEstadistica.duracion_sesion_segundos || 0;

            // Si hay nuevas compras, las agregamos
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
        escribirEstadisticas(estadisticas);

        res.json({ message: "Estadística guardada o actualizada correctamente" });
    } catch (err) {
        console.error("Error en /guardar-estadistica:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para obtener estadísticas
app.get("/obtener-estadisticas", (req, res) => {
    try {
        const estadisticas = leerEstadisticas();
        res.json(estadisticas);
    } catch (err) {
        console.error("Error en /obtener-estadisticas:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Ruta para limpiar estadísticas (opcional, para pruebas)
app.delete("/limpiar-estadisticas", (req, res) => {
    try {
        escribirEstadisticas([]);
        res.json({ message: "Estadísticas limpiadas correctamente" });
    } catch (err) {
        console.error("Error en /limpiar-estadisticas:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));