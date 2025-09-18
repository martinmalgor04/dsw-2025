// BUSINESS LAYER - Lógica de negocio con base de datos PostgreSQL
// Versión que usa el repositorio con conexión a PostgreSQL
import AlumnosRepository from '../data/alumnosrepository.js';
import Alumno from '../core/class1.js';

class BusinessAlumno {
    constructor() {
        this.alumnosRepository = new AlumnosRepository();
    }

    // Probar conexión a la base de datos
    async testConnection() {
        return await this.alumnosRepository.testConnection();
    }

    // Obtener todos los alumnos
    async getAllAlumnos() {
        try {
            return await this.alumnosRepository.getAlumnos();
        } catch (error) {
            console.error('Error en business layer - getAllAlumnos:', error);
            throw error;
        }
    }

    // Obtener un alumno por ID
    async getAlumno(id) {
        try {
            if (!id) {
                throw new Error('ID del alumno es requerido');
            }
            return await this.alumnosRepository.getAlumno(id);
        } catch (error) {
            console.error('Error en business layer - getAlumno:', error);
            throw error;
        }
    }

    // Crear nuevo alumno con validaciones de negocio
    async createAlumno(nombre, apellido, edad, email, legajo) {
        console.log('🏢 BUSINESS: Iniciando createAlumno()');
        console.log('📋 BUSINESS: Datos recibidos:', { nombre, apellido, edad, email, legajo });
        
        try {
            // Validaciones de negocio
            console.log('🔍 BUSINESS: Validando campos obligatorios');
            if (!nombre || !apellido || !email || !legajo) {
                throw new Error('Todos los campos son obligatorios');
            }

            console.log('🔍 BUSINESS: Validando edad');
            if (edad < 18 || edad > 65) {
                throw new Error('La edad debe estar entre 18 y 65 años');
            }

            console.log('🔍 BUSINESS: Validando email');
            if (!this.validarEmail(email)) {
                throw new Error('El formato del email no es válido');
            }

            // Verificar que el legajo no exista
            console.log('🔍 BUSINESS: Verificando legajo único');
            const alumnoExistenteLegajo = await this.alumnosRepository.findByLegajo(legajo);
            if (alumnoExistenteLegajo) {
                console.log('❌ BUSINESS: Legajo ya existe:', alumnoExistenteLegajo);
                throw new Error('Ya existe un alumno con ese legajo');
            }

            // Verificar que el email no exista
            console.log('🔍 BUSINESS: Verificando email único');
            const alumnoExistenteEmail = await this.alumnosRepository.findByEmail(email);
            if (alumnoExistenteEmail) {
                console.log('❌ BUSINESS: Email ya existe:', alumnoExistenteEmail);
                throw new Error('Ya existe un alumno con ese email');
            }

            // Crear instancia de Alumno
            console.log('🏗️ BUSINESS: Creando instancia de Alumno');
            const nuevoAlumno = new Alumno(nombre, apellido, edad, email, legajo);
            console.log('📝 BUSINESS: Alumno creado:', nuevoAlumno);
            
            // Validar usando el método de la clase
            console.log('🔍 BUSINESS: Validando con método esValido()');
            if (!nuevoAlumno.esValido()) {
                throw new Error('Los datos del alumno no son válidos');
            }

            // Guardar en base de datos
            console.log('💾 BUSINESS: Llamando a alumnosRepository.addAlumno()');
            const resultado = await this.alumnosRepository.addAlumno(nuevoAlumno);
            console.log('✅ BUSINESS: Alumno guardado en BD:', resultado);
            
            return resultado;
        } catch (error) {
            console.error('❌ BUSINESS: Error en createAlumno:', error);
            throw error;
        }
    }

    // Actualizar alumno
    async updateAlumno(alumno) {
        try {
            if (!alumno.id) {
                throw new Error('ID del alumno es requerido para actualizar');
            }

            // Verificar que el alumno existe
            const alumnoExistente = await this.alumnosRepository.getAlumno(alumno.id);
            if (!alumnoExistente) {
                throw new Error('Alumno no encontrado');
            }

            // Validaciones de negocio para la actualización
            if (alumno.edad && (alumno.edad < 18 || alumno.edad > 65)) {
                throw new Error('La edad debe estar entre 18 y 65 años');
            }

            if (alumno.email && !this.validarEmail(alumno.email)) {
                throw new Error('El formato del email no es válido');
            }

            // Si se está cambiando el legajo, verificar que no exista
            if (alumno.legajo && alumno.legajo !== alumnoExistente.legajo) {
                const alumnoConLegajo = await this.alumnosRepository.findByLegajo(alumno.legajo);
                if (alumnoConLegajo && alumnoConLegajo.id !== alumno.id) {
                    throw new Error('Ya existe un alumno con ese legajo');
                }
            }

            // Si se está cambiando el email, verificar que no exista
            if (alumno.email && alumno.email !== alumnoExistente.email) {
                const alumnoConEmail = await this.alumnosRepository.findByEmail(alumno.email);
                if (alumnoConEmail && alumnoConEmail.id !== alumno.id) {
                    throw new Error('Ya existe un alumno con ese email');
                }
            }

            return await this.alumnosRepository.updateAlumno(alumno);
        } catch (error) {
            console.error('Error en business layer - updateAlumno:', error);
            throw error;
        }
    }

    // Eliminar alumno
    async deleteAlumno(id) {
        try {
            if (!id) {
                throw new Error('ID del alumno es requerido');
            }

            // Verificar que el alumno existe antes de eliminar
            const alumnoExistente = await this.alumnosRepository.getAlumno(id);
            if (!alumnoExistente) {
                throw new Error('Alumno no encontrado');
            }

            const eliminado = await this.alumnosRepository.deleteAlumno(id);
            if (!eliminado) {
                throw new Error('No se pudo eliminar el alumno');
            }

            return eliminado;
        } catch (error) {
            console.error('Error en business layer - deleteAlumno:', error);
            throw error;
        }
    }

    // Validar formato de email
    validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Buscar alumno por legajo
    async findByLegajo(legajo) {
        try {
            if (!legajo) {
                throw new Error('Legajo es requerido');
            }
            return await this.alumnosRepository.findByLegajo(legajo);
        } catch (error) {
            console.error('Error en business layer - findByLegajo:', error);
            throw error;
        }
    }

    // Buscar alumno por email
    async findByEmail(email) {
        try {
            if (!email) {
                throw new Error('Email es requerido');
            }
            return await this.alumnosRepository.findByEmail(email);
        } catch (error) {
            console.error('Error en business layer - findByEmail:', error);
            throw error;
        }
    }

    // Obtener estadísticas
    async getStats() {
        try {
            const total = await this.alumnosRepository.countAlumnos();
            return {
                totalAlumnos: total
            };
        } catch (error) {
            console.error('Error en business layer - getStats:', error);
            throw error;
        }
    }
}

export default BusinessAlumno;
