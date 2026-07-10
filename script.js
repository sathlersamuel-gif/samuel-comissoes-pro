function formatarMoeda(valor){
  return valor.toLocaleString('pt-BR',{
    style:'currency',
    currency:'BRL'
  });
}

const vendas = JSON.parse(localStorage.getItem("vendas")) || [];

function atualizarTabela(){

const tbody=document.getElementById("tbody");
const total=document.getElementById("total");

tbody.innerHTML="";

let soma=0;

vendas.forEach((venda,i)=>{

soma+=venda.comissao;

tbody.innerHTML+=`
<tr>
<td>${venda.cliente}</td>
<td>${venda.modelo}</td>
<td>${formatarMoeda(venda.comissao)}</td>
<td>
<button class="excluir" onclick="excluir(${i})">
Excluir
</button>
</td>
</tr>
`;

});

total.innerHTML=formatarMoeda(soma);

localStorage.setItem("vendas",JSON.stringify(vendas));

}

function salvarVenda(){

const cliente=document.getElementById("cliente").value;

const modelo=document.getElementById("modelo").value;

const valor=parseFloat(
document.getElementById("valor").value
.replace(/\./g,"")
.replace(",",".")
);

const perc=parseFloat(
document.getElementById("perc").value.replace(",",".")
);

if(!cliente || !modelo || isNaN(valor)){
alert("Preencha todos os campos.");
return;
}

const comissao=valor*(perc/100);

vendas.push({
cliente,
modelo,
valor,
comissao
});

document.getElementById("cliente").value="";
document.getElementById("modelo").value="";
document.getElementById("valor").value="";

atualizarTabela();

}

function excluir(i){

if(confirm("Excluir venda?")){
vendas.splice(i,1);
atualizarTabela();
}

}

document.getElementById("valor").addEventListener("input",function(e){

let v=e.target.value.replace(/\D/g,'');

v=(Number(v)/100).toLocaleString('pt-BR',{
minimumFractionDigits:2
});

e.target.value=v;

});

atualizarTabela();
