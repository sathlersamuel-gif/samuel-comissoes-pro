(function () {
    function formatarTelefone(valor) {
        const numeros = String(valor || "").replace(/\D/g, "").slice(0, 11);

        if (!numeros) return "";
        if (numeros.length <= 2) return `(${numeros}`;
        if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        if (numeros.length <= 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        }
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    function ativarMascaraTelefone() {
        const campo = document.getElementById("telefone");
        if (!campo || campo.dataset.mascaraTelefoneAtiva === "1") return;

        campo.dataset.mascaraTelefoneAtiva = "1";
        campo.setAttribute("inputmode", "numeric");
        campo.setAttribute("maxlength", "15");
        campo.setAttribute("autocomplete", "tel");

        const aplicarMascara = function () {
            this.value = formatarTelefone(this.value);
        };

        campo.addEventListener("input", aplicarMascara);
        campo.addEventListener("change", aplicarMascara);
        campo.addEventListener("blur", aplicarMascara);
        campo.value = formatarTelefone(campo.value);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ativarMascaraTelefone);
    } else {
        ativarMascaraTelefone();
    }

    window.formatarTelefoneCliente = formatarTelefone;
})();
