// Gerenciamento de autenticação com Google
class AuthManager {
    constructor() {
        this.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.currentUser = null;
    }

    // Inicializar autenticação
    async init() {
        try {
            // Verificar sessão atual
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                return {
                    success: true,
                    user: session.user,
                    isNewUser: false
                };
            }
            
            return { success: false, user: null };
        } catch (error) {
            console.error('Erro ao inicializar autenticação:', error);
            return { success: false, error: error.message };
        }
    }

    // Login com Google
    async signInWithGoogle() {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth-callback.html`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;
            
            return {
                success: true,
                url: data.url // URL para redirecionamento
            };
        } catch (error) {
            console.error('Erro no login com Google:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Logout
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar se usuário está autenticado
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Escutar mudanças na autenticação
    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            this.currentUser = session?.user || null;
            callback(event, session?.user || null);
        });
    }
}

// Instância global do gerenciador de autenticação
window.authManager = new AuthManager();
