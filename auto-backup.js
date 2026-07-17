(function () {
    const STORAGE_VENDAS = "samuel_comissoes_pro";
    const STORAGE_CONFIG = "samuel_backup_automatico_config";
    const STORAGE_COPIAS = "samuel_backups_automaticos";
    const LIMITE_COPIAS = 24;

    function lerJson(chave, fallback) {
        try {
            const valor = JSON.parse(localStorage.getItem(chave) || "null");
            return valor ?? fallback;
        } catch (erro) {
            console.warn("Não foi possível ler", chave, erro);
            return fallback;
        }
    }

    function salvarJson(chave, valor) {
        localStorage.setItem(chave, JSON.stringify(valor));
    }

    function configAtual() {
        const salva = lerJson(STORAGE_CONFIG, {});
        return {
            intervaloMeses: Math.min(12, Math.max(1, Number(salva.intervaloMeses) || 12)),
            ultimoBackupEm: salva.ultimoBackupEm || null,
            ultimoAnoVerificado: Number(salva.ultimoAnoVerificado) || new Date().getFullYear(),
            backupPendenteDownload: Boolean(salva.backupPendenteDownload)
        };
    }

    function mesesEntre(inicio, fim) {
        return (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
    }

    function dadosBackup(motivo) {
        const vendas = lerJson(STORAGE_VENDAS, []);
        return {
            aplicativo: "Controle de Vendas PRO",
            versaoBackup: 2,
            motivo,
            geradoEm: new Date().toISOString(),
            vendas: Array.isArray(vendas) ? vendas : []
        };
    }

    function nomeArquivo(backup) {
        const data = new Date(backup.geradoEm).toISOString().slice(0, 10);
        const motivo = backup.motivo === "virada-do-ano" ? "anual" : "periodico";
        return `backup_controle_vendas_${motivo}_${data}.json`;
    }

    function guardarCopiaInterna(backup) {
        const copias = lerJson(STORAGE_COPIAS, []);
        const atualizadas = [backup, ...(Array.isArray(copias) ? copias : [])].slice(0, LIMITE_COPIAS);
        salvarJson(STORAGE_COPIAS, atualizadas);
    }

    function criarBackupAutomatico(motivo) {
        const backup = dadosBackup(motivo);
        guardarCopiaInterna(backup);

        const config = configAtual();
        config.ultimoBackupEm = backup.geradoEm;
        config.ultimoAnoVerificado = new Date().getFullYear();
        config.backupPendenteDownload = true;
        salvarJson(STORAGE_CONFIG, config);
        atualizarPainel();
        return backup;
    }

    function verificarNecessidade() {
        const agora = new Date();
        const config = configAtual();
        const virouAno = agora.getFullYear() > config.ultimoAnoVerificado;

        let venceuIntervalo = false;
        if (config.ultimoBackupEm) {
            const ultimo = new Date(config.ultimoBackupEm);
            venceuIntervalo = !Number.isNaN(ultimo.getTime()) && mesesEntre(ultimo, agora) >= config.intervaloMeses;
        } else {
            venceuIntervalo = true;
        }

        if (virouAno) {
            criarBackupAutomatico("virada-do-ano");
            return;
        }

        if (venceuIntervalo) criarBackupAutomatico("intervalo-configurado");
    }

    async function baixarBackup(backup) {
        if (!backup) return;
        const conteudo = JSON.stringify(backup, null, 2);
        const nome = nomeArquivo(backup);

        if (window.AndroidPdf && typeof window.AndroidPdf.compartilharBackup === "function") {
            try {
                window.AndroidPdf.compartilharBackup(conteudo, nome);
                marcarDownloadConcluido();
                return;
            } catch (erro) {
                console.warn("Falha ao salvar pelo Android:", erro);
            }
        }

        const blob = new Blob([conteudo], { type: "application/json" });
        const arquivo = new File([blob], nome, { type: "application/json" });

        try {
            if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [arquivo] }))) {
                await navigator.share({ title: "Backup automático", files: [arquivo] });
                marcarDownloadConcluido();
                return;
            }
        } catch (erro) {
            if (erro?.name === "AbortError") return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nome;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        marcarDownloadConcluido();
    }

    function marcarDownloadConcluido() {
        const config = configAtual();
        config.backupPendenteDownload = false;
        salvarJson(STORAGE_CONFIG, config);
        atualizarPainel();
    }

    function ultimaCopia() {
        const copias = lerJson(STORAGE_COPIAS, []);
        return Array.isArray(copias) && copias.length ? copias[0] : null;
    }

    function montarPainel() {
        const tela = document.getElementById("backup");
        if (!tela || document.getElementById("backupAutomaticoPainel")) return;

        const painel = document.createElement("section");
        painel.id = "backupAutomaticoPainel";
        painel.innerHTML = `
            <style>
                #backupAutomaticoPainel{margin-top:18px;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.04)}
                #backupAutomaticoPainel h3{margin:0 0 8px;font-size:18px}
                #backupAutomaticoPainel p{margin:7px 0;line-height:1.4}
                #backupAutomaticoPainel label{display:block;margin:14px 0 7px;font-weight:700}
                #backupAutomaticoPainel select{width:100%;min-height:48px;border-radius:12px;padding:0 12px}
                #backupAutomaticoPainel button{width:100%;margin-top:12px}
                #backupAutomaticoStatus{font-size:14px;opacity:.9}
                #backupAutomaticoAviso{display:none;margin-top:12px;padding:12px;border-radius:12px;background:rgba(0,200,120,.12);border:1px solid rgba(0,220,140,.35)}
            </style>
            <h3>Backup automático</h3>
            <p>O fechamento anual é obrigatório: ao entrar em um novo ano, o aplicativo cria uma cópia automática do ano anterior.</p>
            <label for="intervaloBackupAutomatico">Fazer backup também a cada:</label>
            <select id="intervaloBackupAutomatico" aria-label="Intervalo do backup automático"></select>
            <p id="backupAutomaticoStatus"></p>
            <div id="backupAutomaticoAviso">
                <strong>Backup automático pronto.</strong>
                <p>A cópia já está guardada no aplicativo. Toque abaixo para salvar também nos arquivos do telefone.</p>
                <button type="button" id="baixarUltimoBackupAutomatico">Salvar backup no telefone</button>
            </div>
            <button type="button" id="criarBackupAutomaticoAgora">Criar backup automático agora</button>
        `;

        tela.appendChild(painel);

        const select = document.getElementById("intervaloBackupAutomatico");
        select.innerHTML = Array.from({ length: 12 }, (_, i) => {
            const meses = i + 1;
            return `<option value="${meses}">${meses} ${meses === 1 ? "mês" : "meses"}</option>`;
        }).join("");

        select.addEventListener("change", function () {
            const config = configAtual();
            config.intervaloMeses = Number(this.value);
            salvarJson(STORAGE_CONFIG, config);
            atualizarPainel();
        });

        document.getElementById("baixarUltimoBackupAutomatico")?.addEventListener("click", () => baixarBackup(ultimaCopia()));
        document.getElementById("criarBackupAutomaticoAgora")?.addEventListener("click", () => {
            const backup = criarBackupAutomatico("manual-automatico");
            baixarBackup(backup);
        });
    }

    function atualizarPainel() {
        const config = configAtual();
        const select = document.getElementById("intervaloBackupAutomatico");
        const status = document.getElementById("backupAutomaticoStatus");
        const aviso = document.getElementById("backupAutomaticoAviso");

        if (select) select.value = String(config.intervaloMeses);
        if (status) {
            status.textContent = config.ultimoBackupEm
                ? `Último backup automático: ${new Date(config.ultimoBackupEm).toLocaleString("pt-BR")}.`
                : "Nenhum backup automático criado ainda.";
        }
        if (aviso) aviso.style.display = config.backupPendenteDownload ? "block" : "none";
    }

    document.addEventListener("DOMContentLoaded", function () {
        montarPainel();
        verificarNecessidade();
        atualizarPainel();
    });
})();
