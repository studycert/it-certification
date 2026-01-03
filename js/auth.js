/**
 * Cadastro Simplificado - Funcionalidades básicas
 */

// Estado do cadastro
let cadastroState = {
    dados: {}
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('registerForm')) {
        inicializarMascaras();
        inicializarValidacoes();
    }
});

// Máscaras para telefone
function inicializarMascaras() {
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            
            if (valor.length > 11) valor = valor.substring(0, 11);
            
            if (valor.length <= 10) {
                valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
                valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
                valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
            }
            
            e.target.value = valor;
        });
    }
}

// Validações básicas
function inicializarValidacoes() {
    // Validação de nome
    const nomeInput = document.getElementById('nome');
    if (nomeInput) {
        nomeInput.addEventListener('blur', function() {
            validarCampoObrigatorio('nome', 'Digite seu nome');
        });
    }
    
    // Validação de sobrenome
    const sobrenomeInput = document.getElementById('sobrenome');
    if (sobrenomeInput) {
        sobrenomeInput.addEventListener('blur', function() {
            validarCampoObrigatorio('sobrenome', 'Digite seu sobrenome');
        });
    }
    
    // Validação de email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', validarEmail);
    }
    
    // Validação de senha
    const senhaInput = document.getElementById('senha');
    if (senhaInput) {
        senhaInput.addEventListener('input', function() {
            validarForcaSenha();
            validarSenha();
        });
    }
    
    // Validação de confirmação de senha
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener('blur', validarConfirmacaoSenha);
    }
    
    // Validação de telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('blur', validarTelefone);
    }
}

