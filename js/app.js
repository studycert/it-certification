// js/app.js
class StudyCertApp {
    constructor() {
        this.supabase = window.supabase;
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🚀 StudyCert - Inicializando aplicação');
        
        try {
            // Verificar autenticação
            await this.checkAuth();
            
            // Carregar navegação
            this.loadNavigation();
            
            // Configurar eventos
            this.setupEventListeners();
            
            // Carregar dados iniciais se estiver logado
            if (this.currentUser) {
                await this.loadUserData();
            }
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
        }
    }

    async checkAuth() {
        try {
            const { data } = await this.supabase.auth.getUser();
            this.currentUser = data.user;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.currentUser = null;
        }
    }

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

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            // Carregar certificações
            await this.loadCertifications();
            
            // Carregar progresso
            await this.loadUserProgress();
            
            // Carregar materiais
            await this.loadMaterials();
            
            // Carregar simulados
            await this.loadSimulados();
            
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    async loadCertifications() {
        try {
            const { data, error } = await this.supabase
                .from('certificacoes')
                .select('*')
                .eq('ativo', true)
                .order('popularidade', { ascending: false });
            
            if (error) throw error;
            
            // Atualizar UI se necessário
            console.log(`✅ Carregadas ${data?.length || 0} certificações`);
            
        } catch (error) {
            console.error('Erro ao carregar certificações:', error);
        }
    }

    async loadUserProgress() {
        if (!this.currentUser) return;
        
        try {
            const { data, error } = await this.supabase
                .from('progresso_usuario')
                .select(`
                    *,
                    certificacoes:nome
                `)
                .eq('usuario_id', this.currentUser.id);
            
            if (error) throw error;
            
            this.updateProgressUI(data);
            
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        }
    }

    updateProgressUI(progressData) {
        const progressElement = document.getElementById('userProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (!progressElement || !progressFill || !progressText) return;
        
        if (progressData && progressData.length > 0) {
            progressElement.style.display = 'block';
            
            // Calcular progresso médio
            const totalProgress = progressData.reduce((sum, item) => sum + (item.progresso_percentual || 0), 0);
            const avgProgress = Math.round(totalProgress / progressData.length);
            
            progressFill.style.width = `${avgProgress}%`;
            progressText.textContent = `Você completou ${avgProgress}% da sua jornada de certificação`;
        }
    }

    async loadMaterials() {
        try {
            const { data, error } = await this.supabase
                .from('materiais')
                .select(`
                    *,
                    usuarios:nome
                `)
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            console.log(`✅ Carregados ${data?.length || 0} materiais`);
            
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
        }
    }

    async loadSimulados() {
        try {
            const { data, error } = await this.supabase
                .from('simulados')
                .select(`
                    *,
                    certificacoes:nome,
                    usuarios:nome
                `)
                .eq('status', 'aprovado')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            console.log(`✅ Carregados ${data?.length || 0} simulados`);
            
        } catch (error) {
            console.error('Erro ao carregar simulados:', error);
        }
    }

    // ==================== SISTEMA DE UPLOAD ====================
    openUploadModal() {
        if (!this.currentUser) {
            alert('Por favor, faça login para fazer upload de simulados.');
            window.auth.openLogin();
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
                        
                        <div class="upload-area" style="margin: 20px 0;">
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
        
        // Configurar eventos
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
                    }
                }
            });
        }
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
        if (!this.currentUser) {
            alert('Por favor, faça login para enviar simulados.');
            return;
        }
        
        const nome = document.getElementById('simuladoNome').value.trim();
        const descricao = document.getElementById('simuladoDescricao').value.trim();
        const categoria = document.getElementById('simuladoCategoria').value;
        const fileInput = document.getElementById('fileUploadInput');
        const file = fileInput.files[0];
        
        const uploadMessage = document.getElementById('uploadMessage');
        const btnEnviar = document.getElementById('btnEnviarSimulado');
        
        // Validação
        if (!nome) {
            this.showUploadMessage('Por favor, insira um nome para o simulado.', 'error');
            return;
        }
        
        if (!file) {
            this.showUploadMessage('Por favor, selecione um arquivo HTML.', 'error');
            return;
        }
        
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            this.showUploadMessage('Por favor, selecione apenas arquivos HTML.', 'error');
            return;
        }
        
        if (!document.getElementById('termosAceitos').checked) {
            this.showUploadMessage('Você precisa aceitar os termos de uso.', 'error');
            return;
        }
        
        try {
            // Mostrar loading
            btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnEnviar.disabled = true;
            
            // 1. Fazer upload para o Storage
            const nomeArquivo = `${Date.now()}_${this.currentUser.id}_${file.name.replace(/\s+/g, '_')}`;
            
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('simulados')
                .upload(nomeArquivo, file);
            
            if (uploadError) throw uploadError;
            
            // 2. Obter URL pública
            const { data: urlData } = this.supabase.storage
                .from('simulados')
                .getPublicUrl(nomeArquivo);
            
            // 3. Salvar no banco de dados
            const { error: dbError } = await this.supabase
                .from('simulados')
                .insert({
                    nome: nome,
                    descricao: descricao,
                    arquivo_url: urlData.publicUrl,
                    usuario_id: this.currentUser.id,
                    categoria: categoria,
                    total_questoes: 0, // Será atualizado depois
                    tempo_estimado_minutos: 60,
                    nivel_dificuldade: 'intermediario',
                    status: 'pendente'
                });
            
            if (dbError) throw dbError;
            
            this.showUploadMessage('✅ Simulado enviado com sucesso! Aguarde aprovação.', 'success');
            
            setTimeout(() => {
                this.closeUploadModal();
                alert('Simulado enviado com sucesso! Aguarde aprovação dos administradores.');
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

    showUploadMessage(message, type) {
        const element = document.getElementById('uploadMessage');
        if (element) {
            element.innerHTML = message;
            element.className = `message ${type}`;
            element.style.display = 'block';
        }
    }

    // ==================== SIMULADOS ====================
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

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Modal de simulados
        const modalSimulados = document.getElementById('modalSimulados');
        if (modalSimulados) {
            modalSimulados.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) this.fecharModalSimulados();
            });
        }

        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
                this.fecharModalSimulados();
            }
        });
    }

    // ==================== FUNÇÕES AUXILIARES ====================
    createNewPost() {
        if (!this.currentUser) {
            alert('Por favor, faça login para criar posts.');
            window.auth.openLogin();
            return;
        }
        alert('Funcionalidade de criação de posts em desenvolvimento.');
    }

    forgotPassword() {
        window.auth.forgotPassword();
    }
}

// Inicializar app quando o DOM estiver pronto
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyCertApp();
});

// ==================== FUNÇÕES GLOBAIS ====================
window.app = {
    openUploadModal: () => app.openUploadModal(),
    closeUploadModal: () => app.closeUploadModal(),
    enviarSimulado: () => app.enviarSimulado(),
    abrirModalSimulados: () => app.abrirModalSimulados(),
    fecharModalSimulados: () => app.fecharModalSimulados(),
    createNewPost: () => app.createNewPost(),
    forgotPassword: () => app.forgotPassword()
};
