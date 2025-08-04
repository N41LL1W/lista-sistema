const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuração do banco de dados Neon DB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware para processar JSON e arquivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rota para obter todos os itens da lista de compras
app.get('/api/lista', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM lista_compras ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar lista de compras:', err);
        res.status(500).json({ message: 'Erro ao buscar lista de compras.', error: err.message });
    }
});

// Rota para adicionar um novo item à lista de compras
app.post('/api/lista', async (req, res) => {
    const { nome_item } = req.body;
    try {
        const query = 'INSERT INTO lista_compras (nome_item) VALUES ($1) RETURNING *';
        const values = [nome_item];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar item:', err);
        res.status(500).json({ message: 'Erro ao adicionar item.', error: err.message });
    }
});

// Rota para atualizar o valor e a quantidade de um item
app.put('/api/lista/:id', async (req, res) => {
    const { id } = req.params;
    const { valor_unitario, quantidade } = req.body;
    try {
        const query = 'UPDATE lista_compras SET valor_unitario = $1, quantidade = $2 WHERE id = $3 RETURNING *';
        const values = [valor_unitario, quantidade, id];
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

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});