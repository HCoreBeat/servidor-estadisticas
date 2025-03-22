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

// Función para sanear y corregir JSON malformado
function sanitizeJSON(data) {
    try {
        // Intenta parsear el JSON directamente
        return JSON.parse(data);
    } catch (error) {
        console.warn("El archivo JSON está malformado. Intentando corregirlo...");

        // Elimina caracteres no válidos (como saltos de línea o comillas sin escapar)
        const sanitizedData = data
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Elimina caracteres de control
            .replace(/\\'/g, "'") // Corrige comillas simples escapadas
            .replace(/\\"/g, '"') // Corrige comillas dobles escapadas
            .replace(/\\n/g, "") // Elimina saltos de línea escapados
            .replace(/\\t/g, "") // Elimina tabulaciones escapadas
            .replace(/\\r/g, ""); // Elimina retornos de carro escapados

        try {
            // Intenta parsear el JSON saneado
            return JSON.parse(sanitizedData);
        } catch (finalError) {
            console.error("No se pudo corregir el JSON malformado:", finalError);
            return []; // Devuelve un array vacío como último recurso
        }
    }
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

        // Sanear y corregir el JSON si está malformado
        const estadisticas = data ? sanitizeJSON(data) : [];
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
            tiempo_promedio_pagina: nuevaEstadistica.tiempo_promedio_pagina || 0,
            fuente_trafico: nuevaEstadistica.fuente_trafico || "Desconocido",
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

        // Sanear y corregir el JSON si está malformado
        const estadisticas = data ? sanitizeJSON(data) : [];
        res.json(estadisticas);
    });
});

// Puerto de escucha
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));