(function () {
    const botaoImportar = document.getElementById("importarBackup");

    if (!botaoImportar) return;

    botaoImportar.addEventListener("click", function () {
        const seletorArquivo = document.createElement("input");
        seletorArquivo.type = "file";
        seletorArquivo.accept = ".json,application/json";

        seletorArquivo.addEventListener("change", function (evento) {
            const arquivo = evento.target.files && evento.target.files[0];

            if (!arquivo) return;

            const leitor = new FileReader();

            leitor.onload = function () {
                try {
                    const conteudo = JSON.parse(String(leitor.result || ""));
                    const vendasImportadas = Array.isArray(conteudo)
                        ? conteudo
                        : conteudo && Array.isArray(conteudo.vendas)
                            ? conteudo.vendas
                            : null;

                    if (!vendasImportadas) {
                        throw new Error("Formato de backup inválido.");
                    }

                    const backupValido = vendasImportadas.every(function (venda) {
                        return venda && typeof venda === "object";
                    });

                    if (!backupValido) {
                        throw new Error("O arquivo contém dados inválidos.");
                    }

                    const confirmar = confirm(
                        "Foram encontradas " + vendasImportadas.length +
                        " venda(s). Deseja substituir os dados atuais por este backup?"
                    );

                    if (!confirmar) return;

                    vendas = vendasImportadas;
                    salvarBanco();
                    atualizarDashboard();
                    carregarHistorico();

                    alert("Backup importado com sucesso! " + vendas.length + " venda(s) restaurada(s).");
                    abrirTela("dashboard");
                } catch (erro) {
                    alert("Não foi possível importar o backup. Selecione um arquivo JSON exportado pelo aplicativo.");
                    console.error("Erro ao importar backup:", erro);
                }
            };

            leitor.onerror = function () {
                alert("Não foi possível ler o arquivo selecionado.");
            };

            leitor.readAsText(arquivo, "UTF-8");
        });

        seletorArquivo.click();
    });
})();
