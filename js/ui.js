// js/ui.js - Funções de interface do modal de login

let currentAuthTab = 'login';

function openAuthModal(tab = 'login') {
    const modal = document.getElementById('modalAuth');
    if (!modal) return;
    
    currentAuthTab = tab;
    
    // Mostrar modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Definir tab ativa
    setAuthTab(tab);
    
    // Limpar mensagens
    clearAuthMessages();
    
    // Focar no primeiro campo
    setTimeout(() => {
        if (tab === 'login') {
            document.getElementById('loginEmail')?.focus();
        } else {
            document.getElementById('registerName')?.focus();
        }
    }, 100);
}

function closeAuthModal() {
    const modal = document.getElementById('modalAuth');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Limpar campos
    clearAuthFields();
    clearAuthMessages();
}

function setAuthTab(tab) {
    currentAuthTab = tab;
    
    // Atualizar tabs
    document.querySelectorAll('.auth-tab').forEach(tabElement => {
        tabElement.classList.remove('active');
    });
    document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
    
    // Atualizar forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (tab === 'reset') {
        document.getElementById('resetPasswordForm')?.classList.add('active');
    } else {
        document.getElementById(tab + 'Form')?.classList.add('active');
    }
}

function showPasswordReset() {
    setAuthTab('reset');
}

function clearAuthMessages() {
    const messages = ['loginMessage', 'registerMessage', 'resetMessage'];
    messages.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            element.textContent = '';
        }
    });
}

function clearAuthFields() {
    // Limpar campos do login
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    // Limpar campos do cadastro
    const registerName = document.getElementById('registerName');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    if (registerName) registerName.value = '';
    if (registerEmail) registerEmail.value = '';
    if (registerPassword) registerPassword.value = '';
    
    // Limpar campo de reset
    const resetEmail = document.getElementById('resetEmail');
    if (resetEmail) resetEmail.value = '';
}

// Fechar modal ao pressionar ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAuthModal();
    }
});

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('modalAuth');
    const authContainer = document.querySelector('.auth-container');
    
    if (modal && modal.style.display === 'flex' && 
        authContainer && !authContainer.contains(event.target)) {
        closeAuthModal();
    }
});

// Permitir submit com Enter
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (currentAuthTab === 'login') {
            login();
        } else if (currentAuthTab === 'register') {
            register();
        } else if (currentAuthTab === 'reset') {
            resetPassword();
        }
    }
});

// Exportar funções para uso global
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.setAuthTab = setAuthTab;
window.showPasswordReset = showPasswordReset;
