// admin-integration.js - INTEGRAÇÃO COMPLETA
class AdminIntegration {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isAdmin = false;
        this.adminData = null;
        this.init();
    }

    async init() {
        console.log('🔗 Inicializando integração admin...');
        
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
            await this.checkSession();
            
            // Verificar permissões de admin
            await this.checkAdminPermissions();
            
            // Adicionar botão se for admin
            if (this.isAdmin) {
                this.addAdminButton();
                this.setupAdminFeatures();
            }
            
            console.log('✅ Integração admin inicializada');
            
        } catch (error) {
            console.error('❌ Erro na integração admin:', error);
        }
    }

    async checkSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Erro na sessão:', error);
                return false;
            }
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Sessão ativa:', this.currentUser.email);
                return true;
            }
            
            console.log('ℹ️ Nenhuma sessão ativa');
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            return false;
        }
    }

    async checkAdminPermissions() {
        try {
            if (!this.currentUser) {
                console.log('ℹ️ Nenhum usuário para verificar');
                return false;
            }
            
            console.log('🔍 Verificando permissões para:', this.currentUser.email);
            console.log('📋 User ID:', this.currentUser.id);
            
            // Verificar na tabela admin_users
            const { data, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();
            
            if (error) {
                console.log('❌ Erro ao buscar admin:', error.message);
                return false;
            }
            
            if (data) {
                this.adminData = data;
                this.isAdmin = true;
                
                // Armazenar no localStorage para acesso rápido
                localStorage.setItem('admin_role', data.role);
                localStorage.setItem('admin_permissions', JSON.stringify(data.permissions || []));
                localStorage.setItem('admin_user_id', this.currentUser.id);
                
                console.log('🎯 USUÁRIO É ADMINISTRADOR!');
                console.log('👑 Role:', data.role);
                console.log('🔑 Permissões:', data.permissions);
                console.log('📊 Dados completos:', data);
                
                return true;
            }
            
            console.log('ℹ️ Usuário não é administrador');
            this.isAdmin = false;
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            this.isAdmin = false;
            return false;
        }
    }

    addAdminButton() {
        // Não adicionar se já existe
        if (document.querySelector('.admin-panel-btn')) {
            return;
        }
        
        const authButtons = document.getElementById('authButtons');
        if (!authButtons) {
            console.log('⚠️ Container de botões não encontrado');
            return;
        }
        
        // Criar botão do painel admin
        const adminBtn = document.createElement('a');
        adminBtn.href = 'admin.html';
        adminBtn.className = 'btn btn-warning admin-panel-btn';
        adminBtn.innerHTML = `
            <i class="fas fa-crown"></i>
            <span>Painel Admin</span>
        `;
        adminBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            margin-left: 10px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        `;
        
        // Efeitos hover
        adminBtn.addEventListener('mouseenter', () => {
            adminBtn.style.transform = 'translateY(-2px)';
            adminBtn.style.boxShadow = '0 4px 12px rgba(243, 156, 18, 0.4)';
        });
        
        adminBtn.addEventListener('mouseleave', () => {
            adminBtn.style.transform = 'translateY(0)';
            adminBtn.style.boxShadow = 'none';
        });
        
        // Tooltip
        adminBtn.title = `Acessar Painel Administrativo (${this.adminData?.role || 'Admin'})`;
        
        authButtons.appendChild(adminBtn);
        console.log('✅ Botão do painel admin adicionado');
    }

    setupAdminFeatures() {
        // Configurar funcionalidades extras para admin
        
        // 1. Adicionar link rápido no menu
        this.addAdminMenuLink();
        
        // 2. Mostrar status admin
        this.showAdminStatus();
        
        // 3. Configurar redirecionamento automático (opcional)
        this.setupAutoRedirect();
    }

    addAdminMenuLink() {
        // Adicionar link admin no menu principal se existir
        const mainNav = document.getElementById('mainNav');
        if (!mainNav) return;
        
        const adminNavItem = document.createElement('li');
        adminNavItem.innerHTML = `
            <a href="admin.html" class="nav-link" style="color: #f39c12;">
                <i class="fas fa-cog"></i> Admin
            </a>
        `;
        
        mainNav.querySelector('ul').appendChild(adminNavItem);
    }

    showAdminStatus() {
        // Mostrar status admin na página
        const adminBadge = document.createElement('div');
        adminBadge.id = 'adminStatusBadge';
        adminBadge.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        
        adminBadge.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            <span>${this.adminData?.role || 'Admin'}</span>
        `;
        
        document.body.appendChild(adminBadge);
        
        // Esconder após 5 segundos, mostrar ao passar mouse
        setTimeout(() => {
            adminBadge.style.opacity = '0.3';
            adminBadge.style.transition = 'opacity 0.3s';
        }, 5000);
        
        adminBadge.addEventListener('mouseenter', () => {
            adminBadge.style.opacity = '1';
        });
        
        adminBadge.addEventListener('mouseleave', () => {
            adminBadge.style.opacity = '0.3';
        });
    }

    setupAutoRedirect() {
        // Redirecionar automaticamente se a URL tiver ?admin=true
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true') {
            console.log('🔄 Redirecionando automaticamente para admin...');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
        }
    }

    // Métodos públicos
    getAdminStatus() {
        return {
            isAdmin: this.isAdmin,
            role: this.adminData?.role,
            permissions: this.adminData?.permissions,
            user: this.currentUser?.email
        };
    }

    checkPermission(permission) {
        if (!this.isAdmin || !this.adminData?.permissions) return false;
        
        // Se tem permissão "all", tem todas as permissões
        if (this.adminData.permissions.includes('all')) {
            return true;
        }
        
        return this.adminData.permissions.includes(permission);
    }

    redirectToAdmin() {
        if (this.isAdmin) {
            window.location.href = 'admin.html';
        } else {
            alert('Você não tem permissão para acessar o painel admin');
        }
    }
}

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, verificando integração admin...');
    
    // Aguardar um pouco para garantir que tudo carregou
    setTimeout(() => {
        if (typeof SUPABASE_CONFIG !== 'undefined') {
            window.adminIntegration = new AdminIntegration();
        } else {
            console.log('⚠️ Aguardando configurações...');
            setTimeout(() => {
                window.adminIntegration = new AdminIntegration();
            }, 1000);
        }
    }, 500);
});

