// =======================================================
// CONFIGURAÇÃO CORE DO BANCO DE DADOS DO CASSINO
// =======================================================
const API_URL = "https://script.google.com/macros/s/AKfycby4BK37x394VZA6iCBE5Si15ye_mSdCLN8msNQPTRNmyCNxhvYbTyi40gvFm_n-2D2XmA/exec";
const POOL_EMOJIS = ['🦊', '💀', '⛩️', '🗡️', '🧿', '💎'];
let MESTRE_PLAYER_ID = null;
let MODALIDADE_ATIVA = "slots";

function mudarAbaJogo(jogo, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.game-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`game-${jogo}`).classList.add('active');
    MODALIDADE_ATIVA = jogo;
}

// LOGA E DESTRAVA A JANELA DE PARANAUÊ
async function conectarBanca() {
    const id = document.getElementById('p-id').value.trim();
    const pass = document.getElementById('p-pass').value.trim();
    if (!id || !pass) return alert('Insira ID e Senha!');

    document.getElementById('status-txt').innerText = "Verificando credenciais...";
    try {
        const response = await fetch(API_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'login', playerId: id, playerPass: pass })
        });
        const data = await response.json();
        if (data.success) {
            MESTRE_PLAYER_ID = id;
            document.getElementById('status-lbl-nome').innerText = data.playerName;

//=========================================================================================
            atualizarPainelStatusJogador();

            document.getElementById('painel-autenticacao').style.display = 'none';
            document.getElementById('status-box-flutuante').style.display = 'block';
            document.getElementById('abas-jogos-box').style.display = 'flex';
            document.getElementById('bloco-controles-aposta').style.display = 'flex';
            document.getElementById('status-txt').innerText = "Alavanca destravada!";
        } else { alert(data.message); }
    } catch (e) { document.getElementById('status-txt').innerText = "Erro ao autenticar."; }
}

// ATUALIZA O PAINEL DE SALDO
async function atualizarPainelStatusJogador() {
    if (!MESTRE_PLAYER_ID) return;
    try {
        const response = await fetch(API_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'buscarRanking', playerId: MESTRE_PLAYER_ID })
        });
        const data = await response.json();
        if (data.success) {
            const meuStatus = data.statusData.find(s => String(s.id).trim().toLowerCase() === MESTRE_PLAYER_ID.toLowerCase());
            const meuLogin = data.jogadores.find(j => String(j.id).trim().toLowerCase() === MESTRE_PLAYER_ID.toLowerCase());
            if (meuStatus) document.getElementById('status-lbl-saldo').innerText = Number(meuStatus.dinheiro).toLocaleString('pt-BR');
            if (meuLogin) document.getElementById('status-lbl-vila').innerText = meuLogin.vila;
        }
    } catch (e) { }
}

// EXECUTA A JOGADA NA BANCA EM TERRAS DISTANTES
async function dispararApostaBanca() {
    if (!MESTRE_PLAYER_ID) return;
    const btn = document.getElementById('btn-alavanca-master');
    const quantia = Number(document.getElementById('quantia-aposta').value);
    const alvoRoleta = document.getElementById('aposta-alvo-roleta').value;

    const s1 = document.getElementById('sl-1'); const s2 = document.getElementById('sl-2'); const s3 = document.getElementById('sl-3');
    const dBox = document.getElementById('dado-box'); const rLbl = document.getElementById('roleta-resultado-lbl');

    btn.disabled = true;
    if (MODALIDADE_ATIVA === 'slots') { s1.classList.add('girando'); s2.classList.add('girando'); s3.classList.add('girando'); }
    if (MODALIDADE_ATIVA === 'dados') { dBox.classList.add('girando'); dBox.innerText = "🎲"; }
    if (MODALIDADE_ATIVA === 'roleta') { rLbl.classList.add('girando'); rLbl.innerText = "🌀 ROLETANDO..."; }

    try {
        const response = await fetch(API_URL, {
            method: 'POST', headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ acao: 'rodarCassinoEMultiJogos', playerId: MESTRE_PLAYER_ID, aposta: quantia, modalidade: MODALIDADE_ATIVA, alvo: alvoRoleta })
        });
        const data = await response.json();

        s1.classList.remove('girando'); s2.classList.remove('girando'); s3.classList.remove('girando');
        dBox.classList.remove('girando'); rLbl.classList.remove('girando'); btn.disabled = false;

        if (data.success) {
            if (MODALIDADE_ATIVA === 'slots') {
                s1.innerText = data.visualSlot; s2.innerText = POOL_EMOJIS[Math.floor(Math.random() * 6)]; s3.innerText = data.visualSlot;
                if (data.message.indexOf('JACKPOT') !== -1) { s1.innerText = data.visualSlot; s2.innerText = data.visualSlot; s3.innerText = data.visualSlot; }
            } else if (MODALIDADE_ATIVA === 'dados') { dBox.innerText = data.visualDado; }
            else if (MODALIDADE_ATIVA === 'roleta') { rLbl.innerText = "Sorteado: " + data.visualRoleta.toUpperCase(); }
            alert(data.message);
            atualizarPainelStatusJogador(); // Atualiza a Janela de Status com o novo saldo em tempo real!
        } else { alert(data.message); }
    } catch (e) { btn.disabled = false; alert('Erro ao processar aposta.'); }
}
