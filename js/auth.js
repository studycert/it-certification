/**
 * Cadastro.js - Funcionalidades do formulário de cadastro completo
 */

// Estado do cadastro
let cadastroState = {
    passoAtual: 1,
    totalPassos: 3,
    dados: {}
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Apenas se estiver no modal de cadastro
    if (document.getElementById('registerForm')) {
        inicializarMascaras();
        inicializarValidacoes();
        atualizarIndicadoresPasso();
        atualizarBarraProgresso();
    }
});

// Máscaras para CPF e telefone
function inicializarMascaras() {
    // Máscara para CPF
    const cpfInput = document.getElementById('registerCpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, '');
            if (valor.length > 11) valor = valor.substring(0, 11);
            
            if (valor.length <= 11) {
                valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
                valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
                valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            
            e.target.value = valor;
        });
    }
    
    // Máscara para telefones
    const phoneInputs = ['registerPhone', 'registerWhatsApp'];
    phoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function(e) {
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
    });
}

// Validações em tempo real
function inicializarValidacoes() {
    // Validação de nome
    const nomeInput = document.getElementById('registerName');
    if (nomeInput) {
        nomeInput.addEventListener('blur', validarNome);
    }
    
    // Validação de email
    const emailInput = document.getElementById('registerEmail');
    if (emailInput) {
        emailInput.addEventListener('blur', validarEmailCadastro);
    }
    
    // Validação de senha
    const senhaInput = document.getElementById('registerPassword');
    if (senhaInput) {
        senhaInput.addEventListener('input', validarForcaSenha);
        senhaInput.addEventListener('blur', validarSenhaCadastro);
    }
    
    // Validação de confirmação de senha
    const confirmSenhaInput = document.getElementById('registerConfirmPassword');
    if (confirmSenhaInput) {
        confirmSenhaInput.addEventListener('blur', validarConfirmacaoSenha);
    }
    
    // Validação de CPF
    const cpfInput = document.getElementById('registerCpf');
    if (cpfInput) {
        cpfInput.addEventListener('blur', validarCPF);
    }
    
    // Validação de telefone
    const phoneInput = document.getElementById('registerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', validarTelefone);
    }
    
    // Validação de data de nascimento
    const birthInput = document.getElementById('registerBirth');
    if (birthInput) {
        birthInput.addEventListener('blur', validarDataNascimento);
    }
}

