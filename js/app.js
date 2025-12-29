// Adicione no seu app.js, na função de login
async function login() {
    // ... seu código existente de login ...
    
    // APÓS login bem-sucedido, adicione:
    console.log('✅ Login realizado com sucesso');
    
    // Disparar evento para verificar admin
    const event = new Event('userLoggedIn');
    window.dispatchEvent(event);
    
    // Ou se preferir, chamar diretamente
    setTimeout(() => {
        if (window.adminVerifier) {
            window.adminVerifier.init();
        }
    }, 1000);
}
async function verificarEAdicionarBotaoAdmin(user) {
    try {
        // Verificar se usuário é admin
        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (data && !error) {
            const authButtons = document.getElementById('authButtons');
            if (authButtons) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'btn btn-warning btn-sm';
                adminLink.innerHTML = '<i class="fas fa-cog"></i> Admin';
                adminLink.style.marginLeft = '10px';
                authButtons.appendChild(adminLink);
            }
        }
    } catch (error) {
        console.log('Erro ao verificar admin:', error);
    }
}

// Chamar esta função após login bem-sucedido
// Na função login(), adicione:
// if (user) verificarEAdicionarBotaoAdmin(user);

// App principal - StudyCertApp
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
            
            // Inicializar Supabase
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
                        }
                    }
                );
                
                // Testar conexão básica
                const { data, error } = await this.supabase.auth.getSession();
                if (error) {
                    console.error('❌ Erro na conexão do Supabase:', error);
                    this.showNotification('Erro de conexão com o servidor. Verifique sua internet.', 'error');
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
            
            // Carregar dados iniciais
            this.loadInitialData();
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showNotification('Erro na configuração do sistema. Por favor, recarregue a página.', 'error');
        }
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
            const displayName = this.currentUser.user_metadata?.full_name || 
                               this.currentUser.email?.split('@')[0] || 'Usuário';
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
        
        const tabElement = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
        const formElement = document.getElementById(`${tab}Form`);
        
        if (tabElement) tabElement.classList.add('active');
        if (formElement) formElement.classList.add('active');
        
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
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        
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
                
                // Limpar campos
                const loginEmail = document.getElementById('loginEmail');
                const loginPassword = document.getElementById('loginPassword');
                if (loginEmail) loginEmail.value = '';
                if (loginPassword) loginPassword.value = '';
                
                // Recarregar dados do usuário
                this.loadInitialData();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro no login:', error);
            this.showMessage('loginMessage', this.getAuthErrorMessage(error), 'error');
        }
    }

    async register() {
        const name = document.getElementById('registerName')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        
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
                    emailRedirectTo: window.location.origin
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
                        '❌ Problema de conexão. Verifique sua internet.', 
                        'error'
                    );
                } else {
                    this.showMessage('registerMessage', `❌ Erro: ${error.message}`, 'error');
                }
            } else {
                console.log('Usuário cadastrado com sucesso:', data);
                
                this.showMessage('registerMessage', '✅ Cadastro realizado! Verifique seu email para confirmação.', 'success');
                
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
                    const registerName = document.getElementById('registerName');
                    const registerEmail = document.getElementById('registerEmail');
                    const registerPassword = document.getElementById('registerPassword');
                    
                    if (registerName) registerName.value = '';
                    if (registerEmail) registerEmail.value = '';
                    if (registerPassword) registerPassword.value = '';
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
                                   this.currentUser.email?.split('@')[0] || 'Usuário',
                    nivel_experiencia: 'Iniciante',
                    data_criacao: new Date().toISOString(),
                    data_atualizacao: new Date().toISOString()
                };
                
                const { error: createError } = await this.supabase
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
    async abrirModalUpload() {
        console.log('🎯 ABRIR MODAL UPLOAD CLICADO');
        
        if (!this.currentUser) {
            alert('⚠️ Faça login primeiro para enviar simulados!');
            this.openLogin();
            return;
        }
        
        console.log('✅ Usuário logado:', this.currentUser.email);
        
        // Remover modal existente se houver
        const existingModal = document.getElementById('modalUpload');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Criar novo modal
        this.createUploadModal();
        
        // Mostrar modal
        const modal = document.getElementById('modalUpload');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
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
                        <div id="uploadMessage" class="message" style="display: none;"></div>
                        
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
                        
                        <div class="upload-area" id="dragDropArea" style="margin: 20px 0; padding: 2rem; cursor: pointer;">
                            <i class="fas fa-file-upload"></i>
                            <h4>Selecione o arquivo HTML</h4>
                            <p>Arraste ou clique para selecionar um arquivo HTML (máx. 10MB)</p>
                            <input type="file" id="fileUploadInput" accept=".html,.htm" style="display: none;">
                            <button type="button" class="btn btn-primary" onclick="document.getElementById('fileUploadInput').click()">
                                <i class="fas fa-folder-open"></i> Selecionar Arquivo
                            </button>
                            <div id="fileName" style="margin-top: 10px; padding: 8px; background: #f0f7ff; border-radius: 4px; display: none;"></div>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="termosAceitos" required>
                                Concordo com os <a href="#" onclick="alert('Termos de uso em desenvolvimento')" style="color: var(--secondary);">termos de uso</a>
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
        this.setupUploadModalEvents();
    }

    setupUploadModalEvents() {
        const modal = document.getElementById('modalUpload');
        const fileInput = document.getElementById('fileUploadInput');
        const dragDropArea = document.getElementById('dragDropArea');
        const fileNameElement = document.getElementById('fileName');
        
        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeUploadModal();
            }
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
            }
        });
        
        // Gerenciar seleção de arquivo
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelection(e.target.files[0]);
                }
            });
        }
        
        // Configurar drag and drop
        if (dragDropArea) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dragDropArea.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dragDropArea.addEventListener(eventName, () => {
                    dragDropArea.classList.add('drag-over');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dragDropArea.addEventListener(eventName, () => {
                    dragDropArea.classList.remove('drag-over');
                });
            });
            
            dragDropArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelection(files[0]);
                }
            });
        }
    }

    handleFileSelection(file) {
        const fileNameElement = document.getElementById('fileName');
        
        // Validar arquivo
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            this.showUploadMessage('❌ Por favor, selecione apenas arquivos HTML (.html ou .htm).', 'error');
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            this.showUploadMessage('❌ Arquivo muito grande. O limite é 10MB.', 'error');
            return;
        }
        
        // Mostrar informações do arquivo
        const fileSize = (file.size / 1024).toFixed(1);
        fileNameElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-code" style="color: var(--success); font-size: 1.2rem;"></i>
                <div>
                    <strong style="color: var(--dark);">${file.name}</strong><br>
                    <small style="color: #666;">Tamanho: ${fileSize} KB</small>
                </div>
            </div>
        `;
        fileNameElement.style.display = 'block';
        
        this.showUploadMessage('✅ Arquivo selecionado com sucesso!', 'success');
        
        // Armazenar arquivo no objeto app para uso posterior
        this.selectedFile = file;
    }

    async enviarSimulado() {
        console.log('🚀 Iniciando envio do simulado...');
        
        // Coletar dados do formulário
        const nome = document.getElementById('simuladoNome')?.value.trim();
        const descricao = document.getElementById('simuladoDescricao')?.value.trim();
        const categoria = document.getElementById('simuladoCategoria')?.value;
        const termosAceitos = document.getElementById('termosAceitos')?.checked;
        const btnEnviar = document.getElementById('btnEnviarSimulado');
        const file = this.selectedFile;
        
        // Validações
        if (!this.currentUser) {
            alert('❌ Faça login primeiro!');
            this.openLogin();
            return;
        }
        
        if (!nome) {
            this.showUploadMessage('❌ Digite um nome para o simulado.', 'error');
            return;
        }
        
        if (!file) {
            this.showUploadMessage('❌ Selecione um arquivo HTML.', 'error');
            return;
        }
        
        if (!termosAceitos) {
            this.showUploadMessage('❌ Aceite os termos de uso para continuar.', 'error');
            return;
        }
        
        try {
            // Desabilitar botão e mostrar loading
            btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnEnviar.disabled = true;
            
            console.log('📤 Fazendo upload do arquivo...');
            
            // Criar nome único para o arquivo
            const nomeArquivo = `simulado_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const caminho = `${this.currentUser.id}/${nomeArquivo}`;
            
            // Fazer upload para o Supabase Storage
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('simulados')
                .upload(caminho, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (uploadError) {
                console.error('❌ Erro no upload:', uploadError);
                throw new Error(`Falha no upload: ${uploadError.message}`);
            }
            
            console.log('✅ Upload bem-sucedido!', uploadData);
            
            // Obter URL pública do arquivo
            const { data: urlData } = this.supabase.storage
                .from('simulados')
                .getPublicUrl(caminho);
            
            console.log('🔗 URL pública:', urlData.publicUrl);
            
            // Preparar dados para salvar no banco
            const simuladoData = {
                nome: nome,
                descricao: descricao || '',
                categoria: categoria || 'Outros',
                arquivo_url: urlData.publicUrl,
                arquivo_nome: file.name,
                arquivo_tamanho_kb: Math.round(file.size / 1024),
                usuario_id: this.currentUser.id,
                publico: true,
                data_upload: new Date().toISOString(),
                status: 'ativo'
            };
            
            console.log('💾 Salvando no banco de dados...');
            
            // Salvar no banco de dados
            const { data: dbData, error: dbError } = await this.supabase
                .from('simulados')
                .insert([simuladoData])
                .select()
                .single();
            
            if (dbError) {
                console.error('⚠️ Erro ao salvar no banco:', dbError);
                
                // Mesmo com erro no banco, o arquivo foi enviado
                this.showUploadMessage(
                    `✅ Arquivo enviado com sucesso!<br>
                    ⚠️ Houve um erro ao salvar os dados, mas o arquivo está disponível.<br>
                    🔗 <a href="${urlData.publicUrl}" target="_blank" style="color: var(--secondary); font-weight: bold;">Clique aqui para abrir</a>`,
                    'success'
                );
                
                // Salvar localmente como backup
                this.saveToLocalStorage(simuladoData);
            } else {
                // Sucesso completo
                console.log('✅ Simulado salvo no banco:', dbData);
                
                this.showUploadMessage(
                    `🎉 Simulado publicado com sucesso!<br>
                    ✅ O arquivo já está disponível para todos.<br>
                    🔗 <a href="${urlData.publicUrl}" target="_blank" style="color: var(--secondary); font-weight: bold;">Abrir simulado</a>`,
                    'success'
                );
            }
            
            // Limpar formulário
            document.getElementById('simuladoNome').value = '';
            document.getElementById('simuladoDescricao').value = '';
            document.getElementById('fileName').innerHTML = '';
            document.getElementById('fileName').style.display = 'none';
            document.getElementById('termosAceitos').checked = false;
            this.selectedFile = null;
            
            // Atualizar botão
            btnEnviar.innerHTML = '<i class="fas fa-check"></i> Enviado!';
            
            // Fechar modal automaticamente após 5 segundos
            setTimeout(() => {
                this.closeUploadModal();
                
                // Recarregar lista de simulados
                this.loadSimulados();
                
                // Mostrar notificação
                this.showNotification('Simulado publicado com sucesso!', 'success');
            }, 5000);
            
        } catch (error) {
            console.error('❌ Erro no envio:', error);
            
            let mensagem = `❌ Erro ao enviar: ${error.message}`;
            
            if (error.message.includes('JWT')) {
                mensagem = '❌ Sessão expirada! Faça login novamente.';
                this.logout();
            } else if (error.message.includes('permission') || error.message.includes('403')) {
                mensagem = '❌ Sem permissão para enviar arquivos.';
            } else if (error.message.includes('bucket') || error.message.includes('storage')) {
                mensagem = '❌ Problema no servidor de arquivos.';
            } else if (error.message.includes('fetch') || error.message.includes('network')) {
                mensagem = '❌ Problema de conexão. Verifique sua internet.';
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
                id: `local_${Date.now()}`,
                data_salvamento: new Date().toISOString()
            });
            localStorage.setItem('studyCert_simulados', JSON.stringify(simulados));
            console.log('✅ Backup local salvo');
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
            
            // Rolagem automática para a mensagem
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    closeUploadModal() {
        const modal = document.getElementById('modalUpload');
        if (modal) {
            modal.classList.remove('active');
            modal.remove(); // Remover completamente do DOM
        }
        document.body.style.overflow = 'auto';
        
        // Limpar arquivo selecionado
        this.selectedFile = null;
    }

    // ==================== CARREGAR SIMULADOS ====================
    async loadSimulados() {
        try {
            console.log('📥 Carregando simulados...');
            
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
                    .eq('status', 'ativo')
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
                const localData = localStorage.getItem('studyCert_simulados');
                if (localData) {
                    simuladosLocal = JSON.parse(localData);
                    console.log(`📱 ${simuladosLocal.length} simulados carregados localmente`);
                }
            } catch (e) {
                console.warn('⚠️ Erro ao carregar simulados locais:', e);
            }
            
            // Combinar e remover duplicatas
            const allSimulados = [...simuladosDB, ...simuladosLocal];
            const uniqueSimulados = this.removeDuplicates(allSimulados);
            
            // Renderizar na interface
            this.renderSimulados(uniqueSimulados);
            
        } catch (err) {
            console.error('❌ Erro ao carregar simulados:', err);
        }
    }
    
    removeDuplicates(simulados) {
        const seen = new Set();
        return simulados.filter(simulado => {
            const key = simulado.arquivo_url || simulado.nome;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    renderSimulados(simulados) {
        const container = document.getElementById('simuladosContent');
        if (!container) return;
        
        // Remover apenas cards dinâmicos anteriores
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
                        ${simulado.data_upload ? `<p><small>Enviado: ${new Date(simulado.data_upload).toLocaleDateString('pt-BR')}</small></p>` : ''}
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

    // ==================== CARREGAR DADOS INICIAIS ====================
    async loadInitialData() {
        // Carregar simulados do banco
        await this.loadSimulados();
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
        
        // Menu hambúrguer
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = document.getElementById('mainNav');
        
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    if (mainNav.classList.contains('active')) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
            
            // Fechar menu ao clicar em um link
            mainNav.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' && window.innerWidth <= 992) {
                    mainNav.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            });
            
            // Fechar menu ao redimensionar para desktop
            window.addEventListener('resize', () => {
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
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    createNewPost() {
        if (!this.currentUser) {
            alert('Por favor, faça login para criar posts.');
            this.openLogin();
            return;
        }
        this.showNotification('Funcionalidade de criação de posts em desenvolvimento.', 'info');
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

    showNotification(message, type = 'info') {
        // Remover notificações existentes
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
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
    window.app = app; // Tornar global
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

// Upload
window.abrirModalUpload = () => app.abrirModalUpload();

// Outras funções
window.createNewPost = () => app.createNewPost();
window.forgotPassword = () => app.forgotPassword();

// Ajustar layout mobile
function ajustarLayoutMobile() {
    const authButtons = document.getElementById('authButtons');
    if (window.innerWidth <= 768) {
        // Em telas muito pequenas, esconder nome do usuário
        const userSpans = document.querySelectorAll('.user-info span');
        userSpans.forEach(span => span.style.display = 'none');
    }
}

window.addEventListener('load', ajustarLayoutMobile);
window.addEventListener('resize', ajustarLayoutMobile);
