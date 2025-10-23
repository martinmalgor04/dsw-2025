# 🤝 Guía de Contribución

## Cómo Contribuir

### 1. Configuración Inicial

```bash
# Clonar el repositorio
git clone https://github.com/FRRe-DS/2025-12-TPI.git
cd 2025-12-TPI

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Flujo de Trabajo

#### Crear una Nueva Feature
```bash
# Crear branch desde dev
git checkout dev
git pull origin dev
git checkout -b feature/backend-nueva-funcionalidad

# Desarrollar y hacer commits
git add .
git commit -m "feat(backend): implementar nueva funcionalidad"

# Push y crear Pull Request
git push origin feature/backend-nueva-funcionalidad
```

#### Corregir un Bug
```bash
# Crear branch desde dev
git checkout dev
git pull origin dev
git checkout -b fix/frontend-corregir-bug

# Desarrollar y hacer commits
git add .
git commit -m "fix(frontend): corregir bug en componente"

# Push y crear Pull Request
git push origin fix/frontend-corregir-bug
```

### 3. Convenciones de Commits

#### Formato
```
<tipo>(<scope>): <descripción>

[descripción opcional]

[footer opcional]
```

#### Tipos
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (espacios, etc.)
- `refactor`: Refactorización de código
- `test`: Agregar o corregir tests
- `chore`: Cambios en build, dependencias, etc.

#### Scopes
- `backend`: Cambios en el backend
- `frontend`: Cambios en el frontend
- `docs`: Cambios en documentación
- `config`: Cambios de configuración

#### Ejemplos
```bash
feat(backend): implementar servicio de cotización
fix(frontend): corregir validación de formulario
docs(api): actualizar documentación de endpoints
test(backend): agregar tests para servicio de envíos
chore(deps): actualizar dependencias de seguridad
```

### 4. Estándares de Código

#### Backend (NestJS)
- **TypeScript**: Tipado estricto
- **ESLint**: Configuración estándar
- **Prettier**: Formateo automático
- **Tests**: Jest con cobertura >80%

#### Frontend (SvelteKit)
- **TypeScript**: Tipado estricto
- **Tailwind CSS**: Estilos utilitarios
- **ESLint**: Configuración estándar
- **Prettier**: Formateo automático

#### Estructura de Archivos
```
backend/src/
├── modules/           # Módulos de negocio
├── config/            # Configuración
├── common/            # Utilidades compartidas
└── prisma/            # Base de datos

frontend/src/
├── routes/            # Páginas
├── lib/
│   ├── components/    # Componentes UI
│   └── middleware/    # Lógica de negocio
```

### 5. Testing

#### Backend
```bash
cd backend
npm test                    # Tests unitarios
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests end-to-end
```

#### Frontend
```bash
cd frontend
npm test                   # Tests unitarios
npm run test:integration   # Tests de integración
```

#### Cobertura Mínima
- **Backend**: >80% en servicios críticos
- **Frontend**: >70% en componentes principales

### 6. Pull Requests

#### Antes de Crear PR
- [ ] Tests pasando
- [ ] Código formateado
- [ ] Documentación actualizada
- [ ] Commits descriptivos

#### Template de PR
```markdown
## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## Testing
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Manual testing

## Checklist
- [ ] Código formateado
- [ ] Tests pasando
- [ ] Documentación actualizada
- [ ] No breaking changes
```

### 7. Code Review

#### Como Reviewer
- **Funcionalidad**: ¿Cumple los requisitos?
- **Código**: ¿Es legible y mantenible?
- **Tests**: ¿Cobertura adecuada?
- **Performance**: ¿Impacto en rendimiento?
- **Seguridad**: ¿Vulnerabilidades?

#### Como Author
- **Responder**: A todos los comentarios
- **Actualizar**: Código según feedback
- **Explicar**: Decisiones de diseño
- **Testear**: Cambios localmente

### 8. Release Process

#### Versionado
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Changelog**: Registro de cambios
- **Tags**: Git tags para releases

#### Proceso
1. **Merge a main**: Desde dev
2. **Tag release**: `git tag v1.0.0`
3. **Deploy**: Automático via CI/CD
4. **Documentar**: Release notes

### 9. Comunicación

#### Canales
- **GitHub Issues**: Bugs y features
- **GitHub Discussions**: Preguntas generales
- **Pull Requests**: Code review
- **Slack/Discord**: Comunicación diaria

#### Responsabilidades
- **Backend Team**: APIs, base de datos, lógica de negocio
- **Frontend Team**: UI/UX, componentes, integración
- **DevOps Team**: CI/CD, infraestructura, deployment
- **QA Team**: Testing, calidad, documentación

### 10. Recursos

#### Documentación
- [README.md](./README.md) - Setup general
- [docs/](./docs/) - Documentación técnica
- [openapilog.yaml](./openapilog.yaml) - API externa
- [openapiint.yml](./openapiint.yml) - API interna

#### Herramientas
- **IDE**: VS Code con extensiones recomendadas
- **Git**: GitHub Desktop o CLI
- **Docker**: Para desarrollo local
- **Postman**: Para testing de APIs

---

**¡Gracias por contribuir al proyecto! 🚀**