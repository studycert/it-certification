// Sistema de sincronização SIMPLES e EFETIVO
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Sistema de sincronização carregado');
    
    // Função para verificar e atualizar autenticação
    function checkAndSyncAuth() {
        console.log('🔄 Verificando autenticação...');
        
        // 1. Primeiro, verificar se temos dados no localStorage
        const authData = localStorage.getItem('studycert-auth-data');
        const userSession = localStorage.getItem('sb-uhbwudgdeyvbkqoflaqw-auth-token');
        
        console.log('📱 Auth Data:', authData ? 'Presente' : 'Ausente');
        console.log('📱 Session:', userSession ? 'Presente' : 'Ausente');
        
        if (authData) {
            try {
                const user = JSON.parse(authData);
                console.log('✅ Usuário encontrado:', user.email);
                
                // Se tiver authManager, atualizar
                if (window.authManager) {
                    window.authManager.currentUser = {
                        id: user.id,
                        email: user.email,
                        user_metadata: user.metadata || { full_name: user.name }
                    };
                    console.log('✅ AuthManager atualizado');
                }
                
                // Forçar atualização da UI
                if (typeof window.updateAuthUI === 'function') {
                    window.updateAuthUI();
                    console.log('✅ UI atualizada');
                }
                
                return true;
            } catch (e) {
                console.error('❌ Erro ao parsear auth data:', e);
            }
        }
        
        console.log('⚠️ Nenhum usuário autenticado');
        return false;
    }
    
    // Verificar imediatamente
    checkAndSyncAuth();
    
    // Configurar listener para storage events (sincronização entre abas)
    window.addEventListener('storage', function(e) {
        console.log('🔄 Evento storage detectado:', e.key);
        
        if (e.key === 'studycert-auth-data' || e.key === 'sb-uhbwudgdeyvbkqoflaqw-auth-token') {
            console.log('🔄 Mudança de autenticação detectada');
            setTimeout(checkAndSyncAuth, 100);
        }
    });
    
    // Verificar a cada 2 segundos
    setInterval(checkAndSyncAuth, 2000);
    
    // Expor função globalmente
    window.syncAuth = checkAndSyncAuth;
});
