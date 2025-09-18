// CORE LAYER - Clases del dominio
class Alumno {
    constructor(nombre, apellido, edad, email, legajo) {
        this.id = Date.now(); // ID simple para el ejemplo
        this.nombre = nombre;
        this.apellido = apellido;
        this.edad = edad;
        this.email = email;
        this.legajo = legajo;
    }

    // Método para obtener nombre completo
    getNombreCompleto() {
        return `${this.nombre} ${this.apellido}`;
    }

    // Validar datos básicos
    esValido() {
        return this.nombre && this.apellido && this.edad && this.email && this.legajo;
    }
}

export default Alumno;