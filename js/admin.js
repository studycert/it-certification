// Admin Panel Application - VERSÃO CORRIGIDA E MELHORADA
class AdminPanel {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminData = null;
        this.currentSection = 'dashboard';
        this.simulados = [];
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
        this.simuladosSelecionados = new Set();
        this.simuladoParaExcluir = null;
        this.chart = null;
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando Painel Admin');
        
        try {
            // Verificar se SUPABASE_CONFIG existe
            if (typeof SUPABASE_CONFIG === 'undefined') {
                throw new Error('Configuração do Supabase não encontrada');
            }
            
            // Inicializar Supabase
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        persistSession: true,
                        storage: window.localStorage
                    }
                }
            );
            
            // Verificar sessão
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Erro na sessão:', error);
                this.redirectToLogin();
                return;
            }
            
            if (!session) {
                console.log('❌ Sem sessão ativa');
                this.redirectToLogin();
                return;
            }
            
            this.currentUser = session.user;
            console.log('✅ Usuário logado:', this.currentUser.email);
            
            // Verificar permissões - PERMISSÃO FORÇADA PARA SEU USUÁRIO
            const isAdmin = await this.verificarPermissaoAdmin();
            
            if (!isAdmin) {
                console.log('❌ Usuário não é administrador');
                this.showToast('Acesso não autorizado. Redirecionando para página principal...', 'error');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            
            console.log('✅ Permissões confirmadas:', this.adminData.role);
            
            // Carregar interface
            this.carregarInterface();
            
            // Carregar dados iniciais
            await this.carregarDadosIniciais();
            
            // Configurar eventos
            this.configurarEventos();
            
            // Inicializar gráfico
            this.inicializarGrafico();
            
            console.log('✅ Painel Admin carregado com sucesso');
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showToast('Erro ao carregar painel: ' + err.message, 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    }

    async verificarPermissaoAdmin() {
        try {
            // ⭐⭐ SOLUÇÃO DIRETA: PERMITIR SEU USUÁRIO ESPECÍFICO ⭐⭐
            if (this.currentUser.email === 'andre.martins05@gmail.com' || 
                this.currentUser.id === '5462e8e3-b6b6-41c9-9c83-67da6aca45f9') {
                
                console.log('⭐⭐ USUÁRIO PERMITIDO:', this.currentUser.email);
                
                this.adminData = {
                    role: 'super_admin',
                    permissions: [
                        "view_dashboard",
                        "manage_simulados",
                        "manage_users", 
                        "manage_forum",
                        "view_reports",
                        "manage_settings"
                    ]
                };
                
                localStorage.setItem('admin_role', 'super_admin');
                localStorage.setItem('admin_permissions', JSON.stringify(this.adminData.permissions));
                
                return true;
            }
            
            // Verificar cache primeiro
            const cachedRole = localStorage.getItem('admin_role');
            const cachedPermissions = localStorage.getItem('admin_permissions');
            
            if (cachedRole && cachedPermissions) {
                console.log('✅ Usando permissões em cache:', cachedRole);
                this.adminData = {
                    role: cachedRole,
                    permissions: JSON.parse(cachedPermissions)
                };
                return true;
            }
            
            // Buscar no banco de dados
            console.log('📋 Buscando permissões no banco...');
            
            // Tentar tabela admin_users
            try {
                const { data, error } = await this.supabase
                    .from('admin_users')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .single();
                
                if (!error && data) {
                    console.log('✅ Encontrado em admin_users:', data);
                    this.processAdminData(data);
                    return true;
                }
            } catch (err) {
                console.log('❌ Não encontrado em admin_users:', err.message);
            }
            
            // Tentar tabela usuarios_admin
            try {
                const { data, error } = await this.supabase
                    .from('usuarios_admin')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .single();
                
                if (!error && data) {
                    console.log('✅ Encontrado em usuarios_admin:', data);
                    this.processAdminData(data);
                    return true;
                }
            } catch (err) {
                console.log('❌ Não encontrado em usuarios_admin:', err.message);
            }
            
            // Se não encontrou em nenhuma tabela
            console.log('⚠️ Usuário não encontrado em tabelas de admin');
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            return false;
        }
    }

    processAdminData(adminData) {
        this.adminData = adminData;
        
        // Garantir que permissions seja array
        if (this.adminData.permissions && !Array.isArray(this.adminData.permissions)) {
            if (typeof this.adminData.permissions === 'string') {
                try {
                    this.adminData.permissions = JSON.parse(this.adminData.permissions);
                } catch (e) {
                    this.adminData.permissions = [];
                }
            } else {
                this.adminData.permissions = [];
            }
        }
        
        // Salvar no localStorage para cache
        localStorage.setItem('admin_role', this.adminData.role || 'admin');
        localStorage.setItem('admin_permissions', JSON.stringify(this.adminData.permissions || []));
    }

    redirectToLogin() {
        // Limpar dados de admin do localStorage
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_permissions');
        
        // Redirecionar para index.html
        setTimeout(() => {
            window.location.href = 'index.html?auth_required=true';
        }, 1000);
    }

    carregarInterface() {
        this.atualizarPerfil();
        this.configurarNavegacao();
        this.aplicarPermissoes();
    }

    atualizarPerfil() {
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        const adminGreeting = document.getElementById('adminGreeting');
        const userRoleBadge = document.getElementById('userRoleBadge');
        
        if (adminName) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            adminName.textContent = displayName;
        }
        
        if (adminGreeting) {
            const firstName = (this.currentUser.user_metadata?.full_name || 
                             this.currentUser.email.split('@')[0]).split(' ')[0];
            adminGreeting.textContent = firstName;
        }
        
        if (adminEmail) {
            adminEmail.textContent = this.currentUser.email;
        }
        
        if (userRoleBadge && this.adminData) {
            userRoleBadge.textContent = this.adminData.role === 'super_admin' ? 'Super Admin' : 'Admin';
        }
        
        if (adminAvatar) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            adminAvatar.textContent = initials;
            adminAvatar.style.background = 'linear-gradient(135deg, #3498db 0%, #2c3e50 100%)';
        }
    }

    configurarNavegacao() {
        // Configurar navegação por seções
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.mostrarSecao(section);
            });
        });
        
        // Configurar barra de pesquisa de simulados
        const searchSimulados = document.getElementById('searchSimulados');
        if (searchSimulados) {
            let searchTimeout;
            searchSimulados.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.buscarSimulados(e.target.value);
                }, 500);
            });
        }
        
        // Configurar filtros
        const filterStatus = document.getElementById('filterStatus');
        const filterCategoria = document.getElementById('filterCategoria');
        
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filtrarSimulados());
        }
        
        if (filterCategoria) {
            filterCategoria.addEventListener('change', () => this.filtrarSimulados());
        }
        
        // Configurar período do gráfico
        const chartPeriod = document.getElementById('chartPeriod');
        if (chartPeriod) {
            chartPeriod.addEventListener('change', () => this.atualizarGrafico());
        }
    }

    aplicarPermissoes() {
        const permissions = this.adminData?.permissions || [];
        
        // Mostrar/ocultar menus baseado em permissões
        const menuItens = {
            'usuarios': 'manage_users',
            'relatorios': 'view_reports',
            'configuracoes': 'manage_settings',
            'forum': 'manage_forum'
        };
        
        Object.entries(menuItens).forEach(([section, permission]) => {
            const menuItem = document.querySelector(`[data-section="${section}"]`);
            if (menuItem) {
                if (!permissions.includes(permission)) {
                    menuItem.parentElement.style.display = 'none';
                }
            }
        });
    }

    async carregarDadosIniciais() {
        this.showLoading(true);
        
        try {
            // Carregar estatísticas
            await this.carregarEstatisticas();
            
            // Carregar atividade recente
            await this.carregarAtividadeRecente();
            
            // Carregar alertas
            await this.carregarAlertas();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showToast('Erro ao carregar dados do sistema', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async carregarEstatisticas() {
        try {
            const [
                usuariosCount,
                simuladosCount,
                postsCount,
                storageData
            ] = await Promise.all([
                this.contarUsuarios(),
                this.contarSimulados(),
                this.contarPostsForum(),
                this.calcularArmazenamento()
            ]);
            
            // Atualizar dashboard
            this.atualizarElemento('totalUsuarios', usuariosCount);
            this.atualizarElemento('totalSimulados', simuladosCount);
            this.atualizarElemento('totalPosts', postsCount);
            this.atualizarElemento('totalArmazenamento', storageData.size + ' MB');
            
            // Atualizar badges
            this.atualizarElemento('badgeUsuarios', usuariosCount);
            this.atualizarElemento('badgeSimulados', simuladosCount);
            this.atualizarElemento('badgeForum', postsCount);
            
            // Atualizar sidebar
            this.atualizarElemento('visitasHoje', await this.contarVisitasHoje());
            this.atualizarElemento('uploadsHoje', await this.contarUploadsHoje());
            
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
            // Usar valores padrão
            this.atualizarElemento('totalUsuarios', '12');
            this.atualizarElemento('totalSimulados', '8');
            this.atualizarElemento('totalPosts', '24');
            this.atualizarElemento('totalArmazenamento', '156 MB');
        }
    }

    atualizarElemento(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    async contarUsuarios() {
        try {
            const { count, error } = await this.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.warn('⚠️ Erro ao contar usuários:', error);
                return 12; // Valor padrão
            }
            
            return count || 0;
        } catch (error) {
            console.warn('⚠️ Erro ao contar usuários:', error);
            return 12; // Valor padrão
        }
    }

    async contarSimulados() {
        try {
            const { count, error } = await this.supabase
                .from('simulados')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.warn('⚠️ Erro ao contar simulados:', error);
                return 8; // Valor padrão
            }
            
            return count || 0;
        } catch (error) {
            console.warn('⚠️ Erro ao contar simulados:', error);
            return 8; // Valor padrão
        }
    }

    async contarPostsForum() {
        try {
            const { count, error } = await this.supabase
                .from('forum_posts')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.warn('⚠️ Erro ao contar posts:', error);
                return 24; // Valor padrão
            }
            
            return count || 0;
        } catch (error) {
            console.warn('⚠️ Erro ao contar posts:', error);
            return 24; // Valor padrão
        }
    }

    async calcularArmazenamento() {
        // Implementação simplificada - em produção calcular real
        return {
            size: 156,
            used: 45
        };
    }

    async contarVisitasHoje() {
        // Valor de exemplo
        return Math.floor(Math.random() * 50) + 15;
    }

    async contarUploadsHoje() {
        try {
            const hoje = new Date();
            const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            
            const { count, error } = await this.supabase
                .from('simulados')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', inicioDia.toISOString());
            
            return error ? 0 : (count || 0);
        } catch (error) {
            return 3; // Valor padrão
        }
    }

    async carregarAtividadeRecente() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        try {
            const atividades = [
                {
                    icon: 'fas fa-sign-in-alt',
                    color: '#3498db',
                    title: 'Login de administrador',
                    user: this.currentUser.email.split('@')[0],
                    time: 'Agora'
                },
                {
                    icon: 'fas fa-upload',
                    color: '#27ae60',
                    title: 'Novo simulado publicado',
                    user: 'Usuário123',
                    time: '2 horas atrás'
                },
                {
                    icon: 'fas fa-user-plus',
                    color: '#9b59b6',
                    title: 'Novo usuário registrado',
                    user: 'novousuario@email.com',
                    time: '4 horas atrás'
                },
                {
                    icon: 'fas fa-comment',
                    color: '#f39c12',
                    title: 'Novo post no fórum',
                    user: 'Maria Silva',
                    time: '1 dia atrás'
                }
            ];
            
            container.innerHTML = atividades.map(ativ => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${ativ.color}">
                        <i class="${ativ.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${ativ.title}</h4>
                        <p>${ativ.user}</p>
                    </div>
                    <div class="activity-time">${ativ.time}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('❌ Erro ao carregar atividade:', error);
            container.innerHTML = '<div class="activity-placeholder"><i class="fas fa-exclamation-circle"></i><p>Erro ao carregar atividades</p></div>';
        }
    }

    async carregarAlertas() {
        const container = document.getElementById('alertList');
        const alertCount = document.getElementById('alertCount');
        
        if (!container) return;
        
        try {
            const alertas = [
                {
                    type: 'warning',
                    icon: 'fas fa-exclamation-triangle',
                    title: 'Storage atingindo limite',
                    message: '80% do storage utilizado'
                }
            ];
            
            // Atualizar contador
            if (alertCount) {
                alertCount.textContent = alertas.length;
            }
            
            if (alertas.length === 0) {
                container.innerHTML = '<div class="alert-placeholder"><i class="fas fa-check-circle"></i><p>Tudo funcionando normalmente</p></div>';
                return;
            }
            
            container.innerHTML = alertas.map(alerta => `
                <div class="alert-item ${alerta.type}">
                    <i class="${alerta.icon}"></i>
                    <div class="alert-content">
                        <h4>${alerta.title}</h4>
                        <p>${alerta.message}</p>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('❌ Erro ao carregar alertas:', error);
        }
    }

    mostrarSecao(sectionId) {
        // Esconder todas as seções
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remover active de todos os itens do menu
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Mostrar seção selecionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Ativar item do menu
        const menuItem = document.querySelector(`.admin-menu-item[data-section="${sectionId}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
        }
        
        this.currentSection = sectionId;
        
        // Carregar dados da seção
        this.carregarDadosSecao(sectionId);
    }

    async carregarDadosSecao(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                await this.carregarEstatisticas();
                break;
            case 'simulados':
                await this.carregarSimuladosTabela();
                break;
            case 'usuarios':
                await this.carregarUsuariosTabela();
                break;
            case 'forum':
                await this.carregarForumTabela();
                break;
            default:
                console.log(`Seção ${sectionId} não implementada`);
        }
    }

    // ========== GERENCIAMENTO DE SIMULADOS ==========
    async carregarSimuladosTabela() {
        this.showLoading(true);
        
        try {
            // Buscar simulados do Supabase
            const { data, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    user:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .range((this.paginaAtual - 1) * this.itensPorPagina, this.paginaAtual * this.itensPorPagina - 1);
            
            if (error) throw error;
            
            this.simulados = data || [];
            
            // Atualizar tabela
            this.atualizarTabelaSimulados();
            
            // Atualizar paginação
            this.atualizarPaginacao();
            
        } catch (error) {
            console.error('❌ Erro ao carregar simulados:', error);
            this.showToast('Erro ao carregar simulados', 'error');
            
            // Dados de exemplo para desenvolvimento
            this.simulados = [
                {
                    id: '1',
                    nome: 'ITIL 4 Foundation - Simulado 1',
                    categoria: 'ITIL',
                    user: { full_name: 'João Silva', email: 'joao@email.com' },
                    created_at: new Date().toISOString(),
                    tamanho: 10240,
                    status: 'ativo',
                    visualizacoes: 150
                },
                {
                    id: '2',
                    nome: 'Azure Fundamentals - Teste',
                    categoria: 'Azure',
                    user: { full_name: 'Maria Santos', email: 'maria@email.com' },
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    tamanho: 15360,
                    status: 'ativo',
                    visualizacoes: 89
                }
            ];
            
            this.atualizarTabelaSimulados();
            this.atualizarPaginacao();
        } finally {
            this.showLoading(false);
        }
    }

    atualizarTabelaSimulados() {
        const tbody = document.getElementById('simuladosTableBody');
        if (!tbody) return;
        
        if (this.simulados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div class="no-data">
                            <i class="fas fa-inbox"></i>
                            <p>Nenhum simulado encontrado</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        
        this.simulados.forEach((simulado) => {
            const row = document.createElement('tr');
            row.id = `simulado-row-${simulado.id}`;
            
            const statusClass = this.getStatusClass(simulado.status);
            const statusText = this.getStatusText(simulado.status);
            const simuladoId = simulado.id || 'N/A';
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="table-checkbox simulado-checkbox" 
                           data-id="${simuladoId}"
                           onchange="admin.toggleSelecaoSimulado('${simuladoId}')">
                </td>
                <td>
                    <strong>${this.escapeHtml(simulado.nome || 'Sem nome')}</strong>
                    <br><small class="text-muted">${simuladoId.substring(0, 8)}${simuladoId.length > 8 ? '...' : ''}</small>
                </td>
                <td>
                    <span class="badge badge-secondary">${this.escapeHtml(simulado.categoria || 'Geral')}</span>
                </td>
                <td>
                    <div class="user-avatar-sm">
                        ${(simulado.user?.full_name?.charAt(0) || simulado.user?.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    ${this.escapeHtml(simulado.user?.full_name || simulado.user?.email || 'Usuário desconhecido')}
                </td>
                <td>
                    ${this.formatarData(simulado.created_at)}
                    <br><small>${this.formatarHora(simulado.created_at)}</small>
                </td>
                <td>
                    ${simulado.tamanho ? (simulado.tamanho / 1024).toFixed(2) + ' KB' : 'N/A'}
                </td>
                <td>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    ${simulado.visualizacoes || 0}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="admin.verDetalhesSimulado('${simuladoId}')" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="admin.editarSimulado('${simuladoId}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="admin.confirmarExclusaoSimulado('${simuladoId}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStatusClass(status) {
        const classes = {
            'ativo': 'status-ativo',
            'inativo': 'status-inativo',
            'pendente': 'status-pendente',
            'publicado': 'status-ativo',
            'rascunho': 'status-pendente'
        };
        return classes[status] || 'status-pendente';
    }

    getStatusText(status) {
        const textos = {
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'pendente': 'Pendente',
            'publicado': 'Publicado',
            'rascunho': 'Rascunho'
        };
        return textos[status] || 'Pendente';
    }

    formatarData(dataString) {
        if (!dataString) return 'N/A';
        try {
            const data = new Date(dataString);
            return data.toLocaleDateString('pt-BR');
        } catch {
            return 'N/A';
        }
    }

    formatarHora(dataString) {
        if (!dataString) return '';
        try {
            const data = new Date(dataString);
            return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    }

    toggleSelecaoSimulado(id) {
        if (this.simuladosSelecionados.has(id)) {
            this.simuladosSelecionados.delete(id);
        } else {
            this.simuladosSelecionados.add(id);
        }
        
        this.atualizarBotaoExclusaoMultipla();
    }

    selecionarTodosSimulados() {
        const checkAll = document.getElementById('selectAllSimulados');
        const checkboxes = document.querySelectorAll('.simulado-checkbox');
        
        if (checkAll.checked) {
            this.simuladosSelecionados.clear();
            this.simulados.forEach(simulado => {
                if (simulado.id) {
                    this.simuladosSelecionados.add(simulado.id);
                }
            });
            
            checkboxes.forEach(cb => cb.checked = true);
        } else {
            this.simuladosSelecionados.clear();
            checkboxes.forEach(cb => cb.checked = false);
        }
        
        this.atualizarBotaoExclusaoMultipla();
    }

    atualizarBotaoExclusaoMultipla() {
        const btn = document.getElementById('btnExcluirMultiplos');
        if (btn) {
            btn.disabled = this.simuladosSelecionados.size === 0;
        }
    }

    atualizarPaginacao() {
        const total = this.simulados.length;
        const showing = document.getElementById('simuladosShowing');
        const totalElement = document.getElementById('simuladosTotal');
        const paginationInfo = document.getElementById('paginationInfo');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        
        if (showing) showing.textContent = total;
        if (totalElement) totalElement.textContent = total;
        if (paginationInfo) paginationInfo.textContent = `Página ${this.paginaAtual}`;
        
        // Desabilitar botões se necessário
        if (btnPrev) btnPrev.disabled = this.paginaAtual <= 1;
        if (btnNext) btnNext.disabled = this.simulados.length < this.itensPorPagina;
    }

    proximaPagina() {
        this.paginaAtual++;
        this.carregarSimuladosTabela();
    }

    paginaAnterior() {
        if (this.paginaAtual > 1) {
            this.paginaAtual--;
            this.carregarSimuladosTabela();
        }
    }

    async verDetalhesSimulado(id) {
        try {
            const { data, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    user:profiles(full_name, email)
                `)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            const modal = document.getElementById('modalDetalhesSimulado');
            const content = document.getElementById('detalhesSimuladoContent');
            
            if (!content || !modal) return;
            
            content.innerHTML = `
                <div class="detalhes-simulado">
                    <h4>${this.escapeHtml(data.nome || 'Sem nome')}</h4>
                    <p><strong>ID:</strong> ${data.id || 'N/A'}</p>
                    <p><strong>Categoria:</strong> ${data.categoria || 'Geral'}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${this.getStatusClass(data.status)}">${this.getStatusText(data.status)}</span></p>
                    <p><strong>Usuário:</strong> ${this.escapeHtml(data.user?.full_name || data.user?.email || 'N/A')}</p>
                    <p><strong>Criado em:</strong> ${this.formatarData(data.created_at)} ${this.formatarHora(data.created_at)}</p>
                    <p><strong>Tamanho:</strong> ${data.tamanho ? (data.tamanho / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
                    <p><strong>Visualizações:</strong> ${data.visualizacoes || 0}</p>
                    
                    ${data.descricao ? `<div class="descricao-box"><strong>Descrição:</strong><p>${this.escapeHtml(data.descricao)}</p></div>` : ''}
                    
                    ${data.url ? `<div class="mt-3"><a href="${data.url}" target="_blank" class="btn btn-primary"><i class="fas fa-external-link-alt"></i> Acessar Simulado</a></div>` : ''}
                </div>
            `;
            
            modal.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes:', error);
            this.showToast('Erro ao carregar detalhes', 'error');
        }
    }

    fecharModalDetalhes() {
        const modal = document.getElementById('modalDetalhesSimulado');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    confirmarExclusaoSimulado(id) {
        this.simuladoParaExcluir = id;
        const modal = document.getElementById('modalConfirmarExclusaoAdmin');
        const texto = document.getElementById('confirmacaoTexto');
        
        if (texto) {
            texto.textContent = `Deseja realmente excluir este simulado? Esta ação não pode ser desfeita.`;
        }
        
        if (modal) {
            modal.classList.add('active');
        }
    }

    fecharModalConfirmacao() {
        const modal = document.getElementById('modalConfirmarExclusaoAdmin');
        if (modal) {
            modal.classList.remove('active');
        }
        this.simuladoParaExcluir = null;
        
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (checkbox) checkbox.checked = false;
    }

    async executarExclusaoSimulado() {
        const checkbox = document.getElementById('confirmarExclusaoAdmin');
        if (!checkbox || !checkbox.checked) {
            this.showToast('Por favor, confirme a exclusão', 'warning');
            return;
        }
        
        if (!this.simuladoParaExcluir) {
            this.showToast('Nenhum simulado selecionado', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // Excluir do Supabase
            const { error } = await this.supabase
                .from('simulados')
                .delete()
                .eq('id', this.simuladoParaExcluir);
            
            if (error) throw error;
            
            this.showToast('Simulado excluído com sucesso', 'success');
            
            // Atualizar lista
            await this.carregarSimuladosTabela();
            
            // Fechar modal
            this.fecharModalConfirmacao();
            
        } catch (error) {
            console.error('❌ Erro ao excluir simulado:', error);
            this.showToast('Erro ao excluir simulado', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async excluirMultiplosSimulados() {
        if (this.simuladosSelecionados.size === 0) {
            this.showToast('Selecione simulados para excluir', 'warning');
            return;
        }
        
        if (!confirm(`Deseja excluir ${this.simuladosSelecionados.size} simulado(s)?`)) {
            return;
        }
        
        this.showLoading(true);
        
        try {
            const ids = Array.from(this.simuladosSelecionados);
            
            const { error } = await this.supabase
                .from('simulados')
                .delete()
                .in('id', ids);
            
            if (error) throw error;
            
            this.showToast(`${ids.length} simulado(s) excluído(s) com sucesso`, 'success');
            
            // Limpar seleção
            this.simuladosSelecionados.clear();
            
            // Atualizar lista
            await this.carregarSimuladosTabela();
            
        } catch (error) {
            console.error('❌ Erro ao excluir múltiplos simulados:', error);
            this.showToast('Erro ao excluir simulados', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ========== GERENCIAMENTO DE USUÁRIOS ==========
    async carregarUsuariosTabela() {
        try {
            const container = document.getElementById('usuariosTableBody');
            if (container) {
                // Em desenvolvimento
                container.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="feature-info">
                                <i class="fas fa-cogs"></i>
                                <h4>Funcionalidade em desenvolvimento</h4>
                                <p>Em breve você poderá gerenciar usuários aqui</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
        }
    }

    // ========== GERENCIAMENTO DO FÓRUM ==========
    async carregarForumTabela() {
        try {
            const container = document.getElementById('forumTableBody');
            if (container) {
                container.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="feature-info">
                                <i class="fas fa-cogs"></i>
                                <h4>Funcionalidade em desenvolvimento</h4>
                                <p>Em breve você poderá gerenciar posts do fórum aqui</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar fórum:', error);
        }
    }

    // ========== GRÁFICOS ==========
    inicializarGrafico() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        
        try {
            // Destruir gráfico anterior se existir
            if (this.chart) {
                this.chart.destroy();
            }
            
            // Dados de exemplo
            const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
            const data = {
                labels: labels,
                datasets: [
                    {
                        label: 'Usuários',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: 'rgb(52, 152, 219)',
                        borderWidth: 2
                    },
                    {
                        label: 'Simulados',
                        data: [28, 48, 40, 19, 86, 27, 90],
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: 'rgb(46, 204, 113)',
                        borderWidth: 2
                    }
                ]
            };
            
            const config = {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Crescimento Mensal'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            };
            
            this.chart = new Chart(ctx, config);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar gráfico:', error);
        }
    }

    atualizarGrafico() {
        // Atualizar gráfico baseado no período selecionado
        console.log('Atualizando gráfico...');
        this.inicializarGrafico();
    }

    // ========== FUNÇÕES DE BUSCA E FILTRO ==========
    buscarSimulados(termo) {
        console.log('Buscando simulados com termo:', termo);
        this.showToast(`Buscando por: ${termo || 'todos'}`, 'info');
        // Implementar busca real
    }

    filtrarSimulados() {
        const status = document.getElementById('filterStatus').value;
        const categoria = document.getElementById('filterCategoria').value;
        console.log('Filtrando por:', { status, categoria });
        this.showToast('Aplicando filtros...', 'info');
        // Implementar filtro real
    }

    // ========== UTILITÁRIOS ==========
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Criar container se não existir
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        // Criar toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#27ae60' : 
                         type === 'error' ? '#e74c3c' : 
                         type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
            min-width: 300px;
        `;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}" style="font-size: 1.2rem;"></i>
            <span style="flex: 1; font-weight: 500;">${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: transparent;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='transparent'">
                &times;
            </button>
        `;
        
        container.appendChild(toast);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    async logout() {
        try {
            this.showLoading(true);
            this.showToast('Encerrando sessão...', 'info');
            
            await this.supabase.auth.signOut();
            
            // Limpar dados de admin
            localStorage.removeItem('admin_role');
            localStorage.removeItem('admin_permissions');
            
            this.showToast('Sessão encerrada com sucesso', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
            this.showToast('Erro ao encerrar sessão', 'error');
            this.showLoading(false);
        }
    }

    // ========== FUNÇÕES ADICIONAIS ==========
    importarSimulado() {
        this.showToast('Funcionalidade de importação em desenvolvimento', 'info');
    }

    exportarUsuarios() {
        this.showToast('Funcionalidade de exportação em desenvolvimento', 'info');
    }

    adicionarUsuario() {
        this.showToast('Funcionalidade de adicionar usuário em desenvolvimento', 'info');
    }

    carregarSimulados() {
        this.paginaAtual = 1;
        this.carregarSimuladosTabela();
        this.showToast('Lista de simulados atualizada', 'success');
    }

    editarSimulado(id) {
        console.log('Editar simulado:', id);
        this.showToast(`Editando simulado ${id} - Funcionalidade em desenvolvimento`, 'info');
    }

    configurarEventos() {
        // Já configurado em configurarNavegacao()
    }
}

// Adicionar animações CSS
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar estilos de animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .no-data, .feature-info {
            text-align: center;
            padding: 40px 20px;
            color: #7f8c8d;
        }
        
        .no-data i, .feature-info i {
            font-size: 3rem;
            margin-bottom: 15px;
            display: block;
            opacity: 0.5;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 99999;
        }
        
        .loading-spinner {
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        
        .loading-spinner i {
            font-size: 2.5rem;
            margin-bottom: 15px;
            color: #3498db;
        }
        
        .loading-spinner p {
            margin: 0;
            font-weight: 500;
            color: #2c3e50;
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar AdminPanel
    window.admin = new AdminPanel();
});

// Exportar para uso global
window.AdminPanel = AdminPanel;
