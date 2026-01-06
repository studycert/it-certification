// js/auth.js - Sistema de autenticação global CORRIGIDO
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Configuração do Supabase
            const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
            const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';
            
            if (typeof supabase !== 'undefined') {
                this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage,
                        storageKey: 'studycert-auth'
                    },
                    global: {
                        headers: {
                            'apikey': SUPABASE_KEY
                        }
                    }
                });
                
                // Verificar sessão atual
                await this.checkSession();
                this.isInitialized = true;
                
                console.log('✅ AuthManager inicializado com sucesso');
                
                // Disparar evento de inicialização
                window.dispatchEvent(new CustomEvent('studycert-auth-ready'));
                
            } else {
                console.warn('⚠️ Supabase não disponível, usando localStorage');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);
        }
    }

    async checkSession() {
        try {
            if (!this.supabase) return;
            
            // Verificar se já tem sessão ativa localmente
            if (this.currentUser) {
                console.log('✅ Sessão já ativa localmente');
                return;
            }
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.warn('⚠️ Erro ao verificar sessão:', error);
                this.loadFromLocalStorage();
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Sessão ativa:', this.currentUser.email);
                this.saveToLocalStorage();
            } else {
                console.log('⚠️ Nenhuma sessão ativa');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro na verificação de sessão:', error);
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
            localStorage.setItem('studycert_auth', 'true');
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
            
            // Disparar evento
            window.dispatchEvent(new CustomEvent('studycert-auth-login', {
                detail: { user: data.user }
            }));
            
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
            localStorage.removeItem('studycert_auth');
            
            // Disparar evento
            window.dispatchEvent(new CustomEvent('studycert-auth-logout'));
            
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
        localStorage.removeItem('studycert_auth');
    }
}

// Criar instância global única
const authManager = new AuthManager();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    // Expor para uso global
    window.authManager = authManager;
    window.studyCertAuth = authManager;
    
    console.log('🎯 AuthManager carregado e pronto');
});

// Função para verificar se está logado (para uso em outras páginas)
function checkAuth() {
    return authManager.isAuthenticated();
}

// Exportar para uso global
window.checkAuth = checkAuth;
window.logoutGlobal = () => authManager.logout();
