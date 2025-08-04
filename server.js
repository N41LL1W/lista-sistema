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

// Endpoint da API para registrar uma venda
app.post('/api/registrar-venda', async (req, res) => {
    const { produto, valor, quantidade } = req.body;
    try {
        const total = valor * quantidade;
        const query = 'INSERT INTO vendas (produto, valor, quantidade, total) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [produto, valor, quantidade, total];
        
        await pool.query(query, values);
        res.status(200).json({ message: 'Venda registrada com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor.', error: err.message });
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});