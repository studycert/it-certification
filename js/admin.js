// Admin Panel Application - VERSÃO SIMPLIFICADA
class AdminPanel {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
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
            
            // VERIFICAÇÃO SIMPLES - PERMITE TUDO
            console.log('⚠️ MODO DEBUG: Verificação de admin desativada');
            
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
    }

    atualizarPerfil() {
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        const adminAvatar = document.getElementById('adminAvatar');
        
        if (adminName) {
            adminName.textContent = this.currentUser.user_metadata?.full_name || 
                                   this.currentUser.email.split('@')[0];
        }
        
        if (adminEmail) {
            adminEmail.textContent = this.currentUser.email;
        }
        
        if (adminAvatar) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            adminAvatar.textContent = initials;
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
    }

    async carregarDadosIniciais() {
        console.log('📊 Carregando dados iniciais...');
        // Simplesmente mostra dados estáticos por enquanto
        document.getElementById('totalUsuarios').textContent = '0';
        document.getElementById('totalSimulados').textContent = '0';
        document.getElementById('visitasHoje').textContent = '0';
        document.getElementById('uploadsHoje').textContent = '0';
    }

    showToast(message, type = 'info') {
        console.log(`📢 ${type}: ${message}`);
        // Implementação simples
        alert(`${type.toUpperCase()}: ${message}`);
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.showToast('Sessão encerrada', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
});
