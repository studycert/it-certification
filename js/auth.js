// js/auth.js
class AuthSystem {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🔑 Sistema de autenticação inicializando...');
        await this.checkSession();
        this.setupEventListeners();
    }

    // Verificar sessão existente
    async checkSession() {
        try {
            const { data, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Erro ao verificar sessão:', error);
                this.updateAuthUI();
                return;
            }
            
            if (data.session) {
                this.currentUser = data.session.user;
                console.log('👤 Usuário logado:', this.currentUser.email);
                await this.createOrUpdateUserProfile();
            } else {
                this.currentUser = null;
            }
            
            this.updateAuthUI();
            
        } catch (error) {
            console.error('Erro no checkSession:', error);
            this.updateAuthUI();
        }
    }

    // Criar ou atualizar perfil do usuário
    async createOrUpdateUserProfile() {
        if (!this.currentUser) return;

        try {
            const { data: existingProfile, error: fetchError } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Erro ao buscar perfil:', fetchError);
                return;
            }

            const userData = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                nome: this.currentUser.user_metadata?.name || 
                       this.currentUser.user_metadata?.full_name || 
                       this.currentUser.email.split('@')[0],
                status: 'ativo',
                last_login: new Date().toISOString()
            };

            if (!existingProfile) {
                // Criar novo perfil
                const { error: insertError } = await this.supabase
                    .from('usuarios')
                    .insert(userData);
                
                if (insertError) {
                    console.error('Erro ao criar perfil:', insertError);
                } else {
                    console.log('✅ Perfil do usuário criado');
                }
            } else {
                // Atualizar último login
                const { error: updateError } = await this.supabase
                    .from('usuarios')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', this.currentUser.id);
                
                if (updateError) {
                    console.error('Erro ao atualizar perfil:', updateError);
                }
            }
            
        } catch (error) {
            console.error('Erro em createOrUpdateUserProfile:', error);
        }
    }

    // Atualizar interface de usuário
    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const uploadArea = document.getElementById('uploadArea');
        
        if (!authButtons) return;

        if (this.currentUser) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.user_metadata?.name || 
                               this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            
            authButtons.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${initials}</div>
                    <span>${displayName}</span>
                    <button class="btn btn-outline" onclick="auth.logout()" style="margin-left: 10px;">Sair</button>
                </div>
            `;
            
            if (uploadArea) uploadArea.style.display = 'block';
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline" onclick="auth.openLogin()">Entrar</button>
                <button class="btn btn-primary" onclick="auth.openRegister()">Cadastrar</button>
            `;
            
            if (uploadArea) uploadArea.style.display = 'none';
        }
    }

    // ==================== MODAL DE AUTENTICAÇÃO ====================
    openLogin(e) {
        if (e) e.preventDefault();
        this.showAuthModal('login');
    }

    openRegister(e) {
        if (e) e.preventDefault();
        this.showAuthModal('register');
    }

    showAuthModal(tab = 'login') {
        // Verificar se modal já existe
        let modal = document.getElementById('modalAuth');
        
        if (!modal) {
            this.createAuthModal();
            modal = document.getElementById('modalAuth');
        }
        
        // Ativar tab
        this.switchAuthTab(tab);
        
        // Mostrar modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    createAuthModal() {
        const modalHTML = `
            <div id="modalAuth" class="modal-auth">
                <div class="auth-container">
                    <button class="close-auth-modal" onclick="auth.closeAuthModal()">&times;</button>
                    <div class="auth-header">
                        <h2>Study<span style="color: #3498db;">Cert</span></h2>
                        <p>Sua jornada começa aqui</p>
                    </div>
                    <div class="auth-tabs">
                        <div class="auth-tab active" data-tab="login">Entrar</div>
                        <div class="auth-tab" data-tab="register">Cadastrar</div>
                    </div>
                    
                    <div id="loginForm" class="auth-form active">
                        <div id="loginMessage" class="message"></div>
                        <div class="form-group">
                            <label for="loginEmail">E-mail</label>
                            <input type="email" id="loginEmail" placeholder="seu@email.com">
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Senha</label>
                            <input type="password" id="loginPassword" placeholder="Sua senha">
                        </div>
                        <button class="btn btn-primary" onclick="auth.login()" style="width: 100%;">Entrar</button>
                        <div class="auth-footer">
                            <p>Esqueceu sua senha? <a href="#" onclick="auth.forgotPassword()">Redefinir senha</a></p>
                        </div>
                    </div>
                    
                    <div id="registerForm" class="auth-form">
                        <div id="registerMessage" class="message"></div>
                        <div class="form-group">
                            <label for="registerName">Nome Completo</label>
                            <input type="text" id="registerName" placeholder="Seu nome completo">
                        </div>
                        <div class="form-group">
                            <label for="registerEmail">E-mail</label>
                            <input type="email" id="registerEmail" placeholder="seu@email.com">
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Senha</label>
                            <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres">
                        </div>
                        <button class="btn btn-success" onclick="auth.register()" style="width: 100%;">Criar Conta</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar eventos
        const modal = document.getElementById('modalAuth');
        modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeAuthModal();
            }
        });

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchAuthTab(tabName);
            });
        });
    }

    closeAuthModal() {
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
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
    }

    switchAuthTab(tabName) {
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
        
        // Limpar mensagens
        this.clearAuthMessages();
    }

    // ==================== FUNÇÕES DE LOGIN/CADASTRO ====================
    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const messageEl = document.getElementById('loginMessage');
        
        // Validação
        if (!email || !password) {
            this.showAuthMessage(messageEl, 'Preencha todos os campos', 'error');
            return;
        }
        
        try {
            this.showAuthMessage(messageEl, 'Entrando...', 'loading');
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            this.currentUser = data.user;
            await this.createOrUpdateUserProfile();
            
            this.showAuthMessage(messageEl, '✅ Login realizado com sucesso!', 'success');
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                location.reload(); // Recarregar para atualizar conteúdo
            }, 1500);
            
        } catch (error) {
            console.error('Erro no login:', error);
            this.showAuthMessage(messageEl, this.getAuthErrorMessage(error), 'error');
        }
    }

    async register() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const messageEl = document.getElementById('registerMessage');
        
        // Validação
        if (!name || !email || !password) {
            this.showAuthMessage(messageEl, 'Preencha todos os campos', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showAuthMessage(messageEl, 'A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        
        try {
            this.showAuthMessage(messageEl, 'Criando conta...', 'loading');
            
            const { data, error } = await this.supabase.auth.signUp({
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
            
            if (data.user) {
                this.currentUser = data.user;
                await this.createOrUpdateUserProfile();
            }
            
            this.showAuthMessage(messageEl, 
                '✅ Conta criada com sucesso! ' + 
                (data.user?.identities?.length === 0 
                    ? 'Faça login para continuar.' 
                    : 'Verifique seu e-mail para confirmação.'), 
                'success');
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                if (data.session) {
                    location.reload();
                }
            }, 2000);
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showAuthMessage(messageEl, this.getAuthErrorMessage(error), 'error');
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.updateAuthUI();
            
            // Limpar dados locais
            localStorage.removeItem('studyCertUser');
            
            // Recarregar página
            setTimeout(() => {
                location.reload();
            }, 500);
            
        } catch (error) {
            console.error('Erro no logout:', error);
            alert('Erro ao sair da conta');
        }
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    showAuthMessage(element, message, type = 'info') {
        if (!element) return;
        
        element.textContent = message;
        element.style.display = 'block';
        element.className = 'message';
        
        switch(type) {
            case 'error':
                element.style.color = '#e74c3c';
                element.style.backgroundColor = '#fee';
                element.style.border = '1px solid #fcc';
                break;
            case 'success':
                element.style.color = '#27ae60';
                element.style.backgroundColor = '#efe';
                element.style.border = '1px solid #cfc';
                break;
            case 'loading':
                element.style.color = '#3498db';
                element.style.backgroundColor = '#eef';
                element.style.border = '1px solid #cce';
                break;
            default:
                element.style.color = '#666';
                element.style.backgroundColor = '#f5f5f5';
                element.style.border = '1px solid #ddd';
        }
    }

    clearAuthMessages() {
        ['loginMessage', 'registerMessage'].forEach(id => {
            const msg = document.getElementById(id);
            if (msg) {
                msg.textContent = '';
                msg.style.display = 'none';
            }
        });
    }

    getAuthErrorMessage(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('invalid login credentials')) {
            return '❌ E-mail ou senha incorretos';
        } else if (errorMessage.includes('already registered')) {
            return '❌ Este e-mail já está cadastrado';
        } else if (errorMessage.includes('email not confirmed')) {
            return '❌ Confirme seu e-mail antes de fazer login';
        } else if (errorMessage.includes('weak password')) {
            return '❌ A senha é muito fraca';
        } else if (errorMessage.includes('rate limit')) {
            return '❌ Muitas tentativas. Tente novamente mais tarde';
        } else {
            return `❌ Erro: ${error.message}`;
        }
    }

    async forgotPassword() {
        const email = prompt('Digite seu e-mail para redefinir a senha:');
        if (email && this.isValidEmail(email)) {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) {
                alert('Erro: ' + error.message);
            } else {
                alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
                this.closeAuthModal();
            }
        } else if (email) {
            alert('E-mail inválido');
        }
    }

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    setupEventListeners() {
        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAuthModal();
            }
        });
    }
}

// Inicializar quando o DOM estiver pronto
let auth;
document.addEventListener('DOMContentLoaded', () => {
    auth = new AuthSystem();
});

// Exportar funções globais
window.auth = {
    openLogin: (e) => auth.openLogin(e),
    openRegister: (e) => auth.openRegister(e),
    closeAuthModal: () => auth.closeAuthModal(),
    login: () => auth.login(),
    register: () => auth.register(),
    logout: () => auth.logout(),
    forgotPassword: () => auth.forgotPassword()
};
