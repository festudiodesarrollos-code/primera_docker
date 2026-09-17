from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
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

    return render_template("index.html", resultado=resultado)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
