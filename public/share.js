document.addEventListener('DOMContentLoaded', async () => {
    const tituloEl = document.getElementById('lista-compartilhada-titulo');
    const listaEl = document.getElementById('itens-compartilhados');

    try {
        // Pega o token da URL (ex: .../share.html?token=UUID)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (!token) {
            throw new Error("Token de compartilhamento não encontrado na URL.");
        }

        const response = await fetch(`/api/share/${token}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Não foi possível carregar a lista. O link pode estar inválido.");
        }

        const data = await response.json();

        // Renderiza o título e os itens
        document.title = data.nome_lista; // Atualiza o título da aba do navegador
        tituloEl.textContent = data.nome_lista;
        listaEl.innerHTML = '';

        if (data.itens.length === 0) {
            listaEl.innerHTML = '<li style="color: #6c757d; font-style: italic;">Esta lista não tem itens.</li>';
            return;
        }

        let categoriaAtual = "---";
        data.itens.forEach(item => {
            if (item.categoria !== categoriaAtual) {
                categoriaAtual = item.categoria;
                const categoriaHeader = document.createElement('li');
                categoriaHeader.className = 'categoria-header';
                categoriaHeader.textContent = categoriaAtual || 'Sem Categoria';
                listaEl.appendChild(categoriaHeader);
            }

            const li = document.createElement('li');
            li.innerHTML = `<span class="item-nome-compartilhado">${item.nome_item}</span>`;
            listaEl.appendChild(li);
        });

    } catch (error) {
        tituloEl.textContent = "Erro ao Carregar";
        listaEl.innerHTML = `<li>${error.message}</li>`;
        console.error(error);
    }
});