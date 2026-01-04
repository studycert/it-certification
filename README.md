# IT Certification Study Platform

📁 Estrutura do Projeto

it-certification/
├── 📄 index.html              # Página principal (Home)
├── 📄 materiais.html          # Página de materiais de estudo
├── 📄 admin.html              # Painel administrativo
├── 📄 README.md               # Documentação do projeto
│
├── 📂 css/                    # Folhas de estilo
│   ├── style.css             # Estilos gerais
│   ├── materiais.css         # Estilos específicos para materiais
│   └── admin.css             # Estilos do painel administrativo
│
├── 📂 js/                     # Scripts JavaScript
│   ├── app.js                # Lógica principal da aplicação
│   ├── auth.js               # Sistema de autenticação
│   ├── config.js             # Configurações e constantes
│   ├── materiais.js          # Funcionalidades da página de materiais
│   └── admin.js              # Funcionalidades do painel admin
│
├── 📂 simulados/              # Simulados em HTML
│   ├── simulado-itil4-01.html
│   ├── simulado-itil4-02.html
│   └── ... (13 simulados)
│
└── 📂 images/                 # Imagens e assets (se houver)
🚀 Funcionalidades Principais
1. Página Principal (index.html)

    Seções:

        🏠 Home - Visão geral da plataforma

        📜 Certificações - Lista completa de certificações

        💬 Fórum - Discussões e comunidade

        📚 Material de Estudo - Recursos por certificação

        📝 Simulados - Testes práticos

    Recursos:

        Sistema de autenticação (Login/Cadastro)

        Navegação por tabs/sections

        Layout responsivo

2. Página de Materiais (materiais.html)

    Certificações suportadas:

        ITIL 4 Foundation

        Microsoft Azure

        Amazon AWS

        LPIC-1 e LPIC-2

        Security+

        CCNA

    Funcionalidades:

        Upload de materiais (PDF, DOC, PPT, ZIP, MP4)

        Filtros por tipo e ordenação

        Estatísticas de visualizações/downloads

        Sistema de exclusão para proprietários

3. Painel Administrativo (admin.html)

    Gerenciamento:

        Usuários

        Materiais

        Simulados

    Estatísticas e relatórios

4. Sistema de Simulados

    13 simulados ITIL 4 Foundation

    Simulados para outras certificações:

        LPIC-1 (60 questões)

        Security+ (45 questões)

        AWS Cloud Practitioner (50 questões)

        Azure Fundamentals (40 questões)

        CCNA (55 questões)

    Upload de novos simulados

🔧 Tecnologias Utilizadas
Tecnologia	Finalidade
HTML5	Estrutura das páginas
CSS3	Estilização e layout responsivo
JavaScript	Interatividade e lógica
Font Awesome	Ícones e elementos visuais
Supabase	Backend e autenticação
GitHub Pages	Hospedagem gratuita
🗄️ Backend (Supabase)

    URL: https://uhbwudgdeyvbkqoflaqw.supabase.co

    Funcionalidades:

        Autenticação de usuários

        Armazenamento de materiais

        Banco de dados PostgreSQL

        API RESTful

📊 Estatísticas do Repositório

    Commits: 1606 objetos

    Tamanho: ~1.18 MB

    Branches: main

    Última atualização: Contínua

🔐 Segurança e Autenticação

    Sistema de login com:

        Email e senha

        Validação de sessão

        Proteção de rotas

    Controle de permissões:

        Usuários comuns podem upload/download

        Proprietários podem excluir seus materiais

📱 Responsividade

    Design mobile-first

    Compatível com:

        Desktop (992px+)

        Tablet (768px+)

        Mobile (480px+)

    Menu hambúrguer para mobile
    
## License
Educational use.
![GitHub last commit](https://img.shields.io/github/last-commit/studycert/it-certification)
![GitHub repo size](https://img.shields.io/github/repo-size/studycert/it-certification)
![GitHub deployments](https://img.shields.io/github/deployments/studycert/it-certification/github-pages)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
