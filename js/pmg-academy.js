// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Corrigido para usar configuração do config.js

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
            // Verificar se as dependências estão carregadas
            if (typeof supabase === 'undefined') {
                throw new Error('Biblioteca Supabase não carregada');
            }
            
            if (typeof SUPABASE_CONFIG === 'undefined') {
                console.warn('⚠️ SUPABASE_CONFIG não encontrado, usando configuração padrão');
                // Configuração de fallback
                const fallbackConfig = {
                    url: 'https://uhbwudgdeyvbkqoflaqw.supabase.co',
                    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY'
                };
                
                this.supabase = supabase.createClient(
                    fallbackConfig.url,
                    fallbackConfig.anonKey,
                    {
                        auth: { persistSession: false },
                        global: { headers: { 'apikey': fallbackConfig.anonKey } }
                    }
                );
            } else {
                console.log('✅ Usando configuração do config.js');
                
                // IMPORTANTE: Se a chave publicável não funcionar, use a chave anon correta
                // A chave no config.js é: sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4
                // Esta é uma chave pública - pode não ter permissão para ler a tabela materiais
                
                // Tentar com a chave do config.js
                try {
                    this.supabase = supabase.createClient(
                        SUPABASE_CONFIG.url,
                        SUPABASE_CONFIG.anonKey,
                        {
                            auth: { persistSession: false },
                            global: { headers: { 'apikey': SUPABASE_CONFIG.anonKey } }
                        }
                    );
                    
                    // Testar a conexão
                    const { error: testError } = await this.supabase
                        .from('materiais')
                        .select('count')
                        .limit(1);
                    
                    if (testError) {
                        console.warn('⚠️ Chave pública falhou, tentando chave anon...');
                        throw testError;
                    }
                    
                } catch (keyError) {
                    console.warn('⚠️ Problema com a chave, usando chave anon direta...');
                    // Usar chave anon diretamente
                    const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
                    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY';
                    
                    this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                        auth: { persistSession: false }
                    });
                }
            }
            
            console.log('✅ Supabase inicializado');
            
            // Carregar estatísticas iniciais
            this.loadInitialStats();
            this.updateStatsUI();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.handleError('Erro na conexão com o banco de dados');
        }
    }

    async loadPMGFiles() {
        if (this.isLoading) return;
        
        console.log('📥 Carregando arquivos...');
        
        this.isLoading = true;
        const loadingElement = document.getElementById('pmg-files-loading');
        
        try {
            // Mostrar loading
            if (loadingElement) {
                loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Conectando ao banco de dados...</span>';
                loadingElement.style.display = 'block';
            }
            
            // Verificar conexão
            if (!this.supabase) {
                throw new Error('Conexão com Supabase não estabelecida');
            }
            
            // TENTATIVA 1: Consulta básica à tabela materiais
            console.log('🔍 Buscando na tabela materiais...');
            const { data: materials, error } = await this.supabase
                .from('materiais')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) {
                console.error('❌ Erro na consulta materiais:', error);
                
                // TENTATIVA 2: Verificar se a tabela existe com consulta mais simples
                console.log('🔄 Tentando consulta alternativa...');
                const { data: testData, error: testError } = await this.supabase
                    .from('materiais')
                    .select('id, nome')
                    .limit(5);
                
                if (testError) {
                    console.error('❌ Tabela materiais não acessível:', testError);
                    
                    // TENTATIVA 3: Verificar outras tabelas possíveis
                    console.log('🔍 Verificando outras tabelas...');
                    await this.checkOtherTables();
                    
                    return;
                }
                
                this.files = testData || [];
            } else {
                this.files = materials || [];
                console.log(`✅ ${this.files.length} materiais encontrados`);
            }
            
            // Processar e exibir os arquivos
            this.processAndDisplayFiles();
            
        } catch (error) {
            console.error('❌ Erro ao carregar:', error);
            this.showError('Erro: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async checkOtherTables() {
        // Lista de tabelas possíveis onde os arquivos podem estar
        const possibleTables = ['files', 'arquivos', 'documents', 'study_materials', 'simulados'];
        
        for (const table of possibleTables) {
            try {
                console.log(`🔍 Verificando tabela: ${table}`);
                const { data, error } = await this.supabase
                    .from(table)
                    .select('*')
                    .limit(5);
                
                if (!error && data && data.length > 0) {
                    console.log(`✅ Tabela "${table}" encontrada com ${data.length} registros`);
                    
                    // Converter para formato padrão
                    this.files = data.map(item => ({
                        id: item.id,
                        nome: item.nome || item.title || item.filename,
                        descricao: item.descricao || item.description || '',
                        arquivo_url: item.arquivo_url || item.url || item.file_url,
                        arquivo_nome: item.arquivo_nome || item.filename,
                        arquivo_tamanho_kb: item.arquivo_tamanho_kb || item.size_kb,
                        categoria: item.categoria || item.category || 'Geral',
                        fonte: item.fonte || item.source || 'StudyCert',
                        created_at: item.created_at || item.upload_date
                    }));
                    
                    this.processAndDisplayFiles();
                    return;
                }
            } catch (err) {
                console.log(`❌ Tabela "${table}" não encontrada ou erro:`, err.message);
            }
        }
        
        // Se nenhuma tabela funcionou, usar dados de exemplo
        console.log('📋 Nenhuma tabela encontrada, usando dados de exemplo');
        this.files = this.getExampleFiles();
        this.processAndDisplayFiles();
    }

    processAndDisplayFiles() {
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        // Filtrar para ITIL/PMG (para teste, mostrar todos primeiro)
        const filteredFiles = this.files.filter(file => {
            // Para debug, mostrar todos os arquivos
            const showAll = true; // Mude para false depois do teste
            
            if (showAll) return true;
            
            const categoria = (file.categoria || '').toLowerCase();
            const nome = (file.nome || '').toLowerCase();
            const fonte = (file.fonte || '').toLowerCase();
            
            return categoria.includes('itil') || 
                   nome.includes('itil') || 
                   nome.includes('pmg') ||
                   fonte.includes('pmg');
        });
        
        this.files = filteredFiles;
        
        console.log(`📦 ${this.files.length} arquivos para exibição`);
        
        // Esconder loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Renderizar
        if (filesListElement) {
            filesListElement.style.display = 'block';
            this.renderFiles();
        }
        
        this.updateFileCounters();
        this.updateStatsUI();
    }

    getExampleFiles() {
        return [
            {
                id: 'ex1',
                nome: 'ITIL 4 Foundation - Guia PMG Academy',
                descricao: 'Material completo da PMG Academy para certificação ITIL 4 Foundation',
                arquivo_url: '#',
                arquivo_nome: 'itil4-pmg-guia.pdf',
                arquivo_tamanho_kb: 12000,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-15T10:30:00Z'
            },
            {
                id: 'ex2',
                nome: 'Apresentação ITIL 4 - Conceitos',
                descricao: 'Apresentação em PowerPoint sobre conceitos fundamentais',
                arquivo_url: '#',
                arquivo_nome: 'itil4-conceitos.pptx',
                arquivo_tamanho_kb: 8500,
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-16T14:20:00Z'
            }
        ];
    }

    renderFiles() {
        const filesListElement = document.getElementById('pmg-files-list');
        if (!filesListElement) return;
        
        if (this.files.length === 0) {
            filesListElement.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo encontrado</h4>
                    <p>Não foram encontrados arquivos no banco de dados.</p>
                    <p style="font-size: 0.9em; margin-top: 10px; color: #7f8c8d;">
                        <i class="fas fa-info-circle"></i> Verifique se os arquivos estão na tabela 'materiais'
                    </p>
                    <button onclick="pmgManager.debugConnection()" 
                            style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                        <i class="fas fa-wifi"></i> Testar Conexão
                    </button>
                </div>
            `;
            return;
        }
        
        console.log(`🎨 Renderizando ${this.files.length} arquivos`);
        
        // Informação sobre origem dos dados
        let infoHtml = '';
        if (this.files.some(f => f.id && f.id.startsWith('ex'))) {
            infoHtml = `
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin-bottom: 20px; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 0.9em;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Modo de demonstração: Dados de exemplo
                    </p>
                </div>
            `;
        } else {
            infoHtml = `
                <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 10px 15px; margin-bottom: 20px; border-radius: 4px;">
                    <p style="margin: 0; color: #0c5460; font-size: 0.9em;">
                        <i class="fas fa-database"></i>
                        Conectado ao banco de dados: ${this.files.length} arquivos encontrados
                    </p>
                </div>
            `;
        }
        
        let html = infoHtml;
        
        // Agrupar por categoria
        const groupedByCategory = {};
        this.files.forEach(file => {
            const category = file.categoria || 'Geral';
            if (!groupedByCategory[category]) {
                groupedByCategory[category] = [];
            }
            groupedByCategory[category].push(file);
        });
        
        // Renderizar por categoria
        Object.entries(groupedByCategory).forEach(([category, files]) => {
            const color = this.getCategoryColor(category);
            
            html += `
                <div class="file-category">
                    <h5 style="color: ${color};">
                        <i class="fas ${this.getCategoryIcon(category)}"></i> ${category} (${files.length})
                    </h5>
                    <div class="file-list">
            `;
            
            files.forEach((file, index) => {
                html += this.renderFileItem(file, index);
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        // Botão de download
        if (this.files.length > 0) {
            html += `
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="pmgManager.downloadAllFiles()" class="download-all-btn">
                        <i class="fas fa-download"></i> Baixar Todos os Arquivos (${this.files.length})
                    </button>
                </div>
            `;
        }
        
        filesListElement.innerHTML = html;
    }

    renderFileItem(file, index) {
        const fileId = file.id || `file-${index}`;
        const fileName = file.nome || file.arquivo_nome || `Arquivo ${index + 1}`;
        const fileDesc = file.descricao || 'Sem descrição';
        const fileUrl = file.arquivo_url || file.url || '#';
        const fileSize = file.arquivo_tamanho_kb ? 
            (file.arquivo_tamanho_kb / 1024).toFixed(1) + ' MB' : 'N/A';
        
        const fileType = this.getFileType(file);
        const typeColor = this.getTypeColor(fileType);
        const typeIcon = this.getTypeIcon(fileType);
        
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
                    <div style="display: flex; gap: 10px; font-size: 0.75em; color: #95a5a6; margin-top: 5px;">
                        ${file.categoria ? `<span><i class="fas fa-tag"></i> ${file.categoria}</span>` : ''}
                        ${file.fonte ? `<span><i class="fas fa-building"></i> ${file.fonte}</span>` : ''}
                    </div>
                </div>
                <span class="file-size">${fileSize}</span>
                <div class="file-actions">
                    ${fileUrl !== '#' ? `
                        <a href="${fileUrl}" target="_blank" class="btn-view" onclick="pmgManager.trackView('${fileId}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="${fileUrl}" download="${fileName}" class="btn-download" onclick="pmgManager.trackDownload('${fileId}')" title="Baixar">
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

    // Métodos auxiliares
    getFileType(file) {
        const fileName = (file.arquivo_nome || '').toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'ppt';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'doc';
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
        return 'other';
    }

    getTypeColor(type) {
        const colors = { pdf: '#e74c3c', ppt: '#e67e22', doc: '#3498db', html: '#9b59b6', other: '#7f8c8d' };
        return colors[type] || colors.other;
    }

    getTypeIcon(type) {
        const icons = { pdf: 'fa-file-pdf', ppt: 'fa-file-powerpoint', doc: 'fa-file-word', html: 'fa-file-code', other: 'fa-file' };
        return icons[type] || icons.other;
    }

    getCategoryColor(category) {
        const colors = { 'ITIL 4': '#154360', 'ITIL': '#1B4F72', 'Azure': '#0078D4', 'AWS': '#FF9900', 'Linux': '#E95420' };
        return colors[category] || '#2C3E50';
    }

    getCategoryIcon(category) {
        const icons = { 'ITIL 4': 'fa-cube', 'ITIL': 'fa-cube', 'Azure': 'fa-microsoft', 'AWS': 'fa-aws', 'Linux': 'fa-server' };
        return icons[category] || 'fa-folder';
    }

    updateFileCounters() {
        const fileCountElement = document.getElementById('pmg-file-count');
        const totalSizeElement = document.getElementById('pmg-total-size');
        
        if (fileCountElement) {
            fileCountElement.textContent = this.files.length;
        }
        
        if (totalSizeElement) {
            const totalKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
            totalSizeElement.textContent = (totalKB / 1024).toFixed(1) + ' MB';
        }
    }

    loadInitialStats() {
        try {
            const saved = localStorage.getItem('pmg_stats');
            if (saved) {
                this.stats = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Erro ao carregar estatísticas:', e);
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
        localStorage.setItem('pmg_stats', JSON.stringify(this.stats));
    }

    trackDownload(fileId) {
        this.stats.totalDownloads++;
        this.updateStatsUI();
        localStorage.setItem('pmg_stats', JSON.stringify(this.stats));
    }

    downloadAllFiles() {
        if (this.files.length === 0) {
            alert('Nenhum arquivo disponível para download.');
            return;
        }
        
        if (confirm(`Baixar ${this.files.length} arquivos?`)) {
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
        }
    }

    async debugConnection() {
        try {
            alert('Testando conexão com o Supabase...\n\nURL: ' + SUPABASE_CONFIG.url);
            
            const { data, error } = await this.supabase
                .from('materiais')
                .select('count')
                .limit(1);
            
            if (error) {
                alert('❌ Erro: ' + error.message);
            } else {
                alert('✅ Conexão bem-sucedida!\n\nPronto para carregar arquivos.');
                this.loadPMGFiles();
            }
        } catch (err) {
            alert('❌ Erro no teste: ' + err.message);
        }
    }

    showError(message) {
        const loadingElement = document.getElementById('pmg-files-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: #e74c3c; text-align: center; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    <p>${message}</p>
                    <div style="margin-top: 15px;">
                        <button onclick="pmgManager.debugConnection()" 
                                style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-wifi"></i> Testar Conexão
                        </button>
                        <button onclick="pmgManager.loadPMGFiles()" 
                                style="background: #2ecc71; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Tentar Novamente
                        </button>
                    </div>
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

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando PMG Manager...');
    window.pmgManager = new PMGAcademyManager();
    
    // Se estiver na página ITIL 4, abrir automaticamente após um delay
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cert') === 'itil4') {
        setTimeout(() => {
            if (window.togglePmgFiles) {
                togglePmgFiles();
            }
        }, 1000);
    }
});

// Exportar para uso global
window.PMGAcademyManager = PMGAcademyManager;
