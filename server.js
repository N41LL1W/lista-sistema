const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- MIDDLEWARE & SESSÃO ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('trust proxy', 1);
app.use(session({
    secret: process.env.SESSION_SECRET || 'um-segredo-muito-forte-para-desenvolvimento',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
        httpOnly: true,
        sameSite: 'lax'
    }
}));
const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.status(401).json({ message: 'Não autorizado.' });
    }
};

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/registrar', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha || senha.length < 6) return res.status(400).json({ message: 'Email inválido ou senha muito curta (mínimo 6 caracteres).' });
    try {
        const senhaHash = await bcrypt.hash(senha, 12);
        const result = await pool.query('INSERT INTO usuarios (email, senha_hash) VALUES ($1, $2) RETURNING id, email', [email.toLowerCase(), senhaHash]);
        res.status(201).json({ message: 'Usuário registrado com sucesso!', usuario: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ message: 'Este email já está em uso.' });
        console.error('Erro ao registrar usuário:', err.stack);
        res.status(500).json({ message: 'Erro ao registrar usuário.' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        if (result.rowCount === 0) return res.status(401).json({ message: 'Email ou senha inválidos.' });
        const usuario = result.rows[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) return res.status(401).json({ message: 'Email ou senha inválidos.' });
        req.session.isAuth = true;
        req.session.usuario_id = usuario.id;
        req.session.usuario_email = usuario.email;
        res.status(200).json({ message: 'Login bem-sucedido!', usuario: { id: usuario.id, email: usuario.email } });
    } catch (err) {
        console.error('Erro ao fazer login:', err.stack);
        res.status(500).json({ message: 'Erro ao fazer login.' });
    }
});
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Não foi possível fazer logout.' });
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout bem-sucedido.' });
    });
});
app.get('/api/auth/status', (req, res) => {
    if (req.session.isAuth) {
        res.status(200).json({ logado: true, usuario: { id: req.session.usuario_id, email: req.session.usuario_email } });
    } else {
        res.status(200).json({ logado: false });
    }
});

