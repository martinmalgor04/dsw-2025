// SERVIDOR NODE.JS - Servidor HTTP simple
// Conecta directamente con Business Layer (sin controladores)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import BusinessAlumno from './businesslayer/businessalumno.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('app')); // Servir archivos estáticos de la carpeta app

// Instancia de Business Layer
const businessAlumno = new BusinessAlumno();

// RUTAS API - Conectan directamente con Business Layer

// GET /api/alumnos - Obtener todos los alumnos
app.get('/api/alumnos', async (req, res) => {
    console.log('🌐 SERVER: GET /api/alumnos');
    try {
        const alumnos = await businessAlumno.getAllAlumnos();
        console.log('✅ SERVER: Enviando', alumnos.length, 'alumnos');
        res.json({
            success: true,
            data: alumnos,
            count: alumnos.length
        });
    } catch (error) {
        console.error('❌ SERVER: Error en GET /api/alumnos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/alumnos - Crear nuevo alumno
app.post('/api/alumnos', async (req, res) => {
    console.log('🌐 SERVER: POST /api/alumnos');
    console.log('📋 SERVER: Body recibido:', req.body);
    
    try {
        const { nombre, apellido, edad, email, legajo } = req.body;
        const nuevoAlumno = await businessAlumno.createAlumno(nombre, apellido, edad, email, legajo);
        
        console.log('✅ SERVER: Alumno creado, enviando respuesta');
        res.status(201).json({
            success: true,
            data: nuevoAlumno,
            message: 'Alumno creado exitosamente'
        });
    } catch (error) {
        console.error('❌ SERVER: Error en POST /api/alumnos:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/alumnos/:id - Obtener alumno por ID
app.get('/api/alumnos/:id', async (req, res) => {
    console.log('🌐 SERVER: GET /api/alumnos/:id');
    try {
        const id = parseInt(req.params.id);
        const alumno = await businessAlumno.getAlumno(id);
        
        if (!alumno) {
            return res.status(404).json({
                success: false,
                error: 'Alumno no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: alumno
        });
    } catch (error) {
        console.error('❌ SERVER: Error en GET /api/alumnos/:id:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/alumnos/:id - Eliminar alumno
app.delete('/api/alumnos/:id', async (req, res) => {
    console.log('🌐 SERVER: DELETE /api/alumnos/:id');
    try {
        const id = parseInt(req.params.id);
        await businessAlumno.deleteAlumno(id);
        
        res.json({
            success: true,
            message: 'Alumno eliminado exitosamente'
        });
    } catch (error) {
        console.error('❌ SERVER: Error en DELETE /api/alumnos/:id:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats - Obtener estadísticas
app.get('/api/stats', async (req, res) => {
    console.log('🌐 SERVER: GET /api/stats');
    try {
        const stats = await businessAlumno.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ SERVER: Error en GET /api/stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(PORT, async () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log('📋 Rutas disponibles:');
    console.log('   GET  /                    - Aplicación web');
    console.log('   GET  /api/alumnos        - Listar alumnos');
    console.log('   POST /api/alumnos        - Crear alumno');
    console.log('   GET  /api/alumnos/:id    - Obtener alumno');
    console.log('   DELETE /api/alumnos/:id  - Eliminar alumno');
    console.log('   GET  /api/stats          - Estadísticas');
    
    // Probar conexión a base de datos
    try {
        await businessAlumno.testConnection();
        console.log('✅ Conexión a PostgreSQL verificada');
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        console.log('⚠️  El servidor está ejecutándose pero la base de datos no está disponible');
    }
});
