// DATA LAYER - Repositorio con conexión a PostgreSQL
// Reemplaza el repositorio en memoria por uno que usa la base de datos
import dbConnection from './database.js';
import Alumno from '../core/class1.js';

class AlumnosRepository {
    constructor() {
        this.db = dbConnection;
    }

    // Obtener todos los alumnos
    async getAlumnos() {
        try {
            const result = await this.db.query('SELECT * FROM alumnos ORDER BY id');
            return result.rows;
        } catch (error) {
            console.error('Error obteniendo alumnos:', error);
            throw new Error('Error al obtener alumnos de la base de datos');
        }
    }

    // Obtener un alumno por ID
    async getAlumno(id) {
        try {
            const result = await this.db.query('SELECT * FROM alumnos WHERE id = $1', [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo alumno por ID:', error);
            throw new Error('Error al obtener alumno de la base de datos');
        }
    }

    // Agregar nuevo alumno
    async addAlumno(alumno) {
        console.log('💾 DATA: Iniciando addAlumno()');
        console.log('📋 DATA: Datos del alumno a insertar:', alumno);
        
        try {
            const query = `
                INSERT INTO alumnos (id, nombre, apellido, edad, email, legajo) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *
            `;
            const values = [alumno.id, alumno.nombre, alumno.apellido, alumno.edad, alumno.email, alumno.legajo];
            
            console.log('🔍 DATA: Query SQL:', query);
            console.log('🔍 DATA: Valores:', values);
            
            const result = await this.db.query(query, values);
            console.log('✅ DATA: Resultado de la inserción:', result.rows[0]);
            console.log('📊 DATA: Filas afectadas:', result.rowCount);
            
            return result.rows[0];
        } catch (error) {
            console.error('❌ DATA: Error insertando alumno:', error);
            console.error('❌ DATA: Código de error:', error.code);
            console.error('❌ DATA: Constraint violado:', error.constraint);
            
            // Manejar errores específicos de PostgreSQL
            if (error.code === '23505') { // Violación de constraint único
                if (error.constraint === 'uk_alumnos_email') {
                    throw new Error('Ya existe un alumno con ese email');
                }
                if (error.constraint === 'uk_alumnos_legajo') {
                    throw new Error('Ya existe un alumno con ese legajo');
                }
            }
            
            throw new Error('Error al agregar alumno a la base de datos: ' + error.message);
        }
    }

    // Actualizar alumno
    async updateAlumno(alumno) {
        try {
            const query = `
                UPDATE alumnos 
                SET nombre = $2, apellido = $3, edad = $4, email = $5, legajo = $6
                WHERE id = $1 
                RETURNING *
            `;
            const values = [alumno.id, alumno.nombre, alumno.apellido, alumno.edad, alumno.email, alumno.legajo];
            
            const result = await this.db.query(query, values);
            
            if (result.rows.length === 0) {
                throw new Error('Alumno no encontrado');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Error actualizando alumno:', error);
            throw new Error('Error al actualizar alumno en la base de datos');
        }
    }

    // Eliminar alumno
    async deleteAlumno(id) {
        try {
            const result = await this.db.query('DELETE FROM alumnos WHERE id = $1 RETURNING *', [id]);
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error eliminando alumno:', error);
            throw new Error('Error al eliminar alumno de la base de datos');
        }
    }

    // Buscar por legajo
    async findByLegajo(legajo) {
        try {
            const result = await this.db.query('SELECT * FROM alumnos WHERE legajo = $1', [legajo]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando por legajo:', error);
            throw new Error('Error al buscar alumno por legajo');
        }
    }

    // Buscar por email
    async findByEmail(email) {
        try {
            const result = await this.db.query('SELECT * FROM alumnos WHERE email = $1', [email]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error buscando por email:', error);
            throw new Error('Error al buscar alumno por email');
        }
    }

    // Contar total de alumnos
    async countAlumnos() {
        try {
            const result = await this.db.query('SELECT COUNT(*) as total FROM alumnos');
            return parseInt(result.rows[0].total);
        } catch (error) {
            console.error('Error contando alumnos:', error);
            throw new Error('Error al contar alumnos');
        }
    }

    // Probar conexión a la base de datos
    async testConnection() {
        return await this.db.testConnection();
    }
}

export default AlumnosRepository;
