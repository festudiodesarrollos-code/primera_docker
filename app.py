import os
from flask import Flask, render_template, request, Response, jsonify

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="templates",
    static_url_path="",
)


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
        base_dir = (
            os.path.dirname(os.path.abspath(__file__))
            if "__file__" in globals()
            else os.getcwd()
        )
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


# Asegurar archivo persistente al inicializar
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


@app.route("/calculadora", methods=["GET", "POST"])
def calculadora():
    resultado = None
    if request.method == "POST":
        try:
            num1 = float(request.form.get("num1"))
            num2 = float(request.form.get("num2"))
            operacion = request.form.get("operacion")

            if operacion == "suma":
                resultado = num1 + num2
            elif operacion == "resta":
                resultado = num1 - num2
            elif operacion == "multiplicacion":
                resultado = num1 * num2
            elif operacion == "division":
                if num2 != 0:
                    resultado = num1 / num2
                else:
                    resultado = "Error: División por cero"
        except (ValueError, TypeError):
            resultado = "Por favor, introduce números válidos"

    return render_template("index calcu.html", resultado=resultado)


@app.route("/admin", methods=["GET"])
def admin():
    return render_template("admin.html")


@app.route("/estado", methods=["GET"])
def estado():
    nombre = os.getenv("NOMBRE_APP", "Sin Rumbos - Viajes y Turismo")
    entorno = os.getenv("ENTORNO", "produccion")
    return f"<h1>{nombre}</h1><p>Entorno activo: {entorno}</p>"


@app.route("/health", methods=["GET"])
def health():
    return (
        jsonify(
            {
                "status": "ok",
                "app": os.getenv("NOMBRE_APP", "Sin Rumbos - Viajes y Turismo"),
                "entorno": os.getenv("ENTORNO", "produccion"),
            }
        ),
        200,
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)