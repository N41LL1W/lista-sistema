document.addEventListener('DOMContentLoaded', () => {
    const listaComprasUL = document.getElementById('lista-compras');
    const totalCompraSpan = document.getElementById('total-compra');
    const novoItemInput = document.getElementById('novo-item');
    const adicionarBtn = document.getElementById('adicionar-btn');

    let listaAtual = [];

    // Função para renderizar a lista na tela
    const renderizarLista = () => {
        listaComprasUL.innerHTML = '';
        let totalGeral = 0;

        listaAtual.forEach(item => {
            const totalItem = (item.valor_unitario || 0) * (item.quantidade || 0);
            totalGeral += totalItem;

            const li = document.createElement('li');
            li.className = 'lista-item';
            li.innerHTML = `
                <span class="item-nome">${item.nome_item}</span>
                <div class="item-inputs">
                    <input type="number" class="valor-input" placeholder="R$" step="0.01" value="${item.valor_unitario || ''}" data-id="${item.id}">
                    <span>x</span>
                    <input type="number" class="quantidade-input" placeholder="Qtd" value="${item.quantidade || ''}" data-id="${item.id}">
                </div>
                <span class="item-total">R$ ${totalItem.toFixed(2)}</span>
            `;
            listaComprasUL.appendChild(li);
        });

        totalCompraSpan.textContent = totalGeral.toFixed(2);
    };

    // Função para buscar a lista do backend
    const buscarLista = async () => {
        try {
            const response = await fetch('/api/lista');
            if (response.ok) {
                listaAtual = await response.json();
                renderizarLista();
            }
        } catch (error) {
            console.error('Erro ao buscar a lista:', error);
        }
    };

    // Função para adicionar um novo item
    const adicionarItem = async (nome) => {
        if (!nome.trim()) return;
        try {
            const response = await fetch('/api/lista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_item: nome }),
            });
            if (response.ok) {
                const novoItem = await response.json();
                listaAtual.push(novoItem);
                renderizarLista();
                novoItemInput.value = '';
            }
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
        }
    };

    // Função para atualizar um item
    const atualizarItem = async (id, valor, quantidade) => {
        try {
            const response = await fetch(`/api/lista/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valor_unitario: valor, quantidade: quantidade }),
            });
            if (response.ok) {
                await buscarLista(); // Recarrega a lista para atualizar os totais
            }
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
        }
    };

    // Eventos
    adicionarBtn.addEventListener('click', () => adicionarItem(novoItemInput.value));
    novoItemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            adicionarItem(novoItemInput.value);
        }
    });

    listaComprasUL.addEventListener('input', (e) => {
        const input = e.target;
        if (input.classList.contains('valor-input') || input.classList.contains('quantidade-input')) {
            const id = input.dataset.id;
            const li = input.closest('li');
            const valorInput = li.querySelector('.valor-input');
            const quantidadeInput = li.querySelector('.quantidade-input');

            const valor = parseFloat(valorInput.value) || 0;
            const quantidade = parseInt(quantidadeInput.value) || 0;

            // Atualiza no banco de dados
            atualizarItem(id, valor, quantidade);
        }
    });

    // Inicia o carregamento da lista
    buscarLista();
});