document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE ELEMENTOS ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loader = document.getElementById('loader');
    const loginView = document.getElementById('login-view');
    const registroView = document.getElementById('registro-view');
    const loginForm = document.getElementById('login-form');
    const registroForm = document.getElementById('registro-form');
    const mostrarRegistroLink = document.getElementById('mostrar-registro');
    const mostrarLoginLink = document.getElementById('mostrar-login');
    const loginEmailInput = document.getElementById('login-email');
    const loginSenhaInput = document.getElementById('login-senha');
    const registroEmailInput = document.getElementById('registro-email');
    const registroSenhaInput = document.getElementById('registro-senha');
    const loginFeedback = document.getElementById('login-feedback');
    const registroFeedback = document.getElementById('registro-feedback');
    const usuarioLogadoSpan = document.getElementById('usuario-logado');
    const logoutBtn = document.getElementById('logout-btn');
    const listaManager = document.getElementById('lista-manager');
    const listaEditor = document.getElementById('lista-editor');
    const modoCompra = document.getElementById('modo-compra');
    const novaListaNomeInput = document.getElementById('nova-lista-nome');
    const criarListaBtn = document.getElementById('criar-lista-btn');
    const listasSalvasUL = document.getElementById('listas-salvas-ul');
    const listaTitulo = document.getElementById('lista-titulo');
    const adicionarItemListaBtn = document.getElementById('adicionar-item-lista-btn');
    const itensListaUL = document.getElementById('itens-lista');
    const voltarBtn = document.getElementById('voltar-btn');
    const iniciarCompraBtn = document.getElementById('iniciar-compra-btn');
    const compraTitulo = document.getElementById('compra-titulo');
    const adicionarItemCompraBtn = document.getElementById('adicionar-item-compra-btn');
    const itensCompraUL = document.getElementById('itens-compra');
    const voltarCompraBtn = document.getElementById('voltar-compra-btn');
    const resetCompraBtn = document.getElementById('reset-compra-btn');
    const finalizarCompraBtn = document.getElementById('finalizar-compra-btn');
    const limparMarcadosBtn = document.getElementById('limpar-marcados-btn');
    const salvarComoModeloBtn = document.getElementById('salvar-como-modelo-btn');
    const criarFromModeloBtn = document.getElementById('criar-from-modelo-btn');
    const modeloSelect = document.getElementById('modelo-select');
    const novaListaFromModeloNomeInput = document.getElementById('nova-lista-from-modelo-nome');
    const modelosSalvosUL = document.getElementById('modelos-salvos-ul');
    const compartilharBtn = document.getElementById('compartilhar-btn');
    const modalHistorico = document.getElementById('modal-historico');
    const fecharModalHistoricoBtn = document.getElementById('fechar-modal-historico');
    const historicoTituloItem = document.getElementById('historico-titulo-item');
    const historicoListaPrecos = document.getElementById('historico-lista-precos');

    // --- ESTADO DA APLICAÇÃO ---
    let listaAtivaId = null;
    let itensAtivos = [];
    let choicesProdutos = null;
    let choicesCompra = null;
    
    // --- LÓGICA DE AUTENTICAÇÃO ---
    const mostrarFeedback = (elemento, mensagem, tipo = 'erro') => {
        if (elemento) {
            elemento.textContent = mensagem;
            elemento.className = `feedback-msg ${tipo}`;
            setTimeout(() => { if(elemento) { elemento.textContent = ''; elemento.className = 'feedback-msg'; } }, 3000);
        }
    };
    const alternarAuthView = (view) => {
        if (view === 'registro') { loginView.style.display = 'none'; registroView.style.display = 'block'; } 
        else { loginView.style.display = 'block'; registroView.style.display = 'none'; }
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value;
        const senha = loginSenhaInput.value;
        mostrarFeedback(loginFeedback, 'Verificando...', 'info');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            usuarioLogadoSpan.textContent = data.usuario.email;
            iniciarAppPrincipal();
        } catch (error) {
            mostrarFeedback(loginFeedback, error.message, 'erro');
        }
    };
    const handleRegistro = async (e) => {
        e.preventDefault();
        const email = registroEmailInput.value;
        const senha = registroSenhaInput.value;
        try {
            const response = await fetch('/api/auth/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            mostrarFeedback(loginFeedback, 'Registro bem-sucedido! Faça o login.', 'sucesso');
            alternarAuthView('login');
            registroForm.reset();
        } catch (error) {
            mostrarFeedback(registroFeedback, error.message);
        }
    };
    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        location.reload();
    };
    const verificarStatusLogin = async () => {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            if (data.logado) {
                authContainer.style.display = 'none';
                appContainer.style.display = 'block';
                usuarioLogadoSpan.textContent = data.usuario.email;
                iniciarAppPrincipal();
            } else {
                authContainer.style.display = 'block';
                appContainer.style.display = 'none';
            }
        } catch (error) {
            authContainer.style.display = 'block';
            appContainer.style.display = 'none';
        }
    };

    // --- INÍCIO DA LÓGICA DA APLICAÇÃO PRINCIPAL ---
    const iniciarAppPrincipal = () => {
        const mostrarLoader = () => loader.style.display = 'flex';
        const esconderLoader = () => loader.style.display = 'none';
        
        const mostrarManager = () => {
            listaManager.style.display = 'block';
            listaEditor.style.display = 'none';
            modoCompra.style.display = 'none';
            carregarListas();
        };

        const mostrarEditor = (listaId, nomeLista) => {
            listaAtivaId = listaId;
            listaTitulo.textContent = `Lista: ${nomeLista}`;
            listaManager.style.display = 'none';
            listaEditor.style.display = 'block';
            modoCompra.style.display = 'none';
            inicializarChoices(document.getElementById('buscar-produto-select'), (instance) => choicesProdutos = instance);
            carregarItensDaLista(listaId);
        };

        const mostrarCompra = (nomeLista) => {
            compraTitulo.textContent = `Em Compra: ${nomeLista}`;
            listaManager.style.display = 'none';
            listaEditor.style.display = 'none';
            modoCompra.style.display = 'block';
            inicializarChoices(document.getElementById('novo-item-compra-select'), (instance) => choicesCompra = instance);
            carregarItensDaLista(listaId).then(() => renderizarItensCompra());
        };

        const executarAcaoBackend = async (acao) => {
            mostrarLoader();
            try { await acao(); } 
            catch (error) { console.error("Erro na ação de backend:", error); alert("Ocorreu um erro. Tente novamente."); } 
            finally { esconderLoader(); }
        };

        const carregarListas = async () => {
            mostrarLoader();
            try {
                const response = await fetch('/api/listas');
                if (response.status === 401) return handleLogout();
                if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`);
                const data = await response.json();
                renderizarListasEModelos(data);
            } catch (error) { console.error("Erro ao carregar listas:", error); } 
            finally { esconderLoader(); }
        };

        const carregarItensDaLista = async (listaId) => {
            mostrarLoader();
            try {
                const response = await fetch(`/api/listas/${listaId}/itens`);
                if (response.status === 401) return handleLogout();
                if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`);
                const itens = await response.json();
                itensAtivos = Array.isArray(itens) ? itens.map(item => ({ ...item, comprado: !!item.comprado })) : [];
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
            listasSalvasUL.innerHTML = '';
            if (data.listas.length === 0) {
                listasSalvasUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Nenhuma lista salva. Crie uma!</li>';
            } else {
                data.listas.forEach(lista => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="nome-lista-salva">${lista.nome_lista}</span><div class="botoes-lista"><button class="abrir-lista-btn" data-id="${lista.id}" data-nome="${lista.nome_lista}">Abrir</button><button class="deletar-lista-btn" data-id="${lista.id}">Deletar</button></div>`;
                    listasSalvasUL.appendChild(li);
                });
            }
            modeloSelect.innerHTML = '<option value="">-- Selecione um Modelo --</option>';
            modelosSalvosUL.innerHTML = '';
            if (data.templates.length === 0) {
                modelosSalvosUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Nenhum modelo salvo.</li>';
            } else {
                data.templates.forEach(template => {
                    const li = document.createElement('li');
                    li.className = 'modelo-item';
                    li.innerHTML = `<span class="nome-lista-salva">${template.nome_lista}</span><div class="botoes-lista"><button class="deletar-lista-btn" data-id="${template.id}" title="Deletar este modelo">🗑️</button></div>`;
                    modelosSalvosUL.appendChild(li);
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.nome_lista;
                    modeloSelect.appendChild(option);
                });
            }
        };

        const renderizarItensLista = () => {
            itensListaUL.innerHTML = '';
            iniciarCompraBtn.disabled = itensAtivos.length === 0;
            if (itensAtivos.length === 0) {
                itensListaUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Adicione produtos à sua lista.</li>';
                return;
            }
            const itensAgrupados = agruparItensPorCategoria(itensAtivos);
            const categoriasOrdenadas = Object.keys(itensAgrupados).sort((a, b) => {
                if (a === 'Sem Categoria') return -1;
                if (b === 'Sem Categoria') return 1;
                return a.localeCompare(b);
            });
            categoriasOrdenadas.forEach(categoria => {
                const categoriaHeader = document.createElement('li');
                categoriaHeader.className = 'categoria-header';
                categoriaHeader.textContent = categoria;
                itensListaUL.appendChild(categoriaHeader);
                itensAgrupados[categoria].forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'item-editavel';
                    li.dataset.itemId = item.id; // ID do item na lista
                    li.innerHTML = `
                        <div class="info-item-editavel">
                            <span class="nome-item-editavel">${item.nome_item}</span>
                            <span class="categoria-item-editavel" data-produto-id="${item.produto_id}">
                                ${item.categoria || 'Definir Categoria'}
                            </span>
                        </div>
                        <button class="deletar-item-btn" data-id="${item.id}">Deletar</button>`;
                    itensListaUL.appendChild(li);
                });
            });
        };

        const renderizarItensCompra = () => {
            itensAtivos.sort((a, b) => a.comprado - b.comprado);
            itensCompraUL.innerHTML = '';
            if (itensAtivos.length === 0) {
                itensCompraUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Sua lista de compras está vazia.</li>';
            } else {
                const itensAgrupados = agruparItensPorCategoria(itensAtivos.filter(i => !i.comprado));
                const categoriasOrdenadas = Object.keys(itensAgrupados).sort((a, b) => {
                    if (a === 'Sem Categoria') return -1;
                    if (b === 'Sem Categoria') return 1;
                    return a.localeCompare(b);
                });

                categoriasOrdenadas.forEach(categoria => {
                    const categoriaHeader = document.createElement('li');
                    categoriaHeader.className = 'categoria-header';
                    categoriaHeader.textContent = categoria;
                    itensCompraUL.appendChild(categoriaHeader);
                    itensAgrupados[categoria].forEach(item => renderizarItemCompra(item));
                });

                const itensComprados = itensAtivos.filter(i => i.comprado);
                if (itensComprados.length > 0) {
                    const compradoHeader = document.createElement('li');
                    compradoHeader.className = 'categoria-header comprado-header';
                    compradoHeader.textContent = 'Itens no Carrinho';
                    itensCompraUL.appendChild(compradoHeader);
                    itensComprados.forEach(item => renderizarItemCompra(item));
                }
            }
            renderizarTotais();
        };
        
        const renderizarItemCompra = (item) => {
            const subtotal = (item.valor_unitario || 0) * (item.quantidade || 1);
            const li = document.createElement('li');
            li.className = `lista-item ${item.comprado ? 'comprado' : ''}`;
            li.dataset.id = item.id;
            li.dataset.produtoId = item.produto_id;
            li.innerHTML = `
                <div class="item-info"><input type="checkbox" class="item-checkbox" ${item.comprado ? 'checked' : ''}><span class="item-nome">${item.nome_item}</span></div>
                <div class="item-detalhes">
                    <div class="item-inputs"><input type="number" class="valor-input" placeholder="R$" step="0.01" value="${item.valor_unitario || ''}"><span>x</span><input type="number" class="quantidade-input" placeholder="Qtd" value="${item.quantidade || 1}"></div>
                    <div class="item-total">
                        <span>R$ ${subtotal.toFixed(2)}</span>
                        <span class="historico-btn" title="Ver histórico de preços">📈</span>
                    </div>
                </div>`;
            itensCompraUL.appendChild(li);
        };
        
        const renderizarTotais = () => {
            const totalLista = itensAtivos.reduce((acc, item) => acc + (item.valor_unitario || 0) * (item.quantidade || 1), 0);
            const totalCarrinho = itensAtivos.reduce((acc, item) => item.comprado ? acc + (item.valor_unitario || 0) * (item.quantidade || 1) : acc, 0);
            document.getElementById('total-lista').textContent = totalLista.toFixed(2);
            document.getElementById('total-carrinho').textContent = totalCarrinho.toFixed(2);
        };

        const agruparItensPorCategoria = (itens) => {
            return itens.reduce((acc, item) => {
                const categoria = item.categoria || 'Sem Categoria';
                if (!acc[categoria]) acc[categoria] = [];
                acc[categoria].push(item);
                return acc;
            }, {});
        };

        const fecharHistorico = () => { modalHistorico.style.display = 'none'; };
        const mostrarHistoricoPrecos = async (produtoId, nomeItem) => {
            historicoTituloItem.textContent = `Histórico de: ${nomeItem}`;
            historicoListaPrecos.innerHTML = '<li>Carregando...</li>';
            modalHistorico.style.display = 'flex';
            try {
                const response = await fetch(`/api/itens/historico/${produtoId}`);
                const historico = await response.json();
                historicoListaPrecos.innerHTML = '';
                if (historico.length === 0) {
                    historicoListaPrecos.innerHTML = '<li>Nenhum preço registrado para este item.</li>';
                } else {
                    historico.forEach(registro => {
                        const data = new Date(registro.data_compra).toLocaleDateString('pt-BR');
                        const preco = parseFloat(registro.valor_unitario).toFixed(2);
                        const li = document.createElement('li');
                        li.innerHTML = `<span>R$ ${preco}</span> <span>${data}</span>`;
                        historicoListaPrecos.appendChild(li);
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar histórico:", error);
                historicoListaPrecos.innerHTML = '<li>Não foi possível carregar o histórico.</li>';
            }
        };

        // --- LÓGICA DE AUTOCOMPLETAR (CHOICES.JS) ---
        const inicializarChoices = (selectElement, setInstanceCallback, onSelectCallback) => {
            if (!selectElement) return;
            let currentInstance = selectElement.choices;
            if (currentInstance) currentInstance.destroy();

            const newChoices = new Choices(selectElement, {
                searchPlaceholderValue: "Digite para buscar ou criar...",
                itemSelectText: 'Adicionar',
                removeItemButton: true,
                allowHTML: false,
                noResultsText: 'Nenhum resultado, pressione Enter para criar',
                noChoicesText: 'Digite 2+ letras para buscar',
            });
            
            selectElement.addEventListener('search', async (event) => {
                const termo = event.detail.value;
                if (termo.length < 2) return;
                const url = selectElement.id.includes('categoria') ? `/api/categorias/buscar?termo=${encodeURIComponent(termo)}` : `/api/produtos/buscar?termo=${encodeURIComponent(termo)}`;
                const response = await fetch(url);
                const data = await response.json();
                if (Array.isArray(data)) {
                    const choicesData = data.map(d => ({ value: d.id, label: d.nome }));
                    newChoices.setChoices(choicesData, 'value', 'label', false);
                }
            });

            selectElement.addEventListener('addItem', async (event) => {
                if (!isNaN(event.detail.value)) return;
                const nomeNovo = event.detail.value;
                newChoices.removeActiveItemsByValue(nomeNovo);
                onSelectCallback(nomeNovo, true);
            });
            
            selectElement.addEventListener('change', (event) => {
                if(event.detail.value && !isNaN(event.detail.value)){
                    onSelectCallback(event.detail.value, false);
                }
            });

            setInstanceCallback(newChoices);
            newChoices.showDropdown();
        };
        
        const adicionarProdutoNaLista = (produtoId) => {
            console.log("DEBUG 6: Função adicionarProdutoNaLista chamada com ID:", produtoId);
            if (!produtoId) {
                console.warn("DEBUG 7: ID do produto inválido. Abortando.");
                return;
            }
            executarAcaoBackend(async () => {
                console.log(`DEBUG 8: Enviando requisição para adicionar produto ${produtoId} à lista ${listaAtivaId}`);
                const response = await fetch(`/api/listas/${listaAtivaId}/itens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ produto_id: produtoId })
                });

                console.log("DEBUG 9: Resposta da API de adicionar item:", response.status);
                if(response.status === 409) {
                    alert('Este item já está na lista.');
                }
                
                console.log("DEBUG 10: Recarregando itens da lista...");
                await carregarItensDaLista(listaAtivaId);
                if (choicesInstance) choicesInstance.clearStore(); // Limpa o texto do campo de busca
            });
        };

        const handleEditarCategoria = (spanElemento) => {
            const produtoId = spanElemento.dataset.produtoId;
            const selectContainer = document.createElement('div');
            selectContainer.className = 'select-container-editavel';
            const select = document.createElement('select');
            spanElemento.replaceWith(selectContainer);
            selectContainer.appendChild(select);

            const onCategoriaSelect = (categoriaValue, isNew) => {
                executarAcaoBackend(async () => {
                    let categoriaId = categoriaValue;
                    if(isNew) {
                        const categoria = await criarOuEncontrarCategoria(categoriaValue);
                        categoriaId = categoria.id;
                    }
                    await associarProdutoACategoria(produtoId, categoriaId);
                });
            };

            inicializarChoices(select, (instance) => {}, onCategoriaSelect);
        };

        // --- LISTENERS DA APLICAÇÃO PRINCIPAL ---
        adicionarItemListaBtn.addEventListener('click', () => {
            const itemSelecionado = choicesInstance ? choicesInstance.getValue(true) : null;
            if (itemSelecionado) {
                adicionarProdutoNaLista(itemSelecionado);
            } else {
                alert("Selecione um item da lista ou digite um novo nome e pressione Enter.");
            }
        });
        criarListaBtn.addEventListener('click', () => {
            if (!novaListaNomeInput.value.trim()) return;
            executarAcaoBackend(async () => {
                await fetch('/api/listas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_lista: novaListaNomeInput.value.trim() }) });
                novaListaNomeInput.value = '';
                await carregarListas();
            });
        });
        listasSalvasUL.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('abrir-lista-btn')) mostrarEditor(target.dataset.id, target.dataset.nome);
            else if (target.classList.contains('deletar-lista-btn') && confirm('Deletar esta lista e todos os seus itens?')) {
                executarAcaoBackend(async () => {
                    await fetch(`/api/listas/${target.dataset.id}`, { method: 'DELETE' });
                    await carregarListas();
                });
            }
        });
        listasSalvasUL.addEventListener('dblclick', (e) => {
            const span = e.target;
            if (span.classList.contains('nome-lista-salva')) {
                const li = span.closest('li');
                const listaId = li.querySelector('.abrir-lista-btn').dataset.id;
                const nomeAtual = span.textContent;
                const input = document.createElement('input');
                input.type = 'text'; input.value = nomeAtual; input.className = 'input-editavel';
                span.replaceWith(input); input.focus();
                const salvar = () => {
                    const novoNome = input.value.trim();
                    if (novoNome && novoNome !== nomeAtual) {
                        executarAcaoBackend(async () => {
                            await fetch(`/api/listas/${listaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_lista: novoNome }) });
                            span.textContent = novoNome;
                            li.querySelector('.abrir-lista-btn').dataset.nome = novoNome;
                            input.replaceWith(span);
                        });
                    } else { input.replaceWith(span); }
                };
                input.addEventListener('blur', salvar);
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') input.replaceWith(span); });
            }
        });
        
        // VERSÃO CORRIGIDA
        itensListaUL.addEventListener('dblclick', (e) => {
            const target = e.target;
            // Agora só nos importamos com o clique no nome do item.
            if (target.classList.contains('nome-item-editavel')) {
                alert("A edição de nome de produtos padronizados será uma futura funcionalidade!");
                // A lógica para editar o nome de um produto padronizado é mais complexa,
                // então vamos desativá-la temporariamente para evitar confusão.
                // Quando implementarmos, precisaremos do ID do produto, não do item.
            }
        });

        adicionarItemCompraBtn.addEventListener('click', () => {
            const itemSelecionado = choicesCompraInstance ? choicesCompraInstance.getValue(true) : null;
            if (itemSelecionado) {
                adicionarProdutoNaLista(itemSelecionado);
            } else {
                alert("Selecione um item da lista ou digite um novo nome e pressione Enter.");
            }
        });

        itensCompraUL.addEventListener('change', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            const id = li.dataset.id;
            const valor = parseFloat(li.querySelector('.valor-input').value) || 0;
            const quantidade = parseInt(li.querySelector('.quantidade-input').value) || 1;
            const comprado = li.querySelector('.item-checkbox').checked;
            const itemIndex = itensAtivos.findIndex((item) => item.id == id);
            if (itemIndex > -1) {
                itensAtivos[itemIndex] = { ...itensAtivos[itemIndex], valor_unitario: valor, quantidade, comprado };
            }
            renderizarItensCompra();
            fetch(`/api/itens/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor_unitario: valor, quantidade, comprado }) });
        });
        itensCompraUL.addEventListener('click', (e) => {
            if (e.target.classList.contains('historico-btn')) {
                const li = e.target.closest('li');
                const produtoId = li.dataset.produtoId;
                const nomeItem = li.querySelector('.item-nome').textContent;
                mostrarHistoricoPrecos(produtoId, nomeItem);
            }
        });
        resetCompraBtn.addEventListener('click', () => {
            if (confirm('Isso irá limpar todos os preços, quantidades e marcações desta compra. Deseja continuar?')) {
                executarAcaoBackend(async () => {
                    await fetch(`/api/listas/${listaAtivaId}/reset`, { method: 'PUT' });
                    await carregarItensDaLista(listaAtivaId);
                    renderizarItensCompra();
                });
            }
        });
        finalizarCompraBtn.addEventListener('click', () => {
            const itensParaSalvar = itensAtivos.filter(item => item.comprado && item.valor_unitario > 0);
            if (itensParaSalvar.length === 0) {
                alert("Nenhum item com preço foi marcado como comprado para salvar no histórico.");
                return;
            }
            if (confirm(`Salvar ${itensParaSalvar.length} item(ns) no seu histórico de preços?`)) {
                executarAcaoBackend(async () => {
                    const payload = itensParaSalvar.map(item => ({ produto_id: item.produto_id, valor_unitario: item.valor_unitario }));
                    await fetch('/api/compras/finalizar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itensComprados: payload })
                    });
                    alert("Histórico salvo com sucesso!");
                });
            }
        });
        limparMarcadosBtn.addEventListener('click', () => {
            const itensMarcados = itensAtivos.filter(item => item.comprado);
            if (itensMarcados.length === 0) {
                alert("Nenhum item foi marcado como comprado para ser limpo.");
                return;
            }
            if (confirm(`Você tem certeza que deseja remover permanentemente os ${itensMarcados.length} item(ns) marcados desta lista?`)) {
                executarAcaoBackend(async () => {
                    await fetch(`/api/listas/${listaAtivaId}/limpar-comprados`, { method: 'POST' });
                    await carregarItensDaLista(listaAtivaId);
                    renderizarItensCompra();
                });
            }
        });
        salvarComoModeloBtn.addEventListener('click', () => {
            const nomeTemplate = prompt("Digite um nome para este modelo:", listaTitulo.textContent.replace('Lista: ', ''));
            if (nomeTemplate && nomeTemplate.trim() !== "") {
                executarAcaoBackend(async () => {
                    const response = await fetch('/api/listas/save-as-template', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nome_template: nomeTemplate, lista_original_id: listaAtivaId })
                    });
                    if (response.ok) {
                        alert(`Modelo "${nomeTemplate}" salvo com sucesso!`);
                        await carregarListas();
                    } else { alert("Falha ao salvar o modelo."); }
                });
            }
        });
        criarFromModeloBtn.addEventListener('click', () => {
            const modeloId = modeloSelect.value;
            const nomeNovaLista = novaListaFromModeloNomeInput.value;
            if (!modeloId || !nomeNovaLista.trim()) {
                alert("Por favor, selecione um modelo e dê um nome para a nova lista.");
                return;
            }
            executarAcaoBackend(async () => {
                const response = await fetch('/api/listas/from-template', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome_nova_lista: nomeNovaLista, template_id: modeloId })
                });
                if (response.ok) {
                    novaListaFromModeloNomeInput.value = '';
                    modeloSelect.value = '';
                    await carregarListas();
                } else { alert("Falha ao criar lista a partir do modelo."); }
            });
        });
        modelosSalvosUL.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('deletar-lista-btn')) {
                if (confirm('Deletar este modelo permanentemente? Esta ação não pode ser desfeita.')) {
                    const listaId = target.dataset.id;
                    executarAcaoBackend(async () => {
                        await fetch(`/api/listas/${listaId}`, { method: 'DELETE' });
                        await carregarListas();
                    });
                }
            }
        });
        compartilharBtn.addEventListener('click', () => {
            executarAcaoBackend(async () => {
                const response = await fetch(`/api/listas/${listaAtivaId}/token`);
                if (!response.ok) {
                    alert("Não foi possível gerar o link de compartilhamento.");
                    return;
                }
                const data = await response.json();
                const token = data.share_token;
                const shareUrl = `${window.location.origin}/share.html?token=${token}`;
                prompt("Copie este link para compartilhar sua lista (somente visualização):", shareUrl);
            });
        });
        voltarBtn.addEventListener('click', mostrarManager);
        voltarCompraBtn.addEventListener('click', mostrarManager);
        iniciarCompraBtn.addEventListener('click', () => mostrarCompra(listaTitulo.textContent.replace('Lista: ', '')));
        novoItemCompraInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarItemCompraBtn.click(); });
        fecharModalHistoricoBtn.addEventListener('click', fecharHistorico);
        modalHistorico.addEventListener('click', (e) => {
            if (e.target === modalHistorico) {
                fecharHistorico();
            }
        });

        mostrarManager();
    };

    // --- LISTENERS DE AUTENTICAÇÃO ---
    mostrarRegistroLink.addEventListener('click', (e) => { e.preventDefault(); alternarAuthView('registro'); });
    mostrarLoginLink.addEventListener('click', (e) => { e.preventDefault(); alternarAuthView('login'); });
    loginForm.addEventListener('submit', handleLogin);
    registroForm.addEventListener('submit', handleRegistro);
    logoutBtn.addEventListener('click', handleLogout);

    // --- PONTO DE ENTRADA GLOBAL ---
    verificarStatusLogin();
});