// Configurações do Supabase
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseKey = SUPABASE_CONFIG.anonKey;

// Inicializar Supabase
const supabase = supabaseClient || supabase.createClient(supabaseUrl, supabaseKey);

// Verificar se o Supabase foi inicializado corretamente
if (!supabase) {
    console.error('Erro: Supabase não foi inicializado corretamente');
}

// Variáveis globais
let currentUser = null;

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log(`${APP_CONFIG.name} v${APP_CONFIG.version} inicializando...`);
    
    // Inicializar aplicação
    initApp();
});

// Inicializar aplicação
async function initApp() {
    try {
        // Configurar navegação
        setupNavigation();
        
        // Configurar tabs de autenticação
        setupAuthTabs();
        
        // Verificar se o usuário está logado
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

// Verificar status de autenticação
async function checkAuthStatus() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return;
        }
        
        if (session) {
            // Usuário está logado
            currentUser = session.user;
            updateUIForLoggedInUser(session.user);
            
            // Carregar progresso do usuário
            loadUserProgress(session.user.id);
            
            // Mostrar área de upload na página de simulados
            if (window.location.hash.includes('simulados')) {
                showUploadArea();
            }
        } else {
            // Usuário não está logado
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Atualizar UI para usuário logado
function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('authButtons');
    
    if (!authButtons) return;
    
    const userName = user.user_metadata?.name || user.email.split('@')[0];
    
    authButtons.innerHTML = `
        <div class="user-info">
            <i class="fas fa-user-circle" style="margin-right: 8px;"></i>
            <span class="user-name">${userName}</span>
        </div>
        <button class="btn btn-secondary" onclick="logout()">Sair</button>
    `;
    
    // Mostrar progresso do usuário
    const userProgress = document.getElementById('userProgress');
    if (userProgress) {
        userProgress.style.display = 'block';
    }
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('authButtons');
    
    if (!authButtons) return;
    
    authButtons.innerHTML = `
        <button class="btn btn-primary" onclick="openAuthModal()">Entrar</button>
        <button class="btn btn-success" onclick="openRegister()">Cadastrar</button>
    `;
    
    // Esconder progresso do usuário
    const userProgress = document.getElementById('userProgress');
    if (userProgress) {
        userProgress.style.display = 'none';
    }
    
    // Esconder área de upload
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.style.display = 'none';
    }
}

// Configurar navegação
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mainContents = document.querySelectorAll('.main-content');
    const footerLinks = document.querySelectorAll('footer a[data-target]');
    
    // Função para mostrar seção
    function showSection(targetId) {
        // Remover classe active de todos os links
        navLinks.forEach(l => l.classList.remove('active'));
        
        // Adicionar classe active ao link correspondente
        const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Esconder todos os conteúdos
        mainContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Mostrar conteúdo alvo
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.add('active');
            window.location.hash = targetId;
            
            // Mostrar/ocultar área de upload baseado na página
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                if (targetId === 'simulados' && currentUser) {
                    showUploadArea();
                } else {
                    uploadArea.style.display = 'none';
                }
            }
        }
    }
    
    // Adicionar evento de clique aos links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            showSection(target);
        });
    });
    
    // Adicionar evento aos links do footer
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            showSection(target);
        });
    });
    
    // Verificar hash na URL ao carregar a página
    if (window.location.hash) {
        const target = window.location.hash.substring(1);
        showSection(target);
    } else {
        // Mostrar home por padrão
        showSection('home');
    }
}

// Configurar tabs de autenticação
function setupAuthTabs() {
    const authTabs = document.querySelectorAll('.auth-tab');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remover active de todas as tabs
            authTabs.forEach(t => t.classList.remove('active'));
            
            // Adicionar active à tab clicada
            this.classList.add('active');
            
            // Mostrar formulário correspondente
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            
            if (tabName === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
        });
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Fechar modais ao clicar fora
    window.addEventListener('click', function(event) {
        const modalAuth = document.getElementById('modalAuth');
        const modalSimulados = document.getElementById('modalSimulados');
        
        if (modalAuth && event.target === modalAuth) {
            closeAuthModal();
        }
        
        if (modalSimulados && event.target === modalSimulados) {
            fecharModalSimulados();
        }
    });
    
    // Fechar modais com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAuthModal();
            fecharModalSimulados();
        }
    });
}

