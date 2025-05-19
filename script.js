document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://parallelum.com.br/fipe/api/v1/carros";
  const marcaSelect = document.getElementById("marca");
  const modeloSelect = document.getElementById("modelo");
  const anoSelect = document.getElementById("ano");
  const valorFipeDiv = document.getElementById("valor-fipe");
  const resultadoContainer = document.getElementById("resultado-container");
  const valorFipeResultado = document.getElementById("valor-fipe-resultado");
  const descontoResultado = document.getElementById("desconto-resultado");
  const valorFinalResultado = document.getElementById("valor-final-resultado");
  const condicaoResultado = document.getElementById("condicao-resultado");
  const progressBar = document.getElementById("progress-bar");
  const progressPercentage = document.getElementById("progress-percentage");

  let valorFipeAtual = 0;
  
  // Inicializar tooltips do Bootstrap
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Carregar marcas
  async function carregarMarcas() {
    try {
      const res = await fetch(`${baseUrl}/marcas`);
      const marcas = await res.json();
      marcaSelect.innerHTML = '<option selected disabled>Selecione</option>';
      marcas.forEach(marca => {
        const opt = document.createElement("option");
        opt.value = marca.codigo;
        opt.textContent = marca.nome;
        marcaSelect.appendChild(opt);
      });
    } catch (error) {
      console.error("Erro ao carregar marcas:", error);
      valorFipeDiv.textContent = "Erro ao carregar dados. Por favor, tente novamente mais tarde.";
      valorFipeDiv.classList.add("text-danger");
    }
  }

  // Carregar modelos
  marcaSelect.addEventListener("change", async () => {
    try {
      modeloSelect.innerHTML = '<option selected disabled>Carregando...</option>';
      anoSelect.innerHTML = '<option selected disabled>Selecione</option>';
      
      const marcaId = marcaSelect.value;
      const res = await fetch(`${baseUrl}/marcas/${marcaId}/modelos`);
      const data = await res.json();
      
      modeloSelect.innerHTML = '<option selected disabled>Selecione</option>';
      data.modelos.forEach(modelo => {
        const opt = document.createElement("option");
        opt.value = modelo.codigo;
        opt.textContent = modelo.nome;
        modeloSelect.appendChild(opt);
      });
      
      atualizarProgresso();
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      modeloSelect.innerHTML = '<option selected disabled>Erro ao carregar</option>';
    }
  });

  // Carregar anos
  modeloSelect.addEventListener("change", async () => {
    try {
      anoSelect.innerHTML = '<option selected disabled>Carregando...</option>';
      
      const marcaId = marcaSelect.value;
      const modeloId = modeloSelect.value;
      const res = await fetch(`${baseUrl}/marcas/${marcaId}/modelos/${modeloId}/anos`);
      const anos = await res.json();
      
      anoSelect.innerHTML = '<option selected disabled>Selecione</option>';
      anos.forEach(ano => {
        const opt = document.createElement("option");
        opt.value = ano.codigo;
        opt.textContent = ano.nome;
        anoSelect.appendChild(opt);
      });
      
      atualizarProgresso();
    } catch (error) {
      console.error("Erro ao carregar anos:", error);
      anoSelect.innerHTML = '<option selected disabled>Erro ao carregar</option>';
    }
  });

  // Buscar valor FIPE
  anoSelect.addEventListener("change", async () => {
    try {
      valorFipeDiv.textContent = "Carregando valor...";
      
      const marcaId = marcaSelect.value;
      const modeloId = modeloSelect.value;
      const anoId = anoSelect.value;
      const res = await fetch(`${baseUrl}/marcas/${marcaId}/modelos/${modeloId}/anos/${anoId}`);
      const dados = await res.json();
      
      valorFipeAtual = parseFloat(dados.Valor.replace("R$", "").replace(".", "").replace(",", "."));
      valorFipeDiv.textContent = `Valor original da Tabela FIPE: ${dados.Valor}`;
      valorFipeDiv.classList.add("fade-in");
      
      atualizarProgresso();
    } catch (error) {
      console.error("Erro ao buscar valor FIPE:", error);
      valorFipeDiv.textContent = "Erro ao buscar valor FIPE. Por favor, tente novamente.";
      valorFipeDiv.classList.add("text-danger");
    }
  });

  // Atualizar barra de progresso
  function atualizarProgresso() {
    const totalItens = document.querySelectorAll(".checklist-item").length + 3; // +3 para marca, modelo e ano
    let itensSelecionados = 0;
    
    // Verificar se marca, modelo e ano foram selecionados
    if (marcaSelect.value && marcaSelect.value !== "Selecione") itensSelecionados++;
    if (modeloSelect.value && modeloSelect.value !== "Selecione") itensSelecionados++;
    if (anoSelect.value && anoSelect.value !== "Selecione") itensSelecionados++;
    
    // Verificar itens do checklist
    document.querySelectorAll(".checklist-item").forEach(item => {
      if (item.value !== "") itensSelecionados++;
    });
    
    const porcentagem = Math.round((itensSelecionados / totalItens) * 100);
    progressBar.style.width = `${porcentagem}%`;
    progressBar.setAttribute("aria-valuenow", porcentagem);
    progressPercentage.textContent = `${porcentagem}%`;
  }

  // Adicionar evento change a todos os itens do checklist
  document.querySelectorAll(".checklist-item").forEach(item => {
    item.addEventListener("change", atualizarProgresso);
  });

  // Cálculo final do checklist
  document.getElementById("checklist-form").addEventListener("submit", function (e) {
    e.preventDefault();

    if (isNaN(valorFipeAtual) || valorFipeAtual === 0) {
      alert("Por favor, selecione marca, modelo e ano primeiro.");
      return;
    }

    const itens = document.querySelectorAll(".checklist-item");
    let fatorTotal = 0;
    let notaTotal = 0;

    itens.forEach(item => {
      const valor = item.value;
      if (valor === "regular") {
        fatorTotal += parseFloat(item.dataset.regular || 0);
        notaTotal += 1;
      } else if (valor === "ruim") {
        fatorTotal += parseFloat(item.dataset.ruim || 0);
        notaTotal += 2;
      } else if (valor === "grande") {
        fatorTotal += parseFloat(item.dataset.grande || 0);
        notaTotal += 3;
      }
    });

    const media = notaTotal / itens.length;
    const valorDescontado = valorFipeAtual * fatorTotal;
    const valorFinal = valorFipeAtual - valorDescontado;

    let condicao = "";
    let condicaoClass = "";

    // Regra extra: se valor estimado < 50% da FIPE, condição é automaticamente "Ruim"
    if (valorFinal < valorFipeAtual * 0.5) {
      condicao = "Ruim ❌";
      condicaoClass = "condition-bad";
    } else if (media <= 0.5) {
      condicao = "Bom ✅";
      condicaoClass = "condition-good";
    } else if (media <= 1.2) {
      condicao = "Aceitável ⚠️";
      condicaoClass = "condition-acceptable";
    } else {
      condicao = "Ruim ❌";
      condicaoClass = "condition-bad";
    }

    // Atualizar resultados
    valorFipeResultado.textContent = valorFipeAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    descontoResultado.textContent = valorDescontado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    valorFinalResultado.textContent = valorFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    condicaoResultado.textContent = condicao;
    condicaoResultado.className = "";
    condicaoResultado.classList.add(condicaoClass, "fs-3", "fw-bold", "mt-2");
    
    // Mostrar container de resultados com animação
    resultadoContainer.style.display = "block";
    resultadoContainer.classList.add("fade-in");
    
    // Scroll suave até os resultados
    resultadoContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Inicializar
  carregarMarcas();
  atualizarProgresso();
});
