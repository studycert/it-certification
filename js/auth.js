// js/auth.js - Sistema de autenticação simplificado
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
            console.log('🔄 Inicializando AuthManager...');
            
            // Aguardar carregamento do Supabase
            if (typeof supabase === 'undefined') {
                console.error('❌ Supabase não carregado');
                return;
            }
            
            if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
                console.error('❌ Configuração do Supabase ausente');
                return;
            }
            
            // Criar cliente Supabase
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage,
                        storageKey: 'studycert-auth'
                    }
                }
            );
            
            // Verificar sessão existente
            await this.checkSession();
            this.isInitialized = true;
            console.log('✅ AuthManager inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);
        }
    }

    async checkSession() {
        try {
            if (!this.supabase) return;
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.warn('⚠️ Erro ao verificar sessão:', error);
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Sessão ativa para:', this.currentUser.email);
                this.saveToLocalStorage();
            } else {
                console.log('⚠️ Nenhuma sessão ativa');
            }
        } catch (error) {
            console.error('❌ Erro na verificação de sessão:', error);
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
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Tentando login para:', email);
            
            if (!this.supabase) {
                console.error('❌ Supabase não inicializado');
                return { success: false, error: 'Sistema não inicializado' };
            }
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: password
            });

            if (error) {
                console.error('❌ Erro no login:', error.message);
                return { success: false, error: error.message };
            }

            this.currentUser = data.user;
            this.saveToLocalStorage();
            console.log('✅ Login realizado com sucesso');
            
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
            
            console.log('✅ Logout realizado');
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
}

// Criar instância global
const authManager = new AuthManager();

// Exportar para uso global
window.authManager = authManager;
window.AuthManager = AuthManager;
