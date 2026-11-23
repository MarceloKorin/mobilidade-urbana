# Mobilidade Urbana

Projeto acadêmico que representa uma malha urbana como um grafo direcionado e ponderado. O sistema utiliza o algoritmo de Dijkstra para calcular rotas por menor tempo ou menor distância e permite simular interdições e alterações de congestionamento.

## Acesso ao sistema

A aplicação está disponível em:

https://mobilidade-urbana-beta.vercel.app

## Como usar

1. Acesse **Consulta de Rotas**.
2. Escolha a origem, o destino e o critério de cálculo.
3. Clique em **CALCULAR ROTA ÓTIMA** para visualizar o caminho, o tempo e a distância.
4. Use **Simulação de Falhas** para interditar vias e conferir o recálculo da rota.
5. Use **Gestão de Vias** para alterar o congestionamento ou cadastrar cruzamentos e vias.

## Validação rápida

Para conferir o funcionamento pela versão hospedada:

1. Em **Simulação de Falhas**, clique em **REABRIR TODAS AS VIAS**.
2. Em **Gestão de Vias**, mantenha o congestionamento das vias iniciais em `1`.
3. Calcule a rota de `CRU-A` para `CRU-C` por menor tempo. O resultado deve ser `CRU-A → CRU-B → CRU-D → CRU-C`, com `9,5 min` e `1300 m`.
4. Calcule a mesma rota por menor distância. O resultado deve ser `CRU-A → CRU-B → CRU-C`, com `11 min` e `1050 m`.
5. Interdite `CRU-D → CRU-C`. A rota por menor tempo deve mudar para `CRU-A → CRU-B → CRU-C`.

Os demais procedimentos e resultados esperados estão descritos no **Documento de Casos de Teste**, disponível na pasta `docs/`. A mesma pasta contém o **Caderno Técnico** com os detalhes da implementação.

## Execução local opcional

Requer Python 3.10 ou superior.

```bash
python -m pip install -r requirements.txt
python app.py
```

Depois, acesse `http://127.0.0.1:5000` no navegador.

## Estrutura principal

- `app.py`: aplicação web e rotas da API.
- `grafo.py`: estrutura do grafo e algoritmo de Dijkstra.
- `public/`: interface web.
- `requirements.txt`: dependências do projeto.
- `docs/`: documentação técnica e casos de teste.
