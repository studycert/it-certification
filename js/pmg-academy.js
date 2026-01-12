// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Corrigido para buscar arquivos reais do Supabase

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
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando PMG Academy Manager...');
        
        try {
            // Configuração do Supabase - Use a mesma do seu app.js
            const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY';
            
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                global: {
                    headers: { 
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            });
            
            console.log('✅ Supabase inicializado');
            
            // Testar conexão
            await this.testConnection();
            
            // Carregar estatísticas de downloads dos arquivos
            await this.loadStatsFromFiles();
            
            // Atualizar interface
            this.updateStatsUI();
            this.updateFileCounters();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar PMG Academy Manager:', error);
            this.handleError('Erro na conexão com o banco de dados');
        }
    }

    async testConnection() {
        try {
            // Testar conexão com uma consulta simples
            const { data, error } = await this.supabase
                .from('materiais')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            console.log('✅ Conexão com Supabase testada com sucesso');
            
        } catch (error) {
            console.error('❌ Falha no teste de conexão:', error);
            throw error;
        }
    }

    async loadPMGFiles() {
        if (this.isLoading) {
            console.log('⚠️ Já está carregando arquivos...');
            return;
        }
        
        console.log('📥 Buscando arquivos PMG Academy do banco...');
        
        this.isLoading = true;
        this.hasError = false;
        
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        try {
            // Mostrar loading
            if (loadingElement) {
                loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Buscando arquivos no banco de dados...</span>';
                loadingElement.style.display = 'block';
            }
            
            // Fazer várias tentativas de busca com diferentes critérios
            console.log('🔍 Tentando buscar arquivos com diferentes critérios...');
            
            // TENTATIVA 1: Buscar por categoria ITIL 4
            console.log('Tentativa 1: Buscando por categoria ITIL 4');
            let { data: files1, error: error1 } = await this.supabase
                .from('materiais')
                .select('*')
                .ilike('categoria', '%ITIL%')
                .order('created_at', { ascending: false });
            
            if (error1) {
                console.warn('Erro na tentativa 1:', error1);
            }
            
            // TENTATIVA 2: Buscar por fonte PMG Academy
            console.log('Tentativa 2: Buscando por fonte PMG Academy');
            let { data: files2, error: error2 } = await this.supabase
                .from('materiais')
                .select('*')
                .ilike('fonte', '%PMG%')
                .order('created_at', { ascending: false });
            
            if (error2) {
                console.warn('Erro na tentativa 2:', error2);
            }
            
            // TENTATIVA 3: Buscar por nome que contenha PMG
            console.log('Tentativa 3: Buscando por nome PMG');
            let { data: files3, error: error3 } = await this.supabase
                .from('materiais')
                .select('*')
                .or('nome.ilike.%PMG%,nome.ilike.%pmg%,descricao.ilike.%PMG%,descricao.ilike.%pmg%')
                .order('created_at', { ascending: false });
            
            if (error3) {
                console.warn('Erro na tentativa 3:', error3);
            }
            
            // TENTATIVA 4: Buscar todos os materiais
            console.log('Tentativa 4: Buscando todos os materiais');
            let { data: allFiles, error: error4 } = await this.supabase
                .from('materiais')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error4) {
                console.warn('Erro na tentativa 4:', error4);
            }
            
            // Combinar resultados, removendo duplicatas
            let combinedFiles = [];
            const seenIds = new Set();
            
            [files1, files2, files3, allFiles].forEach(fileList => {
                if (fileList && Array.isArray(fileList)) {
                    fileList.forEach(file => {
                        if (file && file.id && !seenIds.has(file.id)) {
                            seenIds.add(file.id);
                            combinedFiles.push(file);
                        }
                    });
                }
            });
            
            console.log(`📊 Resultados combinados: ${combinedFiles.length} arquivos`);
            
            // Filtrar para mostrar apenas arquivos relevantes
            this.files = combinedFiles.filter(file => {
                // Verificar se é do PMG Academy ou ITIL
                const nome = (file.nome || '').toLowerCase();
                const descricao = (file.descricao || '').toLowerCase();
                const categoria = (file.categoria || '').toLowerCase();
                const fonte = (file.fonte || '').toLowerCase();
                
                return nome.includes('pmg') || 
                       nome.includes('itil') ||
                       descricao.includes('pmg') ||
                       descricao.includes('itil') ||
                       categoria.includes('itil') ||
                       fonte.includes('pmg') ||
                       // Se não temos critérios claros, mostrar todos
                       combinedFiles.length <= 30; // Se temos poucos arquivos, mostrar todos
            });
            
            console.log(`📦 Arquivos PMG Academy filtrados: ${this.files.length}`);
            
            // Se ainda não temos arquivos, buscar da tabela simulados
            if (this.files.length === 0) {
                console.log('🔄 Tentando buscar da tabela simulados...');
                const { data: simulados, error: simError } = await this.supabase
                    .from('simulados')
                    .select('*')
                    .ilike('categoria', '%ITIL%')
                    .limit(20);
                
                if (!simError && simulados && simulados.length > 0) {
                    console.log(`📚 Encontrados ${simulados.length} simulados ITIL`);
                    this.files = simulados.map(sim => ({
                        id: sim.id,
                        nome: sim.nome || 'Simulado ITIL',
                        descricao: sim.descricao || 'Material de estudo ITIL',
                        arquivo_url: sim.arquivo_url || '#',
                        arquivo_nome: sim.arquivo_nome || 'simulado.html',
                        arquivo_tamanho_kb: sim.arquivo_tamanho_kb || 0,
                        tipo: 'html',
                        categoria: 'ITIL 4',
                        fonte: 'StudyCert',
                        created_at: sim.created_at || sim.data_upload
                    }));
                }
            }
            
            // Se ainda vazio, mostrar mensagem informativa
            if (this.files.length === 0) {
                console.log('ℹ️ Nenhum arquivo encontrado no banco');
                this.files = []; // Manter vazio, não usar dados de exemplo
            }
            
            // Esconder loading e mostrar resultados
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            
            if (filesListElement) {
                filesListElement.style.display = 'block';
                this.renderFiles();
            }
            
            // Atualizar contadores
            this.updateFileCounters();
            
            // Atualizar estatísticas baseadas nos arquivos
            await this.loadStatsFromFiles();
            
            console.log('✅ Processamento de arquivos concluído');
            
        } catch (error) {
            console.error('❌ Erro crítico ao carregar arquivos:', error);
            this.hasError = true;
            
            // Mostrar mensagem de erro específica
            let errorMessage = 'Não foi possível carregar os arquivos do banco de dados.';
            
            if (error.message.includes('JWT')) {
                errorMessage = 'Problema de autenticação com o banco de dados.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Problema de conexão com a internet.';
            }
            
            this.showErrorInUI(errorMessage);
            
        } finally {
            this.isLoading = false;
        }
    }

    async loadStatsFromFiles() {
        try {
            // Calcular estatísticas baseadas nos arquivos
            let totalViews = 0;
            let totalDownloads = 0;
            
            // Tentar buscar estatísticas do banco
            const { data: stats, error } = await this.supabase
                .from('material_stats')
                .select('*')
                .eq('material_group', 'PMG Academy - ITIL 4')
                .single();
            
            if (!error && stats) {
                this.stats.totalViews = stats.total_views || 0;
                this.stats.totalDownloads = stats.total_downloads || 0;
                this.stats.totalStudents = stats.total_students || 0;
            } else {
                // Calcular baseado nos arquivos
                this.files.forEach(file => {
                    totalViews += file.views || 0;
                    totalDownloads += file.downloads || 0;
                });
                
                this.stats.totalViews = totalViews;
                this.stats.totalDownloads = totalDownloads;
                this.stats.totalStudents = Math.floor(totalDownloads / 3); // Estimativa
            }
            
            // Salvar no localStorage para cache
            this.saveStatsToLocalStorage();
            
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar estatísticas:', error);
            // Usar valores padrão
            this.stats = {
                totalViews: this.files.length * 15,
                totalDownloads: this.files.length * 8,
                totalStudents: this.files.length * 5
            };
        }
    }

    renderFiles() {
        const filesListElement = document.getElementById('pmg-files-list');
        if (!filesListElement) {
            console.error('❌ Elemento pmg-files-list não encontrado');
            return;
        }
        
        if (this.files.length === 0) {
            filesListElement.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-database" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo encontrado</h4>
                    <p>Não foram encontrados arquivos da PMG Academy no banco de dados.</p>
                    <p style="font-size: 0.9em; margin-top: 10px; color: #7f8c8d;">
                        <i class="fas fa-info-circle"></i> Os arquivos devem estar na tabela 'materiais' com categoria 'ITIL 4' ou fonte 'PMG Academy'
                    </p>
                </div>
            `;
            return;
        }
        
        console.log(`🎨 Renderizando ${this.files.length} arquivos...`);
        
        // Agrupar arquivos por tipo
        const filesByType = {
            pdf: [],
            ppt: [],
            doc: [],
            html: [],
            outros: []
        };
        
        this.files.forEach(file => {
            // Determinar tipo pelo nome do arquivo ou extensão
            let tipo = 'outros';
            const fileName = (file.arquivo_nome || '').toLowerCase();
            const fileType = file.tipo || '';
            
            if (fileName.endsWith('.pdf') || fileType === 'pdf' || fileName.includes('.pdf')) {
                tipo = 'pdf';
            } else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || fileType === 'ppt') {
                tipo = 'ppt';
            } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx') || fileType === 'doc') {
                tipo = 'doc';
            } else if (fileName.endsWith('.html') || fileName.endsWith('.htm') || fileType === 'html') {
                tipo = 'html';
            }
            
            filesByType[tipo].push(file);
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
        
        // HTML
        if (filesByType.html.length > 0) {
            html += this.renderFileCategory('Simulados HTML', filesByType.html, '#9b59b6', 'fa-file-code');
        }
        
        // Outros
        if (filesByType.outros.length > 0) {
            html += this.renderFileCategory('Outros', filesByType.outros, '#7f8c8d', 'fa-file');
        }
        
        // Botão para baixar tudo
        if (this.files.length > 0) {
            html += `
                <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px dashed #ddd;">
                    <p style="color: #666; font-size: 0.9em; margin-bottom: 10px;">
                        <i class="fas fa-info-circle"></i> 
                        ${this.files.length} arquivos encontrados no banco de dados
                    </p>
                    <button class="download-all-btn" onclick="pmgManager.downloadAllFiles()">
                        <i class="fas fa-file-archive"></i>
                        Baixar Todos os Arquivos (${this.files.length})
                    </button>
                </div>
            `;
        }
        
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
                (file.arquivo_tamanho_kb / 1024).toFixed(1) + ' MB' : 
                (file.size ? (file.size / 1024 / 1024).toFixed(1) + ' MB' : 'N/A');
            
            const fileName = file.nome || file.arquivo_nome || `Arquivo ${index + 1}`;
            const fileId = file.id || `file-${index}`;
            const fileUrl = file.arquivo_url || file.url || '#';
            const isExternal = fileUrl.startsWith('http');
            
            // Formatar data
            let fileDate = '';
            if (file.created_at) {
                const date = new Date(file.created_at);
                fileDate = date.toLocaleDateString('pt-BR');
            }
            
            html += `
                <div class="file-item" data-file-id="${fileId}">
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div class="file-name" title="${fileName}">
                            ${fileName}
                        </div>
                        <div style="display: flex; gap: 10px; font-size: 0.8em; color: #7f8c8d; margin-top: 3px;">
                            ${fileDate ? `<span><i class="far fa-calendar"></i> ${fileDate}</span>` : ''}
                            ${file.categoria ? `<span><i class="fas fa-tag"></i> ${file.categoria}</span>` : ''}
                        </div>
                    </div>
                    <span class="file-size">${fileSize}</span>
                    <div class="file-actions">
                        <a href="${fileUrl}" 
                           ${isExternal ? 'target="_blank"' : ''}
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
        const fileCountElement = document.getElementById('pmg-file-count');
        if (fileCountElement) {
            fileCountElement.textContent = this.files.length;
        }
        
        const totalSizeKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
        const totalSizeMB = (totalSizeKB / 1024).toFixed(1);
        const totalSizeElement = document.getElementById('pmg-total-size');
        if (totalSizeElement) {
            totalSizeElement.textContent = totalSizeMB + ' MB';
        }
        
        // Atualizar contador geral também
        const totalMaterialsElement = document.getElementById('totalMaterials');
        if (totalMaterialsElement) {
            totalMaterialsElement.textContent = this.files.length;
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

    saveStatsToLocalStorage() {
        try {
            localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('⚠️ Erro ao salvar estatísticas no localStorage:', e);
        }
    }

    loadStatsFromLocalStorage() {
        try {
            const stats = localStorage.getItem('pmg_academy_stats');
            if (stats) {
                this.stats = JSON.parse(stats);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar estatísticas do localStorage:', e);
        }
    }

    trackView(fileId) {
        this.stats.totalViews++;
        this.updateStatsUI();
        this.saveStatsToLocalStorage();
        
        // Atualizar no banco (opcional)
        this.updateStatsInDatabase();
        
        console.log(`👁️ Visualização: ${fileId}`);
    }

    trackDownload(fileId) {
        this.stats.totalDownloads++;
        this.updateStatsUI();
        this.saveStatsToLocalStorage();
        
        // Atualizar no banco (opcional)
        this.updateStatsInDatabase();
        
        console.log(`📥 Download: ${fileId}`);
    }

    async updateStatsInDatabase() {
        try {
            await this.supabase
                .from('material_stats')
                .upsert({
                    material_group: 'PMG Academy - ITIL 4',
                    total_views: this.stats.totalViews,
                    total_downloads: this.stats.totalDownloads,
                    total_students: this.stats.totalStudents,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'material_group'
                });
        } catch (error) {
            console.warn('⚠️ Não foi possível atualizar estatísticas no banco:', error);
        }
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

    retryLoadFiles() {
        console.log('🔄 Tentando carregar arquivos novamente...');
        this.loadPMGFiles();
    }

    showErrorInUI(message) {
        const loadingElement = document.getElementById('pmg-files-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <div style="margin-top: 15px;">
                        <button onclick="pmgManager.debugDatabase()" 
                                style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-bug"></i> Depurar Banco
                        </button>
                        <button onclick="pmgManager.retryLoadFiles()" 
                                style="background: #2ecc71; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Tentar novamente
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async debugDatabase() {
        console.log('🔧 Iniciando depuração do banco de dados...');
        
        try {
            // 1. Listar todas as tabelas disponíveis
            console.log('📋 Listando informações do banco...');
            
            // Testar várias tabelas possíveis
            const tables = ['materiais', 'materials', 'arquivos', 'files', 'simulados', 'study_materials'];
            
            for (const table of tables) {
                console.log(`🔍 Testando tabela: ${table}`);
                try {
                    const { data, error } = await this.supabase
                        .from(table)
                        .select('*')
                        .limit(3);
                    
                    if (!error && data) {
                        console.log(`✅ Tabela "${table}" encontrada com ${data.length} registros`);
                        console.log('📊 Amostra de dados:', data);
                        
                        // Mostrar na tela
                        alert(`Tabela "${table}" encontrada!\n\nRegistros: ${data.length}\n\nAmostra:\n${JSON.stringify(data, null, 2)}`);
                        return;
                    }
                } catch (err) {
                    console.log(`❌ Tabela "${table}" não encontrada ou erro:`, err.message);
                }
            }
            
            alert('❌ Nenhuma tabela de materiais encontrada no banco de dados.\n\nVerifique se os arquivos foram cadastrados corretamente.');
            
        } catch (error) {
            console.error('❌ Erro na depuração:', error);
            alert(`Erro na depuração: ${error.message}`);
        }
    }

    handleError(message) {
        console.error(`❌ ${message}`);
        this.hasError = true;
        this.showErrorInUI(message);
    }
}

// Inicialização automática
console.log('📚 PMG Academy Manager carregado');
window.PMGAcademyManager = PMGAcademyManager;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando PMG Academy Manager...');
    window.pmgManager = new PMGAcademyManager();
    
    // Se estiver na página ITIL 4, carregar automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    const cert = urlParams.get('cert');
    
    if (cert === 'itil4') {
        setTimeout(() => {
            const pmgCard = document.querySelector('.pmg-academy-card');
            if (pmgCard) {
                console.log('🎯 Abrindo card PMG Academy automaticamente...');
                togglePmgFiles();
            }
        }, 1000);
    }
});