// Adicionar evento global para quando o usuário fizer login
window.addEventListener('userLoggedIn', async () => {
    console.log('👤 Evento de login detectado, verificando admin...');
    
    if (window.adminIntegration) {
        // Recarregar verificação
        await adminIntegration.checkSession();
        await adminIntegration.checkAdminPermissions();
        
        if (adminIntegration.isAdmin) {
            adminIntegration.addAdminButton();
            adminIntegration.setupAdminFeatures();
        }
    } else {
        // Inicializar integração
        setTimeout(() => {
            window.adminIntegration = new AdminIntegration();
        }, 1000);
    }
});

// Exportar para uso global
window.AdminIntegration = AdminIntegration;

// Função de debug para console
window.debugAdmin = function() {
    console.group('🔍 DEBUG ADMIN INTEGRATION');
    
    if (window.adminIntegration) {
        const status = adminIntegration.getAdminStatus();
        console.log('Status:', status);
        console.log('Supabase:', adminIntegration.supabase ? '✅ Conectado' : '❌ Não conectado');
        console.log('Usuário:', adminIntegration.currentUser?.email || 'Nenhum');
        console.log('É Admin:', adminIntegration.isAdmin);
        console.log('Dados Admin:', adminIntegration.adminData);
    } else {
        console.log('❌ Integração não inicializada');
    }
    
    console.log('LocalStorage:');
    console.log('- admin_role:', localStorage.getItem('admin_role'));
    console.log('- admin_permissions:', localStorage.getItem('admin_permissions'));
    console.log('- admin_user_id:', localStorage.getItem('admin_user_id'));
    
    console.groupEnd();
};
