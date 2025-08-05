document.addEventListener('DOMContentLoaded', () => {
    // Referências das seções
    const listaManager = document.getElementById('lista-manager');
    const listaEditor = document.getElementById('lista-editor');
    const modoCompra = document.getElementById('modo-compra');

    // Referências da seção de criação de listas
    const novaListaNomeInput = document.getElementById('nova-lista-nome');
    const criarListaBtn = document.getElementById('criar-lista-btn');
    const listasSalvasUL = document.getElementById('listas-salvas-ul');

    // Referências da seção de edição de listas
    const listaTitulo = document.getElementById('lista-titulo');
    const novoItemListaInput = document.getElementById('novo-item-lista');
    const adicionarItemListaBtn = document.getElementById('adicionar-item-lista-btn');
    const itensListaUL = document.getElementById('itens-lista');
    const voltarBtn = document.getElementById('voltar-btn');
    const iniciarCompraBtn = document.getElementById('iniciar-compra-btn');

    // Referências da seção de compra
    const compraTitulo = document.getElementById('compra-titulo');
    const novoItemCompraInput = document.getElementById('novo-item-compra');
    const adicionarItemCompraBtn = document.getElementById('adicionar-item-compra-btn');
    const itensCompraUL = document.getElementById('itens-compra');
    const totalCompraSpan = document.getElementById('total-compra');
    const voltarCompraBtn = document.getElementById('voltar-compra-btn');

    let listaAtivaId = null;
    let itensAtivos = [];

    // --- Funções de Navegação entre Vistas ---
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

    // --- Funções de Lógica do Backend ---
    const carregarListas = async () => {
        try {
            const response = await fetch('/api/listas');
            if (!response.ok) throw new Error('Erro ao carregar listas');
            const listas = await response.json();
            listasSalvasUL.innerHTML = '';
            listas.forEach(lista => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${lista.nome_lista}</span>
                    <button class="abrir-lista-btn" data-id="${lista.id}" data-nome="${lista.nome_lista}">Abrir</button>
                `;
                listasSalvasUL.appendChild(li);
            });
        } catch (error) {
            console.error("Erro ao carregar listas:", error);
            listasSalvasUL.innerHTML = '<li>Não foi possível carregar as listas. Tente novamente.</li>';
        }
    };

    const carregarItensDaLista = async (listaId) => {
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`);
            if (!response.ok) throw new Error('Erro ao carregar itens');
            itensAtivos = await response.json();
            renderizarItensLista();
        } catch (error) {
            console.error("Erro ao carregar itens da lista:", error);
            itensAtivos = [];
            renderizarItensLista();
        }
    };

    const adicionarItem = async (listaId, nomeItem) => {
        if (!nomeItem.trim()) return;
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: nomeItem }),
            });
            if (response.ok) {
                novoItemListaInput.value = '';
                await carregarItensDaLista(listaId);
            }
        } catch (error) {
            console.error("Erro ao adicionar item:", error);
        }
    };

    const adicionarItemEmCompra = async (listaId, nomeItem) => {
        if (!nomeItem.trim()) return;
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: nomeItem }),
            });
            if (response.ok) {
                novoItemCompraInput.value = '';
                // CORREÇÃO: A API retorna um objeto único, não um array.
                const novoItem = await response.json();
                itensAtivos.push(novoItem); // Adiciona o novo item ao array local
                renderizarItensCompra(); // Renderiza a lista atualizada
            }
        } catch (error) {
            console.error("Erro ao adicionar item em compra:", error);
        }
    };
    
    const atualizarItem = async (id, valor, quantidade) => {
        const itemIndex = itensAtivos.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            itensAtivos[itemIndex].valor_unitario = valor;
            itensAtivos[itemIndex].quantidade = quantidade;
            renderizarTotais(); // Apenas atualiza o total na tela para resposta rápida
        }
        try {
            // Atualiza o banco de dados em segundo plano
            await fetch(`/api/itens/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valor_unitario: valor, quantidade: quantidade, comprado: false }),
            });
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            // Opcional: Reverter a mudança visual se a atualização falhar
        }
    };

    // --- Funções de Renderização ---
    const renderizarItensLista = () => {
        itensListaUL.innerHTML = '';
        if (itensAtivos.length === 0) {
            itensListaUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Adicione itens a esta lista.</li>';
            iniciarCompraBtn.disabled = true;
        } else {
            itensAtivos.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.nome_item}</span>`;
                itensListaUL.appendChild(li);
            });
            iniciarCompraBtn.disabled = false;
        }
    };

    const renderizarItensCompra = () => {
        itensCompraUL.innerHTML = '';
        if (itensAtivos.length === 0) {
            itensCompraUL.innerHTML = '<li style="color: #6c757d; font-style: italic;">Sua lista de compras está vazia.</li>';
        } else {
            itensAtivos.forEach(item => {
                const subtotal = (item.valor_unitario || 0) * (item.quantidade || 0);
                const li = document.createElement('li');
                li.className = 'lista-item';
                li.innerHTML = `
                    <span class="item-nome">${item.nome_item}</span>
                    <div class="item-inputs">
                        <input type="number" class="valor-input" placeholder="R$" step="0.01" value="${item.valor_unitario || ''}" data-id="${item.id}">
                        <span>x</span>
                        <input type="number" class="quantidade-input" placeholder="Qtd" value="${item.quantidade || 1}" data-id="${item.id}">
                    </div>
                    <span class="item-total">R$ ${subtotal.toFixed(2)}</span>
                `;
                itensCompraUL.appendChild(li);
            });
        }
        renderizarTotais();
    };
    
    const renderizarTotais = () => {
        const totalCompra = itensAtivos.reduce((acc, item) => acc + (item.valor_unitario || 0) * (item.quantidade || 0), 0);
        totalCompraSpan.textContent = totalCompra.toFixed(2);
    };

    // --- Event Listeners ---
    criarListaBtn.addEventListener('click', async () => {
        const nomeLista = novaListaNomeInput.value;
        if (!nomeLista.trim()) return;
        await fetch('/api/listas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_lista: nomeLista }),
        });
        novaListaNomeInput.value = '';
        carregarListas();
    });

    listasSalvasUL.addEventListener('click', (e) => {
        if (e.target.classList.contains('abrir-lista-btn')) {
            const listaId = e.target.dataset.id;
            const nomeLista = e.target.dataset.nome;
            mostrarEditor(listaId, nomeLista);
        }
    });

    adicionarItemListaBtn.addEventListener('click', () => adicionarItem(listaAtivaId, novoItemListaInput.value));
    novoItemListaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarItem(listaAtivaId, novoItemListaInput.value);
    });
    
    adicionarItemCompraBtn.addEventListener('click', () => adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value));
    novoItemCompraInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value);
    });

    voltarBtn.addEventListener('click', mostrarManager);
    voltarCompraBtn.addEventListener('click', mostrarManager);

    iniciarCompraBtn.addEventListener('click', async () => {
        await carregarItensDaLista(listaAtivaId);
        mostrarCompra(listaTitulo.textContent.replace('Lista: ', ''));
    });
    
    itensCompraUL.addEventListener('input', (e) => {
        const input = e.target;
        if (input.classList.contains('valor-input') || input.classList.contains('quantidade-input')) {
            const id = input.dataset.id;
            const li = input.closest('li');
            const valorInput = li.querySelector('.valor-input');
            const quantidadeInput = li.querySelector('.quantidade-input');
            const totalSpan = li.querySelector('.item-total');

            const valor = parseFloat(valorInput.value) || 0;
            const quantidade = parseInt(quantidadeInput.value) || 0;

            totalSpan.textContent = `R$ ${(valor * quantidade).toFixed(2)}`;
            atualizarItem(id, valor, quantidade);
        }
    });

    mostrarManager();
});