// Carregar dados iniciais
function loadInitialData() {
    // Você pode usar STATIC_DATA aqui se necessário
    console.log('Dados estáticos disponíveis:', STATIC_DATA);
}

// Abrir modal de autenticação
function openAuthModal() {
    const modal = document.getElementById('modalAuth');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }
}

// Fechar modal de autenticação
function closeAuthModal() {
    const modal = document.getElementById('modalAuth');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restaurar scroll
        
        // Limpar mensagens
        clearAuthMessages();
        
        // Limpar campos (opcional)
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    }
}

// Alternar para registro
function openRegister() {
    openAuthModal();
    
    // Ativar tab de registro
    const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
    if (registerTab) {
        registerTab.click();
    }
}

// Login
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const message = document.getElementById('loginMessage');
    
    // Validação básica
    if (!email || !password) {
        showMessage(message, 'Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage(message, 'Por favor, insira um e-mail válido', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        
        if (error) {
            showMessage(message, error.message, 'error');
            return;
        }
        
        showMessage(message, 'Login realizado com sucesso!', 'success');
        
        // Atualizar UI
        updateUIForLoggedInUser(data.user);
        
        // Fechar modal após 1.5 segundos
        setTimeout(() => {
            closeAuthModal();
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage(message, 'Erro ao fazer login. Tente novamente.', 'error');
    }
}

// Registro
async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const message = document.getElementById('registerMessage');
    
    // Validação básica
    if (!name || !email || !password) {
        showMessage(message, 'Por favor, preencha todos os campos', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage(message, 'Por favor, insira um e-mail válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage(message, 'A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    name: name.trim(),
                    created_at: new Date().toISOString()
                }
            }
        });
        
        if (error) {
            showMessage(message, error.message, 'error');
            return;
        }
        
        showMessage(message, 'Conta criada com sucesso! Faça login para continuar.', 'success');
        
        // Alternar para tab de login após 2 segundos
        setTimeout(() => {
            const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
            if (loginTab) {
                loginTab.click();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showMessage(message, 'Erro ao criar conta. Tente novamente.', 'error');
    }
}

// Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Erro no logout:', error);
            return;
        }
        
        currentUser = null;
        updateUIForLoggedOutUser();
        
        // Se estiver na página de simulados, recarregar para atualizar UI
        if (window.location.hash.includes('simulados')) {
            const navLink = document.querySelector('.nav-link[data-target="simulados"]');
            if (navLink) {
                navLink.click();
            }
        }
        
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Redefinir senha
async function forgotPassword() {
    const email = prompt('Digite seu e-mail para redefinir a senha:');
    
    if (!email) return;
    
    if (!validateEmail(email)) {
        alert('Por favor, insira um e-mail válido.');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/reset-password.html`,
        });
        
        if (error) {
            alert('Erro ao enviar e-mail de redefinição: ' + error.message);
        } else {
            alert('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.');
        }
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        alert('Erro ao processar solicitação.');
    }
}

// Carregar progresso do usuário
async function loadUserProgress(userId) {
    const userProgress = document.getElementById('userProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!userProgress || !progressFill || !progressText) return;
    
    try {
        // Aqui você implementaria a lógica para buscar o progresso real do usuário
        // Por enquanto, usaremos dados de exemplo
        const progressPercentage = 35; // Exemplo: 35% completo
        
        // Animar barra de progresso
        setTimeout(() => {
            progressFill.style.width = `${progressPercentage}%`;
            progressText.textContent = `Você completou ${progressPercentage}% da sua jornada de estudos`;
        }, 300);
        
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        progressText.textContent = 'Não foi possível carregar seu progresso';
    }
}

// Mostrar área de upload
function showUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea && currentUser) {
        uploadArea.style.display = 'block';
    }
}

// Criar nova postagem no fórum
function createNewPost() {
    if (!currentUser) {
        alert('Você precisa estar logado para criar uma nova discussão.');
        openAuthModal();
        return;
    }
    
    alert('Funcionalidade de criar nova postagem será implementada em breve!');
}

// Abrir modal de simulados
function abrirModalSimulados() {
    const modal = document.getElementById('modalSimulados');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Fechar modal de simulados
function fecharModalSimulados() {
    const modal = document.getElementById('modalSimulados');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Upload de simulado
function openUploadModal() {
    if (!currentUser) {
        alert('Você precisa estar logado para fazer upload de simulados.');
        openAuthModal();
        return;
    }
    
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
        fileInput.click();
    }
}

// Processar upload de arquivo
async function uploadSimulado() {
    if (!currentUser) {
        alert('Você precisa estar logado para fazer upload de simulados.');
        openAuthModal();
        return;
    }
    
    const fileInput = document.getElementById('fileUpload');
    
    fileInput.onchange = async function(e) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        if (!file.name.endsWith('.html')) {
            alert('Por favor, selecione apenas arquivos HTML.');
            fileInput.value = '';
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limite
            alert('O arquivo é muito grande. O tamanho máximo é 5MB.');
            fileInput.value = '';
            return;
        }
        
        try {
            // Mostrar loading
            const originalText = fileInput.nextElementSibling?.textContent;
            if (fileInput.nextElementSibling) {
                fileInput.nextElementSibling.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            }
            
            // Aqui você implementaria o upload real do arquivo
            // Exemplo com Supabase Storage:
            /*
            const { data, error } = await supabase.storage
                .from(APP_CONFIG.storageBucket)
                .upload(`${currentUser.id}/${Date.now()}_${file.name}`, file);
            */
            
            // Simulando upload
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            alert(`Arquivo "${file.name}" enviado com sucesso! Será revisado antes de ser publicado.`);
            
            // Restaurar texto do botão
            if (fileInput.nextElementSibling && originalText) {
                fileInput.nextElementSibling.textContent = originalText;
            }
            
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload do arquivo.');
        } finally {
            // Limpar input
            fileInput.value = '';
        }
    };
    
    fileInput.click();
}

// Função auxiliar para mostrar mensagens
function showMessage(element, text, type) {
    if (!element) return;
    
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Limpar mensagens de autenticação
function clearAuthMessages() {
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    
    if (loginMessage) {
        loginMessage.style.display = 'none';
    }
    
    if (registerMessage) {
        registerMessage.style.display = 'none';
    }
}

// Validar e-mail
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para redirecionar para página de estudo
function goToStudyPage(certificationName) {
    if (!currentUser) {
        alert('Você precisa estar logado para acessar este conteúdo.');
        openAuthModal();
        return false;
    }
    
    // Em uma implementação real, você redirecionaria para a página de estudo
    console.log(`Redirecionando para estudo: ${certificationName}`);
    return false; // Retorna false para prevenir navegação padrão
}

// Adicionar CSS para user-info
const userInfoStyle = document.createElement('style');
userInfoStyle.textContent = `
    .user-info {
        display: flex;
        align-items: center;
        margin-right: 15px;
        color: #555;
        font-weight: 500;
    }
    
    .user-name {
        font-size: 0.95rem;
    }
    
    .fas.fa-user-circle {
        font-size: 1.2rem;
        color: #3498db;
    }
`;
document.head.appendChild(userInfoStyle);

// Configurar Supabase para escutar mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Estado de autenticação mudou:', event);
    
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
        updateUIForLoggedInUser(session.user);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForLoggedOutUser();
    }
});
