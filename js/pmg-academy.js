// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Usando configuração correta do Supabase

class PMGAcademyManager {
    constructor() {
        this.supabase = null;
        this.files = [];
        this.stats = {
            totalViews: 0,
            totalDownloads: 0,
            totalStudents: 0
        };
        this.isLoading = false;
        this.hasError = false;
        
        // Usar a mesma configuração do app.js
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando PMG Academy Manager...');
        
        try {
            // Verificar se SUPABASE_CONFIG está disponível (do app.js)
            if (typeof SUPABASE_CONFIG !== 'undefined') {
                console.log('✅ Usando configuração do app.js');
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
            } else {
                // Configuração alternativa
                console.log('⚠️ Usando configuração alternativa');
                const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
                const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY';
                
                this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                });
            }
            
            console.log('✅ Supabase inicializado com sucesso');
            
            // Carregar estatísticas iniciais
            this.loadInitialStats();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.handleError('Erro na inicialização: ' + error.message);
        }
    }

    async loadPMGFiles() {
        if (this.isLoading) return;
        
        console.log('📥 Buscando arquivos da PMG Academy...');
        
        this.isLoading = true;
        this.hasError = false;
        
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        try {
            // Mostrar loading
            if (loadingElement) {
                loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Buscando arquivos...</span>';
                loadingElement.style.display = 'block';
            }
            
            // Verificar se Supabase está inicializado
            if (!this.supabase) {
                console.warn('⚠️ Supabase não inicializado, tentando reinicializar...');
                await this.init();
                
                if (!this.supabase) {
                    throw new Error('Não foi possível inicializar o Supabase');
                }
            }
            
            console.log('🔍 Executando consulta no Supabase...');
            
            // CONSULTA SIMPLES: Buscar todos os materiais
            const { data: materials, error } = await this.supabase
                .from('materiais')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erro na consulta:', error);
                
                // Tentar consulta mais básica
                console.log('🔄 Tentando consulta alternativa...');
                const { data: simpleData, error: simpleError } = await this.supabase
                    .from('materiais')
                    .select('id, nome, categoria')
                    .limit(10);
                
                if (simpleError) {
                    throw simpleError;
                }
                
                this.files = simpleData || [];
            } else {
                this.files = materials || [];
            }
            
            console.log(`📊 ${this.files.length} materiais encontrados`);
            
            // Mostrar no console para debug
            if (this.files.length > 0) {
                console.log('📋 Amostra dos materiais:', this.files.slice(0, 3));
                
                // Verificar estrutura dos dados
                this.files.forEach((file, index) => {
                    console.log(`Arquivo ${index + 1}:`, {
                        id: file.id,
                        nome: file.nome,
                        categoria: file.categoria,
                        fonte: file.fonte,
                        arquivo_nome: file.arquivo_nome,
                        arquivo_url: file.arquivo_url ? 'OK' : 'FALTANDO'
                    });
                });
            }
            
            // Se não encontrou arquivos, usar dados de exemplo
            if (this.files.length === 0) {
                console.log('📋 Usando dados de exemplo para demonstração');
                this.files = this.getExampleFiles();
            }
            
            // Filtrar para PMG Academy/ITIL (opcional - para teste mostrar todos)
            const filteredFiles = this.files.filter(file => {
                const categoria = (file.categoria || '').toLowerCase();
                const nome = (file.nome || '').toLowerCase();
                const fonte = (file.fonte || '').toLowerCase();
                
                return categoria.includes('itil') || 
                       nome.includes('itil') || 
                       nome.includes('pmg') ||
                       fonte.includes('pmg') ||
                       true; // REMOVER ESTE 'true' DEPOIS DO TESTE
            });
            
            this.files = filteredFiles;
            
            console.log(`📦 ${this.files.length} arquivos após filtro`);
            
            // Renderizar
            if (loadingElement) loadingElement.style.display = 'none';
            if (filesListElement) {
                filesListElement.style.display = 'block';
                this.renderFiles();
            }
            
            this.updateFileCounters();
            this.updateStatsUI();
            
            console.log('✅ Arquivos carregados com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao carregar arquivos:', error);
            this.hasError = true;
            
            let errorMessage = 'Não foi possível carregar os arquivos.';
            
            if (error.message.includes('JWT')) {
                errorMessage = 'Problema de autenticação com o banco de dados.';
            } else if (error.message.includes('API key') || error.message.includes('Invalid')) {
                errorMessage = 'Chave da API inválida. Verifique a configuração.';
            } else if (error.message.includes('fetch') || error.message.includes('network')) {
                errorMessage = 'Problema de conexão com a internet.';
            } else {
                errorMessage = `Erro: ${error.message}`;
            }
            
            this.showError(errorMessage);
            
            // Usar dados de exemplo em caso de erro
            this.files = this.getExampleFiles();
            this.renderFiles();
            this.updateFileCounters();
            
        } finally {
            this.isLoading = false;
        }
    }

    getExampleFiles() {
        return [
            {
                id: '1',
                nome: 'ITIL 4 Foundation - Guia Completo',
                descricao: 'Material completo para certificação ITIL 4 Foundation',
                arquivo_url: '#',
                arquivo_nome: 'itil4-guia-completo.pdf',
                arquivo_tamanho_kb: 12500,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-15T10:30:00Z'
            },
            {
                id: '2',
                nome: 'Apresentação ITIL 4 - Módulo 1',
                descricao: 'Apresentação em PowerPoint do módulo 1',
                arquivo_url: '#',
                arquivo_nome: 'itil4-modulo1.pptx',
                arquivo_tamanho_kb: 8500,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-16T14:20:00Z'
            },
            {
                id: '3',
                nome: 'Exercícios Resolvidos ITIL 4',
                descricao: 'Lista de exercícios com gabarito comentado',
                arquivo_url: '#',
                arquivo_nome: 'exercicios-itil4.docx',
                arquivo_tamanho_kb: 3200,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-17T09:15:00Z'
            }
        ];
    }

    renderFiles() {
        const filesListElement = document.getElementById('pmg-files-list');
        if (!filesListElement) return;
        
        if (this.files.length === 0) {
            filesListElement.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo disponível</h4>
                    <p>Não há arquivos da PMG Academy no momento.</p>
                    <p style="font-size: 0.9em; margin-top: 10px; color: #7f8c8d;">
                        <i class="fas fa-info-circle"></i> Os arquivos serão carregados automaticamente quando disponíveis.
                    </p>
                </div>
            `;
            return;
        }
        
        console.log(`🎨 Renderizando ${this.files.length} arquivos`);
        
        // Agrupar por tipo
        const filesByType = {
            pdf: [],
            ppt: [],
            doc: [],
            outros: []
        };
        
        this.files.forEach(file => {
            const fileName = (file.arquivo_nome || '').toLowerCase();
            
            if (fileName.endsWith('.pdf')) {
                filesByType.pdf.push(file);
            } else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
                filesByType.ppt.push(file);
            } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
                filesByType.doc.push(file);
            } else {
                filesByType.outros.push(file);
            }
        });
        
        let html = '';
        
        // PDFs
        if (filesByType.pdf.length > 0) {
            html += this.renderFileCategory('PDF', filesByType.pdf, '#e74c3c', 'fa-file-pdf');
        }
        
        // PPTs
        if (filesByType.ppt.length > 0) {
            html += this.renderFileCategory('Apresentações', filesByType.ppt, '#e67e22', 'fa-file-powerpoint');
        }
        
        // DOC
        if (filesByType.doc.length > 0) {
            html += this.renderFileCategory('Documentos', filesByType.doc, '#3498db', 'fa-file-word');
        }
        
        // Outros
        if (filesByType.outros.length > 0) {
            html += this.renderFileCategory('Outros', filesByType.outros, '#7f8c8d', 'fa-file');
        }
        
        // Resumo
        html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; color: #2C3E50; font-weight: 600;">
                            <i class="fas fa-chart-pie"></i> Resumo
                        </p>
                        <p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 0.9em;">
                            ${this.files.length} arquivos • ${this.getTotalSize()} MB
                        </p>
                    </div>
                    <button onclick="pmgManager.downloadAllFiles()" class="download-all-btn">
                        <i class="fas fa-download"></i> Baixar Todos
                    </button>
                </div>
            </div>
        `;
        
        filesListElement.innerHTML = html;
    }

    renderFileCategory(title, files, color, icon) {
        let html = `
            <div class="file-category">
                <h5 style="color: ${color};">
                    <i class="fas ${icon}"></i> ${title} (${files.length})
                </h5>
                <div class="file-list">
        `;
        
        files.forEach((file, index) => {
            const fileSize = file.arquivo_tamanho_kb ? 
                (file.arquivo_tamanho_kb / 1024).toFixed(1) + ' MB' : 'N/A';
            
            const fileName = file.nome || file.arquivo_nome || `Arquivo ${index + 1}`;
            const fileId = file.id || `file-${index}`;
            const fileUrl = file.arquivo_url || '#';
            
            html += `
                <div class="file-item" data-file-id="${fileId}">
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div class="file-name" title="${fileName}">
                            ${fileName}
                        </div>
                        <div style="display: flex; gap: 8px; font-size: 0.8em; color: #7f8c8d; margin-top: 3px;">
                            ${file.categoria ? `<span><i class="fas fa-tag"></i> ${file.categoria}</span>` : ''}
                            ${file.fonte ? `<span><i class="fas fa-building"></i> ${file.fonte}</span>` : ''}
                        </div>
                    </div>
                    <span class="file-size">${fileSize}</span>
                    <div class="file-actions">
                        <a href="${fileUrl}" 
                           ${fileUrl !== '#' ? 'target="_blank"' : ''}
                           class="btn-view"
                           onclick="pmgManager.trackView('${fileId}')"
                           title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="${fileUrl}" 
                           download="${fileName}"
                           class="btn-download"
                           onclick="pmgManager.trackDownload('${fileId}')"
                           title="Baixar">
                            <i class="fas fa-download"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }

    updateFileCounters() {
        // Atualizar contadores no card
        const fileCountElement = document.getElementById('pmg-file-count');
        if (fileCountElement) {
            fileCountElement.textContent = this.files.length;
        }
        
        const totalSize = this.getTotalSize();
        const totalSizeElement = document.getElementById('pmg-total-size');
        if (totalSizeElement) {
            totalSizeElement.textContent = totalSize + ' MB';
        }
    }

    getTotalSize() {
        const totalKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
        return (totalKB / 1024).toFixed(1);
    }

    loadInitialStats() {
        // Carregar estatísticas do localStorage ou usar valores padrão
        try {
            const savedStats = localStorage.getItem('pmg_academy_stats');
            if (savedStats) {
                this.stats = JSON.parse(savedStats);
            } else {
                // Valores padrão baseados no número de arquivos
                this.stats = {
                    totalViews: this.files.length * 20,
                    totalDownloads: this.files.length * 10,
                    totalStudents: Math.floor(this.files.length * 5)
                };
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar estatísticas:', e);
        }
    }

    updateStatsUI() {
        const viewsElement = document.getElementById('pmg-total-views');
        const downloadsElement = document.getElementById('pmg-total-downloads');
        const studentsElement = document.getElementById('pmg-students');
        
        if (viewsElement) viewsElement.textContent = this.stats.totalViews.toLocaleString();
        if (downloadsElement) downloadsElement.textContent = this.stats.totalDownloads.toLocaleString();
        if (studentsElement) studentsElement.textContent = this.stats.totalStudents.toLocaleString();
    }

    trackView(fileId) {
        this.stats.totalViews++;
        this.updateStatsUI();
        localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        console.log(`👁️ Visualização: ${fileId}`);
    }

    trackDownload(fileId) {
        this.stats.totalDownloads++;
        this.updateStatsUI();
        localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        console.log(`📥 Download: ${fileId}`);
    }

    downloadAllFiles() {
        if (this.files.length === 0) {
            alert('Nenhum arquivo disponível para download.');
            return;
        }
        
        if (confirm(`Deseja baixar todos os ${this.files.length} arquivos?\n\nOs arquivos serão baixados individualmente.`)) {
            this.trackDownload('all');
            
            this.files.forEach((file, index) => {
                setTimeout(() => {
                    if (file.arquivo_url && file.arquivo_url !== '#') {
                        const link = document.createElement('a');
                        link.href = file.arquivo_url;
                        link.download = file.nome || file.arquivo_nome || `arquivo-${index + 1}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }, index * 300);
            });
            
            if (window.showNotification) {
                window.showNotification(`Iniciando download de ${this.files.length} arquivos...`, 'info');
            }
        }
    }

    showError(message) {
        const loadingElement = document.getElementById('pmg-files-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #e74c3c; text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>${message}</p>
                    <p style="font-size: 0.9em; margin-top: 10px; color: #7f8c8d;">
                        Mostrando dados de demonstração...
                    </p>
                    <button onclick="pmgManager.loadPMGFiles()" 
                            style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    handleError(message) {
        console.error(message);
        this.showError(message);
    }
}

// Inicialização
console.log('📚 PMG Academy Manager carregado');

// Criar instância global
let pmgManager = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, inicializando PMG Manager...');
    pmgManager = new PMGAcademyManager();
    
    // Expor para uso global
    window.pmgManager = pmgManager;
    
    // Se estiver na página ITIL 4, carregar automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    const cert = urlParams.get('cert');
    
    if (cert === 'itil4') {
        console.log('🎯 Página ITIL 4 detectada');
        
        // Pequeno delay para garantir inicialização
        setTimeout(() => {
            const pmgCard = document.querySelector('.pmg-academy-card');
            if (pmgCard && window.togglePmgFiles) {
                console.log('📂 Abrindo card PMG Academy...');
                togglePmgFiles();
            }
        }, 800);
    }
});
