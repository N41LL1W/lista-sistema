document.addEventListener('DOMContentLoaded', () => {
    const produtoSelect = document.getElementById('produto');
    const valorInput = document.getElementById('valor');
    const quantidadeInput = document.getElementById('quantidade');
    const registrarBtn = document.getElementById('registrarBtn');
    const statusMessage = document.getElementById('status-message');
    const totalItemSpan = document.getElementById('total-item');

    // Lista de produtos para a lista suspensa
    const produtos = ['Caneta', 'Caderno', 'Borracha', 'Lápis'];

    // Preenche a lista suspensa de produtos
    produtos.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto;
        option.textContent = produto;
        produtoSelect.appendChild(option);
    });

    // Calcula o total do item em tempo real
    function calcularTotal() {
        const valor = parseFloat(valorInput.value) || 0;
        const quantidade = parseInt(quantidadeInput.value) || 0;
        const total = valor * quantidade;
        totalItemSpan.textContent = total.toFixed(2);
    }

    valorInput.addEventListener('input', calcularTotal);
    quantidadeInput.addEventListener('input', calcularTotal);

    registrarBtn.addEventListener('click', async () => {
        const produto = produtoSelect.value;
        const valor = parseFloat(valorInput.value);
        const quantidade = parseInt(quantidadeInput.value);

        if (!produto || !valor || !quantidade) {
            statusMessage.textContent = 'Por favor, preencha todos os campos.';
            statusMessage.style.color = 'red';
            return;
        }

        const dadosVenda = { produto, valor, quantidade };

        try {
            const response = await fetch('/api/registrar-venda', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosVenda),
            });

            if (response.ok) {
                statusMessage.textContent = 'Venda registrada com sucesso!';
                statusMessage.style.color = 'green';
                // Limpa os campos após o registro
                produtoSelect.value = '';
                valorInput.value = '';
                quantidadeInput.value = '';
                totalItemSpan.textContent = '0.00';
            } else {
                const error = await response.json();
                statusMessage.textContent = `Erro ao registrar: ${error.message}`;
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            statusMessage.textContent = 'Erro de conexão com o servidor.';
            statusMessage.style.color = 'red';
        }
    });
});