import heapq


class GrafoViario:
    def __init__(self):
        self.adjacencias = {}

    def adicionar_cruzamento(self, cruzamento):
        if cruzamento not in self.adjacencias:
            self.adjacencias[cruzamento] = []

    def adicionar_via(self, origem, destino, tempo, distancia, congestionamento=1.0):
        if tempo < 0 or distancia < 0 or congestionamento < 0:
            raise ValueError("Os pesos não podem ser negativos.")
        self.adicionar_cruzamento(origem)
        self.adicionar_cruzamento(destino)
        self.adjacencias[origem].append({
            "destino": destino, "tempo": tempo, "distancia": distancia,
            "congestionamento": congestionamento, "ativa": True,
        })

    def alterar_status_via(self, origem, destino, ativa):
        if origem not in self.adjacencias:
            raise ValueError("Cruzamento de origem inexistente.")
        for via in self.adjacencias[origem]:
            if via["destino"] == destino:
                via["ativa"] = ativa
                return
        raise ValueError("Via não encontrada.")

    def alterar_congestionamento(self, origem, destino, fator):
        if fator < 0:
            raise ValueError("O congestionamento não pode ser negativo.")
        if origem not in self.adjacencias:
            raise ValueError("Cruzamento de origem inexistente.")
        for via in self.adjacencias[origem]:
            if via["destino"] == destino:
                via["congestionamento"] = fator
                return
        raise ValueError("Via não encontrada.")

    def dijkstra(self, origem, destino, criterio="tempo"):
        if origem not in self.adjacencias:
            raise ValueError("Origem inexistente.")
        if destino not in self.adjacencias:
            raise ValueError("Destino inexistente.")
        if criterio not in ("tempo", "distancia"):
            raise ValueError("Critério inválido. Use 'tempo' ou 'distancia'.")

        distancias = {no: float("inf") for no in self.adjacencias}
        anteriores = {no: None for no in self.adjacencias}
        vias_anteriores = {no: None for no in self.adjacencias}
        distancias[origem] = 0
        fila = [(0, origem)]

        while fila:
            custo_atual, atual = heapq.heappop(fila)
            if custo_atual > distancias[atual]:
                continue
            if atual == destino:
                break
            for via in self.adjacencias[atual]:
                if not via["ativa"]:
                    continue
                vizinho = via["destino"]
                peso = via["tempo"] * via["congestionamento"] if criterio == "tempo" else via["distancia"]
                novo_custo = custo_atual + peso
                if novo_custo < distancias[vizinho]:
                    distancias[vizinho] = novo_custo
                    anteriores[vizinho] = atual
                    vias_anteriores[vizinho] = via
                    heapq.heappush(fila, (novo_custo, vizinho))

        if distancias[destino] == float("inf"):
            return None

        caminho, vias_caminho, atual = [], [], destino
        while atual is not None:
            caminho.append(atual)
            if vias_anteriores[atual] is not None:
                vias_caminho.append(vias_anteriores[atual])
            atual = anteriores[atual]
        caminho.reverse()
        vias_caminho.reverse()

        return {
            "caminho": caminho,
            "criterio": criterio,
            "custo": distancias[destino],
            "tempo_total": sum(v["tempo"] * v["congestionamento"] for v in vias_caminho),
            "distancia_total": sum(v["distancia"] for v in vias_caminho),
        }
