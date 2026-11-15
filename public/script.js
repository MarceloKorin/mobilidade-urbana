const G = { nodes: [], edges: [] };

async function api(url, body) {
    const opcoes = body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }
        : undefined;

    const r = await fetch(url, opcoes);
    const j = await r.json();

    if (!r.ok) {
        throw new Error(j.erro || "Erro no servidor");
    }
    return j;
}

async function load() {
    const j = await api("/api/grafo");
    G.nodes = j.nodes;
    G.edges = j.edges;
}

async function rota(o, d, crit, ig) {
    const j = await api("/api/rota", {
        origem: o,
        destino: d,
        criterio: crit,
        ignorar_bloqueios: ig
    });

    const r = j.resultado;
    if (!r) {
        return null;
    }

    const vias = [];
    for (let i = 0; i < r.caminho.length - 1; i++) {
        const v = G.edges.find(e => e.o === r.caminho[i] && e.d === r.caminho[i + 1]);
        if (v) {
            vias.push(v);
        }
    }

    return {
        caminho: r.caminho,
        vias: vias,
        tempo: r.tempo_total,
        distancia: r.distancia_total
    };
}

async function calc(ig) {
    try {
        S.err = "";
        return await rota(S.o, S.d, S.crit, ig);
    } catch (e) {
        S.err = e.message;
        return null;
    }
}

const S = { p: "geral", o: "CRU-A", d: "CRU-C", crit: "tempo", res: null, err: "", msg: "" };

const $ = s => document.querySelector(s);

const esc = s => String(s).replace(/[&<>"]/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
));

const f = n => (+n.toFixed(2)).toString().replace(".", ",");

const nOpts = sel => G.nodes
    .map(n => `<option ${n === sel ? "selected" : ""}>${esc(n)}</option>`)
    .join("");

function pos() {
    const n = G.nodes.length;
    const p = {};

    G.nodes.forEach((c, i) => {
        const ang = -Math.PI * 0.75 + 2 * Math.PI * i / n;
        p[c] = [300 + 230 * Math.cos(ang), 200 + 135 * Math.sin(ang)];
    });
    return p;
}

function map(route) {
    const P = pos();
    const R = 20;
    const inR = new Set(route ? route.vias : []);

    let h = `<svg viewBox="0 0 600 400"><defs>`;

    [["n", "var(--mu)"], ["r", "var(--gr)"], ["b", "var(--rd)"]].forEach(([id, cor]) => {
        h += `<marker id="m${id}" viewBox="0 0 10 10" refX="8" refY="5"
                markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto">
                <path d="M0 0L10 5L0 10z" fill="${cor}"/></marker>`;
    });
    h += `</defs>`;

    G.edges.forEach(v => {
        const a = P[v.o];
        const b = P[v.d];
        if (!a || !b || v.o === v.d) {
            return;
        }

        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const L = Math.hypot(dx, dy);
        const ux = dx / L;
        const uy = dy / L;
        const off = 26;

        const s = [a[0] + ux * R, a[1] + uy * R];
        const e = [b[0] - ux * (R + 6), b[1] - uy * (R + 6)];
        const cx = (a[0] + b[0]) / 2 - uy * off;
        const cy = (a[1] + b[1]) / 2 + ux * off;

        const k = !v.on ? "b" : inR.has(v) ? "r" : "n";
        const cor = { n: "var(--mu)", r: "var(--gr)", b: "var(--rd)" }[k];
        const tracejado = k === "b" ? 'stroke-dasharray="7 5"' : "";

        h += `<path d="M${s} Q${cx},${cy} ${e}" fill="none" stroke="${cor}"
                stroke-width="${k === "r" ? 4 : 2}" ${tracejado}
                marker-end="url(#m${k})" opacity="${k === "n" ? 0.7 : 1}"/>`;

        const t = 0.3;
        const lx = (1 - t) * (1 - t) * s[0] + 2 * (1 - t) * t * cx + t * t * e[0];
        const ly = (1 - t) * (1 - t) * s[1] + 2 * (1 - t) * t * cy + t * t * e[1];

        h += `<text x="${lx}" y="${ly}" font-size="9" text-anchor="middle"
                fill="${k === "b" ? "var(--rd)" : "var(--tx)"}"
                stroke="var(--map)" stroke-width="4" stroke-linejoin="round"
                paint-order="stroke">${f(v.t * v.c)} min · ${f(v.di)} m</text>`;
    });

    G.nodes.forEach(n => {
        const [x, y] = P[n];
        const first = route && n === route.caminho[0];
        const last = route && n === route.caminho.at(-1);
        const mid = route && route.caminho.includes(n);
        const fill = first ? "var(--gr)" : last ? "var(--rd)" : mid ? "var(--am)" : "var(--nd)";

        h += `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" stroke="#fff" stroke-width="2"/>
              <text x="${x}" y="${y + 4}" font-size="9.5" font-weight="700"
                text-anchor="middle" fill="#fff">${esc(n.length > 7 ? n.slice(-5) : n)}</text>`;

        if (first || last) {
            h += `<text x="${x}" y="${y < 200 ? y - 28 : y + 38}" font-size="10" font-weight="700"
                    text-anchor="middle" fill="${fill}">${first ? "ORIGEM" : "DESTINO"}</text>`;
        }
    });

    return h + "</svg>";
}

