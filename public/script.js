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
    const voltarBtn = document = document.getElementById('voltar-btn');
    const iniciarCompraBtn = document.getElementById('iniciar-compra-btn');

    // Referências da seção de compra
    const compraTitulo = document.getElementById('compra-titulo');
    const novoItemCompraInput = document.getElementById('novo-item-compra'); // NOVO INPUT
    const adicionarItemCompraBtn = document.getElementById('adicionar-item-compra-btn'); // NOVO BOTÃO
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
        const response = await fetch('/api/listas');
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
    };

    const carregarItensDaLista = async (listaId) => {
        const response = await fetch(`/api/listas/${listaId}/itens`);
        itensAtivos = await response.json();
        renderizarItensLista();
    };

    const adicionarItem = async (listaId, nomeItem) => {
        if (!nomeItem.trim()) return;
        const response = await fetch(`/api/listas/${listaId}/itens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_item: nomeItem }),
        });
        if (response.ok) {
            novoItemListaInput.value = '';
            carregarItensDaLista(listaId);
        }
    };

    // NOVO CÓDIGO PARA ADICIONAR ITEM NO MODO COMPRA
    const adicionarItemEmCompra = async (listaId, nomeItem) => {
        if (!nomeItem.trim()) return;
        const response = await fetch(`/api/listas/${listaId}/itens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_item: nomeItem }),
        });
        if (response.ok) {
            novoItemCompraInput.value = '';
            // Recarrega a lista completa para atualizar o display
            const novosItens = await response.json();
            itensAtivos.push(novosItens);
            renderizarItensCompra();
        }
    };

    // CORREÇÃO: Função para atualizar um item sem recarregar toda a lista
    const atualizarItem = async (id, valor, quantidade) => {
        const itemIndex = itensAtivos.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            itensAtivos[itemIndex].valor_unitario = valor;
            itensAtivos[itemIndex].quantidade = quantidade;
            renderizarTotais(); // Apenas recalcula o total
        }

        await fetch(`/api/itens/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor_unitario: valor, quantidade: quantidade, comprado: false }),
        });
    };

    // --- Funções de Renderização ---
    const renderizarItensLista = () => {
        itensListaUL.innerHTML = '';
        itensAtivos.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nome_item}</span>`;
            itensListaUL.appendChild(li);
        });
    };

    const renderizarItensCompra = () => {
        itensCompraUL.innerHTML = '';
        itensAtivos.forEach(item => {
            const subtotal = (item.valor_unitario || 0) * (item.quantidade || 0);
            const li = document.createElement('li');
            li.className = 'lista-item';
            li.innerHTML = `
                <span class="item-nome">${item.nome_item}</span>
                <div class="item-inputs">
                    <input type="number" class="valor-input" placeholder="R$" step="0.01" value="${item.valor_unitario || ''}" data-id="${item.id}">
                    <span>x</span>
                    <input type="number" class="quantidade-input" placeholder="Qtd" value="${item.quantidade || ''}" data-id="${item.id}">
                </div>
                <span class="item-total">R$ ${subtotal.toFixed(2)}</span>
            `;
            itensCompraUL.appendChild(li);
        });
        renderizarTotais();
    };
    
    const renderizarTotais = () => {
        let totalCompra = 0;
        itensAtivos.forEach(item => {
            totalCompra += (item.valor_unitario || 0) * (item.quantidade || 0);
        });
        totalCompraSpan.textContent = totalCompra.toFixed(2);
    }

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
    
    // NOVOS EVENTOS PARA O MODO COMPRA
    adicionarItemCompraBtn.addEventListener('click', () => adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value));
    novoItemCompraInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value);
    });

    voltarBtn.addEventListener('click', () => mostrarManager());
    voltarCompraBtn.addEventListener('click', () => mostrarManager());

    iniciarCompraBtn.addEventListener('click', () => {
        mostrarCompra(listaTitulo.textContent.replace('Lista: ', ''));
    });
    
    itensCompraUL.addEventListener('input', (e) => {
        const input = e.target;
        if (input.classList.contains('valor-input') || input.classList.contains('quantidade-input')) {
            const id = input.dataset.id;
            const valorInput = input.closest('li').querySelector('.valor-input');
            const quantidadeInput = input.closest('li').querySelector('.quantidade-input');

            const valor = parseFloat(valorInput.value) || 0;
            const quantidade = parseInt(quantidadeInput.value) || 0;

            atualizarItem(id, valor, quantidade);
        }
    });

    mostrarManager();
});