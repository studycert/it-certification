// verificar-admin.js - CÓDIGO COMPLETO
class AdminRedirect {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.adminData = null;
        this.init();
    }
    
    async init() {
        try {
            console.log('🔍 Iniciando verificação de admin...');
            
            // Aguardar carregamento do Supabase e das configurações
            if (typeof supabase === 'undefined' || typeof SUPABASE_CONFIG === 'undefined') {
                console.log('Aguardando dependências carregarem...');
                setTimeout(() => this.init(), 500);
                return;
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
                return;
            }
            
            if (!session || !session.user) {
                console.log('ℹ️ Nenhum usuário logado');
                return;
            }
            
            this.currentUser = session.user;
            console.log('✅ Usuário logado encontrado:', this.currentUser.email);
            
            // Verificar se é admin
            const isAdmin = await this.checkAdminStatus();
            
            if (isAdmin) {
                console.log('🎯 Usuário é administrador:', this.adminData.role);
                this.addAdminButton();
                this.checkAutoRedirect();
            } else {
                console.log('ℹ️ Usuário não é administrador');
            }
            
        } catch (err) {
            console.error('❌ Erro na verificação de admin:', err);
        }
    }
    
    async checkAdminStatus() {
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
                console.log('Dados admin:', data);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            return false;
        }
    }
    
    addAdminButton() {
        const authButtons = document.getElementById('authButtons');
        if (!authButtons) {
            console.log('Botões de autenticação não encontrados');
            return;
        }
        
        // Verificar se o botão já existe
        if (document.querySelector('.btn-admin')) {
            return;
        }
        
        // Criar botão de admin
        const adminLink = document.createElement('a');
        adminLink.href = 'admin.html';
        adminLink.className = 'btn btn-warning btn-admin';
        adminLink.innerHTML = '<i class="fas fa-cog"></i> Painel Admin';
        adminLink.style.cssText = `
            margin-left: 10px;
            padding: 8px 16px;
            font-size: 14px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            background: linear-gradient(135deg, #f39c12 0%, #d35400 100%);
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
        `;
        
        // Adicionar efeito hover
        adminLink.addEventListener('mouseenter', () => {
            adminLink.style.transform = 'translateY(-2px)';
            adminLink.style.boxShadow = '0 4px 8px rgba(243, 156, 18, 0.3)';
        });
        
        adminLink.addEventListener('mouseleave', () => {
            adminLink.style.transform = 'translateY(0)';
            adminLink.style.boxShadow = 'none';
        });
        
        // Adicionar tooltip
        adminLink.title = 'Acessar Painel Administrativo';
        
        authButtons.appendChild(adminLink);
        console.log('✅ Botão de admin adicionado');
    }
    
    checkAutoRedirect() {
        // Verificar se deve redirecionar automaticamente
        const urlParams = new URLSearchParams(window.location.search);
        const redirectToAdmin = urlParams.get('redirectToAdmin');
        
        if (redirectToAdmin === 'true') {
            console.log('🔄 Redirecionando para painel admin...');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
        }
    }
    
    // Método público para verificar admin de qualquer lugar
    static async verificarEAdicionarBotao() {
        const verifier = new AdminRedirect();
        await verifier.init();
        return verifier.adminData !== null;
    }
    
    // Método para obter dados do admin
    getAdminData() {
        return this.adminData;
    }
}

// Inicializar automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, iniciando verificação de admin...');
    
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(() => {
        window.adminVerifier = new AdminRedirect();
    }, 1000);
});

// Adicionar evento global para quando o usuário fizer login
window.addEventListener('userLoggedIn', () => {
    console.log('👤 Evento de login detectado, verificando admin...');
    setTimeout(() => {
        if (window.adminVerifier) {
            window.adminVerifier.init();
        } else {
            window.adminVerifier = new AdminRedirect();
        }
    }, 500);
});

// Exportar para uso global
window.AdminRedirect = AdminRedirect;
