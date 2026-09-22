==================================================
  FEStudio Desarrollos - Aplicación Flask Docker
==================================================
Estudiante: Emiliano Franetovich

--------------------------------------------------
Respuestas al cuestionario:
--------------------------------------------------

1. ¿Qué función cumple el Dockerfile?
Es el archivo de configuración que contiene el conjunto de instrucciones paso a paso para automatizar la creación de una imagen Docker. Define la imagen base, las dependencias a instalar, los archivos a copiar y el comando que debe ejecutarse al iniciar el contenedor.

2. ¿Cuál es la diferencia entre la imagen "mi-flask" y el contenedor "mi-app"?
- La imagen ("mi-flask") es una plantilla ejecutable de solo lectura que contiene el código, las dependencias y la configuración de la aplicación.
- El contenedor ("mi-app") es una instancia individual en ejecución creada a partir de esa imagen. Es el entorno aislado donde la aplicación corre en tiempo real.

3. ¿Qué significa -p 8080:5000?
Mapea (o redirige) los puertos entre el sistema anfitrión y el contenedor. Indica que el puerto 8080 de tu equipo físico o servidor (Host) redirigirá todo el tráfico entrante al puerto 5000 interno del contenedor Docker donde está escuchando Flask.

4. ¿Qué ocurre con la aplicación cuando detenemos el contenedor?
El proceso principal de la aplicación se finaliza y el contenedor pasa a un estado detenido (Exited). La página web deja de estar disponible desde el navegador. Sin embargo, los cambios en los datos o el estado del contenedor persisten en el sistema hasta que el contenedor sea eliminado explícitamente (docker rm).
