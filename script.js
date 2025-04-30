document.getElementById("carForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const marca = document.getElementById("marca").value;
  const modelo = document.getElementById("modelo").value;
  const ano = document.getElementById("ano").value;

  const valorFIPE = 50000; // valor fixo simulado, depois trocamos pela API

  const checkboxes = document.querySelectorAll(".checklist input[type='checkbox']");
  let descontoTotal = 0;

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      descontoTotal += parseFloat(checkbox.value);
    }
  });

  const valorFinal = valorFIPE * (1 - descontoTotal / 100);

  document.getElementById("resultado").innerHTML = `
    <p><strong>Valor FIPE:</strong> R$ ${valorFIPE.toLocaleString()}</p>
    <p><strong>Desconto aplicado:</strong> ${descontoTotal}%</p>
    <p><strong>Valor estimado do carro:</strong> R$ ${valorFinal.toFixed(2).toLocaleString()}</p>
  `;
});