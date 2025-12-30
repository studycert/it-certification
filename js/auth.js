// auth.js - Sistema de autenticação global
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Configuração do Supabase (mesma do config.js)
        const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';
        
        if (typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage,
                    storageKey: 'studycert-auth'
                }
            });
            
            // Verificar sessão
            await this.checkSession();
        }
    }

    async checkSession() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Usuário logado (global):', this.currentUser.email);
                this.saveToLocalStorage();
            } else {
                // Tentar carregar do localStorage
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro ao verificar sessão:', error);
        }
    }

    saveToLocalStorage() {
        if (this.currentUser) {
            localStorage.setItem('studycert_user', JSON.stringify({
                id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.full_name || this.currentUser.email
            }));
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
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.saveToLocalStorage();
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            localStorage.removeItem('studycert_user');
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
}

// Instância global
let authManager = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    authManager = new AuthManager();
    window.authManager = authManager;
    
    // Aguardar inicialização
    setTimeout(() => {
        updateAuthUI();
    }, 500);
});

// Atualizar interface com estado de autenticação
function updateAuthUI() {
    const authContainer = document.getElementById('authContainer');
    const uploadSection = document.getElementById('uploadSection');
    
    if (!authManager) return;
    
    if (authManager.isAuthenticated()) {
        const user = authManager.getUser();
        const userName = user.user_metadata?.full_name || user.email;
        
        if (authContainer) {
            authContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="background: var(--primary); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ${userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-weight: bold;">${userName}</div>
                        <div style="font-size: 0.8rem; color: #666;">${user.email}</div>
                    </div>
                    <button onclick="logout()" class="btn btn-outline" style="margin-left: 1rem;">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </button>
                </div>
            `;
        }
        
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
    } else {
        if (authContainer) {
            authContainer.innerHTML = `
                <div style="display: flex; gap: 1rem;">
                    <button onclick="showLoginModal()" class="btn btn-outline">
                        <i class="fas fa-sign-in-alt"></i> Entrar
                    </button>
                    <button onclick="showRegisterModal()" class="btn btn-primary">
                        <i class="fas fa-user-plus"></i> Cadastrar
                    </button>
                </div>
            `;
        }
        
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
    }
}

// Funções globais
async function logout() {
    if (authManager) {
        await authManager.logout();
        updateAuthUI();
        window.location.reload();
    }
}

function showLoginModal() {
    // Redirecionar para página de login ou mostrar modal
    window.location.href = 'index.html#login';
}

function showRegisterModal() {
    window.location.href = 'index.html#register';
}

// Exportar para uso global
window.AuthManager = AuthManager;
window.updateAuthUI = updateAuthUI;
window.logout = logout;
