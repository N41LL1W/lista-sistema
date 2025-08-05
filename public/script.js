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
            listasSalvasUL.innerHTML = '<li>Não foi possível carregar as listas. Tente novamente.</li>';
        }
    };

    const carregarItensDaLista = async (listaId) => {
        try {
            const response = await fetch(`/api/listas/${listaId}/itens`);
            if (!response.ok) throw new Error('Erro ao carregar itens');
            // Garante que o estado 'comprado' seja sempre booleano
            const itens = await response.json();
            itensAtivos = itens.map(item => ({...item, comprado: !!item.comprado}));
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
                const novoItem = await response.json();
                itensAtivos.push({...novoItem, comprado: false});
                renderizarItensCompra();
            }
        } catch (error) {
            console.error("Erro ao adicionar item em compra:", error);
        }
    };
    
    // ATUALIZADO: Lida com o estado 'comprado'
    const atualizarItem = async (id, valor, quantidade, comprado) => {
        const itemIndex = itensAtivos.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            itensAtivos[itemIndex].valor_unitario = valor;
            itensAtivos[itemIndex].quantidade = quantidade;
            itensAtivos[itemIndex].comprado = comprado;
        }

        renderizarTotais();
        
        try {
            await fetch(`/api/itens/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valor_unitario: valor, quantidade: quantidade, comprado: comprado }),
            });
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
        }
    };

    const deletarItem = async (itemId) => {
        try {
            const response = await fetch(`/api/itens/${itemId}`, { method: 'DELETE' });
            if (response.ok) {
                await carregarItensDaLista(listaAtivaId);
            } else {
                alert("Não foi possível deletar o item. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao deletar item:", error);
        }
    };

    const deletarLista = async (listaId) => {
        try {
            const response = await fetch(`/api/listas/${listaId}`, { method: 'DELETE' });
            if (response.ok) {
                await carregarListas();
            } else {
                alert("Não foi possível deletar a lista. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao deletar lista:", error);
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
                li.className = 'item-editavel'; 
                li.innerHTML = `
                    <span>${item.nome_item}</span>
                    <button class="deletar-item-btn" data-id="${item.id}">Deletar</button>
                `;
                itensListaUL.appendChild(li);
            });
            iniciarCompraBtn.disabled = false;
        }
    };

    // ATUALIZADO: renderizarItensCompra com checkbox
    const renderizarItensCompra = () => {
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
                    </div>
                `;
                itensCompraUL.appendChild(li);
            });
        }
        renderizarTotais();
    };
    
    // ATUALIZADO: renderizarTotais para dois valores
    const renderizarTotais = () => {
        const totalLista = itensAtivos.reduce((acc, item) => acc + (item.valor_unitario || 0) * (item.quantidade || 1), 0);
        const totalCarrinho = itensAtivos.reduce((acc, item) => {
            return item.comprado ? acc + (item.valor_unitario || 0) * (item.quantidade || 1) : acc;
        }, 0);

        // Verifica se os elementos existem antes de tentar acessá-los
        const totalListaSpan = document.getElementById('total-lista');
        const totalCarrinhoSpan = document.getElementById('total-carrinho');
        if(totalListaSpan) totalListaSpan.textContent = totalLista.toFixed(2);
        if(totalCarrinhoSpan) totalCarrinhoSpan.textContent = totalCarrinho.toFixed(2);
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
        const target = e.target;
        if (target.classList.contains('abrir-lista-btn')) {
            mostrarEditor(target.dataset.id, target.dataset.nome);
        } else if (target.classList.contains('deletar-lista-btn')) {
            if (confirm('Tem certeza que deseja deletar esta lista e todos os seus itens?')) {
                deletarLista(target.dataset.id);
            }
        }
    });

    itensListaUL.addEventListener('click', (e) => {
        if (e.target.classList.contains('deletar-item-btn')) {
            if (confirm('Tem certeza que deseja deletar este item?')) {
                deletarItem(e.target.dataset.id);
            }
        }
    });

    adicionarItemListaBtn.addEventListener('click', () => adicionarItem(listaAtivaId, novoItemListaInput.value));
    adicionarItemCompraBtn.addEventListener('click', () => adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value));

    voltarBtn.addEventListener('click', mostrarManager);
    voltarCompraBtn.addEventListener('click', mostrarManager);

    iniciarCompraBtn.addEventListener('click', async () => {
        await carregarItensDaLista(listaAtivaId);
        mostrarCompra(listaTitulo.textContent.replace('Lista: ', ''));
    });
    
    // ATUALIZADO: Listener unificado para 'change' em toda a lista de compra
    itensCompraUL.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('valor-input') || target.classList.contains('quantidade-input') || target.classList.contains('item-checkbox')) {
            const li = target.closest('li');
            const id = li.dataset.id;
            
            const valor = parseFloat(li.querySelector('.valor-input').value) || 0;
            const quantidade = parseInt(li.querySelector('.quantidade-input').value) || 1;
            const comprado = li.querySelector('.item-checkbox').checked;

            li.classList.toggle('comprado', comprado);

            li.querySelector('.item-total').textContent = `R$ ${(valor * quantidade).toFixed(2)}`;
            
            atualizarItem(id, valor, quantidade, comprado);
        }
    });

    // Event listeners para 'Enter' continuam úteis
    novoItemListaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarItem(listaAtivaId, novoItemListaInput.value);
    });
    novoItemCompraInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adicionarItemEmCompra(listaAtivaId, novoItemCompraInput.value);
    });

    mostrarManager();
});