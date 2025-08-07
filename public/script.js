document.addEventListener('DOMContentLoaded', () => {
    // Referências de Elementos
    const listaManager = document.getElementById('lista-manager');
    const listaEditor = document.getElementById('lista-editor');
    const modoCompra = document.getElementById('modo-compra');
    const novaListaNomeInput = document.getElementById('nova-lista-nome');
    const criarListaBtn = document.getElementById('criar-lista-btn');
    const listasSalvasUL = document.getElementById('listas-salvas-ul');
    const listaTitulo = document.getElementById('lista-titulo');
    const novoItemListaInput = document.getElementById('novo-item-lista');
    const novaCategoriaInput = document.getElementById('nova-categoria-item');
    const adicionarItemListaBtn = document.getElementById('adicionar-item-lista-btn');
    const itensListaUL = document.getElementById('itens-lista');
    const voltarBtn = document.getElementById('voltar-btn');
    const iniciarCompraBtn = document.getElementById('iniciar-compra-btn');
    const compraTitulo = document.getElementById('compra-titulo');
    const novoItemCompraInput = document.getElementById('novo-item-compra');
    const adicionarItemCompraBtn = document.getElementById('adicionar-item-compra-btn');
    const itensCompraUL = document.getElementById('itens-compra');
    const voltarCompraBtn = document.getElementById('voltar-compra-btn');
    const resetCompraBtn = document.getElementById('reset-compra-btn');
    const loader = document.getElementById('loader');

    // Variáveis de Estado
    let listaAtivaId = null;
    let itensAtivos = [];

    // --- Funções de Controle de UI ---
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
        carregarItensDaLista(listaId);
    };

    const mostrarCompra = (nomeLista) => {
        compraTitulo.textContent = `Em Compra: ${nomeLista}`;
        listaManager.style.display = 'none';
        listaEditor.style.display = 'none';
        modoCompra.style.display = 'block';
        carregarItensDaLista(listaAtivaId).then(() => {
            renderizarItensCompra();
        });
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
            const response = await fetch('/api/listas');
            if (!response.ok) throw new Error(`Erro do servidor: ${response.status}`);
            const listas = await response.json();
            listasSalvasUL.innerHTML = '';
            listas.forEach(lista => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="nome-lista-salva">${lista.nome_lista}</span>
                    <div class="botoes-lista">
                        <button class="abrir-lista-btn" data-id="${lista.id}" data-nome="${lista.nome_lista}">Abrir</button>
                        <button class="deletar-lista-btn" data-id="${lista.id}">Deletar</button>
                    </div>`;
                listasSalvasUL.appendChild(li);
            });
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
            if (!response.ok) {
                throw new Error(`Erro do servidor: ${response.status}`);
            }
            const itens = await response.json();
            if (Array.isArray(itens)) {
                itensAtivos = itens.map(item => ({ ...item, comprado: !!item.comprado }));
            } else {
                console.error("A API não retornou um array de itens.", itens);
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
    const renderizarItensLista = () => {
        itensListaUL.innerHTML = '';
        iniciarCompraBtn.disabled = itensAtivos.length === 0;

        const categoriasSugeridas = document.getElementById('categorias-sugeridas');
        const categoriasExistentes = [...new Set(itensAtivos.map(item => item.categoria).filter(Boolean))];
        categoriasSugeridas.innerHTML = categoriasExistentes.map(c => `<option value="${c}"></option>`).join('');

        if (itensAtivos.length === 0) {
            itensListaUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Adicione itens a esta lista ou verifique a conexão.</li>';
            return;
        }

        let categoriaAtual = "---";
        itensAtivos.forEach(item => {
            if (item.categoria !== categoriaAtual) {
                categoriaAtual = item.categoria;
                const categoriaHeader = document.createElement('li');
                categoriaHeader.className = 'categoria-header';
                categoriaHeader.textContent = categoriaAtual || 'Sem Categoria';
                itensListaUL.appendChild(categoriaHeader);
            }

            const li = document.createElement('li');
            li.className = 'item-editavel';
            li.innerHTML = `<span>${item.nome_item}</span><button class="deletar-item-btn" data-id="${item.id}">Deletar</button>`;
            itensListaUL.appendChild(li);
        });
    };

    const renderizarItensCompra = () => {
        itensAtivos.sort((a, b) => a.comprado - b.comprado);
        itensCompraUL.innerHTML = '';

        if (itensAtivos.length === 0) {
            itensCompraUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Sua lista de compras está vazia.</li>';
        } else {
            let categoriaAtual = "---";
            let cabecalhoCompradosAdicionado = false;

            itensAtivos.forEach(item => {
                if (item.comprado && !cabecalhoCompradosAdicionado) {
                    const compradoHeader = document.createElement('li');
                    compradoHeader.className = 'categoria-header comprado-header';
                    compradoHeader.textContent = 'Itens no Carrinho';
                    itensCompraUL.appendChild(compradoHeader);
                    cabecalhoCompradosAdicionado = true;
                }
                else if (!item.comprado && item.categoria !== categoriaAtual) {
                    categoriaAtual = item.categoria;
                    const categoriaHeader = document.createElement('li');
                    categoriaHeader.className = 'categoria-header';
                    categoriaHeader.textContent = categoriaAtual || 'Sem Categoria';
                    itensCompraUL.appendChild(categoriaHeader);
                }

                const subtotal = (item.valor_unitario || 0) * (item.quantidade || 1);
                const li = document.createElement('li');
                li.className = `lista-item ${item.comprado ? 'comprado' : ''}`;
                li.dataset.id = item.id;
                li.innerHTML = `
                    <div class="item-info"><input type="checkbox" class="item-checkbox" ${item.comprado ? 'checked' : ''}><span class="item-nome">${item.nome_item}</span></div>
                    <div class="item-detalhes">
                        <div class="item-inputs"><input type="number" class="valor-input" placeholder="R$" step="0.01" value="${item.valor_unitario || ''}"><span>x</span><input type="number" class="quantidade-input" placeholder="Qtd" value="${item.quantidade || 1}"></div>
                        <span class="item-total">R$ ${subtotal.toFixed(2)}</span>
                    </div>`;
                itensCompraUL.appendChild(li);
            });
        }
        renderizarTotais();
    };

    const renderizarTotais = () => {
        const totalLista = itensAtivos.reduce((acc, item) => acc + (item.valor_unitario || 0) * (item.quantidade || 1), 0);
        const totalCarrinho = itensAtivos.reduce((acc, item) => item.comprado ? acc + (item.valor_unitario || 0) * (item.quantidade || 1) : acc, 0);
        document.getElementById('total-lista').textContent = totalLista.toFixed(2);
        document.getElementById('total-carrinho').textContent = totalCarrinho.toFixed(2);
    };

    // --- Event Listeners ---
    criarListaBtn.addEventListener('click', () => {
        if (!novaListaNomeInput.value.trim()) return;
        executarAcaoBackend(async () => {
            await fetch('/api/listas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_lista: novaListaNomeInput.value }) });
            novaListaNomeInput.value = '';
            await carregarListas();
        })
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

    itensListaUL.addEventListener('click', (e) => {
        if (e.target.classList.contains('deletar-item-btn') && confirm('Deletar este item?')) {
            executarAcaoBackend(async () => {
                await fetch(`/api/itens/${e.target.dataset.id}`, { method: 'DELETE' });
                await carregarItensDaLista(listaAtivaId);
            });
        }
    });

    itensListaUL.addEventListener('dblclick', (e) => {
        const span = e.target;
        if (span.tagName === 'SPAN' && span.closest('.item-editavel')) {
            const li = span.closest('.item-editavel');
            const itemId = li.querySelector('.deletar-item-btn').dataset.id;
            const nomeAtual = span.textContent;
            const input = document.createElement('input');
            input.type = 'text'; input.value = nomeAtual; input.className = 'input-editavel';
            span.replaceWith(input); input.focus();
            const salvar = () => {
                const novoNome = input.value.trim();
                if (novoNome && novoNome !== nomeAtual) {
                    executarAcaoBackend(async () => {
                        await fetch(`/api/itens/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_item: novoNome }) });
                        span.textContent = novoNome;
                        input.replaceWith(span);
                    });
                } else { input.replaceWith(span); }
            };
            input.addEventListener('blur', salvar);
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); if (e.key === 'Escape') input.replaceWith(span); });
        }
    });

    const adicionarNovoItem = () => {
        const nomeItem = novoItemListaInput.value.trim();
        const categoriaItem = novaCategoriaInput.value.trim();
        if (!nomeItem) return;

        executarAcaoBackend(async () => {
            await fetch(`/api/listas/${listaAtivaId}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: nomeItem, categoria: categoriaItem })
            });
            novoItemListaInput.value = '';
            novaCategoriaInput.value = '';
            await carregarItensDaLista(listaAtivaId);
            novoItemListaInput.focus();
        });
    };

    adicionarItemListaBtn.addEventListener('click', adicionarNovoItem);
    novoItemListaInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarNovoItem(); });
    novaCategoriaInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarNovoItem(); });

    adicionarItemCompraBtn.addEventListener('click', () => {
        const nomeItem = novoItemCompraInput.value.trim();
        if (!nomeItem) return;
        executarAcaoBackend(async () => {
            const response = await fetch(`/api/listas/${listaAtivaId}/itens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome_item: nomeItem }) });
            const novoItem = await response.json();
            itensAtivos.push({ ...novoItem, comprado: false });
            novoItemCompraInput.value = '';
            renderizarItensCompra();
        });
    });

    itensCompraUL.addEventListener('change', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const id = li.dataset.id;
        const valor = parseFloat(li.querySelector('.valor-input').value) || 0;
        const quantidade = parseInt(li.querySelector('.quantidade-input').value) || 1;
        const comprado = li.querySelector('.item-checkbox').checked;
        const itemIndex = itensAtivos.findIndex(item => item.id == id);
        if (itemIndex > -1) itensAtivos[itemIndex] = { ...itensAtivos[itemIndex], valor_unitario: valor, quantidade, comprado };

        renderizarItensCompra();

        fetch(`/api/itens/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ valor_unitario: valor, quantidade, comprado }) });
    });

    resetCompraBtn.addEventListener('click', () => {
        if (confirm('Isso irá limpar todos os preços, quantidades e marcações desta compra. Deseja continuar?')) {
            executarAcaoBackend(async () => {
                const response = await fetch(`/api/listas/${listaAtivaId}/reset`, { method: 'PUT' });
                itensAtivos = await response.json();
                renderizarItensCompra();
            });
        }
    });

    voltarBtn.addEventListener('click', mostrarManager);
    voltarCompraBtn.addEventListener('click', mostrarManager);
    iniciarCompraBtn.addEventListener('click', () => mostrarCompra(listaTitulo.textContent.replace('Lista: ', '')));
    novoItemCompraInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarItemCompraBtn.click(); });

    // Iniciar
    mostrarManager();
})