// App principal
class StudyCertApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('StudyCert - Inicializando aplicação');
        this.setupEventListeners();
        this.showUserProgress();
    }

    setupEventListeners() {
        // Menu hambúrguer
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = document.getElementById('mainNav');
        
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                const icon = menuToggle.querySelector('i');
                if (mainNav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }
        
        // Fechar menu ao clicar fora (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && mainNav && menuToggle) {
                if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
                    mainNav.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        });
        
        // Navegação
        const navLinks = document.querySelectorAll('.nav-link, .footer-links a[data-target]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                this.showSection(targetId);
            });
        });
        
        // Botão "Começar Agora"
        const startNowBtn = document.getElementById('startNowBtn');
        if (startNowBtn) {
            startNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const cadastroBtn = document.getElementById('cadastroBtn');
                if (cadastroBtn) cadastroBtn.click();
            });
        }
        
        // Modal de autenticação
        const loginBtn = document.getElementById('loginBtn');
        const cadastroBtn = document.getElementById('cadastroBtn');
        const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
        const modalAuth = document.getElementById('modalAuth');
        
        if (loginBtn) loginBtn.addEventListener('click', () => this.openAuthModal('login'));
        if (cadastroBtn) cadastroBtn.addEventListener('click', () => this.openAuthModal('register'));
        if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', () => this.closeAuthModal());
        
        // Fechar modal ao clicar fora
        if (modalAuth) {
            modalAuth.addEventListener('click', (e) => {
                if (e.target === modalAuth) this.closeAuthModal();
            });
        }
        
        // Tabs do modal
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.showAuthTab(tabName);
            });
        });
        
        // Formulários
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }
        
        // Botão "Esqueci a senha"
        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.forgotPassword();
            });
        }
        
        // Modal de simulados
        const verSimuladosBtn = document.getElementById('verSimuladosBtn');
        const fecharModalBtn = document.getElementById('fecharModalBtn');
        const modalSimulados = document.getElementById('modalSimulados');
        
        if (verSimuladosBtn) {
            verSimuladosBtn.addEventListener('click', () => this.abrirModalSimulados());
        }
        
        if (fecharModalBtn) {
            fecharModalBtn.addEventListener('click', () => this.fecharModalSimulados());
        }
        
        if (modalSimulados) {
            modalSimulados.addEventListener('click', (e) => {
                if (e.target === modalSimulados) this.fecharModalSimulados();
            });
        }
        
        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAuthModal();
                this.fecharModalSimulados();
            }
        });
    }
    
    showSection(sectionId) {
        // Remover active de todos
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        document.querySelectorAll('.main-content').forEach(content => content.classList.remove('active'));
        
        // Adicionar active ao clicado
        const activeLink = document.querySelector(`.nav-link[data-target="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        // Mostrar seção correspondente
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Fechar menu no mobile
        if (window.innerWidth <= 992) {
            const mainNav = document.getElementById('mainNav');
            const menuToggle = document.getElementById('menuToggle');
            if (mainNav) mainNav.classList.remove('active');
            if (menuToggle) {
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        }
    }
    
    openAuthModal(tab = 'login') {
        const modalAuth = document.getElementById('modalAuth');
        if (modalAuth) {
            modalAuth.classList.add('active');
            this.showAuthTab(tab);
        }
    }
    
    closeAuthModal() {
        const modalAuth = document.getElementById('modalAuth');
        if (modalAuth) {
            modalAuth.classList.remove('active');
        }
    }
    
    showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const activeTab = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
        const activeForm = document.getElementById(`${tab}Form`);
        
        if (activeTab) activeTab.classList.add('active');
        if (activeForm) activeForm.classList.add('active');
    }
    
    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showMessage('loginMessage', 'Por favor, preencha todos os campos', 'error');
            return;
        }
        
        // Simulação de login
        this.showMessage('loginMessage', '✅ Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
            this.closeAuthModal();
            this.showUserProgress();
        }, 1500);
    }
    
    register() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!name || !email || !password) {
            this.showMessage('registerMessage', 'Por favor, preencha todos os campos', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('registerMessage', 'A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }
        
        // Simulação de cadastro
        this.showMessage('registerMessage', '✅ Cadastro realizado com sucesso!', 'success');
        
        setTimeout(() => {
            this.showAuthTab('login');
        }, 2000);
    }
    
    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
        }
    }
    
    showUserProgress() {
        const progressElement = document.getElementById('userProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressElement && progressFill && progressText) {
            progressElement.style.display = 'block';
            setTimeout(() => {
                progressFill.style.width = '65%';
                progressText.textContent = 'Você completou 65% da sua jornada de certificação';
            }, 500);
        }
    }
    
    abrirModalSimulados() {
        const modal = document.getElementById('modalSimulados');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    fecharModalSimulados() {
        const modal = document.getElementById('modalSimulados');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    forgotPassword() {
        const email = prompt('Digite seu email para redefinir a senha:');
        if (email) {
            alert(`Instruções de redefinição enviadas para ${email}`);
        }
    }
}

// Inicializar app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyCertApp();
});

// Funções globais
window.abrirModalSimulados = () => app.abrirModalSimulados();
window.fecharModalSimulados = () => app.fecharModalSimulados();