function resBox(r, title, cls = "") {
    if (r === null) {
        return `<div class="res err"><b>Nenhuma rota disponível entre os cruzamentos.</b></div>`;
    }
    return `
        <div class="res ${cls}">
            <small>${title}</small>
            <b class="big">${f(r.tempo)} min</b>
            Distância: ${f(r.distancia)} metros<br>
            Saltos: ${r.vias.length} via(s)
            <div class="path">${r.caminho.map(esc).join(" → ")}</div>
        </div>`;
}

function selects() {
    return `
        <label>Cruzamento de origem</label>
        <select data-b="o">${nOpts(S.o)}</select>

        <label>Cruzamento de destino</label>
        <select data-b="d">${nOpts(S.d)}</select>

        <label>Critério de decisão (peso da aresta)</label>
        <button class="opt ${S.crit === "tempo" ? "on" : ""}" data-crit="tempo">• Menor tempo de viagem</button>
        <button class="opt ${S.crit === "distancia" ? "on" : ""}" data-crit="distancia">• Menor distância física</button>`;
}

const P = {

    geral() {
        const ativas = G.edges.filter(v => v.on).length;
        const blk = G.edges.length - ativas;

        return `
            <h2>Centro de Monitoramento da Malha Viária</h2>
            <p class="sub">Visualização topológica dos cruzamentos e vias cadastradas no grafo.</p>

            <div class="grid g4">
                <div class="card k"><small>Cruzamentos</small><b style="color:var(--nd)">${G.nodes.length} nós</b></div>
                <div class="card k"><small>Vias de trânsito</small><b style="color:var(--gr)">${G.edges.length} trechos</b></div>
                <div class="card k"><small>Vias ativas</small><b style="color:var(--am)">${ativas}</b></div>
                <div class="card k"><small>Interdições</small><b style="color:${blk ? "var(--rd)" : "var(--mu)"}">${blk} ocorrência(s)</b></div>
            </div>

            <div class="grid g2" style="margin-top:14px;grid-template-columns:1fr minmax(240px,300px)">
                <div class="card">
                    <h3>Mapa de fluxo viário (grafo direcionado)</h3>
                    ${map(null)}
                </div>

                <div class="card sum">
                    <h3>Resumo estrutural</h3>
                    <div><small>Modelo formal</small>Digrafo ponderado G = (V, E)</div>
                    <div><small>Vértices |V|</small>${G.nodes.length} cruzamentos</div>
                    <div><small>Arestas |E|</small>${G.edges.length} vias direcionadas</div>
                    <div><small>Representação</small>Lista de adjacência</div>
                    <div><small>Critérios de decisão</small>Tempo (× congestionamento), Distância</div>
                    <div><small>Algoritmo</small>Dijkstra com fila de prioridade</div>
                    <button class="btn b-bl" data-p="rotas">Simular trajeto ótimo</button>
                    <button class="btn b-out" data-p="falhas">Reportar incidente / obra</button>
                </div>
            </div>`;
    },

    rotas() {
        let resultado = "";
        if (S.err) {
            resultado = `<div class="res err">${esc(S.err)}</div>`;
        } else if (S.res !== undefined && S.res !== false) {
            const criterio = S.crit === "tempo" ? "menor tempo" : "menor distância";
            resultado = resBox(S.res, "Resultado: " + criterio);
        }

        return `
            <h2>Módulo de Otimização e Cálculo de Rotas</h2>
            <p class="sub">Planejamento de rotas com Dijkstra sob critério de tempo ou distância.</p>

            <div class="grid g2">
                <div class="card">
                    <h3>Parâmetros da rota</h3>
                    ${selects()}
                    <button class="btn b-gr" data-act="calc">CALCULAR ROTA ÓTIMA</button>
                    ${resultado}
                </div>

                <div class="card">
                    <h3>Visualização da rota calculada no mapa</h3>
                    ${map(S.res || null)}
                </div>
            </div>`;
    },

    falhas() {
        const orig = S.fo;
        const atual = S.fa;
        const bloqueadas = G.edges.filter(v => !v.on);

        const botoes = G.edges.map((v, i) => `
            <button class="opt ${v.on ? "" : "on"}"
                style="${v.on ? "" : "background:var(--rd);border-color:var(--rd)"}"
                data-tog="${i}">${v.on ? "Interditar" : "Reabrir"}: ${esc(v.o)} → ${esc(v.d)}</button>`
        ).join("");

        const alertas = bloqueadas.length
            ? bloqueadas.map(v => `<div class="alert">[ALERTA] Via interditada: ${esc(v.o)} → ${esc(v.d)}</div>`).join("")
            : `<div class="res" style="margin:0 0 10px">Nenhuma interdição ativa.</div>`;

        let comparacao = "";
        if (orig && atual) {
            const dt = atual.tempo - orig.tempo;
            const dd = atual.distancia - orig.distancia;
            comparacao = `
                <div class="res alt">
                    <small>Impacto do desvio</small>
                    <b>${dt >= 0 ? "+" : ""}${f(dt)} min | ${dd >= 0 ? "+" : ""}${f(dd)} m</b>
                </div>`;
        }

        return `
            <h2>Centro de Simulação de Falhas e Recálculo Dinâmico</h2>
            <p class="sub">Interdite ou reabra vias e veja o re-roteamento automático.</p>

            <div class="grid g2">
                <div class="card">
                    <h3>Gerenciador de interdições</h3>
                    ${alertas}
                    ${selects()}
                    <label>Alternar status da via</label>
                    ${botoes}

                    <div class="res" style="margin-top:12px">
                        <small>1. Rota original (sem bloqueios)</small>
                        <div class="path" style="color:var(--tx)">${orig ? orig.caminho.map(esc).join(" → ") : "—"}</div>
                        ${orig ? `${f(orig.tempo)} min | ${f(orig.distancia)} m` : ""}
                    </div>

                    ${resBox(atual, "2. Rota recalculada (com bloqueios)", "alt")}
                    ${comparacao}
                    <button class="btn b-gr" data-act="reopen">REABRIR TODAS AS VIAS</button>
                </div>

                <div class="card">
                    <h3>Topologia em incidente</h3>
                    ${map(atual)}
                </div>
            </div>`;
    },

    vias() {
        const linhas = G.edges.map((v, i) => `
            <tr>
                <td>${esc(v.o)}</td>
                <td>${esc(v.d)}</td>
                <td>${f(v.t)} min</td>
                <td>${f(v.di)} m</td>
                <td><input type="number" step="0.1" min="0" value="${v.c}" data-cong="${i}">×</td>
                <td class="st ${v.on ? "ok" : "no"}">${v.on ? "ATIVA" : "INTERDITADA"}</td>
                <td><button class="sm" data-tog="${i}">${v.on ? "Interditar" : "Reabrir"}</button></td>
            </tr>`
        ).join("");

        const mensagem = S.msg
            ? `<div class="res ${S.msg.startsWith("✔") ? "" : "err"}">${esc(S.msg)}</div>`
            : "";

        return `
            <h2>Gestão de Vias</h2>
            <p class="sub">Cadastro de cruzamentos e vias, congestionamento e status.</p>

            <div class="card">
                <h3>Adicionar cruzamento</h3>
                <div class="row">
                    <div><input id="nn" placeholder="Ex.: CRU-E"></div>
                    <div><button class="btn b-bl" style="margin:0" data-act="addnode">Adicionar</button></div>
                </div>
            </div>

            <div class="card" style="margin-top:14px">
                <h3>Adicionar via</h3>
                <div class="row">
                    <div><label>Origem</label><select id="vo">${nOpts()}</select></div>
                    <div><label>Destino</label><select id="vd">${nOpts()}</select></div>
                    <div><label>Tempo (min)</label><input id="vt" type="number" step="0.1" value="3"></div>
                    <div><label>Distância (m)</label><input id="vdi" type="number" value="300"></div>
                    <div><label>Congest.</label><input id="vc" type="number" step="0.1" value="1"></div>
                    <div><button class="btn b-bl" style="margin:0" data-act="addvia">Adicionar</button></div>
                </div>
            </div>

            ${mensagem}

            <div class="card tw" style="margin-top:14px">
                <h3>Tabela de vias cadastradas no digrafo</h3>
                <table>
                    <tr>
                        <th>Origem</th><th>Destino</th><th>Tempo base</th>
                        <th>Distância</th><th>Congest.</th><th>Status</th><th></th>
                    </tr>
                    ${linhas}
                </table>
            </div>`;
    }
};

