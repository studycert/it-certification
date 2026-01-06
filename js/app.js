// js/app.js - VERSÃO CORRIGIDA SEM REDIRECIONAMENTO

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
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando StudyCertApp...');
        
        try {
            // Verificar se Supabase está carregado
            if (typeof supabase === 'undefined') {
                console.error('❌ Biblioteca Supabase não carregada');
                return;
            }
            
            // Verificar configurações
            if (!window.SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
                console.error('❌ Configuração do Supabase ausente');
                return;
            }
            
            console.log('✅ Configuração encontrada');
            
            // Inicializar Supabase SEM redirecionamento
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: {
                        autoRefreshToken: false,  // Desativado para evitar problemas
                        persistSession: true,
                        detectSessionInUrl: false,  // IMPORTANTE: false para não detectar na URL
                        storage: window.localStorage
                    }
                }
            );
            
            console.log('✅ Cliente Supabase criado');
            
            // Verificar sessão
            await this.checkAuth();
            
            // Configurar interface
            this.updateAuthUI();
            this.setupEventListeners();
            
            // Setup mobile
            setupMobileMenu();
            ajustarLayoutMobile();
            window.addEventListener('resize', ajustarLayoutMobile);
            
            console.log('✅ StudyCertApp inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    async checkAuth() {
        try {
            if (!this.supabase) return;
            
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
            console.error('❌ Erro na verificação:', error);
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
                console.log('📱 Usuário carregado do localStorage');
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar localStorage:', e);
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        if (!authButtons) return;
        
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
            this.clearAuthMessages();
        }
    }

    showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
        document.getElementById(`${tab}Form`)?.classList.add('active');
        
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
            
            console.log('🔐 Tentando login...');
            
            if (!email || !password) {
                this.showMessage('loginMessage', 'Preencha todos os campos', 'error');
                return;
            }
            
            if (!this.supabase) {
                this.showMessage('loginMessage', 'Sistema não inicializado', 'error');
                return;
            }
            
            this.showMessage('loginMessage', 'Conectando...', 'info');
            
            // Login SIMPLES sem redirecionamento
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase(),
                password: password
            });
            
            if (error) {
                console.error('❌ Erro de login:', error.message);
                
                if (error.message.includes('Invalid login credentials')) {
                    this.showMessage('loginMessage', 'Email ou senha incorretos', 'error');
                } else if (error.message.includes('Email not confirmed')) {
                    // Para desenvolvimento, permitir login mesmo sem confirmar
                    this.showMessage('loginMessage', 'Email não confirmado, mas permitindo acesso...', 'info');
                    
                    // Continuar mesmo sem confirmação
                    this.currentUser = { 
                        email: email,
                        user_metadata: { full_name: email.split('@')[0] }
                    };
                    this.saveToLocalStorage();
                    this.closeAuthModal();
                    this.updateAuthUI();
                    
                } else {
                    this.showMessage('loginMessage', `Erro: ${error.message}`, 'error');
                }
                return;
            }
            
            // Sucesso
            this.showMessage('loginMessage', '✅ Login realizado!', 'success');
            this.currentUser = data.user;
            this.saveToLocalStorage();
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro inesperado:', error);
            this.showMessage('loginMessage', 'Erro inesperado', 'error');
        }
    }

    async register() {
        try {
            const name = document.getElementById('registerName')?.value.trim();
            const email = document.getElementById('registerEmail')?.value.trim();
            const password = document.getElementById('registerPassword')?.value;
            
            console.log('📝 Tentando registro...');
            
            if (!name || !email || !password) {
                this.showMessage('registerMessage', 'Preencha todos os campos', 'error');
                return;
            }
            
            if (password.length < 6) {
                this.showMessage('registerMessage', 'Senha deve ter 6+ caracteres', 'error');
                return;
            }
            
            this.showMessage('registerMessage', 'Processando...', 'info');
            
            // REGISTRO SIMPLIFICADO - SEM emailRedirectTo
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase(),
                password: password,
                options: {
                    data: {
                        full_name: name
                    }
                    // SEM emailRedirectTo para evitar redirecionamento
                }
            });
            
            if (error) {
                console.error('❌ Erro de registro:', error);
                
                if (error.message.includes('User already registered')) {
                    this.showMessage('registerMessage', '✅ Email já cadastrado. Faça login!', 'success');
                    
                    // Tentar login automático
                    setTimeout(async () => {
                        const { data: loginData } = await this.supabase.auth.signInWithPassword({
                            email: email,
                            password: password
                        });
                        
                        if (loginData?.user) {
                            this.currentUser = loginData.user;
                            this.saveToLocalStorage();
                            this.closeAuthModal();
                            this.updateAuthUI();
                            window.location.reload();
                        }
                    }, 1000);
                    
                } else {
                    this.showMessage('registerMessage', `Erro: ${error.message}`, 'error');
                }
                return;
            }
            
            // Sucesso no registro
            this.showMessage('registerMessage', '✅ Cadastro realizado! Você já pode fazer login.', 'success');
            
            // Tentar login automático (o Supabase às vezes já loga)
            setTimeout(async () => {
                try {
                    const { data: sessionData } = await this.supabase.auth.getSession();
                    if (sessionData.session) {
                        this.currentUser = sessionData.session.user;
                        this.saveToLocalStorage();
                        this.closeAuthModal();
                        this.updateAuthUI();
                        window.location.reload();
                    } else {
                        // Se não logou automaticamente, limpar campos e mostrar mensagem
                        document.getElementById('registerName').value = '';
                        document.getElementById('registerEmail').value = '';
                        document.getElementById('registerPassword').value = '';
                    }
                } catch (e) {
                    console.log('Login automático não realizado');
                }
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro inesperado no registro:', error);
            this.showMessage('registerMessage', 'Erro inesperado', 'error');
        }
    }

    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studycert_user');
            
            this.updateAuthUI();
            this.showSection('home');
            
        } catch (error) {
            console.error('❌ Erro no logout:', error);
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

    showSection(sectionId) {
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

    setupEventListeners() {
        // Modal - fechar ao clicar fora
        const modalAuth = document.getElementById('modalAuth');
        if (modalAuth) {
            modalAuth.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeAuthModal();
            });
        }
        
        // ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAuthModal();
        });
        
        // Tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.getAttribute('data-tab');
                this.showAuthTab(tabName);
            });
        });
        
        // Enter para submit
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
    }
}

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    window.studyCertApp = new StudyCertApp();
    
    // Funções globais
    window.submitLogin = () => {
        if (window.studyCertApp) window.studyCertApp.login();
    };
    
    window.submitRegister = () => {
        if (window.studyCertApp) window.studyCertApp.register();
    };
    
    window.showSection = (sectionId, e) => {
        if (e) e.preventDefault();
        if (window.studyCertApp) window.studyCertApp.showSection(sectionId);
    };
    
    window.switchAuthTab = (tab) => {
        if (window.studyCertApp) window.studyCertApp.showAuthTab(tab);
    };
});
