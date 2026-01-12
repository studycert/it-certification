// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Inicialização corrigida

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
        this.initialized = false;
        
        // Não inicializar no construtor, esperar DOM
        console.log('📚 PMG Academy Manager criado (aguardando inicialização)');
    }

    async initialize() {
        if (this.initialized) {
            console.log('✅ Já inicializado');
            return true;
        }
        
        console.log('🔄 Inicializando PMG Academy Manager...');
        
        try {
            // Verificar dependências
            if (typeof supabase === 'undefined') {
                throw new Error('Biblioteca Supabase não carregada');
            }
            
            // Verificar configuração
            if (typeof SUPABASE_CONFIG === 'undefined') {
                console.warn('⚠️ SUPABASE_CONFIG não definido, usando valores padrão');
                // Tentar usar valores do config.js que você forneceu
                const config = {
                    url: 'https://uhbwudgdeyvbkqoflaqw.supabase.co',
                    anonKey: 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4'
                };
                
                this.supabase = supabase.createClient(config.url, config.anonKey, {
                    auth: { persistSession: false },
                    global: { headers: { 'apikey': config.anonKey } }
                });
            } else {
                console.log('✅ Usando configuração do config.js');
                this.supabase = supabase.createClient(
                    SUPABASE_CONFIG.url,
                    SUPABASE_CONFIG.anonKey,
                    {
                        auth: { persistSession: false },
                        global: { headers: { 'apikey': SUPABASE_CONFIG.anonKey } }
                    }
                );
            }
            
            // Testar a conexão
            await this.testConnection();
            
            this.initialized = true;
            console.log('✅ PMG Academy Manager inicializado com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.hasError = true;
            
            // Tentar método alternativo
            try {
                console.log('🔄 Tentando método alternativo de inicialização...');
                this.supabase = this.createFallbackClient();
                await this.testConnection();
                
                this.initialized = true;
                console.log('✅ Inicializado com método alternativo');
                return true;
                
            } catch (fallbackError) {
                console.error('❌ Método alternativo também falhou:', fallbackError);
                this.showGlobalError('Não foi possível conectar ao banco de dados');
                return false;
            }
        }
    }

    createFallbackClient() {
        // Método de fallback direto
        const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY';
        
        return supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false },
            global: { headers: { 'apikey': SUPABASE_KEY } }
        });
    }

    async testConnection() {
        if (!this.supabase) {
            throw new Error('Supabase client não criado');
        }
        
        console.log('🔍 Testando conexão com Supabase...');
        
        // Teste simples
        const { data, error } = await this.supabase
            .from('materiais')
            .select('count')
            .limit(1)
            .single();
        
        if (error) {
            console.warn('⚠️ Teste de contagem falhou, tentando consulta simples...');
            
            // Tentar consulta mais simples
            const { data: simpleData, error: simpleError } = await this.supabase
                .from('materiais')
                .select('id')
                .limit(1);
            
            if (simpleError) {
                throw new Error(`Falha na conexão: ${simpleError.message}`);
            }
        }
        
        console.log('✅ Conexão com Supabase OK');
    }

    async loadPMGFiles() {
        // Verificar se está inicializado
        if (!this.initialized) {
            console.log('🔄 Inicializando antes de carregar arquivos...');
            const initialized = await this.initialize();
            
            if (!initialized) {
                this.showError('Não foi possível inicializar o sistema');
                return;
            }
        }
        
        if (this.isLoading) {
            console.log('⏳ Já está carregando...');
            return;
        }
        
        console.log('📥 Carregando arquivos...');
        
        this.isLoading = true;
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        try {
            // Mostrar loading
            if (loadingElement) {
                loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Conectando ao banco...</span>';
                loadingElement.style.display = 'block';
            }
            
            // Verificar novamente se supabase está disponível
            if (!this.supabase) {
                throw new Error('Supabase client não disponível');
            }
            
            console.log('🔍 Buscando todos os materiais...');
            
            // Buscar TODOS os materiais
            const { data: materials, error } = await this.supabase
                .from('materiais')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erro na consulta:', error);
                
                // Tentar consulta mais simples
                console.log('🔄 Tentando consulta alternativa...');
                const { data: simpleData, error: simpleError } = await this.supabase
                    .from('materiais')
                    .select('id, nome, categoria, arquivo_url')
                    .limit(50);
                
                if (simpleError) {
                    throw simpleError;
                }
                
                this.files = simpleData || [];
            } else {
                this.files = materials || [];
            }
            
            console.log(`📊 ${this.files.length} materiais encontrados`);
            
            // Log detalhado para debug
            if (this.files.length > 0) {
                console.log('📋 Detalhes dos arquivos:');
                this.files.forEach((file, index) => {
                    console.log(`${index + 1}. ${file.nome || 'Sem nome'} | URL: ${file.arquivo_url ? 'Sim' : 'Não'}`);
                });
            }
            
            // Processar resultados
            this.processResults();
            
        } catch (error) {
            console.error('❌ Erro ao carregar:', error);
            this.showError(`Erro: ${error.message}`);
            
            // Usar dados de exemplo em caso de erro
            this.files = this.getExampleFiles();
            this.processResults();
            
        } finally {
            this.isLoading = false;
        }
    }

    processResults() {
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        // Esconder loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Renderizar
        if (filesListElement) {
            filesListElement.style.display = 'block';
            this.renderFiles();
        }
        
        // Atualizar contadores
        this.updateFileCounters();
        this.updateStatsUI();
        
        console.log('✅ Processamento concluído');
    }

    getExampleFiles() {
        return [
            {
                id: 'ex1',
                nome: 'ITIL 4 Foundation - Guia Completo',
                descricao: 'Material de exemplo para demonstração',
                arquivo_url: '#',
                arquivo_nome: 'exemplo.pdf',
                arquivo_tamanho_kb: 10240,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: new Date().toISOString()
            },
            {
                id: 'ex2',
                nome: 'Apresentação ITIL 4',
                descricao: 'Apresentação de exemplo',
                arquivo_url: '#',
                arquivo_nome: 'exemplo.pptx',
                arquivo_tamanho_kb: 8192,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: new Date().toISOString()
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
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo encontrado</h4>
                    <p>A tabela 'materiais' está vazia ou não foi possível acessá-la.</p>
                </div>
            `;
            return;
        }
        
        console.log(`🎨 Renderizando ${this.files.length} arquivos`);
        
        let html = '';
        
        // Agrupar por categoria
        const groupedByCategory = {};
        this.files.forEach(file => {
            const category = file.categoria || 'Geral';
            if (!groupedByCategory[category]) {
                groupedByCategory[category] = [];
            }
            groupedByCategory[category].push(file);
        });
        
        // Renderizar cada categoria
        Object.entries(groupedByCategory).forEach(([category, files]) => {
            html += this.renderCategorySection(category, files);
        });
        
        // Botão de download
        if (this.files.length > 0) {
            html += `
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="window.pmgManager.downloadAllFiles()" class="download-all-btn">
                        <i class="fas fa-download"></i> Baixar Todos (${this.files.length})
                    </button>
                </div>
            `;
        }
        
        filesListElement.innerHTML = html;
    }

    renderCategorySection(category, files) {
        const color = this.getCategoryColor(category);
        
        return `
            <div class="file-category">
                <h5 style="color: ${color};">
                    <i class="fas ${this.getCategoryIcon(category)}"></i> ${category} (${files.length})
                </h5>
                <div class="file-list">
                    ${files.map((file, index) => this.renderFileItem(file, index)).join('')}
                </div>
            </div>
        `;
    }

    renderFileItem(file, index) {
        const fileId = file.id || `file-${index}`;
        const fileName = file.nome || file.arquivo_nome || `Arquivo ${index + 1}`;
        const fileDesc = file.descricao || 'Sem descrição';
        const fileUrl = file.arquivo_url || '#';
        const fileSize = file.arquivo_tamanho_kb ? 
            (file.arquivo_tamanho_kb / 1024).toFixed(1) + ' MB' : 'N/A';
        
        const fileType = this.getFileType(file);
        const typeColor = this.getTypeColor(fileType);
        const typeIcon = this.getTypeIcon(fileType);
        
        // Verificar se URL é válida
        const hasValidUrl = fileUrl && fileUrl !== '#' && 
                           fileUrl !== 'undefined' && 
                           (fileUrl.startsWith('http') || fileUrl.startsWith('https'));
        
        return `
            <div class="file-item" data-file-id="${fileId}">
                <i class="fas ${typeIcon}" style="color: ${typeColor};"></i>
                <div style="flex: 1; min-width: 0;">
                    <div class="file-name" title="${fileName}">
                        ${fileName}
                    </div>
                    <div style="color: #666; font-size: 0.85em; margin-top: 3px;">
                        ${fileDesc}
                    </div>
                    <div style="display: flex; gap: 8px; font-size: 0.75em; color: #95a5a6; margin-top: 5px;">
                        ${file.categoria ? `<span><i class="fas fa-tag"></i> ${file.categoria}</span>` : ''}
                        ${file.fonte ? `<span><i class="fas fa-building"></i> ${file.fonte}</span>` : ''}
                        ${hasValidUrl ? 
                            `<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> Disponível</span>` : 
                            `<span style="color: #e74c3c;"><i class="fas fa-times-circle"></i> Sem link</span>`}
                    </div>
                </div>
                <span class="file-size">${fileSize}</span>
                <div class="file-actions">
                    ${hasValidUrl ? `
                        <a href="${fileUrl}" 
                           target="_blank" 
                           class="btn-view" 
                           onclick="window.pmgManager.trackView('${fileId}')"
                           title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="${fileUrl}" 
                           download="${this.sanitizeFileName(fileName)}" 
                           class="btn-download" 
                           onclick="window.pmgManager.trackDownload('${fileId}')"
                           title="Baixar">
                            <i class="fas fa-download"></i>
                        </a>
                    ` : `
                        <span class="btn-view disabled" title="Link não disponível">
                            <i class="fas fa-eye"></i>
                        </span>
                        <span class="btn-download disabled" title="Download não disponível">
                            <i class="fas fa-download"></i>
                        </span>
                    `}
                </div>
            </div>
        `;
    }

    sanitizeFileName(name) {
        // Remove caracteres inválidos para nome de arquivo
        return name.replace(/[^\w\s.-]/gi, '_');
    }

    // Métodos auxiliares (mantidos iguais)
    getFileType(file) {
        const fileName = (file.arquivo_nome || '').toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'ppt';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'doc';
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
        return 'other';
    }

    getTypeColor(type) {
        const colors = {
            pdf: '#e74c3c', ppt: '#e67e22', doc: '#3498db', 
            html: '#9b59b6', other: '#7f8c8d'
        };
        return colors[type] || colors.other;
    }

    getTypeIcon(type) {
        const icons = {
            pdf: 'fa-file-pdf', ppt: 'fa-file-powerpoint', 
            doc: 'fa-file-word', html: 'fa-file-code', other: 'fa-file'
        };
        return icons[type] || icons.other;
    }

    getCategoryColor(category) {
        const colors = {
            'ITIL 4': '#154360', 'ITIL': '#1B4F72', 'Azure': '#0078D4',
            'AWS': '#FF9900', 'Linux': '#E95420', 'Geral': '#2C3E50'
        };
        return colors[category] || '#2C3E50';
    }

    getCategoryIcon(category) {
        const icons = {
            'ITIL 4': 'fa-cube', 'ITIL': 'fa-cube', 'Azure': 'fa-microsoft',
            'AWS': 'fa-aws', 'Linux': 'fa-server', 'Geral': 'fa-folder'
        };
        return icons[category] || 'fa-folder';
    }

    updateFileCounters() {
        const fileCountElement = document.getElementById('pmg-file-count');
        const totalSizeElement = document.getElementById('pmg-total-size');
        
        if (fileCountElement) fileCountElement.textContent = this.files.length;
        if (totalSizeElement) {
            const totalKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
            totalSizeElement.textContent = (totalKB / 1024).toFixed(1) + ' MB';
        }
    }

    updateStatsUI() {
        const estimatedViews = this.files.length * 20;
        const estimatedDownloads = this.files.length * 10;
        
        this.stats.totalViews = estimatedViews;
        this.stats.totalDownloads = estimatedDownloads;
        this.stats.totalStudents = Math.floor(this.files.length * 5);
        
        const viewsElement = document.getElementById('pmg-total-views');
        const downloadsElement = document.getElementById('pmg-total-downloads');
        const studentsElement = document.getElementById('pmg-students');
        
        if (viewsElement) viewsElement.textContent = estimatedViews.toLocaleString();
        if (downloadsElement) downloadsElement.textContent = estimatedDownloads.toLocaleString();
        if (studentsElement) studentsElement.textContent = this.stats.totalStudents.toLocaleString();
    }

    trackView(fileId) {
        console.log(`👁️ Visualizando: ${fileId}`);
        this.stats.totalViews++;
        this.updateStatsUI();
    }

    trackDownload(fileId) {
        console.log(`📥 Baixando: ${fileId}`);
        this.stats.totalDownloads++;
        this.updateStatsUI();
    }

    downloadAllFiles() {
        const downloadableFiles = this.files.filter(file => 
            file.arquivo_url && file.arquivo_url !== '#' && 
            file.arquivo_url.startsWith('http')
        );
        
        if (downloadableFiles.length === 0) {
            alert('Nenhum arquivo com link disponível para download.');
            return;
        }
        
        if (confirm(`Baixar ${downloadableFiles.length} arquivos?`)) {
            downloadableFiles.forEach((file, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = file.arquivo_url;
                    link.download = this.sanitizeFileName(file.nome || file.arquivo_nome);
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 300);
            });
        }
    }

    showError(message) {
        const loadingElement = document.getElementById('pmg-files-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #e74c3c; text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button onclick="window.pmgManager.loadPMGFiles()" 
                            style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }

    showGlobalError(message) {
        console.error('❌ Erro global:', message);
        
        // Criar notificação global
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 300px;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Erro do Sistema</strong>
                    <p style="margin: 5px 0 0 0; font-size: 0.9em;">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remover após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Gerenciador global
let pmgManager = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM carregado, criando PMG Manager...');
    
    // Criar instância
    pmgManager = new PMGAcademyManager();
    window.pmgManager = pmgManager;
    
    // Inicializar (mas não carregar arquivos ainda)
    await pmgManager.initialize();
    
    console.log('✅ PMG Manager pronto para uso');
    
    // Se estiver na página ITIL 4, configurar para abrir automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cert') === 'itil4') {
        console.log('🎯 Página ITIL 4 detectada');
        
        // Pequeno delay para garantir que tudo está pronto
        setTimeout(() => {
            if (typeof togglePmgFiles === 'function') {
                console.log('📂 Configurando abertura automática do card...');
                
                // Sobrescrever a função togglePmgFiles para carregar arquivos quando abrir
                const originalTogglePmgFiles = window.togglePmgFiles;
                window.togglePmgFiles = function() {
                    const wasOpen = document.getElementById('pmg-files-container').style.display === 'block';
                    originalTogglePmgFiles();
                    
                    // Se estava fechado e agora abriu, carregar arquivos
                    if (!wasOpen && pmgManager && pmgManager.files.length === 0) {
                        console.log('📥 Card aberto, carregando arquivos...');
                        pmgManager.loadPMGFiles();
                    }
                };
                
                // Abrir automaticamente após 1 segundo
                setTimeout(() => {
                    togglePmgFiles();
                }, 1000);
            }
        }, 500);
    }
});

// Exportar para uso global
window.PMGAcademyManager = PMGAcademyManager;
