// Sistema de sincronização de autenticação robusto
class AuthSync {
    constructor() {
        this.STORAGE_KEY = 'studycert-auth-sync';
        this.HEARTBEAT_INTERVAL = 3000; // 3 segundos
        this.init();
    }

    init() {
        console.log('🔄 AuthSync inicializando...');
        
        // 1. Configurar listener para eventos de storage (entre abas)
        window.addEventListener('storage', this.handleStorageEvent.bind(this));
        
        // 2. Configurar listener para nossos próprios eventos
        window.addEventListener('studycert-auth-changed', this.handleAuthChange.bind(this));
        
        // 3. Iniciar heartbeat
        this.startHeartbeat();
        
        // 4. Verificar sessão imediatamente
        this.checkAuthStatus();
        
        console.log('✅ AuthSync inicializado');
    }

    handleStorageEvent(e) {
        if (e.key === this.STORAGE_KEY) {
            console.log('🔄 Evento de storage detectado:', e.key);
            this.syncAuthData(e.newValue);
        }
    }

    handleAuthChange(e) {
        console.log('🔄 Evento de auth change detectado');
        this.broadcastAuthState();
    }

    syncAuthData(authDataJson) {
        try {
            if (!authDataJson) {
                // Logout sincronizado
                console.log('🔄 Logout sincronizado de outra aba');
                this.clearLocalAuth();
                this.updateUI();
                return;
            }

            const authData = JSON.parse(authDataJson);
            console.log('🔄 Login sincronizado de outra aba:', authData.email);
            
            // Salvar localmente
            this.saveLocalAuth(authData);
            
            // Atualizar UI
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Erro ao sincronizar auth data:', error);
        }
    }

    saveLocalAuth(authData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
        
        // Também salvar no formato do authManager
        const userData = {
            id: authData.id,
            email: authData.email,
            name: authData.name,
            metadata: authData.metadata
        };
        localStorage.setItem('studycert-auth-data', JSON.stringify(userData));
        
        // Atualizar authManager se disponível
        if (window.authManager) {
            window.authManager.currentUser = {
                id: authData.id,
                email: authData.email,
                user_metadata: authData.metadata || { full_name: authData.name }
            };
        }
    }

    clearLocalAuth() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('studycert-auth-data');
        
        if (window.authManager) {
            window.authManager.currentUser = null;
        }
    }

    async checkAuthStatus() {
        try {
            console.log('🔄 Verificando status de autenticação...');
            
            // Verificar se temos dados locais
            const localData = localStorage.getItem(this.STORAGE_KEY);
            if (localData) {
                const authData = JSON.parse(localData);
                console.log('📱 Dados locais encontrados:', authData.email);
                this.updateUI();
                return true;
            }
            
            // Se tiver authManager, verificar sessão
            if (window.authManager && window.authManager.supabase) {
                const { data, error } = await window.authManager.supabase.auth.getSession();
                
                if (!error && data.session) {
                    console.log('✅ Sessão ativa encontrada:', data.session.user.email);
                    
                    const authData = {
                        id: data.session.user.id,
                        email: data.session.user.email,
                        name: data.session.user.user_metadata?.full_name || data.session.user.email.split('@')[0],
                        metadata: data.session.user.user_metadata,
                        timestamp: Date.now()
                    };
                    
                    this.saveLocalAuth(authData);
                    this.updateUI();
                    return true;
                }
            }
            
            console.log('⚠️ Nenhuma sessão ativa encontrada');
            this.updateUI();
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao verificar auth status:', error);
            this.updateUI();
            return false;
        }
    }

    broadcastAuthState() {
        console.log('📢 Broadcast auth state');
        
        try {
            // Obter dados do usuário atual
            let authData = null;
            
            if (window.authManager && window.authManager.currentUser) {
                const user = window.authManager.currentUser;
                authData = {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email.split('@')[0],
                    metadata: user.user_metadata,
                    timestamp: Date.now()
                };
            } else {
                // Tentar obter do localStorage
                const localData = localStorage.getItem(this.STORAGE_KEY);
                if (localData) {
                    authData = JSON.parse(localData);
                }
            }
            
            if (authData) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
                console.log('📢 Estado de auth transmitido:', authData.email);
            } else {
                localStorage.removeItem(this.STORAGE_KEY);
                console.log('📢 Estado de auth transmitido: logout');
            }
            
        } catch (error) {
            console.error('❌ Erro ao transmitir auth state:', error);
        }
    }

    startHeartbeat() {
        // Verificar a cada 3 segundos
        setInterval(() => {
            this.checkAuthStatus();
        }, this.HEARTBEAT_INTERVAL);
    }

    updateUI() {
        console.log('🎨 Atualizando UI de autenticação...');
        
        // Disparar evento para que outras partes da página atualizem
        window.dispatchEvent(new CustomEvent('studycert-ui-update'));
        
        // Se existir função updateAuthUI, chamar
        if (typeof window.updateAuthUI === 'function') {
            window.updateAuthUI();
        }
    }
}

// Inicializar sincronização quando o DOM estiver pronto
let authSyncInstance;
document.addEventListener('DOMContentLoaded', () => {
    authSyncInstance = new AuthSync();
    window.authSync = authSyncInstance;
    console.log('🎯 AuthSync pronto para uso');
});
