// js/auth.js - Sistema de autenticação completo com Google/Microsoft
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
                
                await this.checkSession();
                this.isInitialized = true;
                
                console.log('✅ AuthManager inicializado');
                
                window.dispatchEvent(new CustomEvent('studycert-auth-ready'));
                
            } else {
                console.warn('⚠️ Supabase não disponível');
                this.loadFromLocalStorage();
            }
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
                avatar: this.currentUser.user_metadata?.avatar_url,
                email_confirmed: this.currentUser.email_confirmed_at ? true : false
            };
            localStorage.setItem('studycert_user', JSON.stringify(userData));
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
                    email_confirmed_at: user.email_confirmed ? new Date().toISOString() : null,
                    user_metadata: { 
                        full_name: user.name,
                        avatar_url: user.avatar 
                    }
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

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    return { 
                        success: false, 
                        error: 'Email não confirmado',
                        needsConfirmation: true,
                        email: email 
                    };
                }
                throw error;
            }

            this.currentUser = data.user;
            this.saveToLocalStorage();
            
            window.dispatchEvent(new CustomEvent('studycert-auth-login', {
                detail: { user: data.user }
            }));
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { 
                success: false, 
                error: this.getAuthErrorMessage(error) 
            };
        }
    }

    async loginWithOAuth(provider) {
        try {
            if (!this.supabase) await this.init();
            
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin + '/auth-callback.html',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            
            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error(`❌ Erro no login com ${provider}:`, error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async register(name, email, password) {
        try {
            if (!this.supabase) await this.init();
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password: password,
                options: {
                    data: {
                        full_name: name
                    },
                    emailRedirectTo: window.location.origin + '/auth-callback.html'
                }
            });

            if (error) throw error;

            if (data.user) {
                this.currentUser = data.user;
                this.saveToLocalStorage();
                
                if (data.user.identities && data.user.identities.length > 0) {
                    return { 
                        success: true, 
                        user: data.user,
                        needsConfirmation: false 
                    };
                } else {
                    return { 
                        success: true, 
                        user: data.user,
                        needsConfirmation: true 
                    };
                }
            }
            
            return { success: false, error: 'Erro desconhecido no cadastro' };
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            return { 
                success: false, 
                error: this.getAuthErrorMessage(error) 
            };
        }
    }

    async resendConfirmationEmail(email) {
        try {
            if (!this.supabase) await this.init();
            
            const { error } = await this.supabase.auth.resend({
                type: 'signup',
                email: email,
                options: {
                    emailRedirectTo: window.location.origin + '/auth-callback.html'
                }
            });

            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao reenviar confirmação:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async forgotPassword(email) {
        try {
            if (!this.supabase) await this.init();
            
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html'
            });

            if (error) throw error;
            
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao solicitar recuperação:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studycert_user');
            
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

    isEmailConfirmed() {
        return this.currentUser?.email_confirmed_at ? true : false;
    }

    getUser() {
        return this.currentUser;
    }

    getUserInitials() {
        if (!this.currentUser) return 'U';
        const name = this.currentUser.user_metadata?.full_name || this.currentUser.email;
        return name.substring(0, 2).toUpperCase();
    }

    getSupabase() {
        return this.supabase;
    }

    getAuthErrorMessage(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('invalid login')) {
            return 'Email ou senha incorretos';
        } else if (message.includes('email not confirmed')) {
            return 'Email não confirmado. Verifique sua caixa de entrada.';
        } else if (message.includes('user already registered')) {
            return 'Este email já está cadastrado';
        } else if (message.includes('rate limit')) {
            return 'Muitas tentativas. Aguarde alguns minutos.';
        } else if (message.includes('fetch') || message.includes('network')) {
            return 'Erro de conexão. Verifique sua internet.';
        } else if (message.includes('password')) {
            return 'Senha muito fraca. Use pelo menos 6 caracteres.';
        } else {
            return error.message;
        }
    }
}

// Criar instância global
const authManager = new AuthManager();

// Expor para uso global
window.authManager = authManager;
window.checkAuth = () => authManager.isAuthenticated();
window.logoutGlobal = () => authManager.logout();

// Funções globais para login social
window.loginWithGoogle = function() {
    authManager.loginWithOAuth('google');
};

window.loginWithMicrosoft = function() {
    authManager.loginWithOAuth('azure');
};

// Função para reenviar confirmação
window.resendConfirmation = async function(email) {
    const result = await authManager.resendConfirmationEmail(email);
    
    if (result.success) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage('loginMessage', 
                `<div style="padding: 15px;">
                    <div style="color: #27ae60; font-weight: 600; margin-bottom: 10px;">
                        <i class="fas fa-check-circle"></i> Email reenviado!
                    </div>
                    <div style="font-size: 0.9rem; color: #666;">
                        Verifique sua caixa de entrada e pasta de spam.
                    </div>
                </div>`, 
                'success'
            );
        } else {
            alert('✅ Email de confirmação reenviado com sucesso!');
        }
    } else {
        if (window.app && window.app.showMessage) {
            window.app.showMessage('loginMessage', 
                `<div style="padding: 10px;">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong> Erro: ${result.error}</strong>
                </div>`, 
                'error'
            );
        } else {
            alert('❌ Erro ao reenviar: ' + result.error);
        }
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 AuthManager carregado e pronto');
});
