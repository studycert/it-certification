// app.js - StudyCert Application
class StudyCertApp {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        console.log('🚀 StudyCert - Inicializando aplicação...');
        
        try {
            // Inicializar Supabase
            this.supabase = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            
            console.log('✅ Supabase configurado');
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Verificar autenticação
            await this.checkAuth();
            
            // Carregar navegação
            this.setupNavigation();
            
            // Carregar conteúdo inicial
            await this.loadInitialData();
            
            console.log('🎉 Aplicação inicializada com sucesso!');
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
            this.showGlobalError('Erro na configuração do sistema.');
        }
    }

    // ==================== AUTENTICAÇÃO ====================
    async checkAuth() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Erro na sessão:', error);
                return;
            }
            
            if (session?.user) {
                this.currentUser = session.user;
                console.log('👤 Usuário logado:', this.currentUser.email);
                
                // Carregar perfil do usuário
                await this.loadUserProfile();
            } else {
                this.currentUser = null;
                this.userProfile = null;
            }
            
            this.updateAuthUI();
            
        } catch (err) {
            console.error('❌ Erro ao verificar autenticação:', err);
            this.updateAuthUI();
        }
    }

    async loadUserProfile() {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();
            
            if (error) {
                console.log('Criando novo perfil para usuário...');
                // Criar perfil se não existir
                const { data: newProfile, error: createError } = await this.supabase
                    .from('usuarios')
                    .insert({
                        id: this.currentUser.id,
                        email: this.currentUser.email,
                        nome: this.currentUser.user_metadata?.full_name || 
                              this.currentUser.email.split('@')[0]
                    })
                    .select()
                    .single();
                
                if (createError) throw createError;
                
                this.userProfile = newProfile;
            } else {
                this.userProfile = data;
            }
            
            console.log('📋 Perfil carregado:', this.userProfile.nome);
            
            // Mostrar progresso do usuário
            await this.showUserProgress();
            
        } catch (err) {
            console.error('❌ Erro ao carregar perfil:', err);
            this.userProfile = null;
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const uploadArea = document.getElementById('uploadArea');
        
        if (this.currentUser) {
            const displayName = this.userProfile?.nome || 
                              this.currentUser.user_metadata?.full_name || 
                              this.currentUser.email.split('@')[0];
            
            const initials = displayName.substring(0, 2).toUpperCase();
            
            authButtons.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar" onclick="app.showUserMenu()">
                        ${initials}
                    </div>
                    <span>${displayName}</span>
                    <button class="btn btn-outline" onclick="app.logout()" style="margin-left: 10px;">
                        Sair
                    </button>
                </div>
            `;
            
            if (uploadArea) uploadArea.style.display = 'block';
            
        } else {
            authButtons.innerHTML = `
                <button class="btn btn-outline" id="loginBtn">Entrar</button>
                <button class="btn btn-primary" id="registerBtn">Cadastrar</button>
            `;
            
            if (uploadArea) uploadArea.style.display = 'none';
            
            // Reatribuir eventos aos botões
            setTimeout(() => {
                const loginBtn = document.getElementById('loginBtn');
                const registerBtn = document.getElementById('registerBtn');
                
                if (loginBtn) loginBtn.addEventListener('click', () => this.openLogin());
                if (registerBtn) registerBtn.addEventListener('click', () => this.openRegister());
            }, 100);
        }
    }

    showUserMenu() {
        if (!this.currentUser) return;
        
        const menuHTML = `
            <div class="user-menu">
                <div class="user-menu-header">
                    <strong>${this.userProfile?.nome || 'Usuário'}</strong>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${this.currentUser.email}</div>
                </div>
                <div class="user-menu-items">
                    <a href="#" onclick="app.showUserProfile()">
                        <i class="fas fa-user"></i>
                        Meu Perfil
                    </a>
                    <a href="#" onclick="app.showMyProgress()">
                        <i class="fas fa-chart-line"></i>
                        Meu Progresso
                    </a>
                    <a href="#" onclick="app.showMyMaterials()">
                        <i class="fas fa-book"></i>
                        Meus Materiais
                    </a>
                    <a href="#" onclick="app.showMyPosts()">
                        <i class="fas fa-comments"></i>
                        Meus Posts
                    </a>
                </div>
                <div class="user-menu-footer">
                    <button class="btn btn-outline" onclick="app.logout()" style="width: 100%; padding: 8px; font-size: 0.9rem;">
                        <i class="fas fa-sign-out-alt"></i>
                        Sair
                    </button>
                </div>
            </div>
        `;
        
        // Remover menu anterior se existir
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) existingMenu.remove();
        
        // Adicionar novo menu
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        // Fechar menu ao clicar fora
        setTimeout(() => {
            const closeMenu = (e) => {
                const menu = document.querySelector('.user-menu');
                if (menu && !menu.contains(e.target) && !e.target.closest('.user-avatar')) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    // ==================== NAVEGAÇÃO ====================
    setupNavigation() {
        // Navegação principal
        document.addEventListener('click', (e) => {
            // Links de navegação
            if (e.target.matches('.nav-link, .footer-links a[data-target], .btn[data-target]')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('data-target');
                this.showSection(targetId);
            }
            
            // Links do fórum
            if (e.target.matches('.category-list a')) {
                e.preventDefault();
                const category = e.target.getAttribute('data-category');
                this.filterForumPosts(category);
            }
        });
        
        // Mostrar seção inicial
        this.showSection('home');
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
            
            // Carregar conteúdo específico da seção
            this.loadSectionContent(sectionId);
        }
    }

    async loadSectionContent(sectionId) {
        try {
            switch (sectionId) {
                case 'home':
                    await this.loadHomeContent();
                    break;
                case 'certificacoes':
                    await this.loadCertificacoes();
                    break;
                case 'forum':
                    await this.loadForumPosts();
                    break;
                case 'materiais':
                    await this.loadMaterials();
                    break;
                case 'simulados':
                    await this.loadSimulados();
                    break;
            }
        } catch (err) {
            console.error(`❌ Erro ao carregar seção ${sectionId}:`, err);
        }
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Modal de autenticação
        document.addEventListener('click', (e) => {
            if (e.target.matches('#loginBtn, #startNowBtn')) {
                e.preventDefault();
                this.openLogin();
            }
            
            if (e.target.matches('#registerBtn')) {
                e.preventDefault();
                this.openRegister();
            }
            
            if (e.target.matches('#closeAuthModal') || 
                (e.target.classList.contains('modal-auth') && e.target.id === 'modalAuth')) {
                this.closeAuthModal();
            }
            
            if (e.target.matches('#submitLogin')) {
                e.preventDefault();
                this.login();
            }
            
            if (e.target.matches('#submitRegister')) {
                e.preventDefault();
                this.register();
            }
        });
        
        // Tabs de autenticação
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.showAuthTab(tabName);
            });
        });
        
        // Modal de simulados
        document.addEventListener('click', (e) => {
            if (e.target.matches('#closeSimuladosModal') || 
                (e.target.classList.contains('modal-simulados') && e.target.id === 'modalSimulados')) {
                this.closeSimuladosModal();
            }
            
            if (e.target.matches('.show-simulados-btn')) {
                this.openSimuladosModal();
            }
            
            if (e.target.matches('#uploadSimuladoBtn')) {
                this.openUploadModal();
            }
            
            if (e.target.matches('#submitUpload')) {
                e.preventDefault();
                this.uploadSimulado();
            }
            
            if (e.target.matches('#closeUploadModal') || 
                (e.target.classList.contains('modal-upload') && e.target.id === 'modalUpload')) {
                this.closeUploadModal();
            }
            
            if (e.target.matches('#newPostBtn')) {
                e.preventDefault();
                if (!this.currentUser) {
                    alert('Por favor, faça login para criar um novo post.');
                    this.openLogin();
                    return;
                }
                this.createNewPost();
            }
        });
        
        // Formulários
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#loginForm')) {
                e.preventDefault();
                this.login();
            }
            
            if (e.target.matches('#registerForm')) {
                e.preventDefault();
                this.register();
            }
        });
        
        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAuthModal();
                this.closeSimuladosModal();
                this.closeUploadModal();
                
                // Fechar menu do usuário
                const userMenu = document.querySelector('.user-menu');
                if (userMenu) userMenu.remove();
            }
        });
    }

    // ==================== CARREGAMENTO DE DADOS ====================
    async loadInitialData() {
        try {
            // Carregar certificações em destaque
            await this.loadHomeContent();
            
            // Carregar estatísticas
            await this.loadStats();
            
        } catch (err) {
            console.error('❌ Erro ao carregar dados iniciais:', err);
        }
    }

    async loadHomeContent() {
        try {
            // Carregar certificações em destaque
            const { data: certificacoes, error } = await this.supabase
                .from('certificacoes')
                .select('*')
                .eq('ativo', true)
                .order('popularidade', { ascending: false })
                .limit(4);
            
            if (error) throw error;
            
            const grid = document.getElementById('featuredCertifications');
            if (grid && certificacoes) {
                grid.innerHTML = certificacoes.map(cert => `
                    <div class="cert-card">
                        <div class="cert-icon">
                            <i class="${cert.icon_name || 'fas fa-certificate'}"></i>
                        </div>
                        <div class="cert-content">
                            <span class="cert-level">${cert.nivel}</span>
                            <h3>${cert.nome}</h3>
                            <p>${cert.descricao?.substring(0, 100) || 'Certificação de TI'}...</p>
                            <a href="#" class="btn btn-primary" data-target="certificacoes">Estudar</a>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar conteúdo da home:', err);
        }
    }

    async loadCertificacoes() {
        try {
            const { data: certificacoes, error } = await this.supabase
                .from('certificacoes')
                .select('*')
                .eq('ativo', true)
                .order('nome');
            
            if (error) throw error;
            
            const container = document.getElementById('certificacoesContent');
            if (container && certificacoes) {
                container.innerHTML = certificacoes.map(cert => `
                    <div class="cert-card">
                        <div class="cert-icon">
                            <i class="${cert.icon_name || 'fas fa-certificate'}"></i>
                        </div>
                        <div class="cert-content">
                            <span class="cert-level">${cert.nivel}</span>
                            <h3>${cert.nome}</h3>
                            <p>${cert.descricao?.substring(0, 80) || 'Certificação de TI'}...</p>
                            <a href="#" class="btn btn-primary" onclick="app.studyCertification('${cert.id}')">Estudar</a>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar certificações:', err);
        }
    }

    async loadMaterials() {
        try {
            const { data: materiais, error } = await this.supabase
                .from('materiais')
                .select(`
                    *,
                    usuarios:nome
                `)
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false })
                .limit(12);
            
            if (error) throw error;
            
            const container = document.getElementById('materialsContent');
            if (container && materiais) {
                container.innerHTML = materiais.map(material => `
                    <div class="material-card">
                        <div class="material-icon">
                            <i class="${this.getMaterialIcon(material.tipo)}"></i>
                        </div>
                        <div class="material-content">
                            <h3>${material.titulo}</h3>
                            <p>${material.descricao?.substring(0, 100) || 'Material de estudo'}...</p>
                            <div class="material-meta">
                                <span><i class="fas fa-user"></i> ${material.usuarios?.nome || 'Anônimo'}</span>
                                <span><i class="far fa-eye"></i> ${material.visualizacoes || 0}</span>
                            </div>
                            <a href="${material.caminho_arquivo || material.url_externa || '#'}" 
                               ${material.caminho_arquivo || material.url_externa ? 'target="_blank"' : ''}
                               class="btn btn-primary"
                               onclick="app.incrementMaterialViews('${material.id}')">
                                Acessar
                            </a>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar materiais:', err);
        }
    }

    async loadForumPosts(category = null) {
        try {
            let query = this.supabase
                .from('forum_posts')
                .select(`
                    *,
                    usuarios:nome
                `)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (category) {
                // Implementar filtro por categoria
            }
            
            const { data: posts, error } = await query;
            
            if (error) throw error;
            
            const container = document.getElementById('forumPosts');
            if (container && posts) {
                container.innerHTML = posts.map(post => `
                    <div class="post">
                        <div class="post-header">
                            <a href="#" class="post-title" onclick="app.viewForumPost('${post.id}')">${post.titulo}</a>
                            <div class="post-meta">
                                por ${post.usuarios?.nome || 'Anônimo'} • ${this.formatDate(post.created_at)}
                            </div>
                        </div>
                        <div class="post-excerpt">
                            <p>${post.conteudo?.substring(0, 150) || 'Sem conteúdo'}...</p>
                        </div>
                        <div class="post-footer">
                            <span><i class="far fa-comment"></i> ${post.respostas || 0} respostas</span>
                            <span><i class="far fa-eye"></i> ${post.visualizacoes || 0} visualizações</span>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar posts do fórum:', err);
        }
    }

    async loadSimulados() {
        try {
            const { data: simulados, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    certificacoes:nome
                `)
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const container = document.getElementById('simuladosContent');
            if (container) {
                if (simulados && simulados.length > 0) {
                    container.innerHTML = simulados.map(simulado => `
                        <div class="simulado-card">
                            <div class="card-header">
                                <h3><i class="fas fa-file-alt"></i> ${simulado.nome}</h3>
                            </div>
                            <div class="card-body">
                                <span class="simulado-badge">${simulado.total_questoes || 0} questões</span>
                                <p>${simulado.descricao?.substring(0, 100) || 'Simulado de certificação'}</p>
                                <p><strong>Certificação:</strong> ${simulado.certificacoes?.nome || 'Geral'}</p>
                                <p><strong>Tempo estimado:</strong> ${simulado.tempo_estimado_minutos || 60} minutos</p>
                            </div>
                            <div class="card-footer">
                                <a href="${simulado.arquivo_url || '#'}" 
                                   ${simulado.arquivo_url ? 'target="_blank"' : ''}
                                   class="btn btn-primary"
                                   onclick="app.incrementSimuladoViews('${simulado.id}')">
                                    Iniciar Simulado
                                </a>
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<p class="text-center">Nenhum simulado disponível no momento.</p>';
                }
                
                // Adicionar card para upload
                container.innerHTML += `
                    <div class="simulado-card">
                        <div class="card-header">
                            <h3><i class="fas fa-plus-circle"></i> Adicionar Simulado</h3>
                        </div>
                        <div class="card-body">
                            <p>Compartilhe seu próprio simulado com a comunidade.</p>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-primary" onclick="app.openUploadModal()">Upload</button>
                        </div>
                    </div>
                `;
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar simulados:', err);
        }
    }

    async loadStats() {
        try {
            const [
                { count: totalUsers },
                { count: totalMaterials },
                { count: totalSimulados },
                { count: totalPosts }
            ] = await Promise.all([
                this.supabase.from('usuarios').select('*', { count: 'exact', head: true }),
                this.supabase.from('materiais').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
                this.supabase.from('simulados').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
                this.supabase.from('forum_posts').select('*', { count: 'exact', head: true })
            ]);
            
            console.log('📊 Estatísticas do site:');
            console.log('- Usuários:', totalUsers);
            console.log('- Materiais:', totalMaterials);
            console.log('- Simulados:', totalSimulados);
            console.log('- Posts:', totalPosts);
            
        } catch (err) {
            console.error('❌ Erro ao carregar estatísticas:', err);
        }
    }

    // ==================== FUNCIONALIDADES DO USUÁRIO ====================
    async showUserProgress() {
        if (!this.currentUser) return;
        
        try {
            const { data: progresso, error } = await this.supabase
                .from('progresso_usuario')
                .select(`
                    *,
                    certificacoes:nome
                `)
                .eq('usuario_id', this.currentUser.id);
            
            if (error) throw error;
            
            const progressElement = document.getElementById('userProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            if (progressElement && progressFill && progressText) {
                if (progresso && progresso.length > 0) {
                    progressElement.style.display = 'block';
                    
                    // Calcular progresso médio
                    const totalProgress = progresso.reduce((sum, p) => sum + (p.progresso_percentual || 0), 0);
                    const avgProgress = Math.round(totalProgress / progresso.length);
                    
                    progressFill.style.width = `${avgProgress}%`;
                    progressText.textContent = `Você completou ${avgProgress}% da sua jornada de certificação`;
                    
                } else {
                    progressElement.style.display = 'none';
                }
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar progresso:', err);
        }
    }

    async studyCertification(certificacaoId) {
        if (!this.currentUser) {
            alert('Por favor, faça login para acompanhar seu progresso.');
            this.openLogin();
            return;
        }
        
        try {
            // Verificar se já existe progresso
            const { data: existing, error: checkError } = await this.supabase
                .from('progresso_usuario')
                .select('*')
                .eq('usuario_id', this.currentUser.id)
                .eq('certificacao_id', certificacaoId)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            
            if (!existing) {
                // Criar novo progresso
                const { error: insertError } = await this.supabase
                    .from('progresso_usuario')
                    .insert({
                        usuario_id: this.currentUser.id,
                        certificacao_id: certificacaoId,
                        status: 'em_andamento',
                        progresso_percentual: 0,
                        data_inicio: new Date().toISOString().split('T')[0]
                    });
                
                if (insertError) throw insertError;
                
                alert('🎯 Progresso iniciado para esta certificação!');
            }
            
            // Redirecionar para materiais desta certificação
            this.showSection('materiais');
            
        } catch (err) {
            console.error('❌ Erro ao iniciar certificação:', err);
            alert('Erro ao iniciar certificação.');
        }
    }

    // ==================== AUTENTICAÇÃO - MODAL ====================
    openLogin() {
        document.getElementById('modalAuth').classList.add('active');
        this.showAuthTab('login');
        document.body.style.overflow = 'hidden';
    }

    openRegister() {
        document.getElementById('modalAuth').classList.add('active');
        this.showAuthTab('register');
        document.body.style.overflow = 'hidden';
    }

    closeAuthModal() {
        document.getElementById('modalAuth').classList.remove('active');
        this.clearAuthMessages();
        document.body.style.overflow = 'auto';
    }

    showAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        
        const selectedTab = document.querySelector(`.auth-tab[data-tab="${tab}"]`);
        const selectedForm = document.getElementById(`${tab}Form`);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedForm) selectedForm.classList.add('active');
        
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
            const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            this.showMessage('loginMessage', '✅ Login realizado com sucesso!', 'success');
            this.currentUser = data.user;
            
            setTimeout(async () => {
                await this.loadUserProfile();
                this.closeAuthModal();
                this.updateAuthUI();
                
                // Limpar campos
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
                
                // Recarregar conteúdo
                await this.loadSectionContent('home');
                
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
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            
            if (error) throw error;
            
            this.showMessage('registerMessage', '✅ Cadastro realizado! Verifique seu email para confirmação.', 'success');
            
            setTimeout(() => {
                // Limpar campos
                document.getElementById('registerName').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
                
                // Mudar para aba de login
                this.showAuthTab('login');
                
            }, 3000);
            
        } catch (error) {
            console.error('❌ Erro no cadastro:', error);
            this.showMessage('registerMessage', this.getAuthErrorMessage(error), 'error');
        }
    }

    getAuthErrorMessage(error) {
        if (error.message.includes('Invalid login credentials')) {
            return '❌ Email ou senha incorretos';
        } else if (error.message.includes('User already registered')) {
            return '❌ Este email já está cadastrado';
        } else if (error.message.includes('Email not confirmed')) {
            return '❌ Confirme seu email antes de fazer login';
        } else if (error.message.includes('Password should be at least')) {
            return '❌ A senha deve ter pelo menos 6 caracteres';
        } else {
            return `❌ Erro: ${error.message}`;
        }
    }

    async logout() {
        try {
            await this.supabase.auth.signOut();
            this.currentUser = null;
            this.userProfile = null;
            this.updateAuthUI();
            
            // Fechar menu do usuário se aberto
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) userMenu.remove();
            
            // Voltar para a página inicial
            this.showSection('home');
            
            // Recarregar conteúdo
            await this.loadHomeContent();
            
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
        }
    }

    // ==================== SIMULADOS - MODAL ====================
    openSimuladosModal() {
        document.getElementById('modalSimulados').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSimuladosModal() {
        document.getElementById('modalSimulados').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    openUploadModal() {
        if (!this.currentUser) {
            alert('Por favor, faça login para fazer upload de simulados.');
            this.openLogin();
            return;
        }
        
        document.getElementById('modalUpload').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Carregar certificações para o select
        this.loadCertificationsForUpload();
    }

    closeUploadModal() {
        document.getElementById('modalUpload').classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Limpar campos
        document.getElementById('simuladoName').value = '';
        document.getElementById('simuladoDesc').value = '';
        document.getElementById('simuladoQuestions').value = '';
        document.getElementById('simuladoTime').value = '';
        document.getElementById('simuladoFile').value = '';
    }

    async loadCertificationsForUpload() {
        try {
            const { data: certificacoes, error } = await this.supabase
                .from('certificacoes')
                .select('id, nome')
                .eq('ativo', true)
                .order('nome');
            
            if (error) throw error;
            
            const select = document.getElementById('simuladoCert');
            if (select && certificacoes) {
                select.innerHTML = '<option value="">Selecione uma certificação</option>' +
                    certificacoes.map(cert => `<option value="${cert.id}">${cert.nome}</option>`).join('');
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar certificações:', err);
        }
    }

    async uploadSimulado() {
        const name = document.getElementById('simuladoName').value;
        const desc = document.getElementById('simuladoDesc').value;
        const certId = document.getElementById('simuladoCert').value;
        const questions = document.getElementById('simuladoQuestions').value;
        const time = document.getElementById('simuladoTime').value;
        const fileInput = document.getElementById('simuladoFile');
        const file = fileInput.files[0];
        
        if (!name || !desc || !certId || !questions || !time || !file) {
            this.showMessage('uploadMessage', 'Por favor, preencha todos os campos', 'error');
            return;
        }
        
        try {
            // Upload do arquivo
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('simulados')
                .upload(fileName, file);
            
            if (uploadError) throw uploadError;
            
            // Obter URL pública
            const { data: urlData } = this.supabase.storage
                .from('simulados')
                .getPublicUrl(fileName);
            
            // Salvar no banco de dados
            const { data: dbData, error: dbError } = await this.supabase
                .from('simulados')
                .insert({
                    nome: name,
                    descricao: desc,
                    certificacao_id: certId,
                    total_questoes: parseInt(questions),
                    tempo_estimado_minutos: parseInt(time),
                    arquivo_url: urlData.publicUrl,
                    usuario_id: this.currentUser.id,
                    status: 'pendente'
                });
            
            if (dbError) throw dbError;
            
            this.showMessage('uploadMessage', '✅ Simulado enviado com sucesso! Aguarde a aprovação.', 'success');
            
            setTimeout(() => {
                this.closeUploadModal();
                this.loadSimulados();
            }, 2000);
            
        } catch (err) {
            console.error('❌ Erro ao fazer upload do simulado:', err);
            this.showMessage('uploadMessage', '❌ Erro ao enviar simulado. Tente novamente.', 'error');
        }
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
            
            // Auto-esconder mensagens de sucesso
            if (type === 'success') {
                setTimeout(() => {
                    element.style.display = 'none';
                }, 5000);
            }
        }
    }

    getMaterialIcon(tipo) {
        const icons = {
            pdf: 'fas fa-file-pdf',
            ppt: 'fas fa-file-powerpoint',
            doc: 'fas fa-file-word',
            video: 'fas fa-file-video',
            zip: 'fas fa-file-archive',
            link: 'fas fa-external-link-alt',
            default: 'fas fa-file'
        };
        
        return icons[tipo] || icons.default;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) {
            return 'Agora mesmo';
        } else if (diffMins < 60) {
            return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `há ${diffDays} dias`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    filterForumPosts(category) {
        // Implementar filtro de posts por categoria
        console.log('Filtrar posts por categoria:', category);
        // Atualizar UI dos filtros
        document.querySelectorAll('.category-list a').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.category-list a[data-category="${category}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        // Recarregar posts filtrados
        this.loadForumPosts(category);
    }

    async incrementMaterialViews(materialId) {
        try {
            const { error } = await this.supabase.rpc('increment_views', {
                material_id: materialId
            });
            
            if (error) throw error;
            
        } catch (err) {
            console.error('❌ Erro ao incrementar visualizações:', err);
        }
    }

    async incrementSimuladoViews(simuladoId) {
        try {
            const { error } = await this.supabase
                .from('simulados')
                .update({ visualizacoes: this.supabase.raw('visualizacoes + 1') })
                .eq('id', simuladoId);
            
            if (error) throw error;
            
        } catch (err) {
            console.error('❌ Erro ao incrementar visualizações do simulado:', err);
        }
    }

    showGlobalError(message) {
        // Criar elemento de erro global
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        errorDiv.innerHTML = `
            <strong>Erro:</strong> ${message}
            <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: none; color: white; cursor: pointer;">×</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // ==================== MÉTODOS DO FÓRUM ====================
    createNewPost() {
        if (!this.currentUser) {
            alert('Por favor, faça login para criar um novo post.');
            this.openLogin();
            return;
        }
        
        // Criar modal para novo post
        const modalHTML = `
            <div class="modal-upload active" id="newPostModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Nova Discussão</h3>
                        <button class="fechar-modal" onclick="document.getElementById('newPostModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="newPostMessage" class="message"></div>
                        <div class="form-group">
                            <label for="postTitle">Título</label>
                            <input type="text" id="postTitle" placeholder="Digite o título da discussão">
                        </div>
                        <div class="form-group">
                            <label for="postCategory">Categoria</label>
                            <select id="postCategory">
                                <option value="">Selecione uma categoria</option>
                                <option value="microsoft">Certificações Microsoft</option>
                                <option value="aws">Certificações AWS</option>
                                <option value="lpic">LPIC-1 e LPIC-2</option>
                                <option value="itil">ITIL e Governança</option>
                                <option value="security">Security & Cybersecurity</option>
                                <option value="cloud">Cloud Computing</option>
                                <option value="geral">Dúvidas Gerais</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="postContent">Conteúdo</label>
                            <textarea id="postContent" placeholder="Descreva sua dúvida ou compartilhe sua experiência..." rows="8"></textarea>
                        </div>
                        <button class="btn btn-primary" onclick="app.submitNewPost()">Publicar Discussão</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal anterior se existir
        const existingModal = document.getElementById('newPostModal');
        if (existingModal) existingModal.remove();
        
        // Adicionar novo modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
    }

    async submitNewPost() {
        const title = document.getElementById('postTitle').value;
        const category = document.getElementById('postCategory').value;
        const content = document.getElementById('postContent').value;
        
        if (!title || !category || !content) {
            this.showMessage('newPostMessage', 'Por favor, preencha todos os campos', 'error');
            return;
        }
        
        try {
            // Mapear categoria para ID (em produção, isso viria do banco)
            const categoryMap = {
                microsoft: '1',
                aws: '2',
                lpic: '3',
                itil: '4',
                security: '5',
                cloud: '6',
                geral: '7'
            };
            
            const { data, error } = await this.supabase
                .from('forum_posts')
                .insert({
                    titulo: title,
                    conteudo: content,
                    categoria_id: categoryMap[category] || '7',
                    usuario_id: this.currentUser.id
                })
                .select();
            
            if (error) throw error;
            
            this.showMessage('newPostMessage', '✅ Discussão publicada com sucesso!', 'success');
            
            setTimeout(() => {
                const modal = document.getElementById('newPostModal');
                if (modal) modal.remove();
                document.body.style.overflow = 'auto';
                
                // Recarregar posts
                this.loadForumPosts();
                
            }, 2000);
            
        } catch (err) {
            console.error('❌ Erro ao publicar post:', err);
            this.showMessage('newPostMessage', '❌ Erro ao publicar discussão. Tente novamente.', 'error');
        }
    }

    async viewForumPost(postId) {
        // Implementar visualização detalhada do post
        console.log('Visualizar post:', postId);
        alert('Funcionalidade de visualização detalhada do post será implementada em breve.');
    }

    // ==================== MÉTODOS DO USUÁRIO ====================
    showUserProfile() {
        if (!this.currentUser) return;
        alert('Funcionalidade de perfil do usuário será implementada em breve.');
    }

    showMyProgress() {
        if (!this.currentUser) return;
        this.showSection('home'); // Mostrar seção home onde está o progresso
        setTimeout(() => {
            const progressElement = document.getElementById('userProgress');
            if (progressElement) {
                progressElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    showMyMaterials() {
        if (!this.currentUser) return;
        this.showSection('materiais');
        alert('Funcionalidade de meus materiais será implementada em breve.');
    }

    showMyPosts() {
        if (!this.currentUser) return;
        this.showSection('forum');
        alert('Funcionalidade de meus posts será implementada em breve.');
    }
}

// Inicializar aplicação quando o DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyCertApp();
    window.app = app; // Tornar acessível globalmente
});
