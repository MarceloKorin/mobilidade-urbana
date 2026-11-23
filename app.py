import copy
from flask import Flask, jsonify, request

from grafo import GrafoViario  

app = Flask(__name__, static_folder="public", static_url_path="")
grafo = GrafoViario()

grafo.adicionar_via("CRU-A", "CRU-B", 5, 600)
grafo.adicionar_via("CRU-B", "CRU-C", 4, 450)
grafo.adicionar_via("CRU-B", "CRU-D", 2.5, 300)
grafo.adicionar_via("CRU-D", "CRU-C", 3, 400)
grafo.adicionar_via("CRU-C", "CRU-A", 6, 700)

@app.errorhandler(ValueError)
@app.errorhandler(KeyError)
@app.errorhandler(TypeError)
def erro(e):
    return jsonify(erro=str(e).strip("'")), 400


@app.get("/")
def index():
    return app.send_static_file("index.html")


@app.get("/api/grafo")
def estado():
    nodes = list(grafo.adjacencias)
    edges = [
        {"o": o, "d": v["destino"], "t": v["tempo"], "di": v["distancia"],
         "c": v["congestionamento"], "on": v["ativa"]}
        for o, vias in grafo.adjacencias.items() for v in vias
    ]
    return jsonify(nodes=nodes, edges=edges)


@app.post("/api/rota")
def rota():
    d = request.get_json()
    g = grafo
    if d.get("ignorar_bloqueios"): 
        g = copy.deepcopy(grafo)
        for vias in g.adjacencias.values():
            for v in vias:
                v["ativa"] = True
    return jsonify(resultado=g.dijkstra(d["origem"], d["destino"], d.get("criterio", "tempo")))


@app.post("/api/via/status")
def status():
    d = request.get_json()
    grafo.alterar_status_via(d["origem"], d["destino"], bool(d["ativa"]))
    return jsonify(ok=True)


@app.post("/api/via/congestionamento")
def congestionamento():
    d = request.get_json()
    grafo.alterar_congestionamento(d["origem"], d["destino"], float(d["fator"]))
    return jsonify(ok=True)


@app.post("/api/reabrir-todas")
def reabrir():
    for vias in grafo.adjacencias.values():
        for v in vias:
            v["ativa"] = True
    return jsonify(ok=True)


@app.post("/api/cruzamento")
def cruzamento():
    grafo.adicionar_cruzamento(request.get_json()["nome"])
    return jsonify(ok=True)


@app.post("/api/via")
def via():
    d = request.get_json()
    grafo.adicionar_via(d["origem"], d["destino"], float(d["tempo"]),
                        float(d["distancia"]), float(d.get("congestionamento", 1.0)))
    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(debug=True)
