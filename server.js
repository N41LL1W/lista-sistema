const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuração do banco de dados Neon DB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para criar uma nova lista
app.post('/api/listas', async (req, res) => {
    const { nome_lista } = req.body;
    try {
        const query = 'INSERT INTO listas (nome_lista) VALUES ($1) RETURNING id, nome_lista';
        const result = await pool.query(query, [nome_lista]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar lista:', err);
        res.status(500).json({ message: 'Erro ao criar lista.', error: err.message });
    }
});

// Rota para obter todas as listas
app.get('/api/listas', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nome_lista FROM listas ORDER BY data_criacao DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar listas:', err);
        res.status(500).json({ message: 'Erro ao buscar listas.', error: err.message });
    }
});

// Rota para adicionar um item a uma lista específica
app.post('/api/listas/:listaId/itens', async (req, res) => {
    const { listaId } = req.params;
    const { nome_item } = req.body;
    try {
        const query = 'INSERT INTO itens_lista (lista_id, nome_item) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [listaId, nome_item]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar item à lista:', err);
        res.status(500).json({ message: 'Erro ao adicionar item à lista.', error: err.message });
    }
});

// Rota para obter todos os itens de uma lista específica
app.get('/api/listas/:listaId/itens', async (req, res) => {
    const { listaId } = req.params;
    try {
        const query = 'SELECT * FROM itens_lista WHERE lista_id = $1 ORDER BY id';
        const result = await pool.query(query, [listaId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar itens da lista:', err);
        res.status(500).json({ message: 'Erro ao buscar itens da lista.', error: err.message });
    }
});

// Rota para atualizar o valor e a quantidade de um item
app.put('/api/itens/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { valor_unitario, quantidade, comprado } = req.body;
    try {
        const query = 'UPDATE itens_lista SET valor_unitario = $1, quantidade = $2, comprado = $3 WHERE id = $4 RETURNING *';
        const values = [valor_unitario, quantidade, comprado, itemId];
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar item:', err);
        res.status(500).json({ message: 'Erro ao atualizar item.', error: err.message });
    }
});

// --- NOVO: Rota para deletar um item específico ---
app.delete('/api/itens/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
        const query = 'DELETE FROM itens_lista WHERE id = $1';
        const result = await pool.query(query, [itemId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        res.status(204).send(); // 204 No Content -> sucesso, sem conteúdo para retornar
    } catch (err) {
        console.error('Erro ao deletar item:', err);
        res.status(500).json({ message: 'Erro ao deletar item.', error: err.message });
    }
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});