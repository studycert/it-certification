// js/app.js - Versão simplificada e funcional
class StudyCertApp {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando StudyCertApp...');
        
        try {
            // 1. Aguardar configurações
            if (!window.SUPABASE_CONFIG) {
                console.error('❌ Configuração do Supabase não encontrada');
                return;
            }
            
            console.log('✅ Configuração encontrada');
            
            // 2. Inicializar Supabase
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: true,
                        storage: window.localStorage
                    }
                }
            );
            
            // 3. Verificar sessão
            await this.checkAuth();
            
            // 4. Configurar interface
            this.updateAuthUI();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ StudyCertApp inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    async checkAuth() {
        try {
            if (!this.supabase) return;
            
            const { data, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('❌ Erro ao verificar sessão:', error);
                return;
            }
            
            if (data.session) {
                this.currentUser = data.session.user;
                console.log('👤 Usuário logado:', this.currentUser.email);
            } else {
                this.currentUser = null;
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar autenticação:', error);
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        if (!authButtons) return;
        
        if (this.currentUser) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                              this.currentUser.email.split('@')[0];
            const initials = displayName.substring(0, 2).toUpperCase();
            
            authButtons.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${initials}</div>
                    <span>${displayName}</span>
                    <button class="btn btn-outline" onclick="studyCertApp.logout()">Sair</button>
                </div>
            `;
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline" onclick="studyCertApp.openLogin()">Entrar</button>
                <button class="btn btn-primary" onclick="studyCertApp.openRegister()">Cadastrar</button>
            `;
        }
    }

    // Modal de autenticação
    openLogin(e) {
        if (e) e.preventDefault();
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.add('active');
            this.showAuthTab('login');
        }
    }

    openRegister(e) {
        if (e) e.preventDefault();
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.add('active');
            this.showAuthTab('register');
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const tabElement = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
        const formElement = document.getElementById(`${tab}Form`);
        
        if (tabElement) tabElement.classList.add('active');
        if (formElement) formElement.classList.add('active');
    }

    async login() {
        try {
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;
            
            if (!email || !password) {
                this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
                return;
            }
            
            console.log('🔐 Tentando login...');
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: password
            });
            
            if (error) {
                this.showMessage('loginMessage', 'Email ou senha incorretos', 'error');
                return;
            }
            
            this.showMessage('loginMessage', '✅ Login realizado com sucesso!', 'success');
            this.currentUser = data.user;
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showMessage('loginMessage', 'Erro ao fazer login', 'error');
        }
    }

    async register() {
        try {
            const name = document.getElementById('registerName')?.value;
            const email = document.getElementById('registerEmail')?.value;
            const password = document.getElementById('registerPassword')?.value;
            
            if (!name || !email || !password) {
                this.showMessage('registerMessage', 'Preencha todos os campos', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showMessage('registerMessage', 'A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            console.log('📝 Tentando registro...');
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password: password,
                options: {
                    data: {
                        full_name: name.trim()
                    }
                }
            });
            
            if (error) {
                if (error.message.includes('User already registered')) {
                    this.showMessage('registerMessage', '✅ Este email já está cadastrado. Faça login!', 'success');
                } else {
                    this.showMessage('registerMessage', `Erro: ${error.message}`, 'error');
                }
                return;
            }
            
            this.showMessage('registerMessage', '✅ Cadastro realizado com sucesso! Verifique seu email.', 'success');
            
            // Tentar login automático
            setTimeout(async () => {
                const { data: loginData } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (loginData) {
                    this.currentUser = loginData.user;
                    this.closeAuthModal();
                    this.updateAuthUI();
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            this.showMessage('registerMessage', 'Erro ao cadastrar', 'error');
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.updateAuthUI();
            window.location.reload();
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
        }
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
        }
    }

    setupEventListeners() {
        // Modal de autenticação
        const modalAuth = document.getElementById('modalAuth');
        if (modalAuth) {
            modalAuth.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeAuthModal();
            });
        }

        // Tabs de autenticação
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.showAuthTab(tabName);
            });
        });

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAuthModal();
        });
    }
}

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    window.studyCertApp = new StudyCertApp();
    console.log('✅ StudyCertApp disponível como window.studyCertApp');
});

// Funções globais para o HTML
window.submitLogin = function() {
    if (window.studyCertApp) {
        window.studyCertApp.login();
    } else {
        alert('Sistema carregando...');
    }
};

window.submitRegister = function() {
    if (window.studyCertApp) {
        window.studyCertApp.register();
    } else {
        alert('Sistema carregando...');
    }
};

window.showSection = function(sectionId, e) {
    if (e) e.preventDefault();
    
    // Remover active de todos
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.main-content').forEach(content => content.classList.remove('active'));
    
    // Adicionar active ao clicado
    const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`) || 
                      document.querySelector(`a[onclick*="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Mostrar seção
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