// Funções de validação
function validarCampoObrigatorio(campoId, mensagemErro) {
    const input = document.getElementById(campoId);
    const mensagem = document.getElementById('valid' + campoId.charAt(0).toUpperCase() + campoId.slice(1));
    const valor = input.value.trim();
    
    if (!valor) {
        mostrarValidacao(mensagem, mensagemErro, false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    mostrarValidacao(mensagem, '✓ Válido', true);
    input.classList.remove('invalido');
    input.classList.add('valido');
    return true;
}

function validarEmail() {
    const input = document.getElementById('email');
    const mensagem = document.getElementById('validEmail');
    const valor = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Digite seu e-mail', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    if (!emailRegex.test(valor)) {
        mostrarValidacao(mensagem, 'E-mail inválido', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    mostrarValidacao(mensagem, '✓ E-mail válido', true);
    input.classList.remove('invalido');
    input.classList.add('valido');
    return true;
}

function validarSenha() {
    const input = document.getElementById('senha');
    const mensagem = document.getElementById('validSenha');
    const valor = input.value;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Crie uma senha', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    if (valor.length < 6) {
        mostrarValidacao(mensagem, 'Mínimo 6 caracteres', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    mostrarValidacao(mensagem, '✓ Senha válida', true);
    input.classList.remove('invalido');
    input.classList.add('valido');
    return true;
}

function validarForcaSenha() {
    const input = document.getElementById('senha');
    const texto = document.getElementById('forcaTexto');
    const barra = document.getElementById('forcaBarra');
    const valor = input.value;
    
    if (!valor) {
        texto.textContent = 'Fraca';
        barra.style.width = '25%';
        barra.style.backgroundColor = '#e74c3c';
        return;
    }
    
    let score = 0;
    
    // Comprimento
    if (valor.length >= 6) score++;
    if (valor.length >= 8) score++;
    
    // Diversidade
    if (/[a-z]/.test(valor)) score++;
    if (/[A-Z]/.test(valor)) score++;
    if (/[0-9]/.test(valor)) score++;
    
    switch (score) {
        case 0:
        case 1:
            texto.textContent = 'Fraca';
            barra.style.width = '25%';
            barra.style.backgroundColor = '#e74c3c';
            break;
        case 2:
        case 3:
            texto.textContent = 'Média';
            barra.style.width = '50%';
            barra.style.backgroundColor = '#f39c12';
            break;
        case 4:
            texto.textContent = 'Forte';
            barra.style.width = '75%';
            barra.style.backgroundColor = '#27ae60';
            break;
        case 5:
            texto.textContent = 'Muito Forte';
            barra.style.width = '100%';
            barra.style.backgroundColor = '#2ecc71';
            break;
    }
}

function validarConfirmacaoSenha() {
    const senha = document.getElementById('senha').value;
    const input = document.getElementById('confirmarSenha');
    const mensagem = document.getElementById('validConfirmarSenha');
    const valor = input.value;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Confirme sua senha', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    if (senha !== valor) {
        mostrarValidacao(mensagem, 'Senhas não coincidem', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    mostrarValidacao(mensagem, '✓ Senhas iguais', true);
    input.classList.remove('invalido');
    input.classList.add('valido');
    return true;
}

function validarTelefone() {
    const input = document.getElementById('telefone');
    const mensagem = document.getElementById('validTelefone');
    const valor = input.value.replace(/\D/g, '');
    
    // Telefone é opcional
    if (!valor) {
        mensagem.innerHTML = '';
        input.classList.remove('invalido', 'valido');
        return true;
    }
    
    if (valor.length < 10 || valor.length > 11) {
        mostrarValidacao(mensagem, 'Telefone inválido', false);
        input.classList.add('invalido');
        input.classList.remove('valido');
        return false;
    }
    
    mostrarValidacao(mensagem, '✓ Telefone válido', true);
    input.classList.remove('invalido');
    input.classList.add('valido');
    return true;
}

function mostrarValidacao(elemento, mensagem, valido) {
    if (!elemento) return;
    
    const classe = valido ? 'valida' : 'invalida';
    elemento.innerHTML = `<span>${mensagem}</span>`;
    elemento.className = `msg-validacao ${classe}`;
}

// Mostrar/ocultar senha
function mostrarSenha(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Login com redes sociais
function loginComGoogle() {
    // Simulação - implemente com sua API
    mostrarMensagem('Login com Google será implementado em breve!', 'info');
}

function loginComMicrosoft() {
    // Simulação - implemente com sua API
    mostrarMensagem('Login com Microsoft será implementado em breve!', 'info');
}

// Cadastro de usuário
function cadastrarUsuario() {
    // Validar campos obrigatórios
    const camposObrigatorios = ['nome', 'sobrenome', 'email', 'senha', 'confirmarSenha'];
    let valido = true;
    
    camposObrigatorios.forEach(campo => {
        if (!validarCampoObrigatorio(campo, 'Campo obrigatório')) {
            valido = false;
        }
    });
    
    if (!validarEmail()) valido = false;
    if (!validarSenha()) valido = false;
    if (!validarConfirmacaoSenha()) valido = false;
    
    // Verificar termos
    const termos = document.getElementById('termos');
    if (!termos.checked) {
        mostrarMensagem('Você precisa aceitar os Termos de Uso para continuar.', 'error');
        valido = false;
    }
    
    if (!valido) {
        mostrarMensagem('Por favor, corrija os campos destacados em vermelho.', 'error');
        return;
    }
    
    // Coletar dados
    const dados = {
        nome: document.getElementById('nome').value.trim(),
        sobrenome: document.getElementById('sobrenome').value.trim(),
        email: document.getElementById('email').value.trim(),
        senha: document.getElementById('senha').value,
        dataNascimento: document.getElementById('dataNascimento').value,
        telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
        termos: true
    };
    
    // Simular envio
    const botao = document.querySelector('.btn-cadastrar');
    const textoOriginal = botao.innerHTML;
    
    botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';
    botao.disabled = true;
    
    // Simulação de requisição
    setTimeout(() => {
        console.log('Dados do cadastro:', dados);
        
        // Sucesso
        mostrarMensagem('Conta criada com sucesso! Redirecionando...', 'success');
        
        // Em produção, você faria:
        // 1. Enviar dados para o backend
        // 2. Redirecionar ou fazer login automático
        
        // Por enquanto, apenas mostra mensagem e volta para login
        setTimeout(() => {
            mostrarLogin();
            botao.innerHTML = textoOriginal;
            botao.disabled = false;
            
            // Limpar formulário
            document.getElementById('registerForm').reset();
            document.querySelectorAll('.msg-validacao').forEach(el => el.innerHTML = '');
            document.querySelectorAll('input').forEach(el => {
                el.classList.remove('valido', 'invalido');
            });
        }, 2000);
        
    }, 1500);
}

// Mostrar formulário de login
function mostrarLogin() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === 'login') {
            tab.classList.add('active');
        }
    });
    
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.classList.remove('active');
        if (form.id === 'loginForm') {
            form.classList.add('active');
        }
    });
}

