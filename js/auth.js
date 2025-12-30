// auth.js - Sistema de autenticação global CORRIGIDO
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Usar a mesma configuração do config.js
            if (typeof supabase !== 'undefined' && window.SUPABASE_CONFIG) {
                this.supabase = supabase.createClient(
                    window.SUPABASE_CONFIG.url,
                    window.SUPABASE_CONFIG.anonKey,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true,
                            storage: window.localStorage,
                            storageKey: 'studycert-auth' // DEVE SER O MESMO DO app.js
                        }
                    }
                );
                
                // Verificar sessão
                await this.checkSession();
                this.isInitialized = true;
                
                console.log('✅ AuthManager inicializado');
            } else {
                console.warn('⚠️ SUPABASE_CONFIG não encontrado, usando localStorage');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);
        }
    }

    async checkSession() {
        try {
            if (!this.supabase) return;
            
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Sessão encontrada:', this.currentUser.email);
                this.saveToLocalStorage();
                this.dispatchAuthEvent('login');
            } else {
                console.log('⚠️ Nenhuma sessão encontrada');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error);
            this.loadFromLocalStorage();
        }
    }

    saveToLocalStorage() {
        if (this.currentUser) {
            const userData = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0]
            };
            localStorage.setItem('studycert_user', JSON.stringify(userData));
            console.log('💾 Usuário salvo no localStorage');
        }
    }

    loadFromLocalStorage() {
        try {
            const userData = localStorage.getItem('studycert_user');
            if (userData) {
                const user = JSON.parse(userData);
                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    user_metadata: { full_name: user.name }
                };
                console.log('📱 Usuário carregado do localStorage:', user.email);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar do localStorage:', e);
        }
    }

    async login(email, password) {
        try {
            if (!this.supabase) await this.init();
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.saveToLocalStorage();
            this.dispatchAuthEvent('login');
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studycert_user');
            this.dispatchAuthEvent('logout');
            
            return { success: true };
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }

    getSupabase() {
        return this.supabase;
    }

    setUser(user) {
        this.currentUser = user;
        this.saveToLocalStorage();
    }

    clearUser() {
        this.currentUser = null;
        localStorage.removeItem('studycert_user');
    }

    dispatchAuthEvent(eventType) {
        const event = new CustomEvent(`studycert-auth-${eventType}`, {
            detail: { user: this.currentUser }
        });
        window.dispatchEvent(event);
    }
}

// Criar instância global única
const authManager = new AuthManager();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    await authManager.init();
    
    // Expor para uso global
    window.authManager = authManager;
    window.studyCertAuth = authManager; // Alias para compatibilidade
    
    console.log('🎯 AuthManager carregado globalmente');
    
    // Atualizar UI se houver elementos
    updateAuthUI();
});

// Função para atualizar interface (pode ser chamada por qualquer página)
function updateAuthUI() {
    const authContainer = document.getElementById('authContainer');
    const authStatus = document.getElementById('authStatus');
    
    if (!authManager) return;
    
    const isAuthenticated = authManager.isAuthenticated();
    
    if (authStatus) {
        if (isAuthenticated) {
            const user = authManager.getUser();
            authStatus.textContent = `Logado como: ${user.email}`;
            authStatus.style.color = '#27ae60';
        } else {
            authStatus.textContent = 'Não logado';
            authStatus.style.color = '#666';
        }
    }
    
    if (authContainer) {
        if (isAuthenticated) {
            const user = authManager.getUser();
            const userName = user.user_metadata?.full_name || user.email.split('@')[0];
            
            authContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div style="background: var(--primary); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                        ${userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div style="font-size: 0.9rem;">
                        <div style="font-weight: bold;">${userName}</div>
                        <div style="color: #666; font-size: 0.8rem;">${user.email}</div>
                    </div>
                    <button onclick="logoutGlobal()" class="btn btn-outline btn-sm" style="margin-left: 0.5rem;">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="showLoginModal()" class="btn btn-outline btn-sm">
                        <i class="fas fa-sign-in-alt"></i> Entrar
                    </button>
                    <a href="index.html#register" class="btn btn-primary btn-sm">
                        <i class="fas fa-user-plus"></i> Cadastrar
                    </a>
                </div>
            `;
        }
    }
}

// Funções globais
async function logoutGlobal() {
    if (authManager) {
        await authManager.logout();
        updateAuthUI();
        // Recarregar a página para atualizar estado
        setTimeout(() => window.location.reload(), 500);
    }
}

function showLoginModal() {
    window.location.href = 'index.html#login';
}

// Expor funções para uso global
window.updateAuthUI = updateAuthUI;
window.logoutGlobal = logoutGlobal;
window.showLoginModal = showLoginModal;

// Adicionar listener para eventos de auth
window.addEventListener('studycert-auth-login', () => {
    console.log('🔔 Evento de login disparado');
    updateAuthUI();
});

window.addEventListener('studycert-auth-logout', () => {
    console.log('🔔 Evento de logout disparado');
    updateAuthUI();
});