async function render() {
    if (S.p === "falhas") {
        S.fo = await calc(true);
        S.fa = await calc(false);
    }

    document.querySelectorAll("nav button").forEach(b => {
        b.classList.toggle("on", b.dataset.p === S.p);
    });

    const temBloqueio = G.edges.some(v => !v.on);
    const pill = $("#pill");
    pill.textContent = temBloqueio ? "Malha: com interdições" : "Malha: operando 100%";
    pill.className = "pill" + (temBloqueio ? " bad" : "");

    $("#app").innerHTML = P[S.p]();
}

document.addEventListener("click", async e => {
    const t = e.target.closest("[data-p],[data-crit],[data-act],[data-tog]");
    if (!t) {
        return;
    }

    try {
        if (t.dataset.p) {
            S.p = t.dataset.p;
            S.res = undefined;
            S.err = "";
            S.msg = "";
        }

        if (t.dataset.crit) {
            S.crit = t.dataset.crit;
            S.res = undefined;
        }

        if (t.dataset.tog !== undefined) {
            const v = G.edges[+t.dataset.tog];
            await api("/api/via/status", { origem: v.o, destino: v.d, ativa: !v.on });
            await load();
        }

        const a = t.dataset.act;

        if (a === "calc") {
            S.res = await calc(false);
        }

        if (a === "reopen") {
            await api("/api/reabrir-todas", {});
            await load();
        }

        if (a === "addnode") {
            const n = $("#nn").value.trim();
            if (!n) {
                throw new Error("Informe o nome do cruzamento.");
            }
            await api("/api/cruzamento", { nome: n });
            await load();
            S.msg = "✔ Cruzamento " + n + " adicionado.";
        }

        if (a === "addvia") {
            await api("/api/via", {
                origem: $("#vo").value,
                destino: $("#vd").value,
                tempo: +$("#vt").value,
                distancia: +$("#vdi").value,
                congestionamento: +$("#vc").value
            });
            await load();
            S.msg = "✔ Via adicionada.";
        }
    } catch (x) {
        S.msg = x.message;
    }

    await render();
});

document.addEventListener("change", async e => {
    const t = e.target;

    if (t.dataset.b === undefined && t.dataset.cong === undefined) {
        return;
    }

    if (t.dataset.b) {
        S[t.dataset.b] = t.value;
        S.res = undefined;
    }

    if (t.dataset.cong !== undefined) {
        const v = G.edges[+t.dataset.cong];
        try {
            await api("/api/via/congestionamento", { origem: v.o, destino: v.d, fator: +t.value });
            await load();
            S.msg = "";
        } catch (x) {
            S.msg = x.message;
        }
    }

    await render();
});

(async () => {
    try {
        await load();
    } catch (x) {
        S.msg = "Backend offline: " + x.message;
    }
    await render();
})();
