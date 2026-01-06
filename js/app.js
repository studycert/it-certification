// js/app.js - Sistema de autenticação completo e funcional

// Funções de layout mobile
function ajustarLayoutMobile() {
    const authButtons = document.getElementById('authButtons');
    if (window.innerWidth <= 768) {
        authButtons.style.display = 'none';
    } else if (window.innerWidth <= 992) {
        authButtons.style.display = 'flex';
    }
}

// Menu hambúrguer
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            
            const icon = this.querySelector('i');
            if (mainNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}

// App principal
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
            // 1. Verificar configurações
            if (!window.SUPABASE_CONFIG) {
                console.error('❌ Configuração do Supabase não encontrada');
                this.showError('Erro de configuração. Recarregue a página.');
                return;
            }
            
            console.log('✅ Configuração encontrada:', SUPABASE_CONFIG.url);
            
            // 2. Inicializar Supabase
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage,
                        storageKey: 'studycert-auth'
                    }
                }
            );
            
            console.log('✅ Cliente Supabase criado');
            
            // 3. Verificar sessão existente
            await this.checkAuth();
            
            // 4. Configurar interface
            this.updateAuthUI();
            this.setupEventListeners();
            
            // 5. Setup mobile
            setupMobileMenu();
            ajustarLayoutMobile();
            window.addEventListener('resize', ajustarLayoutMobile);
            
            this.isInitialized = true;
            console.log('✅ StudyCertApp inicializado com sucesso!');
            
            // Disparar evento de inicialização
            window.dispatchEvent(new CustomEvent('studycert-ready'));
            
        } catch (error) {
            console.error('❌ Erro fatal na inicialização:', error);
            this.showError('Erro ao inicializar o sistema. Recarregue a página.');
        }
    }

    async checkAuth() {
        try {
            console.log('🔍 Verificando autenticação...');
            
            if (!this.supabase) {
                console.warn('⚠️ Supabase não inicializado');
                return;
            }
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.warn('⚠️ Erro ao verificar sessão:', error.message);
                this.loadFromLocalStorage();
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Sessão ativa para:', this.currentUser.email);
                this.saveToLocalStorage();
            } else {
                console.log('ℹ️ Nenhuma sessão ativa');
                this.loadFromLocalStorage();
            }
            
        } catch (error) {
            console.error('❌ Erro na verificação de autenticação:', error);
            this.loadFromLocalStorage();
        }
    }

    saveToLocalStorage() {
        if (this.currentUser) {
            const userData = {
                id: this.currentUser.id,
                email: this.currentUser.email,
                name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0]
            };
            localStorage.setItem('studycert_user', JSON.stringify(userData));
            console.log('💾 Dados salvos no localStorage');
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
                    user_metadata: { full_name: user.name }
                };
                console.log('📱 Usuário carregado do localStorage:', user.email);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar do localStorage:', e);
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        if (!authButtons) return;
        
        console.log('🔄 Atualizando UI de autenticação...');
        
        if (this.currentUser) {
            const displayName = this.currentUser.user_metadata?.full_name || 
                              this.currentUser.email?.split('@')[0] || 'Usuário';
            const initials = displayName.substring(0, 2).toUpperCase();
            
            authButtons.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${initials}</div>
                    <span>${displayName}</span>
                    <button class="btn btn-outline" onclick="studyCertApp.logout()">Sair</button>
                </div>
            `;
            
            console.log('👤 Usuário mostrado na UI:', displayName);
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline" onclick="studyCertApp.openLogin()">Entrar</button>
                <button class="btn btn-primary" onclick="studyCertApp.openRegister()">Cadastrar</button>
            `;
            console.log('👤 Botões de login/cadastro mostrados');
        }
    }

    // Modal de autenticação
    openLogin(e) {
        if (e) e.preventDefault();
        console.log('📱 Abrindo modal de login');
        
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.add('active');
            this.showAuthTab('login');
            document.getElementById('loginEmail')?.focus();
        }
    }

    openRegister(e) {
        if (e) e.preventDefault();
        console.log('📱 Abrindo modal de registro');
        
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.add('active');
            this.showAuthTab('register');
            document.getElementById('registerName')?.focus();
        }
    }

    closeAuthModal() {
        console.log('📱 Fechando modal de autenticação');
        
        const modal = document.getElementById('modalAuth');
        if (modal) {
            modal.classList.remove('active');
            this.clearAuthMessages();
        }
    }

    showAuthTab(tab) {
        console.log('↔️ Alternando para tab:', tab);
        
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const tabElement = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
        const formElement = document.getElementById(`${tab}Form`);
        
        if (tabElement) tabElement.classList.add('active');
        if (formElement) formElement.classList.add('active');
        
        this.clearAuthMessages();
    }

    clearAuthMessages() {
        ['loginMessage', 'registerMessage'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '';
                element.style.display = 'none';
            }
        });
    }

    async login() {
        try {
            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            
            console.log('🔐 Tentando login com:', { email, senha: password ? '***' : 'vazia' });
            
            // Validação
            if (!email || !password) {
                this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
                return;
            }
            
            if (!this.supabase) {
                this.showMessage('loginMessage', 'Sistema não inicializado', 'error');
                return;
            }
            
            // Limpar mensagens anteriores
            this.showMessage('loginMessage', 'Conectando...', 'info');
            
            // Tentar login
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase(),
                password: password
            });
            
            if (error) {
                console.error('❌ Erro detalhado do Supabase:', error);
                
                if (error.message.includes('Invalid login credentials')) {
                    this.showMessage('loginMessage', '❌ Email ou senha incorretos', 'error');
                } else if (error.message.includes('Email not confirmed')) {
                    this.showMessage('loginMessage', '✅ Email não confirmado. Verifique sua caixa de entrada.', 'info');
                } else if (error.message.includes('User not found')) {
                    this.showMessage('loginMessage', '❌ Usuário não encontrado. Cadastre-se primeiro.', 'error');
                } else {
                    this.showMessage('loginMessage', `❌ Erro: ${error.message}`, 'error');
                }
                return;
            }
            
            // Sucesso!
            this.showMessage('loginMessage', '✅ Login realizado com sucesso!', 'success');
            this.currentUser = data.user;
            this.saveToLocalStorage();
            
            // Fechar modal após 1.5 segundos
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                // Limpar campos
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                // Recarregar página para atualizar estado
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro inesperado no login:', error);
            this.showMessage('loginMessage', '❌ Erro inesperado. Tente novamente.', 'error');
        }
    }

    async register() {
        try {
            const name = document.getElementById('registerName')?.value.trim();
            const email = document.getElementById('registerEmail')?.value.trim();
            const password = document.getElementById('registerPassword')?.value;
            
            console.log('📝 Tentando registro com:', { name, email, senha: password ? '***' : 'vazia' });
            
            // Validação
            if (!name || !email || !password) {
                this.showMessage('registerMessage', 'Preencha todos os campos', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showMessage('registerMessage', 'A senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            if (!this.supabase) {
                this.showMessage('registerMessage', 'Sistema não inicializado', 'error');
                return;
            }
            
            // Limpar mensagens
            this.showMessage('registerMessage', 'Processando...', 'info');
            
            // Tentar cadastro
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: {
                    data: {
                        full_name: name,
                        created_at: new Date().toISOString()
                    },
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) {
                console.error('❌ Erro detalhado do cadastro:', error);
                
                if (error.message.includes('User already registered')) {
                    this.showMessage('registerMessage', '✅ Este email já está cadastrado. Faça login!', 'success');
                    
                    // Tentar login automático
                    setTimeout(async () => {
                        const { data: loginData, error: loginError } = await this.supabase.auth.signInWithPassword({
                            email: email,
                            password: password
                        });
                        
                        if (!loginError && loginData) {
                            this.currentUser = loginData.user;
                            this.saveToLocalStorage();
                            this.closeAuthModal();
                            this.updateAuthUI();
                            window.location.reload();
                        }
                    }, 1000);
                    
                } else if (error.message.includes('Password should be at least 6 characters')) {
                    this.showMessage('registerMessage', '❌ A senha deve ter pelo menos 6 caracteres', 'error');
                } else {
                    this.showMessage('registerMessage', `❌ Erro: ${error.message}`, 'error');
                }
                return;
            }
            
            // Sucesso no cadastro
            if (data.user?.identities?.length === 0) {
                this.showMessage('registerMessage', '✅ Email já cadastrado. Faça login!', 'success');
            } else {
                this.showMessage('registerMessage', '✅ Cadastro realizado! Verifique seu email para confirmação.', 'success');
            }
            
            // Tentar login automático (às vezes o Supabase já loga automaticamente)
            setTimeout(async () => {
                try {
                    const { data: sessionData } = await this.supabase.auth.getSession();
                    if (sessionData.session) {
                        this.currentUser = sessionData.session.user;
                        this.saveToLocalStorage();
                        this.closeAuthModal();
                        this.updateAuthUI();
                        window.location.reload();
                    }
                } catch (e) {
                    console.log('Login automático não realizado, usuário precisa confirmar email');
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro inesperado no cadastro:', error);
            this.showMessage('registerMessage', '❌ Erro inesperado. Tente novamente.', 'error');
        }
    }

    async logout() {
        try {
            console.log('🚪 Fazendo logout...');
            
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studycert_user');
            
            console.log('✅ Logout realizado');
            
            // Atualizar UI
            this.updateAuthUI();
            
            // Voltar para home
            this.showSection('home');
            
            // Recarregar para garantir estado limpo
            setTimeout(() => window.location.reload(), 500);
            
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

    showError(message) {
        console.error('⚠️ Erro:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '10000';
        errorDiv.innerHTML = `❌ ${message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    showSection(sectionId) {
        // Remover active de todos
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.main-content').forEach(content => content.classList.remove('active'));
        
        // Adicionar active ao clicado
        const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        // Mostrar seção
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');
        
        // Modal de autenticação - fechar ao clicar fora
        const modalAuth = document.getElementById('modalAuth');
        if (modalAuth) {
            modalAuth.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeAuthModal();
                }
            });
        }
        
        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAuthModal();
            }
        });
        
        // Tabs de autenticação
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.showAuthTab(tabName);
            });
        });
        
        // Enter para submit nos forms
        document.getElementById('loginForm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.login();
            }
        });
        
        document.getElementById('registerForm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.register();
            }
        });
        
        // Links de navegação
        document.querySelectorAll('.nav-link, .footer-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target') || 
                               link.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (targetId) {
                    this.showSection(targetId);
                }
            });
        });
    }
}

// Inicializar app
let studyCertApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, inicializando app...');
    
    studyCertApp = new StudyCertApp();
    window.studyCertApp = studyCertApp;
    
    console.log('✅ StudyCertApp inicializado!');
    
    // Forçar atualização da UI após 1 segundo
    setTimeout(() => {
        if (studyCertApp.updateAuthUI) {
            studyCertApp.updateAuthUI();
        }
    }, 1000);
});

// Funções globais para o HTML
window.submitLogin = function() {
    console.log('📤 Login submetido via botão');
    if (window.studyCertApp && window.studyCertApp.login) {
        window.studyCertApp.login();
    } else {
        console.warn('App não carregado ainda');
        setTimeout(() => {
            if (window.studyCertApp && window.studyCertApp.login) {
                window.studyCertApp.login();
            } else {
                alert('Sistema ainda não carregou. Aguarde alguns segundos.');
            }
        }, 1000);
    }
};

window.submitRegister = function() {
    console.log('📤 Registro submetido via botão');
    if (window.studyCertApp && window.studyCertApp.register) {
        window.studyCertApp.register();
    } else {
        console.warn('App não carregado ainda');
        setTimeout(() => {
            if (window.studyCertApp && window.studyCertApp.register) {
                window.studyCertApp.register();
            } else {
                alert('Sistema ainda não carregou. Aguarde alguns segundos.');
            }
        }, 1000);
    }
};

window.showSection = function(sectionId, e) {
    if (e) e.preventDefault();
    
    if (window.studyCertApp && window.studyCertApp.showSection) {
        window.studyCertApp.showSection(sectionId);
    } else {
        // Fallback básico
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.main-content').forEach(content => content.classList.remove('active'));
        
        const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

window.switchAuthTab = function(tab) {
    if (window.studyCertApp && window.studyCertApp.showAuthTab) {
        window.studyCertApp.showAuthTab(tab);
    } else {
        // Fallback
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
        document.getElementById(`${tab}Form`)?.classList.add('active');
    }
};

// Inicialização de fallback
window.addEventListener('load', () => {
    console.log('🔄 Página completamente carregada');
    
    // Se o app não inicializou ainda, tentar novamente
    if (!window.studyCertApp) {
        console.log('🔄 Tentando inicializar novamente...');
        window.studyCertApp = new StudyCertApp();
    }
});
