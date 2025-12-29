// Admin Panel Application
class AdminPanel {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminData = null; // Dados específicos do admin
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        console.log('🔧 Inicializando Painel Admin');
        
        try {
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
            
            // VERIFICAÇÃO DE PERMISSÃO REAL
            const isAdmin = await this.verificarPermissaoAdmin();
            
            if (!isAdmin) {
                console.log('❌ Usuário não é administrador');
                this.showToast('Acesso não autorizado. Redirecionando...', 'error');
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
            
            console.log('✅ Painel Admin carregado com sucesso');
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showToast('Erro ao carregar painel', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }

    async verificarPermissaoAdmin() {
        try {
            // Verificar se o usuário está na tabela admin_users
            const { data, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();
            
            if (error) {
                console.log('Usuário não encontrado na tabela admin:', error.message);
                return false;
            }
            
            if (data) {
                this.adminData = data;
                
                // Armazenar permissões no localStorage para acesso rápido
                localStorage.setItem('admin_role', data.role);
                localStorage.setItem('admin_permissions', JSON.stringify(data.permissions));
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            return false;
        }
    }

    redirectToLogin() {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    carregarInterface() {
        // Atualizar informações do perfil
        this.atualizarPerfil();
        
        // Configurar navegação
        this.configurarNavegacao();
        
        // Ocultar/seccionar elementos baseado nas permissões
        this.aplicarPermissoes();
    }

    atualizarPerfil() {
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        const adminRole = document.getElementById('adminRole');
        
        if (adminName) {
            adminName.textContent = this.currentUser.user_metadata?.full_name || 
                                   this.currentUser.email.split('@')[0];
        }
        
        if (adminEmail) {
            adminEmail.textContent = this.currentUser.email;
        }
        
        if (adminRole && this.adminData) {
            adminRole.textContent = this.adminData.role === 'super_admin' ? 'Super Administrador' : 
                                    this.adminData.role === 'moderator' ? 'Moderador' : 'Administrador';
        }
        
        if (adminAvatar) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            adminAvatar.textContent = initials;
        }
    }

    aplicarPermissoes() {
        const permissions = this.adminData?.permissions || [];
        
        // Exemplo: Esconder seções baseado nas permissões
        if (!permissions.includes('manage_users')) {
            const userSection = document.querySelector('[data-section="usuarios"]');
            if (userSection) userSection.style.display = 'none';
        }
        
        if (!permissions.includes('manage_content')) {
            const contentSection = document.querySelector('[data-section="conteudo"]');
            if (contentSection) contentSection.style.display = 'none';
        }
        
        if (!permissions.includes('view_stats')) {
            const statsSection = document.querySelector('[data-section="estatisticas"]');
            if (statsSection) statsSection.style.display = 'none';
        }
        
        // Adicionar badge de role no header
        const headerTitle = document.querySelector('.admin-header .logo h1');
        if (headerTitle && this.adminData) {
            const badge = document.createElement('span');
            badge.className = 'admin-badge';
            badge.textContent = this.adminData.role === 'super_admin' ? 'SUPER ADMIN' : 
                               this.adminData.role === 'moderator' ? 'MODERADOR' : 'ADMIN';
            headerTitle.appendChild(badge);
        }
    }

    configurarNavegacao() {
        // Configurar clique nos itens do menu
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.mostrarSecao(section);
            });
        });
        
        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Mostrar dashboard inicialmente
        this.mostrarSecao('dashboard');
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
        
        // Carregar dados específicos da seção
        this.carregarDadosSecao(sectionId);
    }

    async carregarDadosSecao(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                await this.carregarDashboard();
                break;
            case 'usuarios':
                await this.carregarUsuarios();
                break;
            case 'conteudo':
                await this.carregarConteudo();
                break;
            case 'estatisticas':
                await this.carregarEstatisticas();
                break;
            case 'simulados':
                await this.carregarSimulados();
                break;
        }
    }

    async carregarDashboard() {
        try {
            // Carregar estatísticas em tempo real
            const [
                usuariosCount,
                simuladosCount,
                forumCount,
                uploadsCount
            ] = await Promise.all([
                this.contarUsuarios(),
                this.contarSimulados(),
                this.contarPostsForum(),
                this.contarUploadsHoje()
            ]);
            
            document.getElementById('totalUsuarios').textContent = usuariosCount;
            document.getElementById('totalSimulados').textContent = simuladosCount;
            document.getElementById('visitasHoje').textContent = forumCount;
            document.getElementById('uploadsHoje').textContent = uploadsCount;
            
            // Carregar atividade recente
            await this.carregarAtividadeRecente();
            
            // Carregar gráficos se tiver permissão
            if (this.adminData?.permissions?.includes('view_stats')) {
                this.carregarGraficos();
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
        }
    }

    async contarUsuarios() {
        const { count, error } = await this.supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        
        return error ? 0 : count;
    }

    async contarSimulados() {
        const { count, error } = await this.supabase
            .from('simulados')
            .select('*', { count: 'exact', head: true });
        
        return error ? 0 : count;
    }

    async contarPostsForum() {
        // Contar posts das últimas 24 horas
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count, error } = await this.supabase
            .from('forum_posts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday.toISOString());
        
        return error ? 0 : count;
    }

    async contarUploadsHoje() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { count, error } = await this.supabase
            .from('uploaded_files')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday.toISOString());
        
        return error ? 0 : count;
    }

    async carregarAtividadeRecente() {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        try {
            const { data, error } = await this.supabase
                .from('admin_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                container.innerHTML = data.map(log => `
                    <div class="activity-item">
                        <div class="activity-icon" style="background: ${this.getLogColor(log.action)}">
                            <i class="${this.getLogIcon(log.action)}"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${log.description}</h4>
                            <p>${log.user_email || 'Sistema'}</p>
                        </div>
                        <div class="activity-time">
                            ${this.formatTimeAgo(log.created_at)}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = '<p class="text-muted text-center">Nenhuma atividade recente</p>';
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar atividade:', error);
            container.innerHTML = '<p class="text-danger">Erro ao carregar atividade</p>';
        }
    }

    getLogColor(action) {
        const colors = {
            'login': '#3498db',
            'create': '#27ae60',
            'update': '#f39c12',
            'delete': '#e74c3c',
            'upload': '#9b59b6'
        };
        return colors[action] || '#95a5a6';
    }

    getLogIcon(action) {
        const icons = {
            'login': 'fas fa-sign-in-alt',
            'create': 'fas fa-plus-circle',
            'update': 'fas fa-edit',
            'delete': 'fas fa-trash',
            'upload': 'fas fa-upload'
        };
        return icons[action] || 'fas fa-info-circle';
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours} h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString('pt-BR');
    }

    showToast(message, type = 'info') {
        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Adicionar ao body
        document.body.appendChild(toast);
        
        // Remover após 5 segundos
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            localStorage.removeItem('admin_role');
            localStorage.removeItem('admin_permissions');
            this.showToast('Sessão encerrada', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
            this.showToast('Erro ao encerrar sessão', 'error');
        }
    }

    // Métodos para outras seções...
    async carregarUsuarios() {
        // Implementar carregamento de usuários
    }
    
    async carregarConteudo() {
        // Implementar carregamento de conteúdo
    }
    
    async carregarEstatisticas() {
        // Implementar carregamento de estatísticas
    }
    
    async carregarSimulados() {
        // Implementar carregamento de simulados
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});
