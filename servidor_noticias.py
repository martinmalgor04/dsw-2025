"""
Sistema de Servidor de Noticias - Solución Orientada a Objetos
Desarrollo de Software 2025
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from enum import Enum
import re


# ============================================================================
# CLASES BASE PARA CONTENIDO
# ============================================================================

class TipoContenido(Enum):
    """Enumeración para tipos de contenido"""
    TEXTO = "texto"
    IMAGEN = "imagen"
    VIDEO = "video"

class Contenido(ABC):
    """Clase abstracta base para diferentes tipos de contenido"""
    
    def __init__(self, tipo: TipoContenido):
        self._tipo = tipo
    
    @property
    def tipo(self) -> TipoContenido:
        return self._tipo
    
    @abstractmethod
    def obtener_palabras(self) -> List[str]:
        """Retorna las palabras del contenido para búsquedas"""
        pass
    
    @abstractmethod
    def contar_palabras(self) -> int:
        """Cuenta el número de palabras del contenido"""
        pass


class ContenidoTexto(Contenido):
    """Contenido de tipo texto"""
    
    def __init__(self, texto: str):
        super().__init__(TipoContenido.TEXTO)
        self._texto = texto
    
    @property
    def texto(self) -> str:
        return self._texto
    
    def obtener_palabras(self) -> List[str]:
        """Extrae palabras del texto, removiendo puntuación"""
        palabras = re.findall(r'\b\w+\b', self._texto.lower())
        return palabras
    
    def contar_palabras(self) -> int:
        return len(self.obtener_palabras())
    
    def __str__(self):
        return f"Texto: {self._texto[:50]}..."


class ContenidoImagen(Contenido):
    """Contenido de tipo imagen"""
    
    def __init__(self, url: str, descripcion: str = ""):
        super().__init__(TipoContenido.IMAGEN)
        self._url = url
        self._descripcion = descripcion
    
    @property
    def url(self) -> str:
        return self._url
    
    @property
    def descripcion(self) -> str:
        return self._descripcion
    
    def obtener_palabras(self) -> List[str]:
        """Las imágenes contribuyen con palabras de su descripción"""
        if self._descripcion:
            palabras = re.findall(r'\b\w+\b', self._descripcion.lower())
            return palabras
        return []
    
    def contar_palabras(self) -> int:
        return len(self.obtener_palabras())
    
    def __str__(self):
        return f"Imagen: {self._url} - {self._descripcion}"


class ContenidoVideo(Contenido):
    """Contenido de tipo video"""
    
    def __init__(self, url: str, descripcion: str = "", duracion: int = 0):
        super().__init__(TipoContenido.VIDEO)
        self._url = url
        self._descripcion = descripcion
        self._duracion = duracion  # en segundos
    
    @property
    def url(self) -> str:
        return self._url
    
    @property
    def descripcion(self) -> str:
        return self._descripcion
    
    @property
    def duracion(self) -> int:
        return self._duracion
    
    def obtener_palabras(self) -> List[str]:
        """Los videos contribuyen con palabras de su descripción"""
        if self._descripcion:
            palabras = re.findall(r'\b\w+\b', self._descripcion.lower())
            return palabras
        return []
    
    def contar_palabras(self) -> int:
        return len(self.obtener_palabras())
    
    def __str__(self):
        return f"Video: {self._url} ({self._duracion}s) - {self._descripcion}"


# ============================================================================
# CLASE NOTICIA
# ============================================================================

class Noticia:
    """Representa una noticia con título, clasificación y cuerpo"""
    
    def __init__(self, titulo: str, clasificacion: str):
        self._titulo = titulo
        self._clasificacion = clasificacion.lower()
        self._cuerpo: List[Contenido] = []
    
    @property
    def titulo(self) -> str:
        return self._titulo
    
    @property
    def clasificacion(self) -> str:
        return self._clasificacion
    
    @property
    def cuerpo(self) -> List[Contenido]:
        return self._cuerpo.copy()
    
    def agregar_contenido(self, contenido: Contenido):
        """Agrega contenido al cuerpo de la noticia"""
        self._cuerpo.append(contenido)
    
    def obtener_todas_las_palabras(self) -> List[str]:
        """Obtiene todas las palabras del título y cuerpo"""
        palabras = []
        
        # Palabras del título
        palabras_titulo = re.findall(r'\b\w+\b', self._titulo.lower())
        palabras.extend(palabras_titulo)
        
        # Palabras del cuerpo
        for contenido in self._cuerpo:
            palabras.extend(contenido.obtener_palabras())
        
        return palabras
    
    def contar_palabras_totales(self) -> int:
        """Cuenta el total de palabras en la noticia"""
        return len(self.obtener_todas_las_palabras())
    
    def __str__(self):
        return f"Noticia: '{self._titulo}' - {self._clasificacion} ({len(self._cuerpo)} contenidos)"


# ============================================================================
# CRITERIOS DE BÚSQUEDA (PATRÓN STRATEGY)
# ============================================================================

class CriterioBusqueda(ABC):
    """Interfaz para criterios de búsqueda"""
    
    @abstractmethod
    def cumple_criterio(self, noticia: Noticia) -> bool:
        """Verifica si la noticia cumple con el criterio"""
        pass


class CriterioTitulo(CriterioBusqueda):
    """Criterio de búsqueda por título exacto"""
    
    def __init__(self, titulo_buscado: str):
        self._titulo_buscado = titulo_buscado.lower()
    
    def cumple_criterio(self, noticia: Noticia) -> bool:
        return noticia.titulo.lower() == self._titulo_buscado


class CriterioCategoria(CriterioBusqueda):
    """Criterio de búsqueda por categoría"""
    
    def __init__(self, categoria: str):
        self._categoria = categoria.lower()
    
    def cumple_criterio(self, noticia: Noticia) -> bool:
        return noticia.clasificacion == self._categoria


class CriterioPalabraEnCuerpo(CriterioBusqueda):
    """Criterio de búsqueda por palabra en el cuerpo"""
    
    def __init__(self, palabra: str):
        self._palabra = palabra.lower()
    
    def cumple_criterio(self, noticia: Noticia) -> bool:
        palabras_noticia = noticia.obtener_todas_las_palabras()
        return self._palabra in palabras_noticia


class CriterioListaPalabras(CriterioBusqueda):
    """Criterio de búsqueda por lista de palabras (todas deben estar presentes)"""
    
    def __init__(self, palabras: List[str]):
        self._palabras = [palabra.lower() for palabra in palabras]
    
    def cumple_criterio(self, noticia: Noticia) -> bool:
        palabras_noticia = noticia.obtener_todas_las_palabras()
        return all(palabra in palabras_noticia for palabra in self._palabras)


class CriterioMaximoPalabras(CriterioBusqueda):
    """Criterio de búsqueda por máximo número de palabras"""
    
    def __init__(self, maximo_palabras: int):
        self._maximo_palabras = maximo_palabras
    
    def cumple_criterio(self, noticia: Noticia) -> bool:
        return noticia.contar_palabras_totales() <= self._maximo_palabras


class CriterioCombinado(CriterioBusqueda):
    """Permite combinar múltiples criterios con operadores lógicos"""
    
    def __init__(self, criterios: List[CriterioBusqueda], operador: str = "AND"):
        self._criterios = criterios
        self._operador = operador.upper()
    
    def cumple_criterio(self, noticia: Noticia) -> bool:
        if not self._criterios:
            return True
        
        if self._operador == "AND":
            return all(criterio.cumple_criterio(noticia) for criterio in self._criterios)
        elif self._operador == "OR":
            return any(criterio.cumple_criterio(noticia) for criterio in self._criterios)
        else:
            raise ValueError("Operador debe ser 'AND' o 'OR'")


# ============================================================================
# CLASE USUARIO
# ============================================================================

class Usuario:
    """Representa un usuario con sus preferencias de suscripción"""
    
    def __init__(self, nombre: str, email: str):
        self._nombre = nombre
        self._email = email
        self._preferencias: List[CriterioBusqueda] = []
    
    @property
    def nombre(self) -> str:
        return self._nombre
    
    @property
    def email(self) -> str:
        return self._email
    
    @property
    def preferencias(self) -> List[CriterioBusqueda]:
        return self._preferencias.copy()
    
    def agregar_preferencia(self, criterio: CriterioBusqueda):
        """Agrega una preferencia de suscripción"""
        self._preferencias.append(criterio)
    
    def limpiar_preferencias(self):
        """Limpia todas las preferencias"""
        self._preferencias.clear()
    
    def le_interesa_noticia(self, noticia: Noticia) -> bool:
        """Verifica si la noticia coincide con las preferencias del usuario"""
        if not self._preferencias:
            return False
        
        # La noticia debe cumplir con al menos una preferencia
        return any(preferencia.cumple_criterio(noticia) for preferencia in self._preferencias)
    
    def __str__(self):
        return f"Usuario: {self._nombre} ({self._email}) - {len(self._preferencias)} preferencias"


# ============================================================================
# SERVIDOR DE NOTICIAS
# ============================================================================

class ServidorNoticias:
    """Servidor que gestiona noticias, búsquedas y suscripciones"""
    
    def __init__(self, nombre: str):
        self._nombre = nombre
        self._noticias: List[Noticia] = []
        self._usuarios_suscritos: List[Usuario] = []
    
    @property
    def nombre(self) -> str:
        return self._nombre
    
    def agregar_noticia(self, noticia: Noticia):
        """Agrega una noticia y notifica a usuarios suscritos"""
        self._noticias.append(noticia)
        self._notificar_usuarios_suscritos(noticia)
    
    def buscar_noticias(self, criterio: CriterioBusqueda) -> List[Noticia]:
        """Busca noticias que cumplan con el criterio especificado"""
        return [noticia for noticia in self._noticias if criterio.cumple_criterio(noticia)]
    
    def suscribir_usuario(self, usuario: Usuario):
        """Suscribe un usuario al servidor"""
        if usuario not in self._usuarios_suscritos:
            self._usuarios_suscritos.append(usuario)
    
    def desuscribir_usuario(self, usuario: Usuario):
        """Desuscribe un usuario del servidor"""
        if usuario in self._usuarios_suscritos:
            self._usuarios_suscritos.remove(usuario)
    
    def _notificar_usuarios_suscritos(self, noticia: Noticia):
        """Notifica a usuarios suscritos sobre nuevas noticias que les interesan"""
        for usuario in self._usuarios_suscritos:
            if usuario.le_interesa_noticia(noticia):
                self._enviar_noticia_a_usuario(usuario, noticia)
    
    def _enviar_noticia_a_usuario(self, usuario: Usuario, noticia: Noticia):
        """Simula el envío de una noticia a un usuario"""
        print(f"📧 Enviando a {usuario.nombre} ({usuario.email}): {noticia.titulo}")
    
    def obtener_estadisticas(self) -> Dict[str, Any]:
        """Obtiene estadísticas del servidor"""
        return {
            "total_noticias": len(self._noticias),
            "usuarios_suscritos": len(self._usuarios_suscritos),
            "categorias": list(set(noticia.clasificacion for noticia in self._noticias))
        }
    
    def __str__(self):
        return f"Servidor '{self._nombre}': {len(self._noticias)} noticias, {len(self._usuarios_suscritos)} usuarios"


# ============================================================================
# EJEMPLO DE USO
# ============================================================================

if __name__ == "__main__":
    print("=== SISTEMA DE SERVIDOR DE NOTICIAS ===\n")
    
    # Crear servidor
    servidor = ServidorNoticias("Noticias UTN")
    
    # Crear usuarios
    usuario1 = Usuario("Juan Pérez", "juan@email.com")
    usuario2 = Usuario("María García", "maria@email.com")
    
    # Configurar preferencias de usuario1: noticias de deportes con "De Paul"
    preferencia1 = CriterioCombinado([
        CriterioCategoria("deportes"),
        CriterioPalabraEnCuerpo("de paul")
    ], "AND")
    usuario1.agregar_preferencia(preferencia1)
    
    # Configurar preferencias de usuario2: noticias cortas (menos de 50 palabras)
    preferencia2 = CriterioMaximoPalabras(50)
    usuario2.agregar_preferencia(preferencia2)
    
    # Suscribir usuarios
    servidor.suscribir_usuario(usuario1)
    servidor.suscribir_usuario(usuario2)
    
    # Crear noticias
    noticia1 = Noticia("De Paul marca gol decisivo", "deportes")
    noticia1.agregar_contenido(ContenidoTexto("Rodrigo De Paul anotó el gol que le dio la victoria a la selección argentina en un partido emocionante."))
    noticia1.agregar_contenido(ContenidoImagen("http://ejemplo.com/depaul.jpg", "De Paul celebrando el gol"))
    
    noticia2 = Noticia("De Paul en programa de TV", "espectáculos")
    noticia2.agregar_contenido(ContenidoTexto("El futbolista Rodrigo De Paul participó en un programa de entretenimientos hablando de su vida personal."))
    
    noticia3 = Noticia("Resultado partido", "deportes")
    noticia3.agregar_contenido(ContenidoTexto("Argentina 2 - Brasil 1"))
    
    # Agregar noticias al servidor (esto activará las notificaciones)
    print("Agregando noticias al servidor...\n")
    servidor.agregar_noticia(noticia1)  # Debería notificar a usuario1 (deportes + De Paul)
    servidor.agregar_noticia(noticia2)  # No debería notificar a usuario1 (no es deportes)
    servidor.agregar_noticia(noticia3)  # Debería notificar a usuario2 (noticia corta)
    
    # Realizar búsquedas
    print("\n=== BÚSQUEDAS ===")
    
    # Buscar noticias de deportes
    criterio_deportes = CriterioCategoria("deportes")
    noticias_deportes = servidor.buscar_noticias(criterio_deportes)
    print(f"\nNoticias de deportes encontradas: {len(noticias_deportes)}")
    for noticia in noticias_deportes:
        print(f"  - {noticia}")
    
    # Buscar noticias que mencionen "De Paul"
    criterio_depaul = CriterioPalabraEnCuerpo("de")
    noticias_depaul = servidor.buscar_noticias(criterio_depaul)
    print(f"\nNoticias que mencionan 'de': {len(noticias_depaul)}")
    for noticia in noticias_depaul:
        print(f"  - {noticia}")
    
    # Búsqueda combinada
    criterio_combinado = CriterioCombinado([
        CriterioCategoria("deportes"),
        CriterioPalabraEnCuerpo("argentina")
    ], "AND")
    noticias_combinadas = servidor.buscar_noticias(criterio_combinado)
    print(f"\nNoticias de deportes que mencionan 'argentina': {len(noticias_combinadas)}")
    for noticia in noticias_combinadas:
        print(f"  - {noticia}")
    
    # Mostrar estadísticas
    print(f"\n=== ESTADÍSTICAS ===")
    stats = servidor.obtener_estadisticas()
    print(f"Servidor: {servidor}")
    print(f"Estadísticas: {stats}")
