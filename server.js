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

// --- ROTAS DE LISTAS ---

app.get('/api/listas', async (req, res) => {
    try {
        const listasQuery = 'SELECT id, nome_lista FROM listas WHERE is_template = false OR is_template IS NULL ORDER BY data_criacao DESC';
        const listasResult = await pool.query(listasQuery);

        const templatesQuery = 'SELECT id, nome_lista FROM listas WHERE is_template = true ORDER BY nome_lista ASC';
        const templatesResult = await pool.query(templatesQuery);

        res.status(200).json({
            listas: listasResult.rows,
            templates: templatesResult.rows
        });
    } catch (err) {
        console.error('Erro ao buscar listas:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar listas.', error: err.message });
    }
});

app.post('/api/listas', async (req, res) => {
    const { nome_lista } = req.body;
    try {
        const query = 'INSERT INTO listas (nome_lista, is_template) VALUES ($1, false) RETURNING id, nome_lista';
        const result = await pool.query(query, [nome_lista]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar lista:', err.stack);
        res.status(500).json({ message: 'Erro ao criar lista.', error: err.message });
    }
});

app.post('/api/listas/from-template', async (req, res) => {
    const { nome_nova_lista, template_id } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const novaListaQuery = 'INSERT INTO listas (nome_lista, is_template) VALUES ($1, false) RETURNING id';
        const novaListaResult = await client.query(novaListaQuery, [nome_nova_lista]);
        const novaListaId = novaListaResult.rows[0].id;

        const itensModeloQuery = 'SELECT nome_item, categoria FROM itens_lista WHERE lista_id = $1';
        const itensModeloResult = await client.query(itensModeloQuery, [template_id]);
        const itensParaCopiar = itensModeloResult.rows;

        if (itensParaCopiar.length > 0) {
            const valoresInsert = itensParaCopiar.map(item => `(${novaListaId}, '${item.nome_item.replace(/'/g, "''")}', ${item.categoria ? `'${item.categoria.replace(/'/g, "''")}'` : 'NULL'})`).join(',');
            const insertItensQuery = `INSERT INTO itens_lista (lista_id, nome_item, categoria) VALUES ${valoresInsert}`;
            await client.query(insertItensQuery);
        }

        await client.query('COMMIT');
        res.status(201).json({ id: novaListaId, nome_lista: nome_nova_lista });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar lista a partir do modelo:', err.stack);
        res.status(500).json({ message: 'Erro ao criar lista a partir do modelo.', error: err.message });
    } finally {
        client.release();
    }
});

app.post('/api/listas/save-as-template', async (req, res) => {
    const { nome_template, lista_original_id } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const novoTemplateQuery = 'INSERT INTO listas (nome_lista, is_template) VALUES ($1, true) RETURNING id';
        const novoTemplateResult = await client.query(novoTemplateQuery, [nome_template]);
        const novoTemplateId = novoTemplateResult.rows[0].id;

        const itensOriginaisQuery = 'SELECT nome_item, categoria FROM itens_lista WHERE lista_id = $1';
        const itensOriginaisResult = await client.query(itensOriginaisQuery, [lista_original_id]);
        const itensParaCopiar = itensOriginaisResult.rows;

        if (itensParaCopiar.length > 0) {
            const valoresInsert = itensParaCopiar.map(item => `(${novoTemplateId}, '${item.nome_item.replace(/'/g, "''")}', ${item.categoria ? `'${item.categoria.replace(/'/g, "''")}'` : 'NULL'})`).join(',');
            const insertItensQuery = `INSERT INTO itens_lista (lista_id, nome_item, categoria) VALUES ${valoresInsert}`;
            await client.query(insertItensQuery);
        }

        await client.query('COMMIT');
        res.status(201).json({ id: novoTemplateId, nome_template: nome_template });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao salvar como modelo:', err.stack);
        res.status(500).json({ message: 'Erro ao salvar como modelo.', error: err.message });
    } finally {
        client.release();
    }
});

