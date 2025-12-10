// Configuração do Supabase
let supabase;

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Supabase
    supabase = supabaseClient;
    
    // Verificar se o usuário está logado
    checkAuthStatus();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar tabs de autenticação
    setupAuthTabs();
    
    // Configurar botões de autenticação no header
    setupAuthButtons();
});

// Verificar status de autenticação
async function checkAuthStatus() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Usuário está logado
            updateUIForLoggedInUser(session.user);
            // Carregar progresso do usuário
            loadUserProgress(session.user.id);
        } else {
            // Usuário não está logado
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Atualizar UI para usuário logado
function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('authButtons');
    const uploadArea = document.getElementById('uploadArea');
    
    if (authButtons) {
        authButtons.innerHTML = `
            <span style="margin-right: 15px; color: #555;">Olá, ${user.email.split('@')[0]}</span>
            <button class="btn btn-secondary" onclick="logout()">Sair</button>
        `;
    }
    
    // Mostrar área de upload se estiver na página de simulados
    if (uploadArea && window.location.hash.includes('simulados')) {
        uploadArea.style.display = 'block';
    }
}

// Atualizar UI para usuário não logado
function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('authButtons');
    
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn btn-primary" onclick="openAuthModal()">Entrar</button>
            <button class="btn btn-success" onclick="openRegister()">Cadastrar</button>
        `;
    }
    
    // Esconder progresso do usuário
    const userProgress = document.getElementById('userProgress');
    if (userProgress) {
        userProgress.style.display = 'none';
    }
}

// Configurar navegação
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mainContents = document.querySelectorAll('.main-content');
    const footerLinks = document.querySelectorAll('footer a[data-target]');
    
    // Adicionar evento de clique aos links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe active de todos os links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            this.classList.add('active');
            
            // Obter target
            const target = this.getAttribute('data-target');
            
            // Esconder todos os conteúdos
            mainContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostrar conteúdo alvo
            const targetContent = document.getElementById(target);
            if (targetContent) {
                targetContent.classList.add('active');
                window.location.hash = target;
                
                // Mostrar/ocultar área de upload baseado na página
                const uploadArea = document.getElementById('uploadArea');
                if (uploadArea) {
                    if (target === 'simulados') {
                        checkAuthStatus(); // Verificar se deve mostrar área de upload
                    } else {
                        uploadArea.style.display = 'none';
                    }
                }
            }
        });
    });
    
    // Adicionar evento aos links do footer
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            
            // Encontrar e clicar no link de navegação correspondente
            const navLink = document.querySelector(`.nav-link[data-target="${target}"]`);
            if (navLink) {
                navLink.click();
            }
        });
    });
    
    // Verificar hash na URL ao carregar a página
    if (window.location.hash) {
        const target = window.location.hash.substring(1);
        const navLink = document.querySelector(`.nav-link[data-target="${target}"]`);
        if (navLink) {
            navLink.click();
        }
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

// Configurar botões de autenticação
function setupAuthButtons() {
    // Botões já configurados no updateUIForLoggedOutUser
}

// Abrir modal de autenticação
function openAuthModal() {
    const modal = document.getElementById('modalAuth');
    modal.classList.add('active');
}

// Fechar modal de autenticação
function closeAuthModal() {
    const modal = document.getElementById('modalAuth');
    modal.classList.remove('active');
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
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
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
            // Limpar campos
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            message.classList.remove('success');
            message.style.display = 'none';
        }, 1500);
        
    } catch (error) {
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
    
    if (password.length < 6) {
        showMessage(message, 'A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
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
            // Limpar campos
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            message.classList.remove('success');
            message.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        showMessage(message, 'Erro ao criar conta. Tente novamente.', 'error');
    }
}

// Logout
async function logout() {
    try {
        await supabase.auth.signOut();
        updateUIForLoggedOutUser();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Redefinir senha
async function forgotPassword() {
    const email = prompt('Digite seu e-mail para redefinir a senha:');
    
    if (!email) return;
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        
        if (error) {
            alert('Erro ao enviar e-mail de redefinição: ' + error.message);
        } else {
            alert('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.');
        }
    } catch (error) {
        alert('Erro ao processar solicitação.');
    }
}

// Carregar progresso do usuário
async function loadUserProgress(userId) {
    const userProgress = document.getElementById('userProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!userProgress || !progressFill || !progressText) return;
    
    // Mostrar seção de progresso
    userProgress.style.display = 'block';
    
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

// Criar nova postagem no fórum
function createNewPost() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        alert('Você precisa estar logado para criar uma nova discussão.');
        openAuthModal();
        return;
    }
    
    alert('Funcionalidade de criar nova postagem será implementada em breve!');
}

// Abrir modal de simulados
function abrirModalSimulados() {
    const modal = document.getElementById('modalSimulados');
    modal.classList.add('active');
}

// Fechar modal de simulados
function fecharModalSimulados() {
    const modal = document.getElementById('modalSimulados');
    modal.classList.remove('active');
}

// Abrir modal de upload
function openUploadModal() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        alert('Você precisa estar logado para fazer upload de simulados.');
        openAuthModal();
        return;
    }
    
    const fileInput = document.getElementById('fileUpload');
    if (fileInput) {
        fileInput.click();
    }
}

// Upload de simulado
async function uploadSimulado() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
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
            return;
        }
        
        try {
            // Aqui você implementaria o upload real do arquivo
            alert(`Arquivo "${file.name}" selecionado para upload. Funcionalidade de upload será implementada em breve!`);
            
            // Limpar input
            fileInput.value = '';
            
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload do arquivo.');
        }
    };
    
    fileInput.click();
}

// Função auxiliar para mostrar mensagens
function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

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

// Adicionar funcionalidade aos botões "Estudar" e "Acessar"
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-primary') && 
        (e.target.textContent.includes('Estudar') || e.target.textContent.includes('Acessar'))) {
        e.preventDefault();
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            alert('Você precisa estar logado para acessar este conteúdo.');
            openAuthModal();
        } else {
            alert('Conteúdo carregado com sucesso! Em uma implementação real, você seria redirecionado para a página de estudo.');
        }
    }
});
