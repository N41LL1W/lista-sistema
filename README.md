# 🛒 Sistema de Listas de Compras Inteligente

Bem-vindo ao Sistema de Listas de Compras Inteligente! Esta é uma aplicação web full-stack desenvolvida para criar, gerenciar e otimizar suas idas ao supermercado. Com uma interface limpa, funcionalidades poderosas e sistema de contas de usuário, o objetivo é transformar a tarefa de fazer compras em uma experiência organizada, econômica e colaborativa.

![Captura de Tela da Aplicação](https://via.placeholder.com/800x450.png?text=Insira+um+print+da+sua+aplicação+aqui)
*(Substitua a imagem acima por uma captura de tela real do seu projeto!)*

## ✨ Funcionalidades Principais

O sistema foi construído de forma incremental, adicionando funcionalidades ricas para o usuário:

*   **🔐 Autenticação de Usuários:** Crie sua conta e faça login para gerenciar suas listas de forma privada e segura. As sessões são persistentes, mantendo você logado.
*   **📝 Gerenciamento Completo (CRUD):** Crie, renomeie (com duplo-clique), abra e delete listas, itens e **modelos** com facilidade.
*   **📂 Organização por Categorias:** Agrupe itens por categorias (Hortifruti, Laticínios, Limpeza) para otimizar sua rota no supermercado. É possível editar a categoria de um item a qualquer momento.
*   **🖱️ Modo Visual com Drag-and-Drop:** Adicione itens à sua lista de forma interativa, arrastando-os de uma "despensa" de itens comuns para as caixas de categoria.
*   **📱 Suporte Mobile:** A interface é totalmente responsiva, e o modo de arrastar e soltar funciona perfeitamente com o toque na tela.
*   **💸 Acompanhamento de Compras:** Durante a compra, insira preços e quantidades, marque itens como "comprados" e veja o total do seu carrinho ser calculado em tempo real.
*   **📈 Histórico de Preços:** Salve suas compras finalizadas e consulte o histórico de preços de cada produto para saber se está fazendo um bom negócio.
*   **🔄 Modelos Reutilizáveis (Templates):** Salve listas recorrentes (como "Compras do Mês") como modelos e crie novas listas a partir deles com um único clique.
*   **🔗 Compartilhamento Simples:** Gere um link de compartilhamento (somente visualização) para qualquer lista e envie para familiares ou amigos.
*   **🧹 Limpeza Inteligente:** Após a compra, limpe apenas os itens marcados como "comprados" da sua lista, ou resete todos os preços e quantidades para uma nova compra com a mesma lista.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando uma stack moderna e robusta, focada em performance e escalabilidade.

### **Frontend**
*   **HTML5**
*   **CSS3** (com Grid Layout, Flexbox e Media Queries para responsividade)
*   **JavaScript (ES6+)** (vanilla, sem frameworks)
*   **[SortableJS](https://github.com/SortableJS/Sortable):** Biblioteca leve para a funcionalidade de arrastar e soltar com suporte mobile.

### **Backend**
*   **[Node.js](https://nodejs.org/)**
*   **[Express.js](https://expressjs.com/):** Framework web para a criação da API RESTful.
*   **[express-session](https://github.com/expressjs/session):** Para gerenciamento de sessões de usuário.
*   **[bcryptjs](https://github.com/dcodeIO/bcrypt.js):** Para criptografia segura de senhas.

### **Banco de Dados**
*   **[PostgreSQL](https://www.postgresql.org/)**
*   **Hospedagem:** [Neon](https://neon.tech/) (Serverless Postgres)

### **Deployment**
*   **[Vercel](https://vercel.com/)**: Plataforma para deploy contínuo integrado com o GitHub.

## 🚀 Como Executar Localmente

Para rodar este projeto no seu ambiente de desenvolvimento, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Instale as dependências do backend:**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados:**
    *   Crie um banco de dados PostgreSQL (você pode usar o [Neon](https://neon.tech/)).
    *   Execute todos os comandos `CREATE TABLE` e `ALTER TABLE` encontrados na nossa conversa para criar a estrutura correta.

4.  **Configure as Variáveis de Ambiente:**
    *   Crie um arquivo `.env` na raiz do projeto.
    *   Adicione as seguintes variáveis, substituindo pelos seus próprios valores:
        ```env
        DATABASE_URL="sua_string_de_conexao_do_banco_de_dados"
        SESSION_SECRET="crie_uma_string_longa_e_aleatoria_aqui_para_seguranca"
        ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    node server.js
    ```

6.  **Abra o navegador:**
    Acesse `http://localhost:3000` para ver a aplicação funcionando.

## 🔮 Próximos Passos e Melhorias Futuras

O projeto tem uma base sólida para crescer ainda mais. Algumas ideias para o futuro incluem:
*   **Padronização de Produtos:** Criar uma base de dados de produtos padronizados para permitir análises de preço entre usuários.
*   **Análise de Preços da Comunidade:** Mostrar a média de preço de um produto com base nos dados de todos os usuários.
*   **Colaboração em Tempo Real:** Permitir que múltiplos usuários editem a mesma lista simultaneamente.

---
_Este projeto foi desenvolvido com o auxílio do Gemini, uma IA do Google._