// Mostrar mensagens
function mostrarMensagem(texto, tipo) {
    // Você pode implementar seu sistema de notificações
    // Por enquanto, uso alert simples
    if (tipo === 'error') {
        alert('❌ ' + texto);
    } else if (tipo === 'success') {
        alert('✅ ' + texto);
    } else {
        alert('ℹ️ ' + texto);
    }
}

// Adicionar ao objeto global window
window.mostrarSenha = mostrarSenha;
window.loginComGoogle = loginComGoogle;
window.loginComMicrosoft = loginComMicrosoft;
window.cadastrarUsuario = cadastrarUsuario;
window.mostrarLogin = mostrarLogin;
// js/auth.js - Sistema de autenticação global CORRIGIDO
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Configuração do Supabase
            const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
            const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';
            
            if (typeof supabase !== 'undefined') {
                this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false,
                        storage: window.localStorage,
                        storageKey: 'studycert-auth'
                    },
                    global: {
                        headers: {
                            'apikey': SUPABASE_KEY
                        }
                    }
                });
                
                // Verificar sessão atual
                await this.checkSession();
                this.isInitialized = true;
                
                console.log('✅ AuthManager inicializado com sucesso');
                
                // Disparar evento de inicialização
                window.dispatchEvent(new CustomEvent('studycert-auth-ready'));
                
            } else {
                console.warn('⚠️ Supabase não disponível, usando localStorage');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);
        }
    }

    async checkSession() {
        try {
            if (!this.supabase) return;
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.warn('⚠️ Erro ao verificar sessão:', error);
                this.loadFromLocalStorage();
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                console.log('✅ Sessão ativa:', this.currentUser.email);
                this.saveToLocalStorage();
            } else {
                console.log('⚠️ Nenhuma sessão ativa');
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro na verificação de sessão:', error);
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
            localStorage.setItem('studycert_auth', 'true');
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

    async login(email, password) {
        try {
            if (!this.supabase) await this.init();
            
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.saveToLocalStorage();
            
            // Disparar evento
            window.dispatchEvent(new CustomEvent('studycert-auth-login', {
                detail: { user: data.user }
            }));
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            if (this.supabase) {
                await this.supabase.auth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('studycert_user');
            localStorage.removeItem('studycert_auth');
            
            // Disparar evento
            window.dispatchEvent(new CustomEvent('studycert-auth-logout'));
            
            return { success: true };
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }

    getSupabase() {
        return this.supabase;
    }

    setUser(user) {
        this.currentUser = user;
        this.saveToLocalStorage();
    }

    clearUser() {
        this.currentUser = null;
        localStorage.removeItem('studycert_user');
        localStorage.removeItem('studycert_auth');
    }
}

// Criar instância global única
const authManager = new AuthManager();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    // Expor para uso global
    window.authManager = authManager;
    window.studyCertAuth = authManager;
    
    console.log('🎯 AuthManager carregado e pronto');
});

// Função para verificar se está logado (para uso em outras páginas)
function checkAuth() {
    return authManager.isAuthenticated();
}

// Exportar para uso global
window.checkAuth = checkAuth;
window.logoutGlobal = () => authManager.logout();
