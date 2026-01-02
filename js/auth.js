// js/auth.js - Sistema de autenticação global CORRIGIDO
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.STORAGE_KEY = 'studycert-auth-data';
        this.SESSION_KEY = 'studycert-session';
        this.init();
    }
    // js/auth.js - Adicionar este método à classe AuthManager

// Dentro da classe AuthManager, adicione:
broadcastAuthChange() {
    if (this.currentUser) {
        const authData = {
            id: this.currentUser.id,
            email: this.currentUser.email,
            name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
            metadata: this.currentUser.user_metadata,
            timestamp: Date.now()
        };
        localStorage.setItem('studycert-auth-broadcast', JSON.stringify(authData));
        
        // Disparar evento manualmente (para a mesma aba)
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'studycert-auth-broadcast',
            newValue: JSON.stringify(authData)
        }));
    } else {
        localStorage.removeItem('studycert-auth-broadcast');
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'studycert-auth-broadcast',
            newValue: null
        }));
    }
}

// E modifique os métodos login e logout para chamar broadcast:
async login(email, password) {
    try {
        // ... código existente ...
        
        this.currentUser = data.user;
        this.saveToLocalStorage();
        this.broadcastAuthChange(); // ← ADICIONE ESTA LINHA
        
        return { success: true, user: data.user };
    } catch (error) {
        // ... código existente ...
    }
}

async logout() {
    try {
        // ... código existente ...
        
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.SESSION_KEY);
        this.broadcastAuthChange(); // ← ADICIONE ESTA LINHA
        
        return { success: true };
    } catch (error) {
        // ... código existente ...
    }
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
                        storageKey: this.SESSION_KEY
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
                
                // Configurar sincronização entre abas
                this.setupCrossTabSync();
                
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
                metadata: this.currentUser.user_metadata,
                timestamp: Date.now()
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
                // Verificar se os dados não são muito antigos (1 hora)
                if (user.timestamp && (Date.now() - user.timestamp < 3600000)) {
                    this.currentUser = {
                        id: user.id,
                        email: user.email,
                        user_metadata: user.metadata || { full_name: user.name }
                    };
                    console.log('📱 Usuário carregado do localStorage:', user.email);
                } else {
                    console.log('⚠️ Dados de usuário expirados');
                    localStorage.removeItem(this.STORAGE_KEY);
                }
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar do localStorage:', e);
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    setupCrossTabSync() {
        // Sincronizar login/logout entre abas
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                console.log('🔄 Evento de storage detectado:', e.key);
                
                if (e.newValue) {
                    try {
                        const user = JSON.parse(e.newValue);
                        this.currentUser = {
                            id: user.id,
                            email: user.email,
                            user_metadata: user.metadata || { full_name: user.name }
                        };
                        console.log('🔄 Usuário sincronizado de outra aba:', user.email);
                    } catch (error) {
                        console.error('❌ Erro ao analisar dados de sincronização:', error);
                    }
                } else {
                    this.currentUser = null;
                    console.log('🔄 Logout sincronizado de outra aba');
                }
                
                // Disparar evento para atualizar UI
                window.dispatchEvent(new CustomEvent('studycert-auth-update'));
            }
        });
        
        // Também ouvir nossos próprios eventos customizados
        window.addEventListener('studycert-auth-change', () => {
            this.saveToLocalStorage();
            // Forçar atualização em outras abas
            localStorage.setItem('auth-sync-trigger', Date.now().toString());
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
            
            // Disparar eventos para sincronização
            window.dispatchEvent(new CustomEvent('studycert-auth-login', {
                detail: { user: data.user }
            }));
            
            // Forçar sincronização com outras abas
            localStorage.setItem('auth-sync-trigger', Date.now().toString());
            
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
            localStorage.removeItem(this.SESSION_KEY);
            
            // Disparar eventos para sincronização
            window.dispatchEvent(new CustomEvent('studycert-auth-logout'));
            
            // Forçar sincronização com outras abas
            localStorage.setItem('auth-sync-trigger', Date.now().toString());
            
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

    // Método para forçar verificação de sessão
    async refreshSession() {
        try {
            if (this.supabase) {
                const { data, error } = await this.supabase.auth.getSession();
                if (!error && data.session) {
                    this.currentUser = data.session.user;
                    this.saveToLocalStorage();
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar sessão:', error);
        }
        return false;
    }
}

// Criar instância global única
const authManager = new AuthManager();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    // Expor para uso global
    window.authManager = authManager;
    
    // Configurar listener para eventos de auth
    window.addEventListener('studycert-auth-update', () => {
        console.log('🔄 Evento de atualização de auth recebido');
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
window.refreshAuthSession = () => authManager.refreshSession();
