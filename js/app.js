// No início do arquivo, após as configurações
let authManager = null;

// Modifique a função initApp() para inicializar o authManager
async function initApp() {
    try {
        // Inicializar authManager
        authManager = window.authManager || new AuthManager();
        await authManager.init();
        
        // Configurar navegação
        setupNavigation();
        
        // Configurar tabs de autenticação
        setupAuthTabs();
        
        // Verificar status de autenticação
        await checkAuthStatus();
        
        // Configurar eventos
        setupEventListeners();
        
        // Carregar dados iniciais
        loadInitialData();
        
        console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
    }
}

// Adicione esta função para login com Google
async function loginWithGoogle() {
    try {
        const supabase = supabase.createClient(
            SUPABASE_CONFIG.url, 
            SUPABASE_CONFIG.anonKey
        );
        
        // Detectar se está no GitHub Pages ou localhost
        const isGitHubPages = window.location.hostname === 'studycert.github.io';
        
        // URL de redirecionamento baseada no ambiente
        let redirectUrl;
        
        if (isGitHubPages) {
            // Para GitHub Pages
            redirectUrl = 'https://studycert.github.io/it-certification/auth-callback.html';
        } else {
            // Para desenvolvimento local
            const port = window.location.port || '3000';
            redirectUrl = `http://localhost:${port}/auth-callback.html`;
        }
        
        console.log('Redirecionando para:', redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) {
            console.error('Erro no login com Google:', error);
            showMessage(
                document.getElementById('loginMessage'),
                `Erro: ${error.message}`,
                'error'
            );
            return;
        }
        
        // O Supabase retorna uma URL para redirecionamento
        if (data?.url) {
            window.location.href = data.url;
        }
        
    } catch (error) {
        console.error('Erro no login com Google:', error);
        showMessage(
            document.getElementById('loginMessage'),
            'Erro ao conectar com Google. Tente novamente.',
            'error'
        );
    }

    } catch (error) {
        console.error('Erro no login com Google:', error);
        showMessage(
            document.getElementById('loginMessage'),
            'Erro ao conectar com Google. Tente novamente.',
            'error'
        );
    }
}

// Modifique a função updateUIForLoggedInUser para mostrar botão do Google
function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('authButtons');
    
    if (!authButtons) return;
    
    const userName = user.user_metadata?.name || 
                    user.user_metadata?.full_name || 
                    user.email.split('@')[0];
    
    // Verificar se é login com Google
    const isGoogleUser = user.app_metadata?.provider === 'google';
    const userIcon = isGoogleUser ? 'fab fa-google' : 'fas fa-user-circle';
    
    authButtons.innerHTML = `
        <div class="user-info">
            <i class="${userIcon}" style="margin-right: 8px;"></i>
            <span class="user-name">${userName}</span>
        </div>
        <button class="btn btn-secondary" onclick="logout()">Sair</button>
    `;
    
    // Resto do código...
}

// Atualize o HTML do modal de autenticação para incluir botão do Google
// No seu index.html, modifique a seção do modal de autenticação:

// Dentro do modal-auth, após os formulários, adicione:
/*
<div class="social-auth">
    <div class="divider">
        <span>ou entre com</span>
    </div>
    <button class="btn btn-google" onclick="loginWithGoogle()">
        <i class="fab fa-google"></i> Continuar com Google
    </button>
</div>
*/

// Adicione estes estilos ao CSS:
/*
.social-auth {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.divider {
    text-align: center;
    margin-bottom: 20px;
    position: relative;
}

.divider span {
    background: white;
    padding: 0 15px;
    color: #7f8c8d;
    font-size: 0.9rem;
}

.btn-google {
    width: 100%;
    background-color: #fff;
    color: #757575;
    border: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    font-weight: 600;
}

.btn-google:hover {
    background-color: #f8f9fa;
    border-color: #ccc;
}

.fa-google {
    color: #DB4437;
}
*/