// Funções de validação
function validarNome() {
    const input = document.getElementById('registerName');
    const mensagem = document.getElementById('validName');
    const valor = input.value.trim();
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Por favor, insira seu nome completo.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    if (valor.split(' ').length < 2) {
        mostrarValidacao(mensagem, 'Digite nome e sobrenome.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    mostrarValidacao(mensagem, 'Nome válido!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarEmailCadastro() {
    const input = document.getElementById('registerEmail');
    const mensagem = document.getElementById('validEmail');
    const valor = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Por favor, insira seu e-mail.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    if (!emailRegex.test(valor)) {
        mostrarValidacao(mensagem, 'Por favor, insira um e-mail válido.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    mostrarValidacao(mensagem, 'E-mail válido!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarSenhaCadastro() {
    const input = document.getElementById('registerPassword');
    const mensagem = document.getElementById('validPassword');
    const valor = input.value;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Por favor, insira uma senha.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    if (valor.length < 8) {
        mostrarValidacao(mensagem, 'A senha deve ter pelo menos 8 caracteres.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    const hasUpperCase = /[A-Z]/.test(valor);
    const hasLowerCase = /[a-z]/.test(valor);
    const hasNumbers = /\d/.test(valor);
    const hasSpecial = /[^A-Za-z0-9]/.test(valor);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecial) {
        mostrarValidacao(mensagem, 'Use maiúsculas, minúsculas, números e símbolos.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    mostrarValidacao(mensagem, 'Senha forte!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarConfirmacaoSenha() {
    const senha = document.getElementById('registerPassword').value;
    const input = document.getElementById('registerConfirmPassword');
    const mensagem = document.getElementById('validConfirmPassword');
    const valor = input.value;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Por favor, confirme sua senha.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    if (senha !== valor) {
        mostrarValidacao(mensagem, 'As senhas não coincidem.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    mostrarValidacao(mensagem, 'Senhas coincidem!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarCPF() {
    const input = document.getElementById('registerCpf');
    const mensagem = document.getElementById('validCpf');
    const valor = input.value.replace(/\D/g, '');
    
    // CPF não é obrigatório, apenas valida se preenchido
    if (!valor) {
        mensagem.innerHTML = '';
        input.classList.remove('campo-invalido');
        return true;
    }
    
    if (valor.length !== 11) {
        mostrarValidacao(mensagem, 'CPF deve ter 11 dígitos.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    // Validação simples de CPF
    mostrarValidacao(mensagem, 'CPF válido!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarTelefone() {
    const input = document.getElementById('registerPhone');
    const mensagem = document.getElementById('validPhone');
    const valor = input.value.replace(/\D/g, '');
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Por favor, insira um telefone.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    if (valor.length < 10 || valor.length > 11) {
        mostrarValidacao(mensagem, 'Telefone inválido.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    mostrarValidacao(mensagem, 'Telefone válido!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarDataNascimento() {
    const input = document.getElementById('registerBirth');
    const mensagem = document.getElementById('validBirth');
    const valor = input.value;
    
    if (!valor) {
        mostrarValidacao(mensagem, 'Por favor, insira sua data de nascimento.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    const dataNascimento = new Date(valor);
    const hoje = new Date();
    const idade = hoje.getFullYear() - dataNascimento.getFullYear();
    
    if (idade < 16) {
        mostrarValidacao(mensagem, 'Você deve ter pelo menos 16 anos.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    if (idade > 120) {
        mostrarValidacao(mensagem, 'Data de nascimento inválida.', false);
        input.classList.add('campo-invalido');
        return false;
    }
    
    mostrarValidacao(mensagem, 'Data válida!', true);
    input.classList.remove('campo-invalido');
    return true;
}

function validarForcaSenha() {
    const input = document.getElementById('registerPassword');
    const texto = document.getElementById('passwordStrengthText');
    const barra = document.getElementById('passwordStrengthBar');
    const valor = input.value;
    
    if (!valor) {
        texto.textContent = 'Fraca';
        barra.style.width = '25%';
        barra.style.backgroundColor = '#e74c3c';
        return;
    }
    
    let score = 0;
    
    // Comprimento
    if (valor.length >= 8) score++;
    if (valor.length >= 12) score++;
    
    // Diversidade
    if (/[a-z]/.test(valor)) score++;
    if (/[A-Z]/.test(valor)) score++;
    if (/[0-9]/.test(valor)) score++;
    if (/[^A-Za-z0-9]/.test(valor)) score++;
    
    switch (score) {
        case 0:
        case 1:
        case 2:
            texto.textContent = 'Fraca';
            barra.style.width = '25%';
            barra.style.backgroundColor = '#e74c3c';
            break;
        case 3:
        case 4:
            texto.textContent = 'Média';
            barra.style.width = '50%';
            barra.style.backgroundColor = '#f39c12';
            break;
        case 5:
            texto.textContent = 'Forte';
            barra.style.width = '75%';
            barra.style.backgroundColor = '#27ae60';
            break;
        case 6:
            texto.textContent = 'Muito Forte';
            barra.style.width = '100%';
            barra.style.backgroundColor = '#2ecc71';
            break;
    }
}

function mostrarValidacao(elemento, mensagem, valido) {
    if (!elemento) return;
    
    const icon = valido ? '✓' : '✗';
    const classe = valido ? 'valido' : 'invalido';
    
    elemento.innerHTML = `<span>${icon} ${mensagem}</span>`;
    elemento.className = `mensagem-validacao ${classe}`;
}

// Navegação entre passos
function avancarCadastro() {
    if (!validarPassoAtual()) return;
    
    if (cadastroState.passoAtual < cadastroState.totalPassos) {
        salvarDadosPassoAtual();
        cadastroState.passoAtual++;
        mostrarPassoCadastro(cadastroState.passoAtual);
        atualizarIndicadoresPasso();
        atualizarBarraProgresso();
    }
}

function voltarCadastro() {
    if (cadastroState.passoAtual > 1) {
        cadastroState.passoAtual--;
        mostrarPassoCadastro(cadastroState.passoAtual);
        atualizarIndicadoresPasso();
        atualizarBarraProgresso();
    }
}

function validarPassoAtual() {
    switch (cadastroState.passoAtual) {
        case 1:
            return validarPasso1();
        case 2:
            return validarPasso2();
        case 3:
            return validarPasso3();
        default:
            return false;
    }
}

function validarPasso1() {
    return validarNome() && validarEmailCadastro() && validarTelefone() && validarDataNascimento();
}

function validarPasso2() {
    return validarSenhaCadastro() && validarConfirmacaoSenha();
}

function validarPasso3() {
    const termosCheckbox = document.getElementById('registerTerms');
    if (!termosCheckbox.checked) {
        mostrarNotificacao('Você deve aceitar os Termos de Uso e Política de Privacidade.', 'error');
        return false;
    }
    return true;
}

function mostrarPassoCadastro(numeroPasso) {
    // Oculta todos os passos
    document.querySelectorAll('.cadastro-conteudo').forEach(conteudo => {
        conteudo.classList.remove('ativo');
    });
    
    // Mostra o passo atual
    const passo = document.getElementById(`cadastroPasso${numeroPasso}`);
    if (passo) {
        passo.classList.add('ativo');
    }
}

function atualizarIndicadoresPasso() {
    const indicadores = document.querySelectorAll('.passo-indicador');
    
    indicadores.forEach((indicador, index) => {
        const passo = index + 1;
        
        indicador.classList.remove('ativo', 'completo');
        
        if (passo < cadastroState.passoAtual) {
            indicador.classList.add('completo');
        } else if (passo === cadastroState.passoAtual) {
            indicador.classList.add('ativo');
        }
    });
}

function atualizarBarraProgresso() {
    const texto = document.getElementById('progressText');
    const barra = document.getElementById('progressBar');
    
    if (texto) {
        texto.textContent = `Passo ${cadastroState.passoAtual} de ${cadastroState.totalPassos}`;
    }
    
    if (barra) {
        const porcentagem = (cadastroState.passoAtual / cadastroState.totalPassos) * 100;
        barra.style.width = `${porcentagem}%`;
    }
}

function salvarDadosPassoAtual() {
    const passo = cadastroState.passoAtual;
    const conteudo = document.getElementById(`cadastroPasso${passo}`);
    
    if (!conteudo) return;
    
    const dados = {};
    const inputs = conteudo.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            dados[input.id] = input.checked;
        } else if (input.type === 'radio') {
            if (input.checked) {
                dados[input.name] = input.value;
            }
        } else if (input.type === 'select-multiple') {
            // Para selects múltiplos
            dados[input.id] = Array.from(input.selectedOptions).map(option => option.value);
        } else {
            dados[input.id] = input.value;
        }
    });
    
    cadastroState.dados[`passo${passo}`] = dados;
    console.log('Dados salvos do passo', passo, ':', dados);
}

// Toggle de visibilidade da senha
function togglePassword(inputId) {
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
function loginWithGoogle() {
    mostrarNotificacao('Redirecionando para login com Google...', 'info');
    // Aqui você integraria com a API do Google OAuth
    // Por enquanto, simulamos um delay
    setTimeout(() => {
        mostrarNotificacao('Login com Google será implementado em breve!', 'info');
    }, 1000);
}

function loginWithMicrosoft() {
    mostrarNotificacao('Redirecionando para login com Microsoft...', 'info');
    // Aqui você integraria com a API da Microsoft
    // Por enquanto, simulamos um delay
    setTimeout(() => {
        mostrarNotificacao('Login com Microsoft será implementado em breve!', 'info');
    }, 1000);
}

// Finalizar cadastro
function finalizarCadastro() {
    if (!validarPassoAtual()) return;
    
    salvarDadosPassoAtual();
    
    // Simulação de envio
    const botaoFinalizar = document.querySelector('.btn-passo.finalizar');
    const textoOriginal = botaoFinalizar.innerHTML;
    
    botaoFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    botaoFinalizar.disabled = true;
    
    // Simulação de requisição ao backend
    setTimeout(() => {
        // Aqui você enviaria os dados para seu backend
        console.log('Dados completos do cadastro:', cadastroState.dados);
        
        // Simulação de sucesso
        mostrarModalSucesso();
        
        botaoFinalizar.innerHTML = textoOriginal;
        botaoFinalizar.disabled = false;
    }, 2000);
}

// Modal de sucesso
function mostrarModalSucesso() {
    const modal = document.getElementById('modalSucesso');
    if (modal) {
        modal.classList.add('ativo');
    }
}

function fecharModalSucesso() {
    const modal = document.getElementById('modalSucesso');
    if (modal) {
        modal.classList.remove('ativo');
    }
    
    // Volta para o login
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
    
    // Reseta o cadastro
    cadastroState = {
        passoAtual: 1,
        totalPassos: 3,
        dados: {}
    };
    
    // Reseta os campos do formulário
    document.getElementById('registerForm').reset();
    mostrarPassoCadastro(1);
    atualizarIndicadoresPasso();
    atualizarBarraProgresso();
}

// Função auxiliar para notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Você pode implementar seu sistema de notificações aqui
    alert(mensagem);
}

// Exportar funções para uso global
window.togglePassword = togglePassword;
window.avancarCadastro = avancarCadastro;
window.voltarCadastro = voltarCadastro;
window.loginWithGoogle = loginWithGoogle;
window.loginWithMicrosoft = loginWithMicrosoft;
window.finalizarCadastro = finalizarCadastro;
window.fecharModalSucesso = fecharModalSucesso;

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
