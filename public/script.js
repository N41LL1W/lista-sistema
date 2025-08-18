document.addEventListener("DOMContentLoaded", () => {
  // --- SELETORES DE ELEMENTOS ---

  // Containers Principais
  const authContainer = document.getElementById("auth-container");
  const appContainer = document.getElementById("app-container");
  const loader = document.getElementById("loader");

  // Autenticação
  const loginView = document.getElementById("login-view");
  const registroView = document.getElementById("registro-view");
  const loginForm = document.getElementById("login-form");
  const registroForm = document.getElementById("registro-form");
  const mostrarRegistroLink = document.getElementById("mostrar-registro");
  const mostrarLoginLink = document.getElementById("mostrar-login");
  const loginEmailInput = document.getElementById("login-email");
  const loginSenhaInput = document.getElementById("login-senha");
  const registroEmailInput = document.getElementById("registro-email");
  const registroSenhaInput = document.getElementById("registro-senha");
  const loginFeedback = document.getElementById("login-feedback");
  const registroFeedback = document.getElementById("registro-feedback");
  const usuarioLogadoSpan = document.getElementById("usuario-logado");
  const logoutBtn = document.getElementById("logout-btn");

  // Aplicação Principal
  const listaManager = document.getElementById("lista-manager");
  const listaEditor = document.getElementById("lista-editor");
  const modoCompra = document.getElementById("modo-compra");
  const novaListaNomeInput = document.getElementById("nova-lista-nome");
  const criarListaBtn = document.getElementById("criar-lista-btn");
  const listasSalvasUL = document.getElementById("listas-salvas-ul");
  const listaTitulo = document.getElementById("lista-titulo");
  const novoItemListaInput = document.getElementById("novo-item-lista");
  const novaCategoriaInput = document.getElementById("nova-categoria-item");
  const adicionarItemListaBtn = document.getElementById(
    "adicionar-item-lista-btn"
  );
  const itensListaUL = document.getElementById("itens-lista");
  const voltarBtn = document.getElementById("voltar-btn");
  const iniciarCompraBtn = document.getElementById("iniciar-compra-btn");
  const compraTitulo = document.getElementById("compra-titulo");
  const novoItemCompraInput = document.getElementById("novo-item-compra");
  const adicionarItemCompraBtn = document.getElementById(
    "adicionar-item-compra-btn"
  );
  const itensCompraUL = document.getElementById("itens-compra");
  const voltarCompraBtn = document.getElementById("voltar-compra-btn");
  const resetCompraBtn = document.getElementById("reset-compra-btn");
  const finalizarCompraBtn = document.getElementById("finalizar-compra-btn");
  const salvarComoModeloBtn = document.getElementById("salvar-como-modelo-btn");
  const criarFromModeloBtn = document.getElementById("criar-from-modelo-btn");
  const modeloSelect = document.getElementById("modelo-select");
  const novaListaFromModeloNomeInput = document.getElementById(
    "nova-lista-from-modelo-nome"
  );
  const compartilharBtn = document.getElementById("compartilhar-btn");
  const modoListaBtn = document.getElementById("modo-lista-btn");
  const modoVisualBtn = document.getElementById("modo-visual-btn");
  const editorListaContainer = document.getElementById(
    "editor-lista-container"
  );
  const editorVisualContainer = document.getElementById(
    "editor-visual-container"
  );
  const nuvemItensContainer = document.getElementById("nuvem-itens");
  const caixasCategoriasContainer = document.getElementById(
    "caixas-categorias-container"
  );
  const novaCaixaCategoriaNomeInput = document.getElementById(
    "nova-caixa-categoria-nome"
  );
  const criarCaixaCategoriaBtn = document.getElementById(
    "criar-caixa-categoria-btn"
  );
  const modalHistorico = document.getElementById("modal-historico");
  const fecharModalHistoricoBtn = document.getElementById(
    "fechar-modal-historico"
  );
  const historicoTituloItem = document.getElementById("historico-titulo-item");
  const historicoListaPrecos = document.getElementById(
    "historico-lista-precos"
  );

  // --- ESTADO DA APLICAÇÃO ---
  let listaAtivaId = null;
  let itensAtivos = [];
  // A variável 'itemArrastado' foi removida, pois não é mais necessária com a biblioteca SortableJS.

  // --- LÓGICA DE AUTENTICAÇÃO ---
  const mostrarFeedback = (elemento, mensagem, tipo = "erro") => {
    if (elemento) {
      elemento.textContent = mensagem;
      elemento.className = `feedback-msg ${tipo}`;
      setTimeout(() => {
        if (elemento) {
          elemento.textContent = "";
          elemento.className = "feedback-msg";
        }
      }, 3000);
    }
  };

  const alternarAuthView = (view) => {
    if (view === "registro") {
      loginView.style.display = "none";
      registroView.style.display = "block";
    } else {
      loginView.style.display = "block";
      registroView.style.display = "none";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const senha = loginSenhaInput.value;
    mostrarFeedback(loginFeedback, "Verificando...", "info");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      // SUCESSO: Atualiza a UI diretamente, sem chamar verificarStatusLogin()
      authContainer.style.display = "none";
      appContainer.style.display = "block";
      usuarioLogadoSpan.textContent = data.usuario.email;
      iniciarAppPrincipal();
    } catch (error) {
      mostrarFeedback(loginFeedback, error.message, "erro");
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    const email = registroEmailInput.value;
    const senha = registroSenhaInput.value;
    try {
      const response = await fetch("/api/auth/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }
      mostrarFeedback(
        loginFeedback,
        "Registro bem-sucedido! Faça o login.",
        "sucesso"
      );
      alternarAuthView("login");
      registroForm.reset();
    } catch (error) {
      mostrarFeedback(registroFeedback, error.message);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    location.reload();
  };

  const verificarStatusLogin = async () => {
    try {
      const response = await fetch("/api/auth/status");
      const data = await response.json();
      if (data.logado) {
        authContainer.style.display = "none";
        appContainer.style.display = "block";
        usuarioLogadoSpan.textContent = data.usuario.email;
        iniciarAppPrincipal();
      } else {
        authContainer.style.display = "block";
        appContainer.style.display = "none";
      }
    } catch (error) {
      // Se a verificação falhar (ex: servidor offline), apenas mostra a tela de login.
      authContainer.style.display = "block";
      appContainer.style.display = "none";
    }
  };

  const iniciarAppPrincipal = () => {
    // --- Funções de Controle de UI ---
    const mostrarLoader = () => (loader.style.display = "flex");
    const esconderLoader = () => (loader.style.display = "none");

    const mostrarManager = () => {
      listaManager.style.display = "block";
      listaEditor.style.display = "none";
      modoCompra.style.display = "none";
      carregarListas();
    };

    const mostrarEditor = (listaId, nomeLista) => {
      listaAtivaId = listaId;
      listaTitulo.textContent = `Lista: ${nomeLista}`;
      listaManager.style.display = "none";
      listaEditor.style.display = "block";
      modoCompra.style.display = "none";
      alternarModoEdicao("lista");
      carregarItensDaLista(listaId);
    };

    const mostrarCompra = (nomeLista) => {
      compraTitulo.textContent = `Em Compra: ${nomeLista}`;
      listaManager.style.display = "none";
      listaEditor.style.display = "none";
      modoCompra.style.display = "block";
      carregarItensDaLista(listaAtivaId).then(() => renderizarItensCompra());
    };

    const alternarModoEdicao = (modo) => {
      if (modo === "visual") {
        editorListaContainer.style.display = "none";
        editorVisualContainer.style.display = "block";
        modoListaBtn.classList.remove("ativo");
        modoVisualBtn.classList.add("ativo");
        renderizarModoVisual();
      } else {
        // modo 'lista'
        editorListaContainer.style.display = "block";
        editorVisualContainer.style.display = "none";
        modoListaBtn.classList.add("ativo");
        modoVisualBtn.classList.remove("ativo");
      }
    };

    // --- Funções de Lógica e API ---
    const executarAcaoBackend = async (acao) => {
      mostrarLoader();
      try {
        await acao();
      } catch (error) {
        console.error("Erro na ação de backend:", error);
        alert("Ocorreu um erro. Tente novamente.");
      } finally {
        esconderLoader();
      }
    };

    const carregarListas = async () => {
      mostrarLoader();
      try {
        const response = await fetch("/api/listas");
        if (response.status === 401) return handleLogout();
        if (!response.ok)
          throw new Error(`Erro do servidor: ${response.status}`);
        const data = await response.json();
        renderizarListasEModelos(data);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      } finally {
        esconderLoader();
      }
    };

    const carregarItensDaLista = async (listaId) => {
      mostrarLoader();
      try {
        const response = await fetch(`/api/listas/${listaId}/itens`);
        if (response.status === 401) return handleLogout();
        if (!response.ok)
          throw new Error(`Erro do servidor: ${response.status}`);
        const itens = await response.json();
        if (Array.isArray(itens)) {
          itensAtivos = itens.map((item) => ({
            ...item,
            comprado: !!item.comprado,
          }));
        } else {
          itensAtivos = [];
        }
        renderizarItensLista();
      } catch (error) {
        console.error("Erro ao carregar itens da lista:", error);
        itensAtivos = [];
        renderizarItensLista();
      } finally {
        esconderLoader();
      }
    };

    // --- Funções de Renderização ---
    const renderizarListasEModelos = (data) => {
      listasSalvasUL.innerHTML = "";
      if (data.listas.length === 0) {
        listasSalvasUL.innerHTML =
          '<li style="color: #6c757d; font-style: italic;">Nenhuma lista salva. Crie uma!</li>';
      } else {
        data.listas.forEach((lista) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="nome-lista-salva">${lista.nome_lista}</span><div class="botoes-lista"><button class="abrir-lista-btn" data-id="${lista.id}" data-nome="${lista.nome_lista}">Abrir</button><button class="deletar-lista-btn" data-id="${lista.id}">Deletar</button></div>`;
          listasSalvasUL.appendChild(li);
        });
      }
      modeloSelect.innerHTML =
        '<option value="">-- Selecione um Modelo --</option>';
      if (data.templates.length > 0) {
        data.templates.forEach((template) => {
          const option = document.createElement("option");
          option.value = template.id;
          option.textContent = template.nome_lista;
          modeloSelect.appendChild(option);
        });
      }
    };
    const renderizarItensLista = () => {
      itensListaUL.innerHTML = "";
      iniciarCompraBtn.disabled = itensAtivos.length === 0;

      const categoriasSugeridas = document.getElementById(
        "categorias-sugeridas"
      );
      const categoriasExistentes = [
        ...new Set(itensAtivos.map((item) => item.categoria).filter(Boolean)),
      ];
      categoriasSugeridas.innerHTML = categoriasExistentes
        .map((c) => `<option value="${c}"></option>`)
        .join("");

      if (itensAtivos.length === 0) {
        itensListaUL.innerHTML =
          '<li style="color: #6c757d; font-style: italic;">Adicione itens a esta lista.</li>';
        return;
      }

      let categoriaAtual = "---";
      itensAtivos.forEach((item) => {
        if (item.categoria !== categoriaAtual) {
          categoriaAtual = item.categoria;
          const categoriaHeader = document.createElement("li");
          categoriaHeader.className = "categoria-header";
          categoriaHeader.textContent = categoriaAtual || "Sem Categoria";
          itensListaUL.appendChild(categoriaHeader);
        }

        const li = document.createElement("li");
        li.className = "item-editavel";
        li.dataset.itemId = item.id;
        li.innerHTML = `
                    <div class="info-item-editavel">
                        <span class="nome-item-editavel">${
                          item.nome_item
                        }</span>
                        <span class="categoria-item-editavel">${
                          item.categoria || "Sem Categoria"
                        }</span>
                    </div>
                    <button class="deletar-item-btn" data-id="${
                      item.id
                    }">Deletar</button>`;
        itensListaUL.appendChild(li);
      });
    };
    const renderizarItensCompra = () => {
      itensAtivos.sort((a, b) => a.comprado - b.comprado);
      itensCompraUL.innerHTML = "";

      if (itensAtivos.length === 0) {
        itensCompraUL.innerHTML =
          '<li style="color: #6c757d; font-style: italic;">Sua lista de compras está vazia.</li>';
      } else {
        let categoriaAtual = "---";
        let cabecalhoCompradosAdicionado = false;
        itensAtivos.forEach((item) => {
          if (item.comprado && !cabecalhoCompradosAdicionado) {
            const compradoHeader = document.createElement("li");
            compradoHeader.className = "categoria-header comprado-header";
            compradoHeader.textContent = "Itens no Carrinho";
            itensCompraUL.appendChild(compradoHeader);
            cabecalhoCompradosAdicionado = true;
          } else if (!item.comprado && item.categoria !== categoriaAtual) {
            categoriaAtual = item.categoria;
            const categoriaHeader = document.createElement("li");
            categoriaHeader.className = "categoria-header";
            categoriaHeader.textContent = categoriaAtual || "Sem Categoria";
            itensCompraUL.appendChild(categoriaHeader);
          }
          const subtotal = (item.valor_unitario || 0) * (item.quantidade || 1);
          const li = document.createElement("li");
          li.className = `lista-item ${item.comprado ? "comprado" : ""}`;
          li.dataset.id = item.id;
          li.dataset.nomeItem = item.nome_item;
          li.innerHTML = `
                        <div class="item-info"><input type="checkbox" class="item-checkbox" ${
                          item.comprado ? "checked" : ""
                        }><span class="item-nome">${item.nome_item}</span></div>
                        <div class="item-detalhes">
                            <div class="item-inputs"><input type="number" class="valor-input" placeholder="R$" step="0.01" value="${
                              item.valor_unitario || ""
                            }"><span>x</span><input type="number" class="quantidade-input" placeholder="Qtd" value="${
            item.quantidade || 1
          }"></div>
                            <div class="item-total">
                                <span>R$ ${subtotal.toFixed(2)}</span>
                                <span class="historico-btn" title="Ver histórico de preços">📈</span>
                            </div>
                        </div>`;
          itensCompraUL.appendChild(li);
        });
      }
      renderizarTotais();
    };
    const renderizarTotais = () => {
      const totalLista = itensAtivos.reduce(
        (acc, item) =>
          acc + (item.valor_unitario || 0) * (item.quantidade || 1),
        0
      );
      const totalCarrinho = itensAtivos.reduce(
        (acc, item) =>
          item.comprado
            ? acc + (item.valor_unitario || 0) * (item.quantidade || 1)
            : acc,
        0
      );
      document.getElementById("total-lista").textContent =
        totalLista.toFixed(2);
      document.getElementById("total-carrinho").textContent =
        totalCarrinho.toFixed(2);
    };
    const criarCaixaCategoria = (nomeCategoria) => {
      const categoriaReal = nomeCategoria || "";
      const caixa = document.createElement("div");
      caixa.className = "caixa-categoria";
      caixa.dataset.categoria = categoriaReal;
      caixa.innerHTML = `<h4>${nomeCategoria || "Sem Categoria"}</h4>`;
      caixasCategoriasContainer.appendChild(caixa);
      new Sortable(caixa, {
        group: "shared",
        animation: 150,
        onAdd: function (evt) {
          const nomeItem = evt.item.textContent;
          const categoriaDestino = evt.to.dataset.categoria;
          evt.item.remove();
          executarAcaoBackend(async () => {
            await fetch(`/api/listas/${listaAtivaId}/itens`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nome_item: nomeItem,
                categoria: categoriaDestino,
              }),
            });
            await carregarItensDaLista(listaAtivaId);
          });
        },
      });
    };
    const renderizarModoVisual = async () => {
      nuvemItensContainer.innerHTML = "";
      caixasCategoriasContainer.innerHTML = "";
      new Sortable(nuvemItensContainer, {
        group: { name: "shared", pull: "clone", put: false },
        animation: 150,
        sort: false,
      });
      mostrarLoader();
      try {
        const response = await fetch("/api/itens/unicos");
        const itensUnicos = await response.json();
        itensUnicos.forEach((nomeItem) => {
          const itemSpan = document.createElement("span");
          itemSpan.className = "item-nuvem";
          itemSpan.textContent = nomeItem;
          itemSpan.draggable = true;
          itemSpan.addEventListener("dragstart", handleDragStart);
          itemSpan.addEventListener("dragend", handleDragEnd);
          nuvemItensContainer.appendChild(itemSpan);
        });
      } catch (error) {
        console.error("Erro ao carregar nuvem de itens", error);
        nuvemItensContainer.textContent = "Não foi possível carregar os itens.";
      } finally {
        esconderLoader();
      }
      const categoriasAtuais = [
        ...new Set(itensAtivos.map((item) => item.categoria)),
      ];
      if (categoriasAtuais.includes(null) || categoriasAtuais.length === 0) {
        if (!categoriasAtuais.includes(null)) categoriasAtuais.push(null);
      }
      categoriasAtuais
        .sort()
        .forEach((categoria) => criarCaixaCategoria(categoria));
    };
    const fecharHistorico = () => {
      modalHistorico.style.display = "none";
    };
    const mostrarHistoricoPrecos = async (nomeItem) => {
      historicoTituloItem.textContent = `Histórico de: ${nomeItem}`;
      historicoListaPrecos.innerHTML = "<li>Carregando...</li>";
      modalHistorico.style.display = "flex";
      try {
        const response = await fetch(
          `/api/itens/historico/${encodeURIComponent(nomeItem)}`
        );
        const historico = await response.json();
        historicoListaPrecos.innerHTML = "";
        if (historico.length === 0) {
          historicoListaPrecos.innerHTML =
            "<li>Nenhum preço registrado para este item.</li>";
        } else {
          historico.forEach((registro) => {
            const data = new Date(registro.data_compra).toLocaleDateString(
              "pt-BR"
            );
            const preco = parseFloat(registro.valor_unitario).toFixed(2);
            const li = document.createElement("li");
            li.innerHTML = `<span>R$ ${preco}</span> <span>${data}</span>`;
            historicoListaPrecos.appendChild(li);
          });
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        historicoListaPrecos.innerHTML =
          "<li>Não foi possível carregar o histórico.</li>";
      }
    };

    // --- LISTENERS DA APLICAÇÃO PRINCIPAL ---
    criarListaBtn.addEventListener("click", () => {
      if (!novaListaNomeInput.value.trim()) return;
      executarAcaoBackend(async () => {
        await fetch("/api/listas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome_lista: novaListaNomeInput.value.trim() }),
        });
        novaListaNomeInput.value = "";
        await carregarListas();
      });
    });

    listasSalvasUL.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("abrir-lista-btn"))
        mostrarEditor(target.dataset.id, target.dataset.nome);
      else if (
        target.classList.contains("deletar-lista-btn") &&
        confirm("Deletar esta lista e todos os seus itens?")
      ) {
        executarAcaoBackend(async () => {
          await fetch(`/api/listas/${target.dataset.id}`, { method: "DELETE" });
          await carregarListas();
        });
      }
    });

    listasSalvasUL.addEventListener("dblclick", (e) => {
      const span = e.target;
      if (span.classList.contains("nome-lista-salva")) {
        const li = span.closest("li");
        const listaId = li.querySelector(".abrir-lista-btn").dataset.id;
        const nomeAtual = span.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.value = nomeAtual;
        input.className = "input-editavel";
        span.replaceWith(input);
        input.focus();
        const salvar = () => {
          const novoNome = input.value.trim();
          if (novoNome && novoNome !== nomeAtual) {
            executarAcaoBackend(async () => {
              await fetch(`/api/listas/${listaId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome_lista: novoNome }),
              });
              span.textContent = novoNome;
              li.querySelector(".abrir-lista-btn").dataset.nome = novoNome;
              input.replaceWith(span);
            });
          } else {
            input.replaceWith(span);
          }
        };
        input.addEventListener("blur", salvar);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") input.blur();
          if (e.key === "Escape") input.replaceWith(span);
        });
      }
    });

    itensListaUL.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("deletar-item-btn") &&
        confirm("Deletar este item?")
      ) {
        executarAcaoBackend(async () => {
          await fetch(`/api/itens/${e.target.dataset.id}`, {
            method: "DELETE",
          });
          await carregarItensDaLista(listaAtivaId);
        });
      }
    });

    itensListaUL.addEventListener("dblclick", (e) => {
      const target = e.target;
      const li = target.closest(".item-editavel");
      if (!li) return;
      const itemId = li.dataset.itemId;
      if (target.classList.contains("nome-item-editavel")) {
        const nomeAtual = target.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.value = nomeAtual;
        input.className = "input-editavel";
        target.replaceWith(input);
        input.focus();
        const salvar = () => {
          const novoNome = input.value.trim();
          if (novoNome && novoNome !== nomeAtual) {
            executarAcaoBackend(async () => {
              await fetch(`/api/itens/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome_item: novoNome }),
              });
              target.textContent = novoNome;
              input.replaceWith(target);
            });
          } else {
            input.replaceWith(target);
          }
        };
        input.addEventListener("blur", salvar);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") input.blur();
          if (e.key === "Escape") input.replaceWith(target);
        });
      }
      if (target.classList.contains("categoria-item-editavel")) {
        const categoriaAtual =
          target.textContent === "Sem Categoria" ? "" : target.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.value = categoriaAtual;
        input.className = "input-editavel-categoria";
        input.setAttribute("list", "categorias-sugeridas");
        target.replaceWith(input);
        input.focus();
        const salvar = () => {
          const novaCategoria = input.value.trim();
          if (novaCategoria !== categoriaAtual) {
            executarAcaoBackend(async () => {
              await fetch(`/api/itens/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoria: novaCategoria }),
              });
              await carregarItensDaLista(listaAtivaId);
            });
          } else {
            target.textContent = categoriaAtual || "Sem Categoria";
            input.replaceWith(target);
          }
        };
        input.addEventListener("blur", salvar);
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") input.blur();
          if (e.key === "Escape") {
            target.textContent = categoriaAtual || "Sem Categoria";
            input.replaceWith(target);
          }
        });
      }
    });

    const adicionarNovoItem = () => {
      const nomeItem = novoItemListaInput.value.trim();
      const categoriaItem = novaCategoriaInput.value.trim();
      if (!nomeItem) return;
      executarAcaoBackend(async () => {
        await fetch(`/api/listas/${listaAtivaId}/itens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_item: nomeItem,
            categoria: categoriaItem,
          }),
        });
        novoItemListaInput.value = "";
        novaCategoriaInput.value = "";
        await carregarItensDaLista(listaAtivaId);
        novoItemListaInput.focus();
      });
    };

    adicionarItemListaBtn.addEventListener("click", adicionarNovoItem);
    novoItemListaInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") adicionarNovoItem();
    });
    novaCategoriaInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") adicionarNovoItem();
    });

    adicionarItemCompraBtn.addEventListener("click", () => {
      const nomeItem = novoItemCompraInput.value.trim();
      if (!nomeItem) return;
      executarAcaoBackend(async () => {
        const response = await fetch(`/api/listas/${listaAtivaId}/itens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome_item: nomeItem }),
        });
        const novoItem = await response.json();
        itensAtivos.push({ ...novoItem, comprado: false });
        novoItemCompraInput.value = "";
        renderizarItensCompra();
      });
    });

    itensCompraUL.addEventListener("change", (e) => {
      const li = e.target.closest("li");
      if (!li) return;
      const id = li.dataset.id;
      const valor = parseFloat(li.querySelector(".valor-input").value) || 0;
      const quantidade =
        parseInt(li.querySelector(".quantidade-input").value) || 1;
      const comprado = li.querySelector(".item-checkbox").checked;
      const itemIndex = itensAtivos.findIndex((item) => item.id == id);
      if (itemIndex > -1)
        itensAtivos[itemIndex] = {
          ...itensAtivos[itemIndex],
          valor_unitario: valor,
          quantidade,
          comprado,
        };
      renderizarItensCompra();
      fetch(`/api/itens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor_unitario: valor, quantidade, comprado }),
      });
    });

    itensCompraUL.addEventListener("click", (e) => {
      if (e.target.classList.contains("historico-btn")) {
        const li = e.target.closest("li");
        const nomeItem = li.dataset.nomeItem;
        mostrarHistoricoPrecos(nomeItem);
      }
    });

    resetCompraBtn.addEventListener("click", () => {
      if (
        confirm(
          "Isso irá limpar todos os preços, quantidades e marcações desta compra. Deseja continuar?"
        )
      ) {
        executarAcaoBackend(async () => {
          const response = await fetch(`/api/listas/${listaAtivaId}/reset`, {
            method: "PUT",
          });
          itensAtivos = await response.json();
          renderizarItensCompra();
        });
      }
    });

    finalizarCompraBtn.addEventListener("click", () => {
      const itensParaSalvar = itensAtivos.filter(
        (item) => item.comprado && item.valor_unitario > 0
      );
      if (itensParaSalvar.length === 0) {
        alert(
          "Nenhum item com preço foi marcado como comprado para salvar no histórico."
        );
        return;
      }
      if (
        confirm(
          `Salvar ${itensParaSalvar.length} item(ns) no seu histórico de preços?`
        )
      ) {
        executarAcaoBackend(async () => {
          await fetch("/api/compras/finalizar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itensComprados: itensParaSalvar }),
          });
          alert("Histórico salvo com sucesso!");
        });
      }
    });

    salvarComoModeloBtn.addEventListener("click", () => {
      const nomeTemplate = prompt(
        "Digite um nome para este modelo:",
        listaTitulo.textContent.replace("Lista: ", "")
      );
      if (nomeTemplate && nomeTemplate.trim() !== "") {
        executarAcaoBackend(async () => {
          const response = await fetch("/api/listas/save-as-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome_template: nomeTemplate,
              lista_original_id: listaAtivaId,
            }),
          });
          if (response.ok) {
            alert(`Modelo "${nomeTemplate}" salvo com sucesso!`);
            await carregarListas();
          } else {
            alert("Falha ao salvar o modelo.");
          }
        });
      }
    });

    criarFromModeloBtn.addEventListener("click", () => {
      const modeloId = modeloSelect.value;
      const nomeNovaLista = novaListaFromModeloNomeInput.value;
      if (!modeloId || !nomeNovaLista.trim()) {
        alert("Por favor, selecione um modelo e dê um nome para a nova lista.");
        return;
      }
      executarAcaoBackend(async () => {
        const response = await fetch("/api/listas/from-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_nova_lista: nomeNovaLista,
            template_id: modeloId,
          }),
        });
        if (response.ok) {
          novaListaFromModeloNomeInput.value = "";
          modeloSelect.value = "";
          await carregarListas();
        } else {
          alert("Falha ao criar lista a partir do modelo.");
        }
      });
    });

    compartilharBtn.addEventListener("click", () => {
      executarAcaoBackend(async () => {
        const response = await fetch(`/api/listas/${listaAtivaId}/token`);
        if (!response.ok) {
          alert("Não foi possível gerar o link de compartilhamento.");
          return;
        }
        const data = await response.json();
        const token = data.share_token;
        const shareUrl = `${window.location.origin}/share.html?token=${token}`;
        prompt(
          "Copie este link para compartilhar sua lista (somente visualização):",
          shareUrl
        );
      });
    });

    modoListaBtn.addEventListener("click", () => alternarModoEdicao("lista"));
    modoVisualBtn.addEventListener("click", () => alternarModoEdicao("visual"));

    criarCaixaCategoriaBtn.addEventListener("click", () => {
      const nomeNovaCaixa = novaCaixaCategoriaNomeInput.value.trim();
      if (nomeNovaCaixa) {
        const caixasExistentes = Array.from(
          caixasCategoriasContainer.querySelectorAll(".caixa-categoria")
        );
        if (
          !caixasExistentes.some(
            (caixa) => caixa.dataset.categoria === nomeNovaCaixa
          )
        ) {
          criarCaixaCategoria(nomeNovaCaixa);
        }
        novaCaixaCategoriaNomeInput.value = "";
      }
    });

    voltarBtn.addEventListener("click", mostrarManager);
    voltarCompraBtn.addEventListener("click", mostrarManager);
    iniciarCompraBtn.addEventListener("click", () =>
      mostrarCompra(listaTitulo.textContent.replace("Lista: ", ""))
    );
    novoItemCompraInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") adicionarItemCompraBtn.click();
    });

    fecharModalHistoricoBtn.addEventListener("click", fecharHistorico);
    modalHistorico.addEventListener("click", (e) => {
      if (e.target === modalHistorico) {
        fecharHistorico();
      }
    });

    // --- PONTO DE PARTIDA DA APLICAÇÃO ---
    // Garante que, ao iniciar, a primeira tela seja carregada com os dados.
    mostrarManager();
  }; // FIM DA FUNÇÃO iniciarAppPrincipal

  // --- LISTENERS DE AUTENTICAÇÃO ---
  mostrarRegistroLink.addEventListener("click", (e) => {
    e.preventDefault();
    alternarAuthView("registro");
  });

  mostrarLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    alternarAuthView("login");
  });

  loginForm.addEventListener("submit", handleLogin);
  registroForm.addEventListener("submit", handleRegistro);
  logoutBtn.addEventListener("click", handleLogout);

  // --- PONTO DE ENTRADA GLOBAL ---
  // Inicia todo o processo verificando se o usuário já está logado.
  verificarStatusLogin();
});
