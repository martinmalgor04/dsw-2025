// CAPA DE PRESENTACIÓN - Front Layer
// Conecta directamente con las APIs del servidor

class AlumnosApp {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    // Inicializar la aplicación
    init() {
        this.createHTML();
        this.setupEventListeners();
        this.loadAlumnos();
    }

    // Crear la estructura HTML de la aplicación
    createHTML() {
        document.body.innerHTML = `
            <div class="container">
                <header class="header">
                    <h1>🎓 Alumnos de Desarrollo de Software</h1>
                    <p class="subtitle">Arquitectura por capas - PostgreSQL Real</p>
                </header>

                <main class="main-content">
                    <section class="controls">
                        <button id="refreshBtn" class="btn btn-primary">
                            🔄 Actualizar
                        </button>
                        <button id="addBtn" class="btn btn-success">
                            ➕ Agregar Alumno
                        </button>
                    </section>

                    <section class="students-section">
                        <h2>Lista de Alumnos</h2>
                        <div id="loading" class="loading hidden">Cargando desde PostgreSQL...</div>
                        <div id="error" class="error hidden"></div>
                        <div id="studentsContainer" class="students-grid">
                            <!-- Los alumnos se cargarán aquí -->
                        </div>
                    </section>

                    <section class="stats">
                        <div class="stat-card">
                            <h3>Total de Alumnos</h3>
                            <span id="totalCount">0</span>
                        </div>
                    </section>
                </main>

                <!-- Modal para agregar alumno -->
                <div id="addModal" class="modal hidden">
                    <div class="modal-content">
                        <h3>Agregar Nuevo Alumno</h3>
                        <form id="addStudentForm">
                            <input type="text" id="studentNombre" placeholder="Nombre" required>
                            <input type="text" id="studentApellido" placeholder="Apellido" required>
                            <input type="number" id="studentEdad" placeholder="Edad" min="18" max="65" required>
                            <input type="email" id="studentEmail" placeholder="Email" required>
                            <input type="text" id="studentLegajo" placeholder="Legajo" required>
                            <div id="formError" class="form-error hidden"></div>
                            <div class="modal-buttons">
                                <button type="submit" class="btn btn-success">
                                    <span id="submitText">Guardar</span>
                                    <span id="submitLoading" class="hidden">Guardando...</span>
                                </button>
                                <button type="button" id="cancelBtn" class="btn btn-secondary">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    // Agregar estilos CSS
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }

            .container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            }

            .header h1 {
                color: #4a5568;
                font-size: 2.2rem;
                margin-bottom: 8px;
            }

            .subtitle {
                color: #718096;
                font-size: 1rem;
            }

            .main-content {
                background: white;
                border-radius: 15px;
                padding: 30px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            }

            .controls {
                display: flex;
                gap: 15px;
                margin-bottom: 25px;
                justify-content: center;
            }

            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 600;
                position: relative;
            }

            .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .btn-primary {
                background: #4299e1;
                color: white;
            }

            .btn-primary:hover:not(:disabled) {
                background: #3182ce;
                transform: translateY(-2px);
            }

            .btn-success {
                background: #48bb78;
                color: white;
            }

            .btn-success:hover:not(:disabled) {
                background: #38a169;
                transform: translateY(-2px);
            }

            .btn-secondary {
                background: #a0aec0;
                color: white;
            }

            .btn-secondary:hover {
                background: #718096;
            }

            .btn-danger {
                background: #e53e3e;
                color: white;
                padding: 5px 10px;
                font-size: 0.8rem;
            }

            .btn-danger:hover {
                background: #c53030;
            }

            .students-section h2 {
                color: #4a5568;
                margin-bottom: 20px;
                text-align: center;
            }

            .students-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                margin-bottom: 25px;
            }

            .student-card {
                background: #f7fafc;
                border: 2px solid #e2e8f0;
                border-radius: 10px;
                padding: 20px;
                transition: all 0.3s ease;
                position: relative;
            }

            .student-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                border-color: #4299e1;
            }

            .student-name {
                font-size: 1.1rem;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 8px;
            }

            .student-info {
                color: #718096;
                font-size: 0.85rem;
                margin-bottom: 3px;
            }

            .student-actions {
                position: absolute;
                top: 10px;
                right: 10px;
            }

            .stats {
                display: flex;
                justify-content: center;
                margin-top: 25px;
            }

            .stat-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                min-width: 150px;
            }

            .stat-card h3 {
                margin-bottom: 8px;
                font-size: 1rem;
            }

            .stat-card span {
                font-size: 1.8rem;
                font-weight: bold;
            }

            .loading {
                text-align: center;
                padding: 40px;
                color: #718096;
                font-size: 1rem;
            }

            .error {
                text-align: center;
                padding: 20px;
                color: #e53e3e;
                background: #fed7d7;
                border-radius: 8px;
                margin-bottom: 20px;
            }

            .form-error {
                color: #e53e3e;
                font-size: 0.9rem;
                margin-top: 10px;
                padding: 10px;
                background: #fed7d7;
                border-radius: 4px;
            }

            .hidden {
                display: none;
            }

            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            .modal-content {
                background: white;
                padding: 25px;
                border-radius: 12px;
                width: 90%;
                max-width: 400px;
            }

            .modal-content h3 {
                margin-bottom: 20px;
                color: #4a5568;
            }

            .modal-content input {
                width: 100%;
                padding: 10px;
                margin-bottom: 12px;
                border: 2px solid #e2e8f0;
                border-radius: 6px;
                font-size: 0.9rem;
            }

            .modal-content input:focus {
                outline: none;
                border-color: #4299e1;
            }

            .modal-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 15px;
            }

            @media (max-width: 768px) {
                .container {
                    padding: 15px;
                }

                .header h1 {
                    font-size: 1.8rem;
                }

                .controls {
                    flex-direction: column;
                    align-items: center;
                }

                .students-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Configurar event listeners
    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadAlumnos();
        });

        document.getElementById('addBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideAddModal();
        });

        document.getElementById('addStudentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });

        // Event delegation for delete buttons
        document.getElementById('studentsContainer').addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.btn-danger');
            if (deleteButton) {
                const studentCard = e.target.closest('.student-card');
                if (studentCard) {
                    const id = studentCard.dataset.id;
                    this.deleteStudent(id);
                }
            }
        });
    }

    // Realizar petición HTTP a la API
    async apiRequest(endpoint, options = {}) {
        console.log('🌐 FRONTEND: Haciendo petición a', endpoint);
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }

            console.log('✅ FRONTEND: Respuesta exitosa de', endpoint);
            return data;
        } catch (error) {
            console.error('❌ FRONTEND: Error en petición a', endpoint, ':', error);
            throw error;
        }
    }

    // Cargar alumnos desde PostgreSQL
    async loadAlumnos() {
        this.showLoading();
        this.hideError();
        
        try {
            const response = await this.apiRequest('/alumnos');
            this.renderAlumnos(response.data);
            this.updateStats(response.count);
        } catch (error) {
            console.error('Error al cargar alumnos:', error);
            this.showError('Error al cargar alumnos desde PostgreSQL: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    // Renderizar lista de alumnos
    renderAlumnos(alumnos) {
        const container = document.getElementById('studentsContainer');
        
        if (alumnos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <h3>No hay alumnos registrados</h3>
                    <p>Agrega el primer alumno usando el botón "Agregar Alumno"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alumnos.map(alumno => `
            <div class="student-card" data-id="${alumno.id}">
                <div class="student-actions">
                    <button class="btn btn-danger">
                        🗑️
                    </button>
                </div>
                <div class="student-name">${alumno.nombre} ${alumno.apellido}</div>
                <div class="student-info">📧 ${alumno.email}</div>
                <div class="student-info">🎓 Legajo: ${alumno.legajo}</div>
                <div class="student-info">👤 Edad: ${alumno.edad} años</div>
                <div class="student-info">🆔 ID: ${alumno.id}</div>
            </div>
        `).join('');
    }

    // Actualizar estadísticas
    updateStats(count) {
        document.getElementById('totalCount').textContent = count;
    }

    // Mostrar modal para agregar alumno
    showAddModal() {
        document.getElementById('addModal').style.display = 'flex';
        document.getElementById('studentNombre').focus();
        this.hideFormError();
    }

    // Ocultar modal
    hideAddModal() {
        document.getElementById('addModal').style.display = 'none';
        document.getElementById('addStudentForm').reset();
        this.hideFormError();
        this.setSubmitLoading(false);
    }

    // Agregar nuevo alumno
    async addStudent() {
        const nombre = document.getElementById('studentNombre').value.trim();
        const apellido = document.getElementById('studentApellido').value.trim();
        const edad = parseInt(document.getElementById('studentEdad').value);
        const email = document.getElementById('studentEmail').value.trim();
        const legajo = document.getElementById('studentLegajo').value.trim();

        this.hideFormError();
        this.setSubmitLoading(true);

        try {
            await this.apiRequest('/alumnos', {
                method: 'POST',
                body: JSON.stringify({ nombre, apellido, edad, email, legajo })
            });

            this.hideAddModal();
            this.showSuccess('Alumno agregado exitosamente a PostgreSQL');
            await this.loadAlumnos();
        } catch (error) {
            this.showFormError(error.message);
        } finally {
            this.setSubmitLoading(false);
        }
    }

    // Eliminar alumno
    async deleteStudent(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este alumno?')) {
            return;
        }

        try {
            await this.apiRequest(`/alumnos/${id}`, {
                method: 'DELETE'
            });

            this.showSuccess('Alumno eliminado exitosamente de PostgreSQL');
            await this.loadAlumnos();
        } catch (error) {
            this.showError('Error al eliminar alumno: ' + error.message);
        }
    }

    // Mostrar/ocultar loading
    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('studentsContainer').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('studentsContainer').style.display = 'grid';
    }

    // Mostrar/ocultar error
    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('error').style.display = 'none';
    }

    // Mostrar/ocultar error del formulario
    showFormError(message) {
        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideFormError() {
        document.getElementById('formError').style.display = 'none';
    }

    // Controlar loading del botón submit
    setSubmitLoading(loading) {
        const submitBtn = document.querySelector('#addStudentForm button[type="submit"]');
        const submitText = document.getElementById('submitText');
        const submitLoading = document.getElementById('submitLoading');
        
        if (loading) {
            submitBtn.disabled = true;
            submitText.style.display = 'none';
            submitLoading.style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitLoading.style.display = 'none';
        }
    }

    // Mostrar notificaciones
    showSuccess(message) {
        this.showNotification(message, '#48bb78');
    }

    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-weight: 600;
            font-size: 0.9rem;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 4000);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AlumnosApp();
});