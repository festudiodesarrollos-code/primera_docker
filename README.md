# FEStudio Desarrollos - Aplicación Flask Docker

**Trabajo Práctico:** Diseños y Arquitectura de Despliegues  
**Estudiante:** Emiliano Franetovich  
**Asignatura:** Arquitectura y Despliegues  
**Estudio / Proyecto:** FEStudio Desarrollos  

---

## 📌 Descripción del Proyecto

Este proyecto comprende el desarrollo, empaquetado, persistencia y despliegue en producción de una aplicación web construida sobre **Flask (Python 3.12)** para la empresa de viajes y turismo **"Sin Rumbos"**.

La aplicación sigue las buenas prácticas de la metodología *Twelve-Factor App*:
- **Entorno aislado y reproducible:** Dockerfile optimizado basado en `python:3.12-slim`.
- **Servidor WSGI de grado productivo:** Gunicorn con soporte concurrente de workers y threads.
- **Orquestación unificada:** Docker Compose para construcción, asignación de puertos y volúmenes.
- **Desacoplamiento de configuración:** Inyección dinámica de variables de entorno mediante `.env`.
- **Persistencia desacoplada:** Volumen Docker nombrado (`practica_datos`) montado en `/datos` para resguardar información crítica independientemente del ciclo de vida de los contenedores.
- **Despliegue remoto real:** Implementado en servidor Ubuntu 24.04 vía SSH con reglas de cortafuegos en UFW.

---

## 🗂️ Estructura del Repositorio

```text
├── app.py                     # Punto de entrada de la aplicación Flask y definición de rutas
├── dockerfile                 # Definición de la imagen Docker para producción (Python + Gunicorn)
├── docker-compose.yml         # Orquestador del servicio, puertos, variables y volúmenes
├── requirements.txt           # Dependencias de Python (Flask, Gunicorn, Jinja2, etc.)
├── .env.example               # Plantilla de variables de entorno para despliegues
├── .dockerignore              # Exclusiones de construcción para un contexto Docker limpio y seguro
├── .gitignore                 # Exclusiones de control de versiones
├── templates/                 # Vistas HTML, estilos CSS, scripts JS y recursos estáticos
└── Ejercicios practicos/       # Entregables y bitácoras de las etapas prácticas:
    ├── README.md              # Respuestas al cuestionario teórico fundamental de Docker
    ├── Versiones/             # Práctica de variables de entorno y desacoplamiento de config
    ├── Volumenes/             # Práctica de persistencia de datos mediante volúmenes Docker
    └── Despligue/             # Bitácora y registros del despliegue exitoso en servidor SSH
```

---

## 🚀 Endpoints de la Aplicación

| Ruta | Métodos | Descripción |
| :--- | :--- | :--- |
| `/` | `GET, POST` | **Página Principal**: Landing comercial e interactiva de *Sin Rumbos - Viajes y Turismo*. |
| `/alumno` | `GET` | **Persistencia de Datos**: Consulta el archivo generado en el volumen persistente (`/datos/alumno.txt`). |
| `/calculadora` | `GET, POST` | **Calculadora Web**: Interfaz funcional para operaciones aritméticas básicas. |
| `/admin` | `GET` | **Panel Administrativo**: Interfaz para administración de presupuestos y viajes. |
| `/health` | `GET` | **Healthcheck**: Endpoint JSON de monitoreo del estado y entorno activo. |
| `/estado` | `GET` | **Estado**: Renderiza el nombre de la app y el entorno en ejecución (`NOMBRE_APP`, `ENTORNO`). |

---

## ⚙️ Puesta en Marcha y Despliegue

### 1. Clonar el repositorio
```bash
git clone https://github.com/festudiodesarrollos-code/primera_docker.git
cd primera_docker
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```
*(Opcional: modificar `HOST_PORT` en `.env` si se requiere exponer la app en otro puerto del host, e.g. puerto 80 u 8080)*.

### 3. Levantar la aplicación con Docker Compose
```bash
docker compose up -d --build
```

### 4. Verificar el estado del servicio
```bash
# Ver estado del contenedor y puertos mapeados
docker compose ps

# Monitorear los logs en tiempo real
docker compose logs -f
```

---

## 📂 Ejercicios Prácticos y Documentación

En la carpeta [`Ejercicios practicos/`](./Ejercicios%20practicos/) se encuentra la documentación completa de cada etapa evaluada:
1. **[Cuestionario Docker](./Ejercicios%20practicos/README.md):** Respuestas conceptuales sobre Dockerfile, diferencias entre imagen/contenedor, mapeo de puertos y persistencia.
2. **[Persistencia y Variables de Entorno](./Ejercicios%20practicos/Versiones/):** Capturas y comandos demostrando la ejecución desacoplada con `-e` y `--env-file`.
3. **[Volúmenes](./Ejercicios%20practicos/Volumenes/):** Demostración de persistencia de datos entre contenedores destruidos y recreados.
4. **[Despliegue en Servidor SSH](./Ejercicios%20practicos/Despligue/despligue.md):** Log de terminal del despliegue en servidor Ubuntu con Docker Compose, Gunicorn y configuración de firewall.
