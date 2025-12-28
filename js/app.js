// Função para ajustar botões no mobile
function ajustarLayoutMobile() {
    const authButtons = document.getElementById('authButtons');
    const menuToggle = document.getElementById('menuToggle');
    
    if (window.innerWidth <= 768) {
        // No mobile muito pequeno, move os botões para o menu hambúrguer
        authButtons.style.display = 'none';
    } else if (window.innerWidth <= 992) {
        // No tablet, mantém os botões visíveis
        authButtons.style.display = 'flex';
    }
}

// Executa ao carregar e redimensionar
window.addEventListener('load', ajustarLayoutMobile);
window.addEventListener('resize', ajustarLayoutMobile);

// Menu hambúrguer
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (menuToggle && mainNav) {
        console.log('Menu encontrado, configurando...');
        
        menuToggle.addEventListener('click', function() {
            console.log('Botão clicado!');
            mainNav.classList.toggle('active');
            
            // Muda o ícone
            const icon = this.querySelector('i');
            if (mainNav.classList.contains('active')) {
                console.log('Abrindo menu');
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                console.log('Fechando menu');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Fechar menu ao clicar em link (mobile)
        mainNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && window.innerWidth <= 992) {
                mainNav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Ajustar ao redimensionar
        window.addEventListener('resize', function() {
            if (window.innerWidth > 992) {
                mainNav.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    } else {
        console.error('Elementos não encontrados!');
    }
});

// App principal - StudyCert
class StudyCertApp {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.config = {
            storageBucket: 'simulados'
        };
        this.init();
    }

    async init() {
        console.log('StudyCert - Inicializando aplicação');
        
        try {
            // Testar conexão com Supabase
            console.log('Testando conexão com Supabase...');
            console.log('URL:', SUPABASE_CONFIG.url);
            console.log('Chave:', SUPABASE_CONFIG.anonKey ? 'Presente' : 'Faltando');
            
            // Inicializar Supabase com configurações aprimoradas
            if (typeof supabase !== 'undefined' && SUPABASE_CONFIG) {
                this.supabase = window.supabase.createClient(
                    SUPABASE_CONFIG.url,
                    SUPABASE_CONFIG.anonKey,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: true,
                            storage: window.localStorage,
                            storageKey: 'studycert-auth'
                        },
                        global: {
                            headers: {
                                'apikey': SUPABASE_CONFIG.anonKey
                            }
                        }
                    }
                );
                
                // Testar conexão básica
                const { data, error } = await this.supabase.auth.getSession();
                if (error) {
                    console.error('❌ Erro na conexão do Supabase:', error);
                    if (error.message.includes('fetch')) {
                        this.showGlobalError('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
                    }
                } else {
                    console.log('✅ Supabase conectado com sucesso!');
                }
            } else {
                throw new Error('Configuração do Supabase não encontrada');
            }
            
            // Carregar navegação
            this.loadNavigation();
            
            // Verificar autenticação
            await this.checkAuth();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Inicializar sistema de upload
            this.initUploadSystem();
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showGlobalError('Erro na configuração do sistema. Por favor, recarregue a página.');
        }
    }

    // ==================== NAVEGAÇÃO ====================
    loadNavigation() {
        const navLinks = document.querySelectorAll('.nav-link, .footer-links a[data-target], .btn[data-target]');
        const mainContents = document.querySelectorAll('.main-content');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                this.showSection(targetId);
            });
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
    }

    // ==================== AUTENTICAÇÃO ====================
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
            
            this.updateAuthUI();
            if (this.currentUser) this.showUserProgress();
            
        } catch (err) {
            console.error('❌ Erro ao verificar autenticação:', err);
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const uploadArea = document.getElementById('uploadArea');
        
        if (this.currentUser) {
            const displayName = this.currentUser.user_metadata?.full_name || this.currentUser.email;
            const initials = displayName.substring(0, 2).toUpperCase();
            
            authButtons.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${initials}</div>
                    <span>${displayName}</span>
                    <button class="btn btn-outline" onclick="app.logout()" style="margin-left: 10px;">Sair</button>
                </div>
            `;
            
            if (uploadArea) uploadArea.style.display = 'block';
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline" onclick="app.openLogin()">Entrar</button>
                <button class="btn btn-primary" onclick="app.openRegister()">Cadastrar</button>
            `;
            
            if (uploadArea) uploadArea.style.display = 'none';
        }
    }

    // Modal de Autenticação
    openLogin(e) {
        if (e) e.preventDefault();
        document.getElementById('modalAuth').classList.add('active');
        this.showAuthTab('login');
    }

    openRegister(e) {
        if (e) e.preventDefault();
        document.getElementById('modalAuth').classList.add('active');
        this.showAuthTab('register');
    }

    closeAuthModal() {
        document.getElementById('modalAuth').classList.remove('active');
        this.clearAuthMessages();
    }

    showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
        this.clearAuthMessages();
    }

    clearAuthMessages() {
        const loginMsg = document.getElementById('loginMessage');
        const registerMsg = document.getElementById('registerMessage');
        
        if (loginMsg) {
            loginMsg.innerHTML = '';
            loginMsg.style.display = 'none';
        }
        if (registerMsg) {
            registerMsg.innerHTML = '';
            registerMsg.style.display = 'none';
        }
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showMessage('loginMessage', 'Por favor, preencha todos os campos', 'error');
            return;
        }
        
        try {
            console.log('Tentando login para:', email);
            
            const { data, error } = await this.supabase.auth.signInWithPassword({ 
                email: email.toLowerCase().trim(), 
                password: password 
            });
            
            if (error) {
                console.error('❌ Erro detalhado no login:', error);
                throw error;
            }
            
            this.showMessage('loginMessage', '✅ Login realizado com sucesso!', 'success');
            this.currentUser = data.user;
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                this.showUserProgress();
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showMessage('loginMessage', this.getAuthErrorMessage(error), 'error');
        }
    }

    async register() {
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
        
        try {
            console.log('Tentando cadastrar usuário:', { email, name });
            
            // Testar conexão primeiro
            try {
                const { error: testError } = await this.supabase.auth.getSession();
                if (testError && testError.message.includes('fetch')) {
                    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
                }
            } catch (testErr) {
                console.warn('⚠️ Teste de conexão falhou:', testErr);
                // Continuar mesmo com erro no teste
            }
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password: password,
                options: {
                    data: {
                        full_name: name.trim(),
                        created_at: new Date().toISOString()
                    },
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) {
                console.error('Erro detalhado do Supabase:', {
                    message: error.message,
                    status: error.status,
                    name: error.name
                });
                
                if (error.message.includes('User already registered')) {
                    this.showMessage('registerMessage', '❌ Este email já está cadastrado. Tente fazer login.', 'error');
                } else if (error.message.includes('rate limit')) {
                    this.showMessage('registerMessage', '❌ Muitas tentativas. Aguarde alguns minutos.', 'error');
                } else if (error.message.includes('fetch')) {
                    this.showMessage('registerMessage', 
                        '❌ Problema de conexão:<br>' +
                        '1. Verifique sua internet<br>' +
                        '2. A URL do Supabase está correta?<br>' +
                        '3. A chave anon está correta?', 
                        'error'
                    );
                } else if (error.message.includes('JWT')) {
                    this.showMessage('registerMessage', '❌ Chave de API inválida. Contate o suporte.', 'error');
                } else if (error.message.includes('invalid')) {
                    this.showMessage('registerMessage', '❌ Email inválido ou já registrado.', 'error');
                } else {
                    this.showMessage('registerMessage', `❌ Erro: ${error.message}`, 'error');
                }
            } else {
                console.log('Usuário cadastrado com sucesso:', data);
                
                if (data.user?.identities?.length === 0) {
                    this.showMessage('registerMessage', '✅ Este email já possui uma conta. Faça login.', 'success');
                } else {
                    this.showMessage('registerMessage', '✅ Cadastro realizado! Verifique seu email para confirmação.', 'success');
                }
                
                // Tentar criar perfil do usuário (opcional)
                if (data.user) {
                    try {
                        const { error: profileError } = await this.supabase
                            .from('usuario_perfil')
                            .upsert({
                                id: data.user.id,
                                nome_completo: name.trim(),
                                nivel_experiencia: 'Iniciante',
                                data_criacao: new Date().toISOString(),
                                data_atualizacao: new Date().toISOString()
                            });
                        
                        if (profileError) {
                            console.warn('⚠️ Perfil não criado (tabela pode não existir):', profileError);
                        } else {
                            console.log('✅ Perfil do usuário criado');
                        }
                    } catch (profileErr) {
                        console.warn('⚠️ Erro ao criar perfil:', profileErr);
                    }
                }
                
                // Limpar formulário após sucesso
                setTimeout(() => {
                    document.getElementById('registerName').value = '';
                    document.getElementById('registerEmail').value = '';
                    document.getElementById('registerPassword').value = '';
                    
                    // Se o email precisa de confirmação, mostrar mensagem especial
                    if (data.user && !data.user.email_confirmed_at) {
                        this.showAuthTab('login');
                        this.showMessage('loginMessage', 
                            '📧 Confirmação de email enviada!<br>Verifique sua caixa de entrada antes de fazer login.', 
                            'success'
                        );
                    } else {
                        this.showAuthTab('login');
                    }
                }, 3000);
            }
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                this.showMessage('registerMessage', 
                    '❌ Falha na conexão:<br>' +
                    '• Verifique sua conexão com a internet<br>' +
                    '• O servidor pode estar temporariamente indisponível<br>' +
                    '• Tente novamente em alguns minutos', 
                    'error'
                );
            } else {
                this.showMessage('registerMessage', `❌ Erro: ${error.message}`, 'error');
            }
        }
    }

    getAuthErrorMessage(error) {
        if (error.message.includes('Invalid login credentials')) {
            return '❌ Email ou senha incorretos';
        } else if (error.message.includes('User already registered')) {
            return '❌ Este email já está cadastrado';
        } else if (error.message.includes('Email not confirmed')) {
            return '❌ Confirme seu email antes de fazer login';
        } else if (error.message.includes('Invalid API key')) {
            return '❌ Problema de configuração do sistema';
        } else if (error.message.includes('For security purposes')) {
            return '❌ Muitas tentativas. Tente novamente mais tarde.';
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
            return '❌ Problema de conexão. Verifique sua internet.';
        } else {
            return `❌ Erro: ${error.message}`;
        }
    }

    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
            
            // Auto-remover mensagem de erro após 10 segundos
            if (type === 'error') {
                setTimeout(() => {
                    element.style.display = 'none';
                }, 10000);
            }
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.updateAuthUI();
            
            const userProgress = document.getElementById('userProgress');
            if (userProgress) userProgress.style.display = 'none';
            
            // Volta para a página inicial
            this.showSection('home');
            
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
        }
    }

    showUserProgress() {
        if (!this.currentUser) return;
        
        const progressElement = document.getElementById('userProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressElement && progressFill && progressText) {
            progressElement.style.display = 'block';
            const progress = 45; // 45%
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Você completou ${progress}% da sua jornada de certificação`;
        }
    }

    // ==================== SIMULADOS ====================
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

    // ==================== UPLOAD SYSTEM ====================
    initUploadSystem() {
        console.log('📤 Sistema de upload inicializado');
        
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file.type !== 'text/html' && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
                        alert('Por favor, selecione apenas arquivos HTML.');
                        return;
                    }
                    console.log('Arquivo para upload:', file);
                    e.target.value = '';
                }
            });
        }
    }

    uploadSimulado() {
        if (!this.currentUser) {
            alert('Por favor, faça login para fazer upload de simulados.');
            this.openLogin();
            return;
        }
        
        document.getElementById('fileUpload').click();
    }

    // Modal de Upload
    openUploadModal() {
        if (!this.currentUser) {
            alert('Por favor, faça login para fazer upload de simulados.');
            this.openLogin();
            return;
        }
        
        if (!document.getElementById('modalUpload')) {
            this.createUploadModal();
        }
        
        document.getElementById('modalUpload').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    createUploadModal() {
        const modalHTML = `
            <div id="modalUpload" class="modal-upload">
                <div class="modal-container" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-cloud-upload-alt"></i> Enviar Simulado</h3>
                        <button class="fechar-modal" onclick="app.closeUploadModal()">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div id="uploadMessage" class="message"></div>
                        
                        <div class="form-group">
                            <label for="simuladoNome">Nome do Simulado *</label>
                            <input type="text" id="simuladoNome" placeholder="Ex: ITIL 4 Foundation - Simulado 1" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="simuladoDescricao">Descrição</label>
                            <textarea id="simuladoDescricao" rows="3" placeholder="Descreva seu simulado..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="simuladoCategoria">Categoria</label>
                            <select id="simuladoCategoria">
                                <option value="ITIL">ITIL</option>
                                <option value="Linux">Linux (LPIC)</option>
                                <option value="AWS">AWS</option>
                                <option value="Azure">Azure</option>
                                <option value="Security">Security+</option>
                                <option value="CCNA">CCNA</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        
                        <div class="upload-area" style="margin: 20px 0; padding: 2rem;">
                            <i class="fas fa-file-upload"></i>
                            <h4>Selecione o arquivo HTML</h4>
                            <p>Arraste ou clique para selecionar um arquivo HTML</p>
                            <input type="file" id="fileUploadInput" accept=".html,.htm" style="display: none;">
                            <button class="btn btn-primary" onclick="document.getElementById('fileUploadInput').click()">
                                <i class="fas fa-folder-open"></i> Selecionar Arquivo
                            </button>
                            <p id="fileName" style="margin-top: 10px; color: var(--gray);"></p>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <label>
                                <input type="checkbox" id="termosAceitos" required>
                                Concordo com os <a href="#" onclick="alert('Termos de uso em desenvolvimento')">termos de uso</a>
                            </label>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="app.closeUploadModal()">Cancelar</button>
                        <button class="btn btn-success" onclick="app.enviarSimulado()" id="btnEnviarSimulado">
                            <i class="fas fa-paper-plane"></i> Enviar Simulado
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar eventos do modal
        const modal = document.getElementById('modalUpload');
        modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeUploadModal();
            }
        });
        
        // Evento do input de arquivo
        const fileInput = document.getElementById('fileUploadInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const fileNameElement = document.getElementById('fileName');
                    if (fileNameElement) {
                        fileNameElement.textContent = `Arquivo selecionado: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                        fileNameElement.style.color = 'var(--success)';
                    }
                }
            });
        }
        
        // Evento de arrastar e soltar
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadArea = document.querySelector('#modalUpload .upload-area');
        if (!uploadArea) return;
        
        // Prevenir comportamentos padrão
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // Highlight quando arrasta sobre
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });
        
        // Remove highlight
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });
        
        // Handle drop
        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const file = files[0];
                
                // Validar arquivo
                if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
                    this.showUploadMessage('❌ Por favor, arraste apenas arquivos HTML (extensão .html ou .htm).', 'error');
                    return;
                }
                
                if (file.size > 10 * 1024 * 1024) { // 10MB limite
                    this.showUploadMessage('❌ Arquivo muito grande. O limite é 10MB.', 'error');
                    return;
                }
                
                // Configurar input de arquivo
                const fileInput = document.getElementById('fileUploadInput');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Atualizar interface com feedback visual
                const fileNameElement = document.getElementById('fileName');
                if (fileNameElement) {
                    const fileSize = (file.size / 1024).toFixed(1);
                    fileNameElement.innerHTML = `
                        <div style="text-align: left;">
                            <strong style="color: var(--success);">✓ Arquivo válido</strong><br>
                            <span style="font-size: 0.9em; color: var(--dark);">${file.name}</span><br>
                            <span style="font-size: 0.8em; color: #666;">Tamanho: ${fileSize} KB</span>
                        </div>
                    `;
                }
                
                // Mostrar mensagem de sucesso
                this.showUploadMessage('✅ Arquivo carregado com sucesso!', 'success');
            }
        }, false);
        
        // Adicionar efeito de clique na área de upload
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.classList.contains('upload-area')) {
                document.getElementById('fileUploadInput').click();
            }
        });
    }

    closeUploadModal() {
        const modal = document.getElementById('modalUpload');
        if (modal) {
            modal.classList.remove('active');
        }
        document.body.style.overflow = 'auto';
        
        // Limpar formulário
        if (document.getElementById('simuladoNome')) {
            document.getElementById('simuladoNome').value = '';
            document.getElementById('simuladoDescricao').value = '';
            document.getElementById('simuladoCategoria').value = 'ITIL';
            document.getElementById('fileName').textContent = '';
            document.getElementById('termosAceitos').checked = false;
            document.getElementById('uploadMessage').style.display = 'none';
        }
    }

    async enviarSimulado() {
        const nome = document.getElementById('simuladoNome').value.trim();
        const descricao = document.getElementById('simuladoDescricao').value.trim();
        const categoria = document.getElementById('simuladoCategoria').value;
        const fileInput = document.getElementById('fileUploadInput');
        const file = fileInput.files[0];
        
        const uploadMessage = document.getElementById('uploadMessage');
        const btnEnviar = document.getElementById('btnEnviarSimulado');
        
        // Validação
        if (!nome) {
            this.showUploadMessage('❌ Por favor, insira um nome para o simulado.', 'error');
            return;
        }
        
        if (!file) {
            this.showUploadMessage('❌ Por favor, selecione um arquivo HTML.', 'error');
            return;
        }
        
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            this.showUploadMessage('❌ Por favor, selecione apenas arquivos HTML (.html ou .htm).', 'error');
            return;
        }
        
        if (!document.getElementById('termosAceitos').checked) {
            this.showUploadMessage('❌ Você precisa aceitar os termos de uso.', 'error');
            return;
        }
        
        try {
            // Mostrar loading
            btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnEnviar.disabled = true;
            
            // Salvar no localStorage como fallback
            const simuladoData = {
                nome: nome,
                descricao: descricao,
                arquivo_nome: file.name,
                arquivo_tamanho: Math.round(file.size / 1024),
                usuario_id: this.currentUser.id,
                usuario_nome: this.currentUser.user_metadata?.full_name || this.currentUser.email,
                categoria: categoria,
                data_upload: new Date().toISOString(),
                local: true
            };
            
            this.saveToLocalStorage(simuladoData);
            
            this.showUploadMessage('✅ Simulado salvo localmente com sucesso!', 'success');
            
            setTimeout(() => {
                this.closeUploadModal();
                alert('Simulado enviado com sucesso! (Salvo localmente)');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erro ao enviar simulado:', error);
            this.showUploadMessage(`❌ Erro ao enviar simulado: ${error.message}`, 'error');
        } finally {
            // Restaurar botão
            if (btnEnviar) {
                btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Simulado';
                btnEnviar.disabled = false;
            }
        }
    }

    saveToLocalStorage(simuladoData) {
        try {
            let simulados = JSON.parse(localStorage.getItem('studyCert_simulados') || '[]');
            simulados.push({
                ...simuladoData,
                id: `local_${Date.now()}`
            });
            localStorage.setItem('studyCert_simulados', JSON.stringify(simulados));
            console.log('✅ Simulado salvo localmente:', simuladoData.nome);
        } catch (err) {
            console.error('❌ Erro ao salvar no localStorage:', err);
        }
    }

    showUploadMessage(message, type) {
        const element = document.getElementById('uploadMessage');
        if (element) {
            element.innerHTML = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
        }
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Modal de autenticação
        const modalAuth = document.getElementById('modalAuth');
        if (modalAuth) {
            modalAuth.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.closeAuthModal();
            });
        }

        // Modal de simulados
        const modalSimulados = document.getElementById('modalSimulados');
        if (modalSimulados) {
            modalSimulados.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.fecharModalSimulados();
            });
        }

        // Tabs de autenticação
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.showAuthTab(tabName);
            });
        });

        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAuthModal();
                this.closeUploadModal();
                this.fecharModalSimulados();
            }
        });
        
        // Input de email - auto lowercase
        const loginEmail = document.getElementById('loginEmail');
        const registerEmail = document.getElementById('registerEmail');
        
        if (loginEmail) {
            loginEmail.addEventListener('blur', () => {
                loginEmail.value = loginEmail.value.toLowerCase();
            });
        }
        
        if (registerEmail) {
            registerEmail.addEventListener('blur', () => {
                registerEmail.value = registerEmail.value.toLowerCase();
            });
        }
        
        // Enter para submit nos forms
        document.getElementById('loginForm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login();
            }
        });
        
        document.getElementById('registerForm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.register();
            }
        });
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    createNewPost() {
        if (!this.currentUser) {
            alert('Por favor, faça login para criar posts.');
            this.openLogin();
            return;
        }
        alert('Funcionalidade de criação de posts em desenvolvimento.');
    }

    forgotPassword() {
        const email = prompt('Digite seu email para redefinir a senha:');
        if (!email) return;
        
        // Implementação básica
        alert(`Instruções de redefinição de senha enviadas para ${email} (funcionalidade em desenvolvimento)`);
    }

    showGlobalError(message) {
        console.error('Erro global:', message);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '10000';
        errorDiv.innerHTML = `❌ ${message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Inicializar app quando o DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyCertApp();
});

// ==================== FUNÇÕES GLOBAIS ====================
// Estas funções são acessíveis via onclick no HTML

// Autenticação
window.openLogin = (e) => app.openLogin(e);
window.openRegister = (e) => app.openRegister(e);
window.closeAuthModal = () => app.closeAuthModal();
window.login = () => app.login();
window.register = () => app.register();
window.logout = () => app.logout();

// Simulados
window.abrirModalSimulados = () => app.abrirModalSimulados();
window.fecharModalSimulados = () => app.fecharModalSimulados();
window.uploadSimulado = () => app.uploadSimulado();
window.openUploadModal = () => app.openUploadModal();

// Outras funções
window.createNewPost = () => app.createNewPost();
window.forgotPassword = () => app.forgotPassword();

// Variável global para a instância do app (para debugging)
window.StudyCertApp = app;
