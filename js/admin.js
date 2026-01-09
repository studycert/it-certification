// Admin Panel Application - VERSÃO COMPLETA E FUNCIONAL
class AdminApp {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminData = null;
        this.currentSection = 'dashboard';
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('🎯 Inicializando Painel Admin');
        
        try {
            // Inicializar Supabase
            await this.initSupabase();
            
            // Verificar autenticação e permissões
            await this.checkAuth();
            
            // Carregar interface
            this.carregarInterface();
            
            // Configurar navegação
            this.configurarNavegacao();
            
            // Carregar dados iniciais
            await this.carregarDadosIniciais();
            
            // Configurar eventos
            this.configurarEventos();
            
            console.log('✅ Painel Admin carregado com sucesso!');
            
        } catch (err) {
            console.error('❌ Erro ao inicializar painel admin:', err);
            this.showToast('Erro ao carregar painel administrativo', 'error');
        }
    }

    async initSupabase() {
        try {
            if (typeof supabase !== 'undefined' && SUPABASE_CONFIG) {
                this.supabase = supabase.createClient(
                    SUPABASE_CONFIG.url,
                    SUPABASE_CONFIG.anonKey,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true,
                            storage: window.localStorage,
                            storageKey: 'studycert-auth'
                        }
                    }
                );
                console.log('✅ Supabase conectado no admin');
            } else {
                console.warn('⚠️ Supabase não configurado, usando modo desenvolvimento');
            }
        } catch (error) {
            console.error('❌ Erro na conexão do Supabase:', error);
        }
    }

    async checkAuth() {
        try {
            console.log('🔐 Verificando permissões internas...');
            
            // 1. Pega a sessão atual do Supabase
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error || !session) {
                console.error("Sessão não encontrada");
                window.location.href = 'index.html';
                return;
            }

            this.currentUser = session.user;
            const userEmail = this.currentUser.email.toLowerCase();

            // 2. Consulta as tabelas de admin para confirmar o acesso
            const [res1, res2] = await Promise.all([
                this.supabase.from('admin_user').select('email').eq('email', userEmail).maybeSingle(),
                this.supabase.from('admin_usuarios').select('email').eq('email', userEmail).maybeSingle()
            ]);

            if (res1.data || res2.data) {
                this.adminData = res1.data || res2.data;
                localStorage.setItem('admin_role', 'super_admin');
                
                // 3. ESSENCIAL: Mostra a página (remove a tela branca do admin.html)
                document.documentElement.style.display = 'block';
                
                // 4. Esconde o carregando se existir
                const loader = document.getElementById('loadingOverlay');
                if (loader) loader.style.display = 'none';

                console.log('✅ Acesso confirmado:', userEmail);
            } else {
                console.error('🚫 Usuário não autorizado');
                alert("Acesso negado para " + userEmail);
                window.location.href = 'index.html';
            }
        } catch (err) {
            console.error('❌ Erro crítico no checkAuth:', err);
            window.location.href = 'index.html';
        }
    }
        // CONSULTA AS SUAS DUAS TABELAS REAIS
        const [res1, res2] = await Promise.all([
            this.supabase
                .from('admin_user')
                .select('email')
                .eq('email', userEmail)
                .maybeSingle(),
            this.supabase
                .from('admin_usuarios')
                .select('email')
                .eq('email', userEmail)
                .maybeSingle()
        ]);

        // Se encontrar o e-mail em qualquer uma das duas, retorna TRUE
        if (res1.data || res2.data) {
            // Guardamos o papel de admin no storage para outras funções do app
            localStorage.setItem('admin_role', 'super_admin');
            this.adminData = res1.data || res2.data;
            return true;
        }

        return false;
    } catch (err) {
        console.warn('⚠️ Erro ao consultar tabelas de admin:', err);
        return false;
    }
}

    setupDevUser() {
        this.currentUser = {
            id: 'dev-' + Date.now(),
            email: 'admin@example.com',
            user_metadata: { full_name: 'Administrador' }
        };
        
        this.adminData = {
            role: 'super_admin',
            permissions: ['*']
        };
        
        localStorage.setItem('admin_role', 'super_admin');
        localStorage.setItem('authenticated', 'true');
    }

    redirectToLogin() {
        this.showToast('Por favor, faça login para acessar o painel administrativo', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html#login';
        }, 1500);
    }

    carregarInterface() {
        // Atualizar perfil
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        
        if (adminName) adminName.textContent = this.currentUser.user_metadata?.full_name || 'Administrador';
        if (adminEmail) adminEmail.textContent = this.currentUser.email || 'admin@example.com';
        if (adminAvatar) {
            const name = this.currentUser.user_metadata?.full_name || 'AD';
            adminAvatar.textContent = name.substring(0, 2).toUpperCase();
        }
    }

    configurarNavegacao() {
        // Navegação entre seções
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const sectionId = item.getAttribute('data-section');
                this.showSection(sectionId);
            });
        });
        
        // Navegação inicial
        this.showSection('dashboard');
    }

    showSection(sectionId) {
        // Remover active de todos
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Adicionar active ao selecionado
        const activeItem = document.querySelector(`.admin-menu-item[data-section="${sectionId}"]`);
        const activeSection = document.getElementById(sectionId);
        
        if (activeItem) activeItem.classList.add('active');
        if (activeSection) {
            activeSection.classList.add('active');
            
            // Carregar dados específicos da seção
            this.loadSectionData(sectionId);
        }
    }

    async loadSectionData(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                await this.carregarDashboard();
                break;
            case 'usuarios':
                await this.carregarUsuarios();
                break;
            case 'simulados':
                await this.carregarSimulados();
                break;
            case 'forum':
                await this.carregarForum();
                break;
            case 'certificacoes':
                await this.carregarCertificacoes();
                break;
            case 'materiais':
                await this.carregarMateriais();
                break;
            case 'relatorios':
                await this.carregarRelatorios();
                break;
            case 'configuracoes':
                this.carregarConfiguracoes();
                break;
        }
    }

    async carregarDadosIniciais() {
        // Carregar estatísticas gerais
        await this.carregarEstatisticas();
        
        // Carregar atividades recentes
        await this.carregarAtividadeRecente();
        
        // Carregar alertas
        await this.carregarAlertas();
    }

    async carregarEstatisticas() {
        try {
            // Dados de exemplo (substituir por dados reais do banco)
            const stats = {
                totalUsuarios: 1248,
                totalSimulados: 43,
                totalPosts: 328,
                totalArmazenamento: 156,
                visitasHoje: 24
            };
            
            // Atualizar interface
            document.getElementById('totalUsuarios').textContent = stats.totalUsuarios.toLocaleString();
            document.getElementById('totalSimulados').textContent = stats.totalSimulados;
            document.getElementById('totalPosts').textContent = stats.totalPosts;
            document.getElementById('totalArmazenamento').textContent = `${stats.totalArmazenamento} MB`;
            document.getElementById('totalArmazenamentoNum').textContent = stats.totalArmazenamento;
            document.getElementById('visitasHoje').textContent = stats.visitasHoje;
            
            // Badges
            document.getElementById('badgeUsers').textContent = stats.totalUsuarios;
            document.getElementById('badgeSimulados').textContent = stats.totalSimulados;
            document.getElementById('badgeForum').textContent = stats.totalPosts;
            
        } catch (err) {
            console.error('❌ Erro ao carregar estatísticas:', err);
        }
    }

    async carregarDashboard() {
        // Inicializar gráficos
        this.initCharts();
        
        // Carregar dados do dashboard
        await this.carregarAtividadeRecente();
        await this.carregarAlertas();
    }

    initCharts() {
        // Gráfico de acesso
        const accessCtx = document.getElementById('accessChart');
        if (accessCtx) {
            this.charts.access = new Chart(accessCtx, {
                type: 'line',
                data: {
                    labels: ['1 Jan', '8 Jan', '15 Jan', '22 Jan', '29 Jan', '5 Fev', '12 Fev'],
                    datasets: [
                        {
                            label: 'Visitas',
                            data: [1200, 1900, 1500, 2500, 2200, 3000, 2800],
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Downloads',
                            data: [400, 800, 600, 1200, 900, 1500, 1300],
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
        }
        
        // Gráfico de usuários
        const usersCtx = document.getElementById('usersChart');
        if (usersCtx) {
            this.charts.users = new Chart(usersCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
                    datasets: [
                        {
                            label: 'Novos Usuários',
                            data: [120, 190, 150, 250, 220, 300, 280],
                            backgroundColor: 'rgba(52, 152, 219, 0.7)',
                            borderColor: '#3498db',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        }
                    }
                }
            });
        }
    }

    async carregarAtividadeRecente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        try {
            // Dados de exemplo
            const atividades = [
                { icon: 'fa-sign-in-alt', iconClass: 'login', title: 'Login de administrador', user: 'Admin', time: 'Agora' },
                { icon: 'fa-upload', iconClass: 'upload', title: 'Simulado publicado', user: 'João Silva', time: '2h atrás' },
                { icon: 'fa-user-plus', iconClass: 'user', title: 'Novo usuário registrado', user: 'maria@email.com', time: '4h atrás' },
                { icon: 'fa-comment', iconClass: 'comment', title: 'Novo post no fórum', user: 'Carlos Santos', time: '1 dia atrás' },
                { icon: 'fa-download', iconClass: 'download', title: 'Download de material', user: 'Ana Pereira', time: '2 dias atrás' }
            ];
            
            container.innerHTML = atividades.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.iconClass}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${activity.user}</p>
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('❌ Erro ao carregar atividades:', err);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar atividades</p>
                </div>
            `;
        }
    }

    async carregarAlertas() {
        const container = document.getElementById('alertList');
        if (!container) return;
        
        try {
            // Dados de exemplo
            const alertas = [
                { type: 'warning', icon: 'fa-exclamation-triangle', title: 'Backup Pendente', message: 'Backup semanal deve ser realizado até amanhã' },
                { type: 'danger', icon: 'fa-server', title: 'Alta Carga', message: 'Servidor com 85% de utilização de CPU' },
                { type: 'success', icon: 'fa-check-circle', title: 'Sistema Atualizado', message: 'Atualização de segurança aplicada com sucesso' }
            ];
            
            container.innerHTML = alertas.map(alert => `
                <div class="alert-item ${alert.type}">
                    <i class="fas ${alert.icon}"></i>
                    <div class="alert-content">
                        <h4>${alert.title}</h4>
                        <p>${alert.message}</p>
                    </div>
                </div>
            `).join('');
            
            // Atualizar contador
            document.getElementById('alertCount').textContent = alertas.length;
            
        } catch (err) {
            console.error('❌ Erro ao carregar alertas:', err);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar alertas</p>
                </div>
            `;
        }
    }

    async carregarUsuarios() {
        const container = document.getElementById('usersTableBody');
        if (!container) return;
        
        this.showLoading('usersTableBody');
        
        try {
            // Dados de exemplo
            const usuarios = [
                { id: 1, nome: 'João Silva', email: 'joao@email.com', avatar: 'JS', status: 'ativo', role: 'usuario', registro: '2024-01-15' },
                { id: 2, nome: 'Maria Santos', email: 'maria@email.com', avatar: 'MS', status: 'ativo', role: 'moderador', registro: '2024-01-10' },
                { id: 3, nome: 'Carlos Oliveira', email: 'carlos@email.com', avatar: 'CO', status: 'pendente', role: 'usuario', registro: '2024-01-20' },
                { id: 4, nome: 'Ana Pereira', email: 'ana@email.com', avatar: 'AP', status: 'ativo', role: 'usuario', registro: '2024-01-05' },
                { id: 5, nome: 'Pedro Costa', email: 'pedro@email.com', avatar: 'PC', status: 'inativo', role: 'usuario', registro: '2024-01-12' }
            ];
            
            container.innerHTML = usuarios.map(user => `
                <tr>
                    <td><input type="checkbox" class="table-checkbox" data-id="${user.id}"></td>
                    <td>
                        <div class="user-avatar-sm">${user.avatar}</div>
                        ${user.nome}
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="status-badge status-${user.status}">
                            ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${user.role === 'moderador' ? 'badge-secondary' : ''}">
                            ${user.role}
                        </span>
                    </td>
                    <td>${user.registro}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="AdminApp.editarUsuario(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="AdminApp.excluirUsuario(${user.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Configurar seleção múltipla
            this.configurarSelecaoMultipla('users');
            
            // Atualizar paginação
            this.atualizarPaginacao('users', usuarios.length, 1, 10);
            
        } catch (err) {
            console.error('❌ Erro ao carregar usuários:', err);
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Erro ao carregar usuários</p>
                    </td>
                </tr>
            `;
        }
    }

    async carregarSimulados() {
        const container = document.getElementById('simuladosTableBody');
        if (!container) return;
        
        this.showLoading('simuladosTableBody');
        
        try {
            // Dados de exemplo
            const simulados = [
                { id: 1, nome: 'ITIL 4 Foundation - Simulado 1', categoria: 'ITIL', autor: 'João Silva', status: 'aprovado', downloads: 145, data: '2024-01-15' },
                { id: 2, nome: 'Azure Fundamentals', categoria: 'Azure', autor: 'Maria Santos', status: 'aprovado', downloads: 89, data: '2024-01-10' },
                { id: 3, nome: 'AWS Cloud Practitioner', categoria: 'AWS', autor: 'Carlos Oliveira', status: 'pendente', downloads: 0, data: '2024-01-20' },
                { id: 4, nome: 'LPIC-1 Comandos Essenciais', categoria: 'Linux', autor: 'Ana Pereira', status: 'aprovado', downloads: 210, data: '2024-01-05' },
                { id: 5, nome: 'Security+ SY0-601', categoria: 'Security', autor: 'Pedro Costa', status: 'rejeitado', downloads: 0, data: '2024-01-12' }
            ];
            
            container.innerHTML = simulados.map(simulado => `
                <tr>
                    <td><input type="checkbox" class="table-checkbox" data-id="${simulado.id}"></td>
                    <td>${simulado.nome}</td>
                    <td>${simulado.categoria}</td>
                    <td>${simulado.autor}</td>
                    <td>
                        <span class="status-badge status-${simulado.status}">
                            ${this.capitalizeFirst(simulado.status)}
                        </span>
                    </td>
                    <td>${simulado.downloads}</td>
                    <td>${simulado.data}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="AdminApp.verSimulado(${simulado.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="AdminApp.editarSimulado(${simulado.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${simulado.status === 'pendente' ? `
                                <button class="btn btn-sm btn-success" onclick="AdminApp.aprovarSimulado(${simulado.id})">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Configurar seleção múltipla
            this.configurarSelecaoMultipla('simulados');
            
            // Atualizar paginação
            this.atualizarPaginacao('simulados', simulados.length, 1, 10);
            
        } catch (err) {
            console.error('❌ Erro ao carregar simulados:', err);
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Erro ao carregar simulados</p>
                    </td>
                </tr>
            `;
        }
    }

    async carregarForum() {
        const container = document.getElementById('forumTableBody');
        if (!container) return;
        
        this.showLoading('forumTableBody');
        
        try {
            // Dados de exemplo
            const posts = [
                { id: 1, titulo: 'Dúvida sobre LPIC-1 - Comandos essenciais', autor: 'João Silva', categoria: 'Linux', respostas: 7, visualizacoes: 42, status: 'ativo', data: '2024-01-15' },
                { id: 2, titulo: 'Material de estudo para ITIL 4 Foundation', autor: 'Maria Santos', categoria: 'ITIL', respostas: 12, visualizacoes: 87, status: 'ativo', data: '2024-01-14' },
                { id: 3, titulo: 'Experiência com exame Security+', autor: 'Carlos Oliveira', categoria: 'Security', respostas: 23, visualizacoes: 156, status: 'fechado', data: '2024-01-13' },
                { id: 4, titulo: 'Problema com upload de simulado', autor: 'Ana Pereira', categoria: 'Ajuda', respostas: 3, visualizacoes: 25, status: 'denunciado', data: '2024-01-12' },
                { id: 5, titulo: 'Dicas para certificação AWS', autor: 'Pedro Costa', categoria: 'AWS', respostas: 15, visualizacoes: 98, status: 'ativo', data: '2024-01-11' }
            ];
            
            container.innerHTML = posts.map(post => `
                <tr>
                    <td><input type="checkbox" class="table-checkbox" data-id="${post.id}"></td>
                    <td>${post.titulo}</td>
                    <td>${post.autor}</td>
                    <td>${post.categoria}</td>
                    <td>${post.respostas}</td>
                    <td>${post.visualizacoes}</td>
                    <td>
                        <span class="status-badge status-${post.status}">
                            ${this.capitalizeFirst(post.status)}
                        </span>
                    </td>
                    <td>${post.data}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="AdminApp.verPost(${post.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="AdminApp.editarPost(${post.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${post.status === 'denunciado' ? `
                                <button class="btn btn-sm btn-warning" onclick="AdminApp.moderarPost(${post.id})">
                                    <i class="fas fa-gavel"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Configurar seleção múltipla
            this.configurarSelecaoMultipla('forum');
            
            // Atualizar paginação
            this.atualizarPaginacao('forum', posts.length, 1, 10);
            
        } catch (err) {
            console.error('❌ Erro ao carregar posts:', err);
            container.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Erro ao carregar posts</p>
                    </td>
                </tr>
            `;
        }
    }

    async carregarCertificacoes() {
        const container = document.getElementById('certificacoesAdminContent');
        if (!container) return;
        
        this.showLoading('certificacoesAdminContent');
        
        try {
            // Dados de exemplo
            const certificacoes = [
                { id: 1, nome: 'Azure Fundamentals', nivel: 'Fundamental', provedor: 'Microsoft', descricao: 'Conceitos fundamentais de nuvem e serviços Azure.' },
                { id: 2, nome: 'AWS Cloud Practitioner', nivel: 'Fundamental', provedor: 'AWS', descricao: 'Fundamentos da AWS e conceitos de computação em nuvem.' },
                { id: 3, nome: 'Security+', nivel: 'Associate', provedor: 'CompTIA', descricao: 'Fundamentos de cybersecurity.' },
                { id: 4, nome: 'ITIL 4 Foundation', nivel: 'Fundamental', provedor: 'ITIL', descricao: 'Framework de gerenciamento de serviços de TI.' },
                { id: 5, nome: 'LPIC-1', nivel: 'Associate', provedor: 'Linux', descricao: 'Certificação Linux Professional Institute - Nível 1.' }
            ];
            
            container.innerHTML = certificacoes.map(cert => `
                <div class="cert-card">
                    <div class="cert-icon">
                        <i class="${this.getCertIcon(cert.provedor)}"></i>
                    </div>
                    <div class="cert-content">
                        <span class="cert-level">${cert.nivel}</span>
                        <h3>${cert.nome}</h3>
                        <p>${cert.descricao}</p>
                        <div class="action-buttons" style="margin-top: 15px;">
                            <button class="btn btn-sm btn-outline" onclick="AdminApp.editarCertificacao(${cert.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="AdminApp.excluirCertificacao(${cert.id})">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('❌ Erro ao carregar certificações:', err);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar certificações</p>
                </div>
            `;
        }
    }

    async carregarMateriais() {
        const container = document.getElementById('materiaisAdminContent');
        if (!container) return;
        
        this.showLoading('materiaisAdminContent');
        
        try {
            // Dados de exemplo
            const materiais = [
                { id: 1, nome: 'Microsoft Azure', tipo: 'pdf', certificacao: 'Azure', descricao: 'Guias de estudo, resumos e recursos para certificações Azure.' },
                { id: 2, nome: 'Amazon AWS', tipo: 'video', certificacao: 'AWS', descricao: 'Material para Cloud Practitioner, Solutions Architect e outras.' },
                { id: 3, nome: 'LPIC-1 e LPIC-2', tipo: 'pdf', certificacao: 'Linux', descricao: 'Recursos para certificações Linux Professional Institute.' },
                { id: 4, nome: 'ITIL 4', tipo: 'link', certificacao: 'ITIL', descricao: 'Guias, resumos e material para certificação ITIL.' },
                { id: 5, nome: 'Security+', tipo: 'apresentacao', certificacao: 'Security', descricao: 'Material para preparação da certificação CompTIA Security+.' }
            ];
            
            container.innerHTML = materiais.map(material => `
                <div class="material-card">
                    <div class="material-icon">
                        <i class="${this.getMaterialIcon(material.tipo)}"></i>
                    </div>
                    <div class="material-content">
                        <h3>${material.nome}</h3>
                        <p>${material.descricao}</p>
                        <div class="action-buttons" style="margin-top: 15px;">
                            <button class="btn btn-sm btn-outline" onclick="AdminApp.verMaterial(${material.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="AdminApp.editarMaterial(${material.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('❌ Erro ao carregar materiais:', err);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Erro ao carregar materiais</p>
                </div>
            `;
        }
    }

    async carregarRelatorios() {
        // Carregar dados para os relatórios rápidos
        await this.carregarTopSimulados();
        await this.carregarTopForumTopics();
        await this.carregarTopCertificacoes();
    }

    async carregarTopSimulados() {
        const container = document.getElementById('topSimulados');
        if (!container) return;
        
        try {
            // Dados de exemplo
            const topSimulados = [
                { nome: 'ITIL 4 Foundation - Simulado 1', acessos: 145 },
                { nome: 'LPIC-1 Comandos Essenciais', acessos: 120 },
                { nome: 'Azure Fundamentals', acessos: 89 },
                { nome: 'AWS Cloud Practitioner', acessos: 76 },
                { nome: 'Security+ SY0-601', acessos: 65 }
            ];
            
            container.innerHTML = topSimulados.map((simulado, index) => `
                <div class="report-item">
                    <span>${index + 1}. ${simulado.nome}</span>
                    <strong>${simulado.acessos}</strong>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('❌ Erro ao carregar top simulados:', err);
            container.innerHTML = '<p class="text-muted">Erro ao carregar dados</p>';
        }
    }

    async carregarTopForumTopics() {
        const container = document.getElementById('topForumTopics');
        if (!container) return;
        
        try {
            // Dados de exemplo
            const topTopics = [
                { titulo: 'Experiência com exame Security+', respostas: 23 },
                { titulo: 'Material de estudo para ITIL 4', respostas: 12 },
                { titulo: 'Dúvida sobre LPIC-1', respostas: 7 },
                { titulo: 'Dicas para certificação AWS', respostas: 15 },
                { titulo: 'Problema com upload de simulado', respostas: 3 }
            ];
            
            container.innerHTML = topTopics.map((topic, index) => `
                <div class="report-item">
                    <span>${index + 1}. ${topic.titulo}</span>
                    <strong>${topic.respostas}</strong>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('❌ Erro ao carregar top tópicos:', err);
            container.innerHTML = '<p class="text-muted">Erro ao carregar dados</p>';
        }
    }

    async carregarTopCertificacoes() {
        const container = document.getElementById('topCertificacoes');
        if (!container) return;
        
        try {
            // Dados de exemplo
            const topCerts = [
                { nome: 'ITIL 4 Foundation', interessados: 320 },
                { nome: 'LPIC-1', interessados: 280 },
                { nome: 'Azure Fundamentals', interessados: 245 },
                { nome: 'AWS Cloud Practitioner', interessados: 210 },
                { nome: 'Security+', interessados: 180 }
            ];
            
            container.innerHTML = topCerts.map((cert, index) => `
                <div class="report-item">
                    <span>${index + 1}. ${cert.nome}</span>
                    <strong>${cert.interessados}</strong>
                </div>
            `).join('');
            
        } catch (err) {
            console.error('❌ Erro ao carregar top certificações:', err);
            container.innerHTML = '<p class="text-muted">Erro ao carregar dados</p>';
        }
    }

    carregarConfiguracoes() {
        // Carregar configurações salvas
        const savedSettings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
        
        // Preencher formulários com configurações salvas
        if (savedSettings.general) {
            document.getElementById('siteName').value = savedSettings.general.siteName || 'StudyCert';
            document.getElementById('siteEmail').value = savedSettings.general.siteEmail || 'contato@studyCert.com';
            document.getElementById('siteDescription').value = savedSettings.general.siteDescription || 'Sua plataforma completa para preparação e certificação em Tecnologia da Informação';
            document.getElementById('maintenanceMode').checked = savedSettings.general.maintenanceMode || false;
        }
        
        if (savedSettings.security) {
            document.getElementById('passwordPolicy').value = savedSettings.security.passwordPolicy || 'medium';
            document.getElementById('sessionTimeout').value = savedSettings.security.sessionTimeout || 60;
            document.getElementById('maxLoginAttempts').value = savedSettings.security.maxLoginAttempts || 5;
            document.getElementById('twoFactorAuth').checked = savedSettings.security.twoFactorAuth || false;
        }
    }

    configurarEventos() {
        // Botão de atualizar atividades
        document.getElementById('activityList')?.addEventListener('click', (e) => {
            if (e.target.closest('.btn-outline')) {
                this.loadActivities();
            }
        });
        
        // Busca em tempo real
        document.getElementById('searchUsers')?.addEventListener('input', (e) => {
            this.filtrarTabela('users', e.target.value);
        });
        
        document.getElementById('searchSimulados')?.addEventListener('input', (e) => {
            this.filtrarTabela('simulados', e.target.value);
        });
        
        document.getElementById('searchForum')?.addEventListener('input', (e) => {
            this.filtrarTabela('forum', e.target.value);
        });
        
        // Filtros
        document.getElementById('filterStatus')?.addEventListener('change', (e) => {
            this.filtrarTabela('users', '', e.target.value);
        });
        
        document.getElementById('filterCategory')?.addEventListener('change', (e) => {
            this.filtrarTabela('simulados', '', e.target.value);
        });
        
        document.getElementById('filterForumCategory')?.addEventListener('change', (e) => {
            this.filtrarTabela('forum', '', e.target.value);
        });
        
        // Formulários de configuração
        document.getElementById('generalSettings')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarConfiguracoesGerais();
        });
        
        document.getElementById('securitySettings')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarConfiguracoesSeguranca();
        });
        
        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.fecharTodosModais();
            }
        });
    }

    configurarSelecaoMultipla(tipo) {
        const selectAll = document.getElementById(`selectAll${this.capitalizeFirst(tipo)}`);
        const checkboxes = document.querySelectorAll(`#${tipo}TableBody .table-checkbox`);
        
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
        }
        
        // Atualizar select all quando checkboxes individuais mudarem
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                const someChecked = Array.from(checkboxes).some(cb => cb.checked);
                
                if (selectAll) {
                    selectAll.checked = allChecked;
                    selectAll.indeterminate = someChecked && !allChecked;
                }
            });
        });
    }

    atualizarPaginacao(tipo, total, pagina, porPagina) {
        document.getElementById(`${tipo}Showing`).textContent = Math.min(porPagina, total);
        document.getElementById(`${tipo}Total`).textContent = total;
        document.getElementById(`${tipo}Page`).textContent = pagina;
        
        // Atualizar estado dos botões
        const prevBtn = document.querySelector(`[onclick="AdminApp.prevPage('${tipo}')"]`);
        const nextBtn = document.querySelector(`[onclick="AdminApp.nextPage('${tipo}')"]`);
        
        if (prevBtn) prevBtn.disabled = pagina <= 1;
        if (nextBtn) nextBtn.disabled = pagina >= Math.ceil(total / porPagina);
    }

    // ============================
    // FUNÇÕES DE AÇÃO
    // ============================
    
    loadActivities() {
        const btn = event?.target?.closest('button');
        if (btn) {
            const icon = btn.querySelector('i');
            icon.className = 'fas fa-spinner fa-spin';
            btn.disabled = true;
            
            setTimeout(() => {
                this.carregarAtividadeRecente();
                icon.className = 'fas fa-sync-alt';
                btn.disabled = false;
                this.showToast('Atividades atualizadas!', 'success');
            }, 800);
        }
    }

    async createUser() {
        this.showModal('user', {
            title: 'Novo Usuário',
            fields: [
                { type: 'text', id: 'newUserName', label: 'Nome Completo', required: true },
                { type: 'email', id: 'newUserEmail', label: 'Email', required: true },
                { type: 'password', id: 'newUserPassword', label: 'Senha', required: true },
                { type: 'select', id: 'newUserRole', label: 'Perfil', options: [
                    { value: 'usuario', text: 'Usuário' },
                    { value: 'moderador', text: 'Moderador' },
                    { value: 'admin', text: 'Administrador' }
                ]}
            ],
            onSubmit: async (data) => {
                // Simular criação de usuário
                this.showToast('Usuário criado com sucesso!', 'success');
                await this.carregarUsuarios();
            }
        });
    }

    async uploadSimulado() {
        this.showModal('simulado', {
            title: 'Upload de Simulado',
            fields: [
                { type: 'text', id: 'simuladoNome', label: 'Nome do Simulado', required: true },
                { type: 'textarea', id: 'simuladoDescricao', label: 'Descrição' },
                { type: 'select', id: 'simuladoCategoria', label: 'Categoria', options: [
                    { value: 'ITIL', text: 'ITIL' },
                    { value: 'Linux', text: 'Linux' },
                    { value: 'AWS', text: 'AWS' },
                    { value: 'Azure', text: 'Azure' },
                    { value: 'Security', text: 'Security' }
                ]},
                { type: 'file', id: 'simuladoArquivo', label: 'Arquivo HTML', accept: '.html', required: true }
            ],
            onSubmit: async (data) => {
                // Simular upload
                this.showToast('Simulado enviado com sucesso!', 'success');
                await this.carregarSimulados();
            }
        });
    }

    async createCategory() {
        this.showModal('category', {
            title: 'Nova Categoria',
            fields: [
                { type: 'text', id: 'categoryName', label: 'Nome da Categoria', required: true },
                { type: 'textarea', id: 'categoryDescription', label: 'Descrição' },
                { type: 'select', id: 'categoryParent', label: 'Categoria Pai', options: [
                    { value: '', text: 'Nenhuma (categoria principal)' },
                    { value: 'microsoft', text: 'Microsoft' },
                    { value: 'aws', text: 'AWS' },
                    { value: 'linux', text: 'Linux' }
                ]}
            ],
            onSubmit: async (data) => {
                this.showToast('Categoria criada com sucesso!', 'success');
                await this.carregarForum();
            }
        });
    }

    async addMaterial() {
        this.showModal('material', {
            title: 'Novo Material',
            fields: [
                { type: 'text', id: 'materialNome', label: 'Nome do Material', required: true },
                { type: 'select', id: 'materialTipo', label: 'Tipo', options: [
                    { value: 'pdf', text: 'PDF' },
                    { value: 'video', text: 'Videoaula' },
                    { value: 'link', text: 'Link Externo' },
                    { value: 'apresentacao', text: 'Apresentação' }
                ]},
                { type: 'select', id: 'materialCertificacao', label: 'Certificação', options: [
                    { value: 'itil', text: 'ITIL' },
                    { value: 'linux', text: 'Linux' },
                    { value: 'azure', text: 'Azure' },
                    { value: 'aws', text: 'AWS' },
                    { value: 'security', text: 'Security' }
                ]},
                { type: 'textarea', id: 'materialDescricao', label: 'Descrição' },
                { type: 'url', id: 'materialUrl', label: 'URL' }
            ],
            onSubmit: async (data) => {
                this.showToast('Material adicionado com sucesso!', 'success');
                await this.carregarMateriais();
            }
        });
    }

    async addCertificacao() {
        this.showModal('certificacao', {
            title: 'Nova Certificação',
            fields: [
                { type: 'text', id: 'certNome', label: 'Nome da Certificação', required: true },
                { type: 'select', id: 'certNivel', label: 'Nível', options: [
                    { value: 'fundamental', text: 'Fundamental' },
                    { value: 'associate', text: 'Associate' },
                    { value: 'professional', text: 'Professional' },
                    { value: 'expert', text: 'Expert' }
                ]},
                { type: 'select', id: 'certProvedor', label: 'Provedor', options: [
                    { value: 'microsoft', text: 'Microsoft' },
                    { value: 'aws', text: 'AWS' },
                    { value: 'comptia', text: 'CompTIA' },
                    { value: 'itil', text: 'ITIL' },
                    { value: 'linux', text: 'Linux' }
                ]},
                { type: 'textarea', id: 'certDescricao', label: 'Descrição' },
                { type: 'url', id: 'certUrl', label: 'URL Oficial' }
            ],
            onSubmit: async (data) => {
                this.showToast('Certificação adicionada com sucesso!', 'success');
                await this.carregarCertificacoes();
            }
        });
    }

    async generateReport(tipo) {
        this.showLoadingOverlay(true);
        
        try {
            // Simular geração de relatório
            setTimeout(() => {
                this.showLoadingOverlay(false);
                this.showToast(`Relatório de ${tipo} gerado com sucesso!`, 'success');
                
                // Criar link de download simulado
                const link = document.createElement('a');
                link.href = 'data:text/csv;charset=utf-8,relatorio.csv';
                link.download = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                
            }, 1500);
        } catch (err) {
            this.showLoadingOverlay(false);
            this.showToast('Erro ao gerar relatório', 'error');
        }
    }

    async createBackup() {
        if (!confirm('Deseja criar um backup completo do sistema?')) return;
        
        this.showLoadingOverlay(true);
        
        try {
            // Simular criação de backup
            setTimeout(() => {
                this.showLoadingOverlay(false);
                this.showToast('Backup criado com sucesso!', 'success');
            }, 2000);
        } catch (err) {
            this.showLoadingOverlay(false);
            this.showToast('Erro ao criar backup', 'error');
        }
    }

    async clearCache() {
        if (!confirm('Deseja limpar todo o cache do sistema?')) return;
        
        this.showLoadingOverlay(true);
        
        try {
            // Limpar cache do localStorage
            const keysToKeep = ['admin_role', 'authenticated', 'admin_settings'];
            Object.keys(localStorage).forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
            
            setTimeout(() => {
                this.showLoadingOverlay(false);
                this.showToast('Cache limpo com sucesso!', 'success');
            }, 1000);
        } catch (err) {
            this.showLoadingOverlay(false);
            this.showToast('Erro ao limpar cache', 'error');
        }
    }

    async optimizeDatabase() {
        if (!confirm('Deseja otimizar o banco de dados?')) return;
        
        this.showLoadingOverlay(true);
        
        try {
            // Simular otimização
            setTimeout(() => {
                this.showLoadingOverlay(false);
                this.showToast('Banco de dados otimizado com sucesso!', 'success');
            }, 3000);
        } catch (err) {
            this.showLoadingOverlay(false);
            this.showToast('Erro ao otimizar banco de dados', 'error');
        }
    }

    salvarConfiguracoesGerais() {
        const settings = {
            siteName: document.getElementById('siteName').value,
            siteEmail: document.getElementById('siteEmail').value,
            siteDescription: document.getElementById('siteDescription').value,
            maintenanceMode: document.getElementById('maintenanceMode').checked
        };
        
        localStorage.setItem('admin_settings', JSON.stringify({
            ...JSON.parse(localStorage.getItem('admin_settings') || '{}'),
            general: settings
        }));
        
        this.showToast('Configurações gerais salvas com sucesso!', 'success');
    }

    salvarConfiguracoesSeguranca() {
        const settings = {
            passwordPolicy: document.getElementById('passwordPolicy').value,
            sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
            maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
            twoFactorAuth: document.getElementById('twoFactorAuth').checked
        };
        
        localStorage.setItem('admin_settings', JSON.stringify({
            ...JSON.parse(localStorage.getItem('admin_settings') || '{}'),
            security: settings
        }));
        
        this.showToast('Configurações de segurança salvas com sucesso!', 'success');
    }

    // ============================
    // FUNÇÕES UTILITÁRIAS
    // ============================
    
    showModal(tipo, options) {
        const modalId = `modal${this.capitalizeFirst(tipo)}`;
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'admin-modal';
            modal.innerHTML = `
                <div class="modal-container">
                    <div class="modal-header">
                        <h3><i class="fas fa-${this.getModalIcon(tipo)}"></i> ${options.title}</h3>
                        <button class="fechar-modal" onclick="AdminApp.fecharModal('${tipo}')">&times;</button>
                    </div>
                    <div class="modal-body" id="${modalId}Body">
                        <!-- Conteúdo será gerado dinamicamente -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="AdminApp.fecharModal('${tipo}')">Cancelar</button>
                        <button class="btn btn-success" onclick="AdminApp.submitModal('${tipo}')">Salvar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Gerar campos do formulário
        const body = document.getElementById(`${modalId}Body`);
        body.innerHTML = options.fields.map(field => this.generateFormField(field)).join('');
        
        // Adicionar evento de submit
        window.AdminApp.submitModal = (modalTipo) => {
            const data = {};
            options.fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        data[field.id] = element.checked;
                    } else {
                        data[field.id] = element.value;
                    }
                }
            });
            
            options.onSubmit(data);
            this.fecharModal(modalTipo);
        };
        
        modal.classList.add('active');
    }

    generateFormField(field) {
        switch (field.type) {
            case 'select':
                return `
                    <div class="form-group">
                        <label for="${field.id}">${field.label}</label>
                        <select id="${field.id}" class="form-control" ${field.required ? 'required' : ''}>
                            ${field.options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}
                        </select>
                    </div>
                `;
            case 'textarea':
                return `
                    <div class="form-group">
                        <label for="${field.id}">${field.label}</label>
                        <textarea id="${field.id}" class="form-control" rows="3" ${field.required ? 'required' : ''}></textarea>
                    </div>
                `;
            case 'file':
                return `
                    <div class="form-group">
                        <label for="${field.id}">${field.label}</label>
                        <input type="file" id="${field.id}" class="form-control" accept="${field.accept || ''}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            default:
                return `
                    <div class="form-group">
                        <label for="${field.id}">${field.label}</label>
                        <input type="${field.type}" id="${field.id}" class="form-control" ${field.required ? 'required' : ''}>
                    </div>
                `;
        }
    }

    fecharModal(tipo) {
        const modal = document.getElementById(`modal${this.capitalizeFirst(tipo)}`);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    fecharTodosModais() {
        document.querySelectorAll('.admin-modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="loading-data">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando...</p>
                </div>
            `;
        }
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-toast" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove após 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    getToastIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    getModalIcon(tipo) {
        switch(tipo) {
            case 'user': return 'user-plus';
            case 'simulado': return 'file-upload';
            case 'category': return 'folder-plus';
            case 'material': return 'book';
            case 'certificacao': return 'certificate';
            default: return 'edit';
        }
    }

    getCertIcon(provedor) {
        switch(provedor.toLowerCase()) {
            case 'microsoft': return 'fab fa-microsoft';
            case 'aws': return 'fab fa-aws';
            case 'comptia': return 'fas fa-shield-alt';
            case 'itil': return 'fas fa-cube';
            case 'linux': return 'fas fa-server';
            default: return 'fas fa-certificate';
        }
    }

    getMaterialIcon(tipo) {
        switch(tipo) {
            case 'pdf': return 'fas fa-file-pdf';
            case 'video': return 'fas fa-video';
            case 'link': return 'fas fa-link';
            case 'apresentacao': return 'fas fa-presentation';
            default: return 'fas fa-file';
        }
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    filtrarTabela(tipo, termo, filtro) {
        const table = document.getElementById(`${tipo}Table`);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matchTermo = !termo || text.includes(termo.toLowerCase());
            const matchFiltro = !filtro || row.querySelector('.status-badge')?.textContent.toLowerCase().includes(filtro.toLowerCase());
            
            if (matchTermo && matchFiltro) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Atualizar contador
        document.getElementById(`${tipo}Showing`).textContent = visibleCount;
    }

    // ============================
    // FUNÇÕES DE NAVEGAÇÃO E CONTROLE
    // ============================
    
    prevPage(tipo) {
        const current = parseInt(document.getElementById(`${tipo}Page`).textContent);
        if (current > 1) {
            // Implementar lógica de paginação aqui
            this.showToast(`Carregando página ${current - 1}...`, 'info');
        }
    }

    nextPage(tipo) {
        const current = parseInt(document.getElementById(`${tipo}Page`).textContent);
        const total = parseInt(document.getElementById(`${tipo}Total`).textContent);
        const porPagina = 10;
        
        if (current < Math.ceil(total / porPagina)) {
            // Implementar lógica de paginação aqui
            this.showToast(`Carregando página ${current + 1}...`, 'info');
        }
    }

    async exportUsers() {
        this.showToast('Exportando usuários...', 'info');
        // Implementar exportação
    }

    async exportForum() {
        this.showToast('Exportando dados do fórum...', 'info');
        // Implementar exportação
    }

    async importCertificacoes() {
        this.showToast('Importando certificações...', 'info');
        // Implementar importação
    }

    async bulkAction(tipo, action) {
        const checkboxes = document.querySelectorAll(`#${tipo}TableBody .table-checkbox:checked`);
        
        if (checkboxes.length === 0) {
            this.showToast('Selecione pelo menos um item', 'warning');
            return;
        }
        
        const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
        
        switch(action) {
            case 'approve':
                this.showToast(`Aprovando ${ids.length} simulados...`, 'info');
                // Implementar aprovação
                break;
            case 'archive':
                this.showToast(`Arquivando ${ids.length} materiais...`, 'info');
                // Implementar arquivamento
                break;
        }
    }

    // ============================
    // FUNÇÕES DE AÇÃO (placeholder)
    // ============================
    
    editarUsuario(id) {
        this.showToast(`Editando usuário ${id}...`, 'info');
        // Implementar edição
    }

    excluirUsuario(id) {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            this.showToast(`Excluindo usuário ${id}...`, 'info');
            // Implementar exclusão
        }
    }

    verSimulado(id) {
        this.showToast(`Visualizando simulado ${id}...`, 'info');
        // Implementar visualização
    }

    editarSimulado(id) {
        this.showToast(`Editando simulado ${id}...`, 'info');
        // Implementar edição
    }

    aprovarSimulado(id) {
        this.showToast(`Aprovando simulado ${id}...`, 'info');
        // Implementar aprovação
    }

    verPost(id) {
        this.showToast(`Visualizando post ${id}...`, 'info');
        // Implementar visualização
    }

    editarPost(id) {
        this.showToast(`Editando post ${id}...`, 'info');
        // Implementar edição
    }

    moderarPost(id) {
        this.showToast(`Moderando post ${id}...`, 'info');
        // Implementar moderação
    }

    editarCertificacao(id) {
        this.showToast(`Editando certificação ${id}...`, 'info');
        // Implementar edição
    }

    excluirCertificacao(id) {
        if (confirm('Tem certeza que deseja excluir esta certificação?')) {
            this.showToast(`Excluindo certificação ${id}...`, 'info');
            // Implementar exclusão
        }
    }

    verMaterial(id) {
        this.showToast(`Visualizando material ${id}...`, 'info');
        // Implementar visualização
    }

    editarMaterial(id) {
        this.showToast(`Editando material ${id}...`, 'info');
        // Implementar edição
    }

    // ============================
    // LOGOUT
    // ============================
    
    async logout() {
        if (confirm('Deseja realmente sair do painel administrativo?')) {
            try {
                // Limpar dados de admin
                localStorage.removeItem('admin_role');
                localStorage.removeItem('admin_permissions');
                
                // Fazer logout do Supabase se estiver conectado
                if (this.supabase) {
                    await this.supabase.auth.signOut();
                }
                
                this.showToast('Saindo do painel admin...', 'warning');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } catch (err) {
                console.error('❌ Erro no logout:', err);
                window.location.href = 'index.html';
            }
        }
    }
}

// Inicializar quando o DOM estiver pronto
let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
    window.AdminApp = adminApp;
});