// --- ROTAS DE PRODUTOS ---
app.get('/api/produtos/buscar', isAuth, async (req, res) => {
    const termoBusca = req.query.termo || '';
    try {
        const query = "SELECT id, nome, categoria_sugerida FROM produtos_padronizados WHERE nome ILIKE $1 ORDER BY nome LIMIT 10";
        const result = await pool.query(query, [`%${termoBusca}%`]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar produtos:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar produtos.' });
    }
});
app.post('/api/produtos/find-or-create', isAuth, async (req, res) => {
    const { nome_produto, categoria } = req.body;
    if (!nome_produto) return res.status(400).json({ message: 'Nome do produto é obrigatório.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let result = await client.query('SELECT * FROM produtos_padronizados WHERE nome = $1', [nome_produto]);
        let produto;
        if (result.rowCount > 0) {
            produto = result.rows[0];
        } else {
            result = await client.query('INSERT INTO produtos_padronizados (nome, categoria_sugerida) VALUES ($1, $2) RETURNING *', [nome_produto, categoria]);
            produto = result.rows[0];
        }
        await client.query('COMMIT');
        res.status(200).json(produto);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro em find-or-create produto:', err.stack);
        res.status(500).json({ message: 'Erro ao processar produto.' });
    } finally {
        client.release();
    }
});

// --- ROTAS DE LISTAS ---
app.get('/api/listas', isAuth, async (req, res) => {
    const { usuario_id } = req.session;
    try {
        const listasQuery = 'SELECT id, nome_lista FROM listas WHERE (is_template = false OR is_template IS NULL) AND usuario_id = $1 ORDER BY data_criacao DESC';
        const listasResult = await pool.query(listasQuery, [usuario_id]);
        const templatesQuery = 'SELECT id, nome_lista FROM listas WHERE is_template = true AND usuario_id = $1 ORDER BY nome_lista ASC';
        const templatesResult = await pool.query(templatesQuery, [usuario_id]);
        res.status(200).json({ listas: listasResult.rows, templates: templatesResult.rows });
    } catch (err) {
        console.error('Erro ao buscar listas do usuário:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar listas.' });
    }
});
app.post('/api/listas', isAuth, async (req, res) => {
    const { nome_lista } = req.body;
    const { usuario_id } = req.session;
    try {
        const result = await pool.query('INSERT INTO listas (nome_lista, usuario_id) VALUES ($1, $2) RETURNING id, nome_lista', [nome_lista.trim(), usuario_id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar lista:', err.stack);
        res.status(500).json({ message: 'Erro interno ao criar a lista.' });
    }
});
app.post('/api/listas/from-template', isAuth, async (req, res) => {
    const { nome_nova_lista, template_id } = req.body;
    const { usuario_id } = req.session;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const novaListaResult = await client.query('INSERT INTO listas (nome_lista, is_template, usuario_id) VALUES ($1, false, $2) RETURNING id', [nome_nova_lista, usuario_id]);
        const novaListaId = novaListaResult.rows[0].id;
        const itensModeloResult = await client.query('SELECT produto_id FROM itens_lista WHERE lista_id = $1', [template_id]);
        const itensParaCopiar = itensModeloResult.rows;
        if (itensParaCopiar.length > 0) {
            const valoresInsert = itensParaCopiar.map(item => `(${novaListaId}, ${item.produto_id})`).join(',');
            await client.query(`INSERT INTO itens_lista (lista_id, produto_id) VALUES ${valoresInsert}`);
        }
        await client.query('COMMIT');
        res.status(201).json({ id: novaListaId, nome_lista: nome_nova_lista });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar lista a partir do modelo:', err.stack);
        res.status(500).json({ message: 'Erro ao criar lista a partir do modelo.' });
    } finally {
        client.release();
    }
});
app.post('/api/listas/save-as-template', isAuth, async (req, res) => {
    const { nome_template, lista_original_id } = req.body;
    const { usuario_id } = req.session;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const novoTemplateResult = await client.query('INSERT INTO listas (nome_lista, is_template, usuario_id) VALUES ($1, true, $2) RETURNING id', [nome_template, usuario_id]);
        const novoTemplateId = novoTemplateResult.rows[0].id;
        const itensOriginaisResult = await client.query('SELECT produto_id FROM itens_lista WHERE lista_id = $1', [lista_original_id]);
        const itensParaCopiar = itensOriginaisResult.rows;
        if (itensParaCopiar.length > 0) {
            const valoresInsert = itensParaCopiar.map(item => `(${novoTemplateId}, ${item.produto_id})`).join(',');
            await client.query(`INSERT INTO itens_lista (lista_id, produto_id) VALUES ${valoresInsert}`);
        }
        await client.query('COMMIT');
        res.status(201).json({ id: novoTemplateId, nome_template: nome_template });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao salvar como modelo:', err.stack);
        res.status(500).json({ message: 'Erro ao salvar como modelo.' });
    } finally {
        client.release();
    }
});
app.get('/api/listas/:listaId/token', isAuth, async (req, res) => {
    const { listaId } = req.params;
    const { usuario_id } = req.session;
    try {
        const result = await pool.query('SELECT share_token FROM listas WHERE id = $1 AND usuario_id = $2', [listaId, usuario_id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Lista não encontrada ou não pertence a este usuário.' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter token:', err.stack);
        res.status(500).json({ message: 'Erro ao obter token.' });
    }
});
app.delete('/api/listas/:listaId', isAuth, async (req, res) => {
    const { listaId } = req.params;
    const { usuario_id } = req.session;
    try {
        const result = await pool.query('DELETE FROM listas WHERE id = $1 AND usuario_id = $2', [listaId, usuario_id]);
        if (result.rowCount === 0) return res.status(403).json({ message: 'Acesso negado.' });
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar lista:', err.stack);
        res.status(500).json({ message: 'Erro ao deletar lista.' });
    }
});
app.put('/api/listas/:listaId/reset', isAuth, async (req, res) => {
    const { listaId } = req.params;
    const { usuario_id } = req.session;
    try {
        const query = 'UPDATE itens_lista SET comprado = false, valor_unitario = NULL, quantidade = 1 WHERE lista_id = $1 AND lista_id IN (SELECT id FROM listas WHERE usuario_id = $2)';
        await pool.query(query, [listaId, usuario_id]);
        res.status(200).json({ message: 'Lista resetada.'});
    } catch (err) {
        console.error('Erro ao resetar a lista:', err.stack);
        res.status(500).json({ message: 'Erro ao resetar a lista.' });
    }
});
app.post('/api/listas/:listaId/limpar-comprados', isAuth, async (req, res) => {
    const { listaId } = req.params;
    const { usuario_id } = req.session;
    try {
        const query = 'DELETE FROM itens_lista WHERE lista_id = $1 AND comprado = true AND lista_id IN (SELECT id FROM listas WHERE usuario_id = $2)';
        await pool.query(query, [listaId, usuario_id]);
        res.status(200).json({ message: 'Itens comprados foram limpos da lista.' });
    } catch (err) {
        console.error('Erro ao limpar itens comprados:', err.stack);
        res.status(500).json({ message: 'Erro ao limpar itens comprados.' });
    }
});

// --- ROTAS DE ITENS (REFATORADAS) ---
app.get('/api/listas/:listaId/itens', isAuth, async (req, res) => {
    const { listaId } = req.params;
    const { usuario_id } = req.session;
    try {
        const query = `
            SELECT 
                i.id, i.lista_id, i.produto_id, i.valor_unitario, i.quantidade, i.comprado,
                p.nome AS nome_item, p.categoria_sugerida AS categoria
            FROM itens_lista i
            JOIN produtos_padronizados p ON i.produto_id = p.id
            JOIN listas l ON i.lista_id = l.id
            WHERE i.lista_id = $1 AND l.usuario_id = $2
            ORDER BY p.categoria_sugerida ASC NULLS FIRST, p.nome ASC
        `;
        const result = await pool.query(query, [listaId, usuario_id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar itens da lista:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar itens.' });
    }
});
app.post('/api/listas/:listaId/itens', isAuth, async (req, res) => {
    const { listaId } = req.params;
    const { produto_id } = req.body;
    const { usuario_id } = req.session;
    try {
        const ownerResult = await pool.query('SELECT id FROM listas WHERE id = $1 AND usuario_id = $2', [listaId, usuario_id]);
        if (ownerResult.rowCount === 0) return res.status(403).json({ message: 'Acesso negado.' });
        const existingResult = await pool.query('SELECT id FROM itens_lista WHERE lista_id = $1 AND produto_id = $2', [listaId, produto_id]);
        if (existingResult.rowCount > 0) return res.status(409).json({ message: 'Este item já está na lista.' });
        const result = await pool.query('INSERT INTO itens_lista (lista_id, produto_id) VALUES ($1, $2) RETURNING id', [listaId, produto_id]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar item:', err.stack);
        res.status(500).json({ message: 'Erro ao adicionar item.' });
    }
});
app.put('/api/itens/:itemId', isAuth, async (req, res) => {
    const { itemId } = req.params;
    const { valor_unitario, quantidade, comprado } = req.body;
    const { usuario_id } = req.session;
    try {
        const query = 'UPDATE itens_lista SET valor_unitario = $1, quantidade = $2, comprado = $3 WHERE id = $4 AND lista_id IN (SELECT id FROM listas WHERE usuario_id = $5) RETURNING *';
        const result = await pool.query(query, [valor_unitario, quantidade, comprado, itemId, usuario_id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Item não encontrado ou acesso negado.' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar item:', err.stack);
        res.status(500).json({ message: 'Erro ao atualizar item.' });
    }
});
app.delete('/api/itens/:itemId', isAuth, async (req, res) => {
    const { itemId } = req.params;
    const { usuario_id } = req.session;
    try {
        const query = 'DELETE FROM itens_lista WHERE id = $1 AND lista_id IN (SELECT id FROM listas WHERE usuario_id = $2)';
        const result = await pool.query(query, [itemId, usuario_id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Item não encontrado ou acesso negado.' });
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar item:', err.stack);
        res.status(500).json({ message: 'Erro ao deletar item.' });
    }
});

// --- ROTAS DE HISTÓRICO (REFATORADAS) ---
app.post('/api/compras/finalizar', isAuth, async (req, res) => {
    const { itensComprados } = req.body;
    const { usuario_id } = req.session;
    if (!itensComprados || itensComprados.length === 0) return res.status(400).json({ message: 'Nenhum item comprado para registrar.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = 'INSERT INTO historico_precos (produto_id, valor_unitario, usuario_id) VALUES ($1, $2, $3)';
        for (const item of itensComprados) {
            await client.query(query, [item.produto_id, item.valor_unitario, usuario_id]);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Histórico de compras salvo com sucesso!' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao salvar histórico de compras:', err.stack);
        res.status(500).json({ message: 'Erro ao salvar histórico.' });
    } finally {
        client.release();
    }
});
app.get('/api/itens/historico/:produtoId', isAuth, async (req, res) => {
    const { usuario_id } = req.session;
    const { produtoId } = req.params;
    try {
        const query = 'SELECT valor_unitario, data_compra FROM historico_precos WHERE produto_id = $1 AND usuario_id = $2 ORDER BY data_compra DESC LIMIT 5';
        const result = await pool.query(query, [produtoId, usuario_id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar histórico do item:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar histórico do item.' });
    }
});

// --- ROTAS PÚBLICAS ---
app.get('/api/share/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const listaResult = await pool.query('SELECT id, nome_lista FROM listas WHERE share_token = $1', [token]);
        if (listaResult.rowCount === 0) return res.status(404).json({ message: 'Lista compartilhada não encontrada.' });
        const lista = listaResult.rows[0];
        const itensQuery = `
            SELECT p.nome AS nome_item, p.categoria_sugerida AS categoria
            FROM itens_lista i
            JOIN produtos_padronizados p ON i.produto_id = p.id
            WHERE i.lista_id = $1
            ORDER BY p.categoria_sugerida ASC NULLS FIRST, p.nome ASC
        `;
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
app.get('/api/itens/unicos', async (req, res) => {
    // MODIFICADO: Esta rota agora busca da nova tabela de produtos.
    try {
        const result = await pool.query('SELECT nome FROM produtos_padronizados ORDER BY nome ASC');
        const nomesItens = result.rows.map(row => row.nome);
        res.status(200).json(nomesItens);
    } catch (err) {
        console.error('Erro ao buscar itens únicos:', err.stack);
        res.status(500).json({ message: 'Erro ao buscar itens únicos.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});