import os
from flask import Flask, render_template, Response

app = Flask(__name__, template_folder="templates", static_folder="templates", static_url_path="")

def obtener_directorio_datos():
    ruta = os.getenv("DATA_DIR", "/datos")
    try:
        os.makedirs(ruta, exist_ok=True)
        # Prueba de escritura para verificar permisos
        archivo_test = os.path.join(ruta, ".write_test")
        with open(archivo_test, "w", encoding="utf-8") as f:
            f.write("ok")
        os.remove(archivo_test)
        return ruta
    except (PermissionError, OSError):
        base_dir = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
        ruta_local = os.path.join(base_dir, "datos")
        os.makedirs(ruta_local, exist_ok=True)
        return ruta_local

DATA_DIR = obtener_directorio_datos()
ALUMNO_FILE = os.path.join(DATA_DIR, "alumno.txt")

def asegurar_archivo_alumno():
    if not os.path.exists(ALUMNO_FILE):
        nombre = os.getenv("ALUMNO_NOMBRE", "Emiliano Franetovich")
        materia = os.getenv("ASIGNATURA", "Arquitectura y Despliegues")
        entorno = os.getenv("ENTORNO", "produccion")
        estudio = os.getenv("ESTUDIO", "FEStudio Desarrollos")
        
        contenido = (
            "==================================================\n"
            "   PRÁCTICA DE VOLÚMENES DOCKER - DATOS DEL ALUMNO\n"
            "==================================================\n"
            f"Alumno: {nombre}\n"
            f"Asignatura: {materia}\n"
            f"Volumen Docker: practica_datos\n"
            f"Ruta en contenedor: {ALUMNO_FILE}\n"
            f"Entorno: {entorno}\n"
            f"Estudio / Proyecto: {estudio}\n"
            "==================================================\n"
        )
        with open(ALUMNO_FILE, "w", encoding="utf-8") as f:
            f.write(contenido)
    return ALUMNO_FILE

# Generar el archivo al inicializar la app
asegurar_archivo_alumno()

@app.route("/", methods=["GET", "POST"])
def home():
    asegurar_archivo_alumno()
    return render_template("index.html")

@app.route("/alumno", methods=["GET"])
def ver_alumno():
    asegurar_archivo_alumno()
    try:
        with open(ALUMNO_FILE, "r", encoding="utf-8") as f:
            contenido = f.read()
        return Response(contenido, mimetype="text/plain; charset=utf-8")
    except Exception as e:
        return f"Error al leer {ALUMNO_FILE}: {str(e)}", 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)