// Sistema de sincronização de autenticação entre páginas
class AuthSync {
    constructor() {
        this.STORAGE_KEY = 'studycert-sync-auth';
        this.init();
    }

    init() {
        // Ouvir mudanças no storage (entre abas)
        window.addEventListener('storage', this.handleStorageChange.bind(this));
        
        // Configurar heartbeat para manter sessão sincronizada
        this.setupHeartbeat();
        
        console.log('🔄 AuthSync inicializado');
    }

    handleStorageChange(e) {
        if (e.key === this.STORAGE_KEY) {
            console.log('🔄 Mudança de autenticação detectada em outra aba');
            
            try {
                const authData = JSON.parse(e.newValue);
                this.syncWithOtherTab(authData);
            } catch (error) {
                console.error('❌ Erro ao processar sincronização:', error);
            }
        }
    }

    syncWithOtherTab(authData) {
        if (!authData) {
            // Logout em outra aba
            if (window.authManager) {
                window.authManager.currentUser = null;
                window.authManager.saveToLocalStorage?.();
            }
            this.triggerAuthUpdate();
            return;
        }

        // Login em outra aba
        if (window.authManager) {
            window.authManager.currentUser = {
                id: authData.id,
                email: authData.email,
                user_metadata: authData.metadata || { full_name: authData.name }
            };
            window.authManager.saveToLocalStorage?.();
        }
        
        this.triggerAuthUpdate();
    }

    triggerAuthUpdate() {
        // Disparar evento para atualizar UI
        const event = new CustomEvent('studycert-sync-update');
        window.dispatchEvent(event);
        
        // Também forçar update da UI se a função existir
        if (typeof updateAuthUI === 'function') {
            updateAuthUI();
        }
    }

    setupHeartbeat() {
        // Verificar sessão a cada 2 segundos
        setInterval(() => {
            this.checkSession();
        }, 2000);
    }

    async checkSession() {
        if (window.authManager && window.authManager.supabase) {
            try {
                const { data, error } = await window.authManager.supabase.auth.getSession();
                if (!error && data.session) {
                    // Atualizar localmente
                    window.authManager.currentUser = data.session.user;
                    window.authManager.saveToLocalStorage?.();
                    
                    // Sincronizar com outras abas
                    this.broadcastAuthState(data.session.user);
                }
            } catch (error) {
                console.warn('⚠️ Erro ao verificar sessão:', error);
            }
        }
    }

    broadcastAuthState(user) {
        if (!user) return;
        
        const authData = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            metadata: user.user_metadata,
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    }
}

// Inicializar sincronização
const authSync = new AuthSync();
window.authSync = authSync;
