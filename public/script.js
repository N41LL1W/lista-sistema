document.addEventListener('DOMContentLoaded', () => {
    // Referências das seções e elementos
    const listaManager = document.getElementById('lista-manager');
    const listaEditor = document.getElementById('lista-editor');
    const modoCompra = document.getElementById('modo-compra');
    const novaListaNomeInput = document.getElementById('nova-lista-nome');
    const criarListaBtn = document.getElementById('criar-lista-btn');
    const listasSalvasUL = document.getElementById('listas-salvas-ul');
    const listaTitulo = document.getElementById('lista-titulo');
    const novoItemListaInput = document.getElementById('novo-item-lista');
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

    let listaAtivaId = null;
    let itensAtivos = [];

    // --- Funções de Navegação ---
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
        renderizarItensCompra();
    };

    // --- Funções de Lógica ---
    const carregarListas = async () => {
        try {
            const response = await fetch('/api/listas');
            const listas = await response.json();
            listasSalvasUL.innerHTML = '';
            listas.forEach(lista => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="nome-lista-salva">${lista.nome_lista}</span>
                    <div class="botoes-lista">
                        <button class="abrir-lista-btn" data-id="${lista.id}" data-nome="${lista.nome_lista}">Abrir</button>
                        <button class="deletar-lista-btn" data-id="${lista.id}">Deletar</button>
                    </div>
                `;
                listasSalvasUL.appendChild(li);
            });
        } catch (error) {
            console.error("Erro ao carregar listas:", error);
        }
    };

    const carregarItensDaLista = async (listaId) => {
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`);
            const itens = await response.json();
            itensAtivos = itens.map(item => ({...item, comprado: !!item.comprado}));
            renderizarItensLista();
        } catch (error) {
            console.error("Erro ao carregar itens da lista:", error);
        }
    };

    const adicionarItem = async (listaId, nomeItem) => {
        if (!nomeItem.trim()) return;
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: nomeItem }),
            });
            if (response.ok) {
                novoItemListaInput.value = '';
                await carregarItensDaLista(listaId);
            }
        } catch (error) { console.error("Erro ao adicionar item:", error); }
    };

    const adicionarItemEmCompra = async (listaId, nomeItem) => {
        if (!nomeItem.trim()) return;
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: nomeItem }),
            });
            if (response.ok) {
                novoItemCompraInput.value = '';
                const novoItem = await response.json();
                itensAtivos.push({...novoItem, comprado: false});
                renderizarItensCompra();
            }
        } catch (error) { console.error("Erro ao adicionar item em compra:", error); }
    };

    const atualizarItem = async (id, valor, quantidade, comprado) => {
        try {
            await fetch(`/api/itens/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valor_unitario: valor, quantidade: quantidade, comprado: comprado }),
            });
        } catch (error) { console.error("Erro ao atualizar item:", error); }
    };

    const deletarItem = async (itemId) => {
        try {
            const response = await fetch(`/api/itens/${itemId}`, { method: 'DELETE' });
            if (response.ok) await carregarItensDaLista(listaAtivaId);
        } catch (error) { console.error("Erro ao deletar item:", error); }
    };

    const deletarLista = async (listaId) => {
        try {
            const response = await fetch(`/api/listas/${listaId}`, { method: 'DELETE' });
            if (response.ok) await carregarListas();
        } catch (error) { console.error("Erro ao deletar lista:", error); }
    };

    // --- NOVO: Função para resetar a compra ---
    const resetarCompra = async (listaId) => {
        try {
            const response = await fetch(`/api/listas/${listaId}/reset`, { method: 'PUT' });
            if (response.ok) {
                itensAtivos = await response.json();
                renderizarItensCompra();
            } else {
                alert('Não foi possível limpar a compra. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao resetar compra:', error);
        }
    };

    // --- Funções de Renderização ---
    const renderizarItensLista = () => {
        itensListaUL.innerHTML = '';
        iniciarCompraBtn.disabled = itensAtivos.length === 0;
        if (itensAtivos.length === 0) {
            itensListaUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Adicione itens a esta lista.</li>';
        } else {
            itensAtivos.forEach(item => {
                const li = document.createElement('li');
                li.className = 'item-editavel';
                li.innerHTML = `<span>${item.nome_item}</span><button class="deletar-item-btn" data-id="${item.id}">Deletar</button>`;
                itensListaUL.appendChild(li);
            });
        }
    };

    // ATUALIZADO: Com ordenação automática
    const renderizarItensCompra = () => {
        itensAtivos.sort((a, b) => a.comprado - b.comprado);
        itensCompraUL.innerHTML = '';
        if (itensAtivos.length === 0) {
            itensCompraUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Sua lista de compras está vazia.</li>';
        } else {
            itensAtivos.forEach(item => {
                const subtotal = (item.valor_unitario || 0) * (item.quantidade || 1);
                const li = document.createElement('li');
                li.className = `lista-item ${item.comprado ? 'comprado' : ''}`;
                li.dataset.id = item.id;
                li.innerHTML = `
                    <div class="item-info">
                        <input type="checkbox" class="item-checkbox" ${item.comprado ? 'checked' : ''}>
                        <span class="item-nome">${item.nome_item}</span>
                    </div>
                    <div class="item-detalhes">
                        <div class="item-inputs">
                            <input type="number" class="valor-input" placeholder="R$" step="0.01" value="${item.valor_unitario || ''}">
                            <span>x</span>
                            <input type="number" class="quantidade-input" placeholder="Qtd" value="${item.quantidade || 1}">
                        </div>
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
    criarListaBtn.addEventListener('click', () => adicionarItem(listaAtivaId, novaListaNomeInput.value));
    listasSalvasUL.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('abrir-lista-btn')) mostrarEditor(target.dataset.id, target.dataset.nome);
        else if (target.classList.contains('deletar-lista-btn') && confirm('Deletar esta lista e todos os seus itens?')) deletarLista(target.dataset.id);
    });
    itensListaUL.addEventListener('click', (e) => {
        if (e.target.classList.contains('deletar-item-btn') && confirm('Deletar este item?')) deletarItem(e.target.dataset.id);
    });
    adicionarItemListaBtn.addEventListener('click', () => adicionarItem(listaAtivaId, novoItemListaInput.value));
    adicionarItemCompraBtn.addEventListener('click', () => adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value));
    voltarBtn.addEventListener('click', mostrarManager);
    voltarCompraBtn.addEventListener('click', mostrarManager);
    iniciarCompraBtn.addEventListener('click', async () => {
        await carregarItensDaLista(listaAtivaId);
        mostrarCompra(listaTitulo.textContent.replace('Lista: ', ''));
    });

    // ATUALIZADO: Com lógica de re-renderização para ordenação
    itensCompraUL.addEventListener('change', (e) => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;
        
        const id = li.dataset.id;
        const valor = parseFloat(li.querySelector('.valor-input').value) || 0;
        const quantidade = parseInt(li.querySelector('.quantidade-input').value) || 1;
        const comprado = li.querySelector('.item-checkbox').checked;

        const itemIndex = itensAtivos.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            itensAtivos[itemIndex] = { ...itensAtivos[itemIndex], valor_unitario: valor, quantidade, comprado };
        }

        if (target.classList.contains('item-checkbox')) {
            renderizarItensCompra();
        } else {
            li.querySelector('.item-total').textContent = `R$ ${(valor * quantidade).toFixed(2)}`;
            renderizarTotais();
        }
        
        atualizarItem(id, valor, quantidade, comprado);
    });
    
    // NOVO: Event listener para o botão de reset
    resetCompraBtn.addEventListener('click', () => {
        if (confirm('Isso irá limpar todos os preços, quantidades e marcações desta compra. Deseja continuar?')) {
            resetarCompra(listaAtivaId);
        }
    });

    // Listeners de 'Enter'
    novoItemListaInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarItem(listaAtivaId, novoItemListaInput.value); });
    novoItemCompraInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value); });

    mostrarManager();
});