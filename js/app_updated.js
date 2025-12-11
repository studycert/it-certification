// app_updated.js - Versão atualizada com todas as funcionalidades
import StudyCertAPI from './api.js';

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
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            
            console.log('✅ Supabase configurado');
            
            // Carregar navegação
            this.loadNavigation();
            
            // Verificar autenticação
            await this.checkAuth();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar dados iniciais
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
            
            if (error) throw error;
            
            if (session) {
                this.currentUser = session.user;
                console.log('👤 Usuário logado:', this.currentUser.email);
                
                // Carregar perfil do usuário
                await this.loadUserProfile();
            } else {
                this.currentUser = null;
                this.userProfile = null;
            }
            
            this.updateAuthUI();
            this.updateNavigation();
            
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
            
            if (error) throw error;
            
            this.userProfile = data;
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
                <button class="btn btn-outline" onclick="app.openLogin()">Entrar</button>
                <button class="btn btn-primary" onclick="app.openRegister()">Cadastrar</button>
            `;
            
            if (uploadArea) uploadArea.style.display = 'none';
        }
    }

    showUserMenu() {
        if (!this.currentUser) return;
        
        const menuHTML = `
            <div class="user-menu" style="
                position: absolute;
                top: 60px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                min-width: 200px;
                z-index: 1000;
            ">
                <div class="user-menu-header" style="
                    padding: 15px;
                    border-bottom: 1px solid #eee;
                    background: linear-gradient(135deg, #2c3e50, #3498db);
                    color: white;
                    border-radius: 8px 8px 0 0;
                ">
                    <strong>${this.userProfile?.nome || 'Usuário'}</strong>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${this.currentUser.email}</div>
                </div>
                <div class="user-menu-items">
                    <a href="#" onclick="app.showUserProfile()" style="
                        display: block;
                        padding: 12px 15px;
                        color: #333;
                        text-decoration: none;
                        border-bottom: 1px solid #f5f5f5;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-user" style="margin-right: 10px;"></i>
                        Meu Perfil
                    </a>
                    <a href="#" onclick="app.showMyProgress()" style="
                        display: block;
                        padding: 12px 15px;
                        color: #333;
                        text-decoration: none;
                        border-bottom: 1px solid #f5f5f5;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-chart-line" style="margin-right: 10px;"></i>
                        Meu Progresso
                    </a>
                    <a href="#" onclick="app.showMyMaterials()" style="
                        display: block;
                        padding: 12px 15px;
                        color: #333;
                        text-decoration: none;
                        border-bottom: 1px solid #f5f5f5;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-book" style="margin-right: 10px;"></i>
                        Meus Materiais
                    </a>
                    <a href="#" onclick="app.showMyPosts()" style="
                        display: block;
                        padding: 12px 15px;
                        color: #333;
                        text-decoration: none;
                        transition: background 0.3s;
                    ">
                        <i class="fas fa-comments" style="margin-right: 10px;"></i>
                        Meus Posts
                    </a>
                </div>
                <div class="user-menu-footer" style="
                    padding: 10px 15px;
                    border-top: 1px solid #eee;
                    text-align: center;
                ">
                    <button class="btn btn-outline" onclick="app.logout()" style="
                        width: 100%;
                        padding: 8px;
                        font-size: 0.9rem;
                    ">
                        <i class="fas fa-sign-out-alt" style="margin-right: 5px;"></i>
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

    // ==================== NAVEGAÇÃO E CONTEÚDO ====================
    loadNavigation() {
        // Navegação principal
        const navLinks = document.querySelectorAll('.nav-link, .footer-links a[data-target], .btn[data-target]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                this.showSection(targetId);
            });
        });
        
        // Botões de categoria de materiais
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.getAttribute('data-category');
                this.filterMaterials(category);
            });
        });
    }

    updateNavigation() {
        // Atualizar links baseados no status de autenticação
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const target = link.getAttribute('data-target');
            
            // Esconder/mostrar links baseados na autenticação
            if (target === 'forum' && !this.currentUser) {
                link.style.display = 'none';
            } else {
                link.style.display = 'block';
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

    // ==================== CARREGAMENTO DE DADOS ====================
    async loadInitialData() {
        // Carregar certificações
        await this.loadCertificacoes();
        
        // Carregar estatísticas do site
        await this.loadSiteStats();
    }

    async loadHomeContent() {
        // Carregar certificações em destaque
        try {
            const { data: certificacoes, error } = await this.supabase
                .from('certificacoes')
                .select('*')
                .eq('ativo', true)
                .order('popularidade', { ascending: false })
                .limit(4);
            
            if (error) throw error;
            
            // Atualizar grid de certificações
            const certificationsGrid = document.querySelector('.certifications-grid');
            if (certificationsGrid && certificacoes) {
                certificationsGrid.innerHTML = certificacoes.map(cert => `
                    <div class="cert-card">
                        <div class="cert-icon">
                            <i class="${cert.icon_name || 'fas fa-certificate'}"></i>
                        </div>
                        <div class="cert-content">
                            <span class="cert-level">${cert.nivel}</span>
                            <h3>${cert.nome}</h3>
                            <p>${cert.descricao?.substring(0, 100) || 'Certificação de TI'}...</p>
                            <a href="#" class="btn btn-primary" onclick="app.studyCertification('${cert.id}')">Estudar</a>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar certificações:', err);
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
                                <span><i class="far fa-eye"></i> ${material.visualizacoes}</span>
                            </div>
                            <a href="${material.caminho_arquivo || material.url_externa}" 
                               target="_blank" 
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

    async loadForumPosts() {
        try {
            const { data: posts, error } = await this.supabase
                .from('forum_posts')
                .select(`
                    *,
                    forum_categorias:nome,
                    usuarios:nome
                `)
                .order('created_at', { ascending: false })
                .limit(20);
            
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
                            <span><i class="far fa-comment"></i> ${post.respostas} respostas</span>
                            <span><i class="far fa-eye"></i> ${post.visualizacoes} visualizações</span>
                            <span><i class="fas fa-tag"></i> ${post.forum_categorias?.nome || 'Geral'}</span>
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
                    certificacoes:nome,
                    usuarios:nome
                `)
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const container = document.getElementById('simuladosContent');
            if (container && simulados) {
                container.innerHTML = simulados.map(simulado => `
                    <div class="simulado-card">
                        <div class="card-header">
                            <h3><i class="fas fa-file-alt"></i> ${simulado.nome}</h3>
                        </div>
                        <div class="card-body">
                            <span class="simulado-badge">${simulado.total_questoes} questões</span>
                            <p>${simulado.descricao?.substring(0, 100) || 'Simulado de certificação'}</p>
                            <p><strong>Certificação:</strong> ${simulado.certificacoes?.nome || 'Geral'}</p>
                            <p><strong>Tempo estimado:</strong> ${simulado.tempo_estimado_minutos} minutos</p>
                        </div>
                        <div class="card-footer">
                            <a href="${simulado.arquivo_url}" 
                               target="_blank" 
                               class="btn btn-primary"
                               onclick="app.incrementSimuladoViews('${simulado.id}')">
                                Iniciar Simulado
                            </a>
                        </div>
                    </div>
                `).join('');
                
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

    async loadSiteStats() {
        try {
            // Obter estatísticas
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

    // ==================== FUNÇÕES AUXILIARES ====================
    getMaterialIcon(tipo) {
        const icons = {
            pdf: 'fas fa-file-pdf pdf',
            ppt: 'fas fa-file-powerpoint ppt',
            doc: 'fas fa-file-word doc',
            video: 'fas fa-file-video video',
            zip: 'fas fa-file-archive zip',
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
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hoje';
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
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

    // ==================== FILTROS ====================
    filterMaterials(category) {
        const materials = document.querySelectorAll('.material-card');
        
        materials.forEach(material => {
            const materialCategory = material.getAttribute('data-category');
            
            if (category === 'all' || materialCategory === category) {
                material.style.display = 'block';
            } else {
                material.style.display = 'none';
            }
        });
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
                
                // Fechar menu do usuário
                const userMenu = document.querySelector('.user-menu');
                if (userMenu) userMenu.remove();
            }
        });

        // Listeners para formulários de login/registro
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
    }

    // ==================== MÉTODOS PÚBLICOS (disponíveis no HTML) ====================
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
            const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            this.showMessage('loginMessage', '✅ Login realizado com sucesso!', 'success');
            this.currentUser = data.user;
            
            setTimeout(async () => {
                await this.loadUserProfile();
                this.closeAuthModal();
                this.updateAuthUI();
                this.updateNavigation();
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
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });
            
            if (error) throw error;
            
            this.showMessage('registerMessage', '✅ Cadastro realizado! Verifique seu email para confirmação.', 'success');
            
            setTimeout(() => {
                document.getElementById('registerName').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
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
            this.userProfile = null;
            this.updateAuthUI();
            this.updateNavigation();
            
            const userProgress = document.getElementById('userProgress');
            if (userProgress) userProgress.style.display = 'none';
            
            // Fechar menu do usuário se aberto
            const userMenu = document.querySelector('.user-menu');
            if (userMenu) userMenu.remove();
            
            // Voltar para a página inicial
            this.showSection('home');
            
        } catch (error) {
            console.error('❌ Erro ao fazer logout:', error);
        }
    }

    abrirModalSimulados() {
        const modal = document.getElementById('modalSimulados');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    fecharModalSimulados() {
        const modal = document.getElementById('modalSimulados');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    showGlobalError(message) {
        console.error('Erro global:', message);
        // Você pode implementar um sistema de notificação mais elaborado aqui
    }
}

// Inicializar aplicação quando o DOM estiver pronto
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
window.openUploadModal = () => app.openUploadModal();

// Outras funções
window.createNewPost = () => app.createNewPost();
window.forgotPassword = () => app.forgotPassword();