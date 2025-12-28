// Função para ajustar botões no mobile
function ajustarLayoutMobile() {
    const authButtons = document.getElementById('authButtons');
    if (window.innerWidth <= 768) {
        authButtons.style.display = 'none';
    } else if (window.innerWidth <= 992) {
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
                this.supabase = supabase.createClient(
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
            
            // Carregar dados iniciais
            this.loadInitialData();
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showGlobalError('Erro na configuração do sistema. Por favor, recarregue a página.');
        }
    }

    // ==================== CARREGAR DADOS INICIAIS ====================
    async loadInitialData() {
        // Carregar simulados do banco
        await this.loadSimulados();
    }

    // ==================== NAVEGAÇÃO ====================
    loadNavigation() {
        const navLinks = document.querySelectorAll('.nav-link, .footer-links a[data-target], .btn[data-target]');
        
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
                
                // Garantir que o perfil existe
                await this.ensureUserProfile();
                
                // Carregar progresso do usuário
                await this.loadUserProgress();
            } else {
                this.currentUser = null;
            }
            
            this.updateAuthUI();
            
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

    // Função para garantir perfil do usuário
    async ensureUserProfile() {
        if (!this.currentUser) return;
        
        try {
            // Verificar se o perfil já existe
            const { data: existingProfile, error: checkError } = await this.supabase
                .from('usuario_perfil')
                .select('id')
                .eq('id', this.currentUser.id)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                console.warn('⚠️ Erro ao verificar perfil:', checkError);
            }
            
            // Se não existe, criar
            if (!existingProfile) {
                const userData = {
                    id: this.currentUser.id,
                    nome_completo: this.currentUser.user_metadata?.full_name || 
                                   this.currentUser.email.split('@')[0] || 'Usuário',
                    nivel_experiencia: 'Iniciante',
                    data_criacao: new Date().toISOString(),
                    data_atualizacao: new Date().toISOString()
                };
                
                const { data: newProfile, error: createError } = await this.supabase
                    .from('usuario_perfil')
                    .insert([userData]);
                
                if (createError) {
                    console.warn('⚠️ Não foi possível criar perfil:', createError);
                } else {
                    console.log('✅ Perfil criado com sucesso');
                }
            }
        } catch (err) {
            console.warn('⚠️ Erro ao garantir perfil:', err);
        }
    }

    // Carregar progresso do usuário
    async loadUserProgress() {
        if (!this.currentUser) return;
        
        try {
            const { data: progresso, error } = await this.supabase
                .from('usuario_progresso')
                .select('*')
                .eq('usuario_id', this.currentUser.id);
            
            if (error) {
                console.warn('⚠️ Erro ao carregar progresso:', error);
                return;
            }
            
            this.showUserProgress(progresso);
            
        } catch (err) {
            console.warn('⚠️ Erro:', err);
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
            
            // Garantir perfil
            await this.ensureUserProfile();
            
            setTimeout(() => {
                this.closeAuthModal();
                this.updateAuthUI();
                this.loadUserProgress();
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                
                // Recarregar dados do usuário
                this.loadInitialData();
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
            
            const { data, error } = await this.supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password: password,
                options: {
                    data: {
                        full_name: name.trim(),
                        created_at: new Date().toISOString()
                    },
                    emailRedirectTo: 'https://studycert.github.io/it-certification/'
                }
            });
            
            if (error) {
                console.error('Erro detalhado do Supabase:', error);
                
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
                
                // Tentar fazer login automaticamente
                setTimeout(async () => {
                    const { data: loginData, error: loginError } = await this.supabase.auth.signInWithPassword({
                        email: email.toLowerCase().trim(),
                        password: password
                    });
                    
                    if (!loginError) {
                        this.currentUser = loginData.user;
                        this.closeAuthModal();
                        this.updateAuthUI();
                        await this.ensureUserProfile();
                        this.loadInitialData();
                    }
                }, 2000);
                
                // Limpar formulário
                setTimeout(() => {
                    document.getElementById('registerName').value = '';
                    document.getElementById('registerEmail').value = '';
                    document.getElementById('registerPassword').value = '';
                }, 3000);
            }
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            this.showMessage('registerMessage', `❌ Erro: ${error.message}`, 'error');
        }
    }

    getAuthErrorMessage(error) {
        if (error.message.includes('Invalid login credentials')) {
            return '❌ Email ou senha incorretos';
        } else if (error.message.includes('User already registered')) {
            return '❌ Este email já está cadastrado';
        } else if (error.message.includes('Email not confirmed')) {
            return '✅ Email não confirmado, mas permitindo acesso...';
        } else if (error.message.includes('Invalid API key')) {
            return '❌ Problema de configuração do sistema';
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

    showUserProgress(progressoData) {
        if (!this.currentUser) return;
        
        const progressElement = document.getElementById('userProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressElement && progressFill && progressText) {
            progressElement.style.display = 'block';
            
            // Calcular progresso médio
            let progressoTotal = 0;
            if (progressoData && progressoData.length > 0) {
                progressoData.forEach(p => {
                    progressoTotal += p.progresso_percentual || 0;
                });
                const progressoMedio = Math.round(progressoTotal / progressoData.length);
                progressFill.style.width = `${progressoMedio}%`;
                progressText.textContent = `Você completou ${progressoMedio}% da sua jornada de certificação`;
            } else {
                progressFill.style.width = `0%`;
                progressText.textContent = 'Comece sua jornada de certificação!';
            }
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
        
        const modal = document.getElementById('modalUpload');
        modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeUploadModal();
            }
        });
        
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
        
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadArea = document.querySelector('#modalUpload .upload-area');
        if (!uploadArea) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });
        
        uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                const file = files[0];
                
                if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
                    this.showUploadMessage('❌ Por favor, arraste apenas arquivos HTML.', 'error');
                    return;
                }
                
                if (file.size > 10 * 1024 * 1024) {
                    this.showUploadMessage('❌ Arquivo muito grande. O limite é 10MB.', 'error');
                    return;
                }
                
                const fileInput = document.getElementById('fileUploadInput');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
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
                
                this.showUploadMessage('✅ Arquivo carregado com sucesso!', 'success');
            }
        }, false);
        
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
        const simuladoNome = document.getElementById('simuladoNome');
        if (simuladoNome) {
            simuladoNome.value = '';
            document.getElementById('simuladoDescricao').value = '';
            document.getElementById('simuladoCategoria').value = 'ITIL';
            document.getElementById('fileName').textContent = '';
            document.getElementById('termosAceitos').checked = false;
            
            // Resetar botão
            const btnEnviar = document.getElementById('btnEnviarSimulado');
            if (btnEnviar) {
                btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Simulado';
                btnEnviar.disabled = false;
            }
            
            // Limpar mensagem
            const uploadMessage = document.getElementById('uploadMessage');
            if (uploadMessage) {
                uploadMessage.innerHTML = '';
                uploadMessage.style.display = 'none';
            }
        }
    }

    async enviarSimulado() {
        console.log('🚀 Enviando simulado...');
        
        const nome = document.getElementById('simuladoNome').value.trim();
        const descricao = document.getElementById('simuladoDescricao').value.trim();
        const categoria = document.getElementById('simuladoCategoria').value;
        const fileInput = document.getElementById('fileUploadInput');
        const file = fileInput.files[0];
        const btnEnviar = document.getElementById('btnEnviarSimulado');
        
        // Validações
        if (!this.currentUser) {
            alert('❌ Faça login primeiro!');
            this.openLogin();
            return;
        }
        
        if (!nome || !file) {
            alert('❌ Preencha o nome e selecione um arquivo!');
            return;
        }
        
        if (!document.getElementById('termosAceitos').checked) {
            alert('❌ Aceite os termos de uso!');
            return;
        }
        
        try {
            btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnEnviar.disabled = true;
            
            // Upload
            const nomeArquivo = `simulado_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const caminho = `${this.currentUser.id}/${nomeArquivo}`;
            
            console.log('📤 Fazendo upload para:', caminho);
            
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('simulados')
                .upload(caminho, file);
            
            if (uploadError) {
                console.error('❌ Erro no upload:', uploadError);
                throw new Error(`Falha no upload: ${uploadError.message}`);
            }
            
            console.log('✅ Upload bem-sucedido!', uploadData);
            
            // Obter URL
            const { data: urlData } = this.supabase.storage
                .from('simulados')
                .getPublicUrl(caminho);
            
            console.log('🔗 URL:', urlData.publicUrl);
            
            // Salvar no banco
            const simuladoData = {
                nome: nome,
                descricao: descricao,
                categoria: categoria,
                arquivo_url: urlData.publicUrl,
                arquivo_nome: file.name,
                arquivo_tamanho_kb: Math.round(file.size / 1024),
                usuario_id: this.currentUser.id,
                publico: true,
                data_upload: new Date().toISOString()
            };
            
            console.log('💾 Salvando no banco...');
            
            const { data: dbData, error: dbError } = await this.supabase
                .from('simulados')
                .insert([simuladoData])
                .select()
                .single();
            
            if (dbError) {
                console.error('⚠️ Erro no banco:', dbError);
                
                // Ainda mostra sucesso, mas com aviso
                this.showUploadMessage(
                    `✅ Arquivo enviado com sucesso!<br>
                    ⚠️ Houve um erro ao salvar os dados, mas o arquivo está disponível.<br>
                    🔗 <a href="${urlData.publicUrl}" target="_blank">Clique aqui para abrir</a>`,
                    'success'
                );
                
                // Salvar localmente
                this.saveToLocalStorage(simuladoData);
            } else {
                // Sucesso completo
                this.showUploadMessage(
                    `🎉 Simulado publicado com sucesso!<br>
                    ✅ O arquivo já está disponível para todos.<br>
                    🔗 <a href="${urlData.publicUrl}" target="_blank">Abrir simulado</a>`,
                    'success'
                );
            }
            
            // Limpar formulário (mas manter mensagem visível)
            document.getElementById('simuladoNome').value = '';
            document.getElementById('simuladoDescricao').value = '';
            document.getElementById('fileUploadInput').value = '';
            document.getElementById('fileName').textContent = '';
            document.getElementById('termosAceitos').checked = false;
            
            // Desabilitar botão enviar (já foi enviado)
            btnEnviar.disabled = true;
            btnEnviar.innerHTML = '<i class="fas fa-check"></i> Enviado!';
            
            // Fechar modal automaticamente após 5 segundos
            setTimeout(() => {
                this.closeUploadModal();
                this.loadSimulados(); // Atualizar lista
            }, 5000);
            
        } catch (error) {
            console.error('❌ Erro:', error);
            
            let mensagem = `❌ Erro ao enviar: ${error.message}`;
            
            if (error.message.includes('JWT')) {
                mensagem = '❌ Sessão expirada! Faça login novamente.';
                this.logout();
            } else if (error.message.includes('permission')) {
                mensagem = '❌ Sem permissão para enviar arquivos.';
            } else if (error.message.includes('bucket')) {
                mensagem = '❌ Problema no servidor de arquivos.';
            }
            
            this.showUploadMessage(mensagem, 'error');
            
            // Restaurar botão
            btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Simulado';
            btnEnviar.disabled = false;
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
            console.log('✅ Backup local salvo');
        } catch (err) {
            console.error('❌ Erro no localStorage:', err);
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

    // ==================== CARREGAR SIMULADOS ====================
    async loadSimulados() {
        try {
            console.log('📥 Carregando simulados do banco...');
            
            // Carregar simulados do banco
            let simuladosDB = [];
            try {
                const { data, error } = await this.supabase
                    .from('simulados')
                    .select(`
                        *,
                        usuario_perfil:nome_completo
                    `)
                    .eq('publico', true)
                    .order('data_upload', { ascending: false })
                    .limit(20);
                
                if (error) {
                    console.error('❌ Erro ao carregar simulados do banco:', error);
                } else {
                    simuladosDB = data || [];
                    console.log(`✅ ${simuladosDB.length} simulados carregados do banco`);
                }
            } catch (dbErr) {
                console.error('❌ Erro na consulta de simulados:', dbErr);
            }
            
            // Carregar simulados locais
            let simuladosLocal = [];
            try {
                simuladosLocal = JSON.parse(localStorage.getItem('studyCert_simulados') || '[]');
                console.log(`📱 ${simuladosLocal.length} simulados carregados localmente`);
            } catch (e) {
                console.warn('⚠️ Erro ao carregar simulados locais:', e);
            }
            
            // Combinar
            const allSimulados = [...simuladosDB, ...simuladosLocal];
            
            // Renderizar na interface
            this.renderSimulados(allSimulados);
            
        } catch (err) {
            console.error('❌ Erro ao carregar simulados:', err);
        }
    }
    
    renderSimulados(simulados) {
        const container = document.getElementById('simuladosContent');
        if (!container) return;
        
        // Manter os cards estáticos originais
        const staticCards = Array.from(container.querySelectorAll('.simulado-card:not(.dynamic)'));
        
        // Limpar cards dinâmicos anteriores
        const dynamicCards = container.querySelectorAll('.simulado-card.dynamic');
        dynamicCards.forEach(card => card.remove());
        
        // Adicionar cards dinâmicos
        simulados.forEach((simulado, index) => {
            const cardHTML = `
                <div class="simulado-card dynamic">
                    <div class="card-header">
                        <h3><i class="fas fa-file-alt"></i> ${this.escapeHtml(simulado.nome)}</h3>
                    </div>
                    <div class="card-body">
                        <span class="simulado-badge">${this.escapeHtml(simulado.categoria || 'Geral')}</span>
                        <p>${this.escapeHtml(simulado.descricao || 'Simulado compartilhado pela comunidade')}</p>
                        ${simulado.usuario_perfil ? `<p><small>Por: ${this.escapeHtml(simulado.usuario_perfil.nome_completo || 'Usuário')}</small></p>` : ''}
                        ${simulado.arquivo_tamanho_kb ? `<p><small>Tamanho: ${simulado.arquivo_tamanho_kb} KB</small></p>` : ''}
                    </div>
                    <div class="card-footer">
                        ${simulado.arquivo_url ? 
                            `<a href="${simulado.arquivo_url}" target="_blank" class="btn btn-primary">Abrir Simulado</a>` :
                            `<button class="btn btn-primary" onclick="alert('Simulado local - função em desenvolvimento')">Abrir Local</button>`
                        }
                    </div>
                </div>
            `;
            
            // Inserir antes do último card (botão de upload)
            const lastCard = container.querySelector('.simulado-card:last-child');
            if (lastCard) {
                lastCard.insertAdjacentHTML('beforebegin', cardHTML);
            }
        });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        
        this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        }).then(({ error }) => {
            if (error) {
                alert('Erro ao enviar email de recuperação: ' + error.message);
            } else {
                alert('Instruções de redefinição enviadas para ' + email);
            }
        });
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
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Inicializar app quando o DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyCertApp();
});

// ==================== FUNÇÕES GLOBAIS ====================
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

// 🔧 CORREÇÃO DO BOTÃO DE UPLOAD
setTimeout(() => {
    // Corrigir botão "Upload" no card "Adicionar Simulado"
    const botoes = document.querySelectorAll('.btn-primary');
    botoes.forEach(botao => {
        if (botao.textContent.trim() === 'Upload' && 
            botao.getAttribute('onclick') === 'uploadSimulado()') {
            botao.setAttribute('onclick', 'openUploadModal()');
        }
    });
}, 1000);

// Variável global para a instância do app
window.StudyCertApp = app;
