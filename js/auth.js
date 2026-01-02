// js/auth.js - Sistema de autenticação global MELHORADO
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.STORAGE_KEY = 'studycert-auth-v2';
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
                        detectSessionInUrl: true,
                        storage: window.localStorage,
                        storageKey: this.STORAGE_KEY
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
                
                // Sincronizar com outras abas
                this.setupStorageSync();
                
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
            if (!this.supabase) {
                this.loadFromLocalStorage();
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
                name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
                metadata: this.currentUser.user_metadata
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    loadFromLocalStorage() {
        try {
            const userData = localStorage.getItem(this.STORAGE_KEY);
            if (userData) {
                const user = JSON.parse(userData);
                this.currentUser = {
                    id: user.id,
                    email: user.email,
                    user_metadata: user.metadata || { full_name: user.name }
                };
                console.log('📱 Usuário carregado do localStorage:', user.email);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar do localStorage:', e);
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    setupStorageSync() {
        // Sincronizar login/logout entre abas
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                if (e.newValue) {
                    const user = JSON.parse(e.newValue);
                    this.currentUser = {
                        id: user.id,
                        email: user.email,
                        user_metadata: user.metadata || { full_name: user.name }
                    };
                } else {
                    this.currentUser = null;
                }
                
                // Disparar evento para atualizar UI
                window.dispatchEvent(new CustomEvent('studycert-auth-changed', {
                    detail: { user: this.currentUser }
                }));
                
                // Forçar atualização da UI
                if (window.updateAuthUI) {
                    window.updateAuthUI();
                }
            }
        });
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
            
            // Sincronizar com outras abas
            window.dispatchEvent(new StorageEvent('storage', {
                key: this.STORAGE_KEY,
                newValue: JSON.stringify({
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
                    metadata: data.user.user_metadata
                })
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
            localStorage.removeItem(this.STORAGE_KEY);
            
            // Disparar evento para sincronizar
            window.dispatchEvent(new CustomEvent('studycert-auth-logout'));
            
            // Sincronizar com outras abas
            window.dispatchEvent(new StorageEvent('storage', {
                key: this.STORAGE_KEY,
                newValue: null
            }));
            
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
        
        // Sincronizar
        window.dispatchEvent(new StorageEvent('storage', {
            key: this.STORAGE_KEY,
            newValue: JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email.split('@')[0],
                metadata: user.user_metadata
            })
        }));
    }

    clearUser() {
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        
        // Sincronizar
        window.dispatchEvent(new StorageEvent('storage', {
            key: this.STORAGE_KEY,
            newValue: null
        }));
    }
}

// Criar instância global única
const authManager = new AuthManager();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    // Expor para uso global
    window.authManager = authManager;
    window.studyCertAuth = authManager;
    
    // Configurar listener para eventos de auth
    window.addEventListener('studycert-auth-changed', () => {
        if (window.updateAuthUI) {
            window.updateAuthUI();
        }
    });
    
    console.log('🎯 AuthManager carregado e pronto');
});

// Funções globais
window.checkAuth = () => authManager.isAuthenticated();
window.logoutGlobal = () => authManager.logout();
window.getCurrentUser = () => authManager.getUser();
