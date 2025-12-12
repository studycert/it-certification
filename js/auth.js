// js/auth.js - FUNÇÕES DE AUTENTICAÇÃO CORRIGIDAS

// Inicializar cliente Supabase
let supabaseClient = null;

// Abrir modal de autenticação
window.openAuthModal = function(tab = 'login') {
    console.log('🔑 Abrindo modal de autenticação, tab:', tab);
    
    const modal = document.getElementById('modalAuth');
    if (!modal) {
        console.error('Modal de autenticação não encontrado!');
        return;
    }
    
    // Inicializar Supabase se necessário
    if (!supabaseClient) {
        try {
            supabaseClient = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            console.log('✅ Supabase inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
            alert('Erro na configuração do sistema. Tente novamente mais tarde.');
            return;
        }
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Ativar tab selecionada
    setTimeout(() => {
        switchAuthTab(tab);
    }, 10);
};

// Fechar modal de autenticação
window.closeAuthModal = function() {
    const modal = document.getElementById('modalAuth');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpar formulários
    ['loginEmail', 'loginPassword', 'registerName', 'registerEmail', 'registerPassword'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    // Limpar mensagens
    ['loginMessage', 'registerMessage'].forEach(id => {
        const msg = document.getElementById(id);
        if (msg) {
            msg.textContent = '';
            msg.style.display = 'none';
        }
    });
};

// Alternar entre tabs de login/cadastro
function switchAuthTab(tabName) {
    // Desativar todas as tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Esconder todos os formulários
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Ativar tab selecionada
    const activeTab = document.querySelector(`.auth-tab[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Mostrar formulário correspondente
    const activeForm = document.getElementById(`${tabName}Form`);
    if (activeForm) {
        activeForm.classList.add('active');
    }
}

// Função de login
window.login = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('loginMessage');
    
    // Validação
    if (!email || !password) {
        showAuthMessage(messageEl, 'Preencha todos os campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthMessage(messageEl, 'E-mail inválido', 'error');
        return;
    }
    
    try {
        showAuthMessage(messageEl, 'Entrando...', 'info');
        
        // Login no Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Buscar perfil do usuário
        const { data: userProfile, error: profileError } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
        
        let userData = {
            id: data.user.id,
            email: data.user.email,
            nome: data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0]
        };
        
        // Se não encontrou perfil, criar um
        if (profileError || !userProfile) {
            console.log('Criando novo perfil para usuário...');
            const { error: insertError } = await supabaseClient
                .from('usuarios')
                .insert({
                    id: data.user.id,
                    email: email,
                    nome: userData.nome,
                    nivel_experiencia: 'iniciante',
                    status: 'ativo',
                    created_at: new Date().toISOString()
                });
            
            if (insertError) {
                console.warn('Erro ao criar perfil:', insertError);
            }
        } else {
            // Combinar dados do perfil existente
            userData = { ...userData, ...userProfile };
        }
        
        // Atualizar last_login
        await supabaseClient
            .from('usuarios')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        
        // Salvar no localStorage
        localStorage.setItem('studyCertUser', JSON.stringify(userData));
        
        showAuthMessage(messageEl, 'Login realizado com sucesso!', 'success');
        
        // Atualizar UI e recarregar após 1 segundo
        setTimeout(() => {
            closeAuthModal();
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'E-mail ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Confirme seu e-mail antes de fazer login';
        }
        
        showAuthMessage(messageEl, errorMessage, 'error');
    }
};

// Função de cadastro
window.register = async function() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const messageEl = document.getElementById('registerMessage');
    
    // Validação
    if (!name || !email || !password) {
        showAuthMessage(messageEl, 'Preencha todos os campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthMessage(messageEl, 'E-mail inválido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage(messageEl, 'A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    try {
        showAuthMessage(messageEl, 'Criando conta...', 'info');
        
        // Cadastro no Supabase
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    full_name: name,
                    name: name
                }
            }
        });
        
        if (error) throw error;
        
        // Criar perfil na tabela usuarios
        const { error: profileError } = await supabaseClient
            .from('usuarios')
            .insert({
                id: data.user.id,
                email: email,
                nome: name,
                nivel_experiencia: 'iniciante',
                status: 'ativo',
                created_at: new Date().toISOString()
            });
        
        if (profileError) {
            console.warn('Erro ao criar perfil:', profileError);
        }
        
        showAuthMessage(messageEl, 
            data.user.identities?.length === 0 
                ? 'Conta criada! Faça login para continuar.' 
                : 'Conta criada com sucesso! Verifique seu e-mail para confirmação.', 
            'success');
        
        // Limpar formulário após 2 segundos
        setTimeout(() => {
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            
            // Se o usuário foi logado automaticamente
            if (data.session) {
                const userData = {
                    id: data.user.id,
                    email: data.user.email,
                    nome: name
                };
                localStorage.setItem('studyCertUser', JSON.stringify(userData));
                setTimeout(() => {
                    closeAuthModal();
                    location.reload();
                }, 1000);
            } else {
                // Alternar para tab de login
                switchAuthTab('login');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        
        let errorMessage = 'Erro ao criar conta';
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
            errorMessage = 'Este e-mail já está cadastrado';
        } else if (error.message.includes('password')) {
            errorMessage = 'A senha é muito fraca';
        }
        
        showAuthMessage(messageEl, errorMessage, 'error');
    }
};

// Função de logout
window.logout = async function() {
    try {
        // Logout do Supabase
        await supabaseClient.auth.signOut();
        
        // Remover dados locais
        localStorage.removeItem('studyCertUser');
        
        console.log('✅ Logout realizado');
        
        // Recarregar página
        location.reload();
        
    } catch (error) {
        console.error('Erro no logout:', error);
        alert('Erro ao sair da conta');
    }
};

// Função de recuperação de senha
window.forgotPassword = function() {
    const email = prompt('Digite seu e-mail para redefinir a senha:');
    if (email && isValidEmail(email)) {
        supabaseClient.auth.resetPasswordForEmail(email)
            .then(({ error }) => {
                if (error) {
                    alert('Erro: ' + error.message);
                } else {
                    alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
                    closeAuthModal();
                }
            });
    } else if (email) {
        alert('E-mail inválido');
    }
};

// Funções auxiliares
function showAuthMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.style.display = 'block';
    element.className = 'message';
    
    switch(type) {
        case 'error':
            element.style.backgroundColor = '#fee';
            element.style.color = '#c33';
            element.style.border = '1px solid #fcc';
            break;
        case 'success':
            element.style.backgroundColor = '#efe';
            element.style.color = '#2a7';
            element.style.border = '1px solid #cfc';
            break;
        case 'info':
            element.style.backgroundColor = '#eef';
            element.style.color = '#3498db';
            element.style.border = '1px solid #cce';
            break;
        default:
            element.style.backgroundColor = '#f5f5f5';
            element.style.color = '#666';
            element.style.border = '1px solid #ddd';
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Inicializar eventos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos dos tabs
    document.querySelectorAll('.auth-tab').forEach(tabEl => {
        tabEl.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Fechar modal ao clicar fora
    const modalAuth = document.getElementById('modalAuth');
    if (modalAuth) {
        modalAuth.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAuthModal();
            }
        });
    }
    
    // Permitir submit com Enter
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                register();
            }
        });
    }
});
