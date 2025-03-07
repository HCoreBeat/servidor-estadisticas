const express = require("express");
const fs = require("fs");
const app = express();

// Middleware para procesar JSON
app.use(express.json());

// Ruta para guardar estadísticas
app.post("/guardar-estadistica", (req, res) => {
    const nuevaEstadistica = req.body;

    // Lee las estadísticas actuales
    fs.readFile("estadisticas.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") {
            return res.status(500).send("Error leyendo el archivo");
        }

        const estadisticas = data ? JSON.parse(data) : [];
        estadisticas.push(nuevaEstadistica);

        // Escribe las estadísticas actualizadas
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

        const estadisticas = data ? JSON.parse(data) : [];
        res.json(estadisticas);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