// --- ROTA FALTANTE ADICIONADA AQUI ---
app.get('/api/listas/:listaId/token', async (req, res) => {
    const { listaId } = req.params;
    try {
        const query = 'SELECT share_token FROM listas WHERE id = $1';
        const result = await pool.query(query, [listaId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Lista não encontrada.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter token:', err.stack);
        res.status(500).json({ message: 'Erro ao obter token.' });
    }
});

app.patch('/api/listas/:listaId', async (req, res) => {
    const { listaId } = req.params;
    const { nome_lista } = req.body;
    if (!nome_lista) return res.status(400).json({ message: 'O novo nome da lista é obrigatório.' });
    try {
        const query = 'UPDATE listas SET nome_lista = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [nome_lista, listaId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Lista não encontrada.' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao renomear lista:', err.stack);
        res.status(500).json({ message: 'Erro ao renomear lista.', error: err.message });
    }
});

app.delete('/api/listas/:listaId', async (req, res) => {
    const { listaId } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM itens_lista WHERE lista_id = $1', [listaId]);
        const result = await client.query('DELETE FROM listas WHERE id = $1', [listaId]);
        await client.query('COMMIT');
        if (result.rowCount === 0) return res.status(404).json({ message: 'Lista não encontrada.' });
        res.status(204).send();
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao deletar lista:', err.stack);
        res.status(500).json({ message: 'Erro ao deletar lista.', error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/listas/:listaId/reset', async (req, res) => {
    const { listaId } = req.params;
    try {
        const query = 'UPDATE itens_lista SET comprado = false, valor_unitario = NULL, quantidade = 1 WHERE lista_id = $1 RETURNING *';
        const result = await pool.query(query, [listaId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao resetar a lista:', err.stack);
        res.status(500).json({ message: 'Erro ao resetar a lista.', error: err.message });
    }
});


// --- ROTAS DE COMPARTILHAMENTO ---

// --- ROTA FALTANTE ADICIONADA AQUI ---
app.get('/api/share/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const listaQuery = 'SELECT id, nome_lista FROM listas WHERE share_token = $1';
        const listaResult = await pool.query(listaQuery, [token]);

        if (listaResult.rowCount === 0) {
            return res.status(404).json({ message: 'Lista compartilhada não encontrada.' });
        }
        const lista = listaResult.rows[0];

        const itensQuery = 'SELECT nome_item, categoria FROM itens_lista WHERE lista_id = $1 ORDER BY categoria ASC NULLS FIRST, id';
        const itensResult = await pool.query(itensQuery, [lista.id]);

        res.status(200).json({
            nome_lista: lista.nome_lista,
            itens: itensResult.rows
        });
    } catch (err) {
        console.error('Erro ao buscar lista compartilhada:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar lista compartilhada.' });
    }
});


// --- ROTAS DE ITENS ---

app.get('/api/listas/:listaId/itens', async (req, res) => {
    const { listaId } = req.params;
    try {
        const query = 'SELECT * FROM itens_lista WHERE lista_id = $1 ORDER BY categoria ASC NULLS FIRST, id';
        const result = await pool.query(query, [listaId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar itens:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar itens.', error: err.message });
    }
});

app.post('/api/listas/:listaId/itens', async (req, res) => {
    const { listaId } = req.params;
    const { nome_item, categoria } = req.body;
    try {
        const categoriaParaSalvar = categoria && categoria.trim() !== '' ? categoria.trim() : null;
        const query = 'INSERT INTO itens_lista (lista_id, nome_item, categoria) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [listaId, nome_item, categoriaParaSalvar]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar item:', err.stack);
        res.status(500).json({ message: 'Erro ao adicionar item.', error: err.message });
    }
});

app.put('/api/itens/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { valor_unitario, quantidade, comprado } = req.body;
    try {
        const query = 'UPDATE itens_lista SET valor_unitario = $1, quantidade = $2, comprado = $3 WHERE id = $4 RETURNING *';
        const result = await pool.query(query, [valor_unitario, quantidade, comprado, itemId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Item não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar item:', err.stack);
        res.status(500).json({ message: 'Erro ao atualizar item.', error: err.message });
    }
});

app.patch('/api/itens/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { nome_item } = req.body;
    if (!nome_item) return res.status(400).json({ message: 'O novo nome do item é obrigatório.' });
    try {
        const query = 'UPDATE itens_lista SET nome_item = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [nome_item, itemId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Item não encontrado.' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao renomear item:', err.stack);
        res.status(500).json({ message: 'Erro ao renomear item.', error: err.message });
    }
});

app.delete('/api/itens/:itemId', async (req, res) => {
    const { itemId } = req.params;
    try {
        const result = await pool.query('DELETE FROM itens_lista WHERE id = $1', [itemId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Item não encontrado.' });
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar item:', err.stack);
        res.status(500).json({ message: 'Erro ao deletar item.', error: err.message });
    }
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});