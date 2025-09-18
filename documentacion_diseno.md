# Diseño Orientado a Objetos - Sistema de Servidor de Noticias

## Resumen del Problema

Se requiere implementar un sistema de servidor de noticias que:
- Concentre noticias de diferentes agencias
- Permita búsquedas con múltiples criterios
- Implemente un sistema de suscripciones basado en preferencias de usuarios

## Arquitectura de Clases

### 1. Jerarquía de Contenido

#### Clase Abstracta: `Contenido`
- **Propósito**: Clase base para diferentes tipos de contenido
- **Atributos**: `_tipo: TipoContenido`
- **Métodos abstractos**:
  - `obtener_palabras() -> List[str]`
  - `contar_palabras() -> int`

#### Clases Concretas de Contenido:

##### `ContenidoTexto(Contenido)`
- **Atributos**: `_texto: str`
- **Métodos**: Extrae palabras del texto usando regex

##### `ContenidoImagen(Contenido)`
- **Atributos**: `_url: str`, `_descripcion: str`
- **Métodos**: Usa descripción para búsquedas de palabras

##### `ContenidoVideo(Contenido)`
- **Atributos**: `_url: str`, `_descripcion: str`, `_duracion: int`
- **Métodos**: Similar a imagen, incluye duración

### 2. Clase Principal: `Noticia`

- **Atributos**:
  - `_titulo: str`: Título de la noticia
  - `_clasificacion: str`: Categoría (deportes, sociales, etc.)
  - `_cuerpo: List[Contenido]`: Lista de contenidos mixtos

- **Métodos principales**:
  - `agregar_contenido(contenido: Contenido)`: Añade contenido al cuerpo
  - `obtener_todas_las_palabras() -> List[str]`: Extrae todas las palabras
  - `contar_palabras_totales() -> int`: Cuenta palabras totales

### 3. Sistema de Búsqueda (Patrón Strategy)

#### Clase Abstracta: `CriterioBusqueda`
- **Método abstracto**: `cumple_criterio(noticia: Noticia) -> bool`

#### Implementaciones Concretas:

##### `CriterioTitulo(CriterioBusqueda)`
- Busca por título exacto (case-insensitive)

##### `CriterioCategoria(CriterioBusqueda)`
- Filtra por categoría específica

##### `CriterioPalabraEnCuerpo(CriterioBusqueda)`
- Busca palabra específica en todo el contenido

##### `CriterioListaPalabras(CriterioBusqueda)`
- Verifica que todas las palabras estén presentes

##### `CriterioMaximoPalabras(CriterioBusqueda)`
- Filtra noticias con máximo número de palabras

##### `CriterioCombinado(CriterioBusqueda)`
- Combina múltiples criterios con operadores AND/OR

### 4. Gestión de Usuarios: `Usuario`

- **Atributos**:
  - `_nombre: str`: Nombre del usuario
  - `_email: str`: Email para notificaciones
  - `_preferencias: List[CriterioBusqueda]`: Criterios de suscripción

- **Métodos principales**:
  - `agregar_preferencia(criterio: CriterioBusqueda)`: Añade preferencia
  - `le_interesa_noticia(noticia: Noticia) -> bool`: Evalúa interés

### 5. Clase Central: `ServidorNoticias`

- **Atributos**:
  - `_nombre: str`: Nombre del servidor
  - `_noticias: List[Noticia]`: Almacén de noticias
  - `_usuarios_suscritos: List[Usuario]`: Lista de suscriptores

- **Métodos principales**:
  - `agregar_noticia(noticia: Noticia)`: Añade noticia y notifica
  - `buscar_noticias(criterio: CriterioBusqueda) -> List[Noticia]`: Búsqueda
  - `suscribir_usuario(usuario: Usuario)`: Gestión de suscripciones
  - `_notificar_usuarios_suscritos(noticia: Noticia)`: Sistema de notificaciones

## Patrones de Diseño Implementados

### 1. **Strategy Pattern** (Criterios de Búsqueda)
- Permite intercambiar algoritmos de búsqueda dinámicamente
- Facilita agregar nuevos tipos de búsqueda sin modificar código existente
- Cada criterio encapsula su lógica específica

### 2. **Template Method** (Clase Contenido)
- Define estructura común para diferentes tipos de contenido
- Permite que subclases implementen comportamientos específicos
- Mantiene consistencia en la interfaz

### 3. **Observer Pattern** (Sistema de Suscripciones)
- Los usuarios se suscriben al servidor
- Cuando llega una noticia nueva, se notifica automáticamente
- Desacoplamiento entre servidor y usuarios

### 4. **Composite Pattern** (CriterioCombinado)
- Permite combinar criterios simples en criterios complejos
- Estructura de árbol para expresiones de búsqueda
- Flexibilidad para crear consultas complejas

## Ventajas del Diseño

### **Extensibilidad**
- Fácil agregar nuevos tipos de contenido
- Nuevos criterios de búsqueda sin modificar código existente
- Sistema modular y desacoplado

### **Mantenibilidad**
- Responsabilidades claras y separadas
- Código reutilizable y bien estructurado
- Fácil testing unitario

### **Flexibilidad**
- Búsquedas complejas mediante combinación de criterios
- Contenido mixto en noticias (texto, imagen, video)
- Preferencias personalizables por usuario

### **Escalabilidad**
- Arquitectura preparada para grandes volúmenes
- Posibilidad de optimizar búsquedas específicas
- Sistema de notificaciones eficiente

## Casos de Uso Ejemplificados

### Búsqueda Simple
```python
criterio = CriterioCategoria("deportes")
noticias = servidor.buscar_noticias(criterio)
```

### Búsqueda Combinada
```python
criterio = CriterioCombinado([
    CriterioCategoria("deportes"),
    CriterioPalabraEnCuerpo("De Paul")
], "AND")
```

### Suscripción de Usuario
```python
usuario.agregar_preferencia(criterio)
servidor.suscribir_usuario(usuario)
# Automáticamente recibe noticias que coincidan
```

## Posibles Extensiones

1. **Persistencia**: Agregar base de datos
2. **Cache**: Implementar cache de búsquedas frecuentes
3. **API REST**: Exponer funcionalidad via web services
4. **Notificaciones Push**: Sistema de notificaciones en tiempo real
5. **Análisis**: Estadísticas y métricas de uso
6. **Seguridad**: Autenticación y autorización de usuarios

