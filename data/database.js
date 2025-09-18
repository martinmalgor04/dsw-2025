// DATABASE CONNECTION - Conexión a PostgreSQL
// Configuración de conexión a la base de datos

import pkg from 'pg';
const { Pool } = pkg;

class DatabaseConnection {
    constructor() {
        // Configuración de conexión a PostgreSQL
        this.pool = new Pool({
            user: 'postgres',           // Usuario
            host: 'localhost',          // Host
            database: 'desarrollo',     // Base de datos
            password: '',               // ⚠️  AGREGAR TU CONTRASEÑA AQUÍ
            port: 5432,                 // Puerto
            max: 20,                    // Máximo de conexiones en el pool
            idleTimeoutMillis: 30000,   // Tiempo de espera
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Error inesperado en el pool de conexiones:', err);
        });
    }

    // Ejecutar una consulta
    async query(text, params) {
        console.log('🗄️ DATABASE: Ejecutando query');
        console.log('📝 DATABASE: SQL:', text.trim());
        console.log('📋 DATABASE: Parámetros:', params);
        
        const client = await this.pool.connect();
        try {
            const startTime = Date.now();
            const result = await client.query(text, params);
            const endTime = Date.now();
            
            console.log(`⏱️ DATABASE: Query ejecutada en ${endTime - startTime}ms`);
            console.log('📊 DATABASE: Filas devueltas:', result.rowCount);
            console.log('✅ DATABASE: Query exitosa');
            
            return result;
        } catch (error) {
            console.error('❌ DATABASE: Error ejecutando query:', error);
            console.error('❌ DATABASE: SQL que falló:', text.trim());
            console.error('❌ DATABASE: Parámetros:', params);
            throw error;
        } finally {
            client.release();
        }
    }

    // Cerrar el pool de conexiones
    async close() {
        await this.pool.end();
    }

    // Probar la conexión
    async testConnection() {
        try {
            const result = await this.query('SELECT NOW() as current_time');
            console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0].current_time);
            return true;
        } catch (error) {
            console.error('❌ Error conectando a PostgreSQL:', error.message);
            return false;
        }
    }
}

// Instancia singleton de la conexión
const dbConnection = new DatabaseConnection();

export default dbConnection;