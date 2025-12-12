// js/app.js - APLICAÇÃO PRINCIPAL SIMPLIFICADA

class StudyCertApp {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🚀 StudyCert - Inicializando...');
        
        try {
            // Inicializar Supabase
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
            
            // Verificar autenticação
            await this.checkAuth();
            
            // Carregar dados iniciais
            await this.loadInitialData();
            
            console.log('✅ Aplicação inicializada');
            
        } catch (err) {
            console.error('❌ Erro na inicialização:', err);
        }
    }

    async checkAuth() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                console.log('👤 Usuário logado:', this.currentUser.email);
                
                // Carregar perfil do usuário
                await this.loadUserProfile();
            }
            
        } catch (err) {
            console.error('❌ Erro ao verificar autenticação:', err);
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
            
            console.log('📋 Perfil carregado:', data.nome);
            
            // Atualizar progresso
            await this.updateUserProgress();
            
        } catch (err) {
            console.error('❌ Erro ao carregar perfil:', err);
        }
    }

    async updateUserProgress() {
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
                    progressText.textContent = `Progresso: ${avgProgress}% completado`;
                    
                } else {
                    progressElement.style.display = 'none';
                }
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar progresso:', err);
        }
    }

    async loadInitialData() {
        // Carregar certificações
        await this.loadCertificacoes();
        
        // Carregar materiais
        await this.loadMaterials();
        
        // Carregar simulados
        await this.loadSimulados();
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
                            <button class="btn btn-primary" onclick="app.studyCertification('${cert.id}')">Estudar</button>
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
                .limit(6);
            
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
                               class="btn btn-primary">
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
                .order('created_at', { ascending: false })
                .limit(8);
            
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
                        </div>
                        <div class="card-footer">
                            <a href="${simulado.arquivo_url}" 
                               target="_blank" 
                               class="btn btn-primary">
                                Iniciar Simulado
                            </a>
                        </div>
                    </div>
                `).join('');
                
                // Adicionar card para upload se usuário estiver logado
                if (this.currentUser) {
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
            }
            
        } catch (err) {
            console.error('❌ Erro ao carregar simulados:', err);
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

    async studyCertification(certificacaoId) {
        if (!this.currentUser) {
            alert('Por favor, faça login para acompanhar seu progresso.');
            openAuthModal('login');
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
                await this.updateUserProgress();
            }
            
            // Redirecionar para materiais
            showContent('materiais');
            
        } catch (err) {
            console.error('❌ Erro ao iniciar certificação:', err);
            alert('Erro ao iniciar certificação.');
        }
    }

    openUploadModal() {
        alert('Funcionalidade de upload em breve!');
    }
}

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudyCertApp();
    window.app = app;
});
