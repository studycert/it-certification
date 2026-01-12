// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Corrigido

class PMGAcademyManager {
    constructor() {
        this.supabase = null;
        this.files = [];
        this.stats = {
            totalViews: 0,
            totalDownloads: 0,
            totalStudents: 1247
        };
        this.isLoading = false;
        this.hasError = false;
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando PMG Academy Manager...');
        
        try {
            // Inicializar Supabase com configurações seguras
            const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
            const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY';
            
            // Verificar se Supabase está disponível
            if (typeof supabase === 'undefined') {
                console.error('❌ Supabase não está disponível');
                this.handleError('Biblioteca Supabase não carregada');
                return;
            }
            
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            
            console.log('✅ Supabase inicializado');
            
            // Carregar estatísticas iniciais
            await this.loadInitialStats();
            
            // Atualizar interface
            this.updateStatsUI();
            this.updateFileCounters();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar PMG Academy Manager:', error);
            this.handleError('Erro na inicialização');
        }
    }

    async loadPMGFiles() {
        if (this.isLoading) {
            console.log('⚠️ Já está carregando arquivos...');
            return;
        }
        
        console.log('📥 Carregando arquivos PMG Academy...');
        
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
            if (filesListElement) {
                filesListElement.style.display = 'none';
                filesListElement.innerHTML = '';
            }
            
            // Verificar conexão com Supabase
            if (!this.supabase) {
                throw new Error('Conexão com Supabase não disponível');
            }
            
            // Buscar arquivos do Supabase - consulta mais simples e segura
            console.log('🔍 Buscando arquivos no banco...');
            
            let query = this.supabase
                .from('materiais')
                .select('*')
                .limit(20);
            
            // Primeiro, tentar buscar todos os materiais
            const { data: allFiles, error: allError } = await query;
            
            if (allError) {
                console.warn('⚠️ Erro na consulta geral:', allError);
                throw allError;
            }
            
            console.log(`📄 Total de materiais encontrados: ${allFiles ? allFiles.length : 0}`);
            
            // Filtrar localmente por PMG Academy
            this.files = allFiles ? allFiles.filter(file => {
                const categoria = file.categoria || '';
                const fonte = file.fonte || '';
                const nome = file.nome || '';
                
                // Verificar se é da PMG Academy
                return categoria.includes('ITIL') || 
                       fonte.includes('PMG') || 
                       fonte.includes('pmg') ||
                       nome.includes('PMG') ||
                       nome.includes('pmg');
            }) : [];
            
            console.log(`📦 Arquivos PMG Academy filtrados: ${this.files.length}`);
            
            // Se não encontrou arquivos específicos, usar dados de exemplo
            if (this.files.length === 0) {
                console.log('📋 Nenhum arquivo PMG encontrado, usando dados de exemplo');
                this.files = this.getExampleFiles();
            }
            
            // Esconder loading e mostrar arquivos
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }
            if (filesListElement) {
                filesListElement.style.display = 'block';
                this.renderFiles();
            }
            
            // Atualizar contadores
            this.updateFileCounters();
            
            console.log('✅ Arquivos carregados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao carregar arquivos PMG:', error);
            this.hasError = true;
            
            // Mostrar mensagem de erro amigável
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Não foi possível carregar os arquivos.</p>
                        <p style="font-size: 0.9em; margin-top: 10px;">
                            <button onclick="pmgManager.retryLoadFiles()" 
                                    style="background: #4ECDC4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-redo"></i> Tentar novamente
                            </button>
                        </p>
                    </div>
                `;
            }
            
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
                nome: 'ITIL 4 Foundation - Guia Completo PMG Academy',
                descricao: 'Material completo da PMG Academy para certificação ITIL 4 Foundation',
                arquivo_url: '#',
                arquivo_nome: 'itil4-pmg-guia-completo.pdf',
                arquivo_tamanho_kb: 12400,
                tipo: 'pdf',
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-15T10:30:00Z'
            },
            {
                id: '2',
                nome: 'Apresentação ITIL 4 - Módulo 1',
                descricao: 'Apresentação PPT do módulo 1 da PMG Academy',
                arquivo_url: '#',
                arquivo_nome: 'itil4-modulo1.ppt',
                arquivo_tamanho_kb: 7800,
                tipo: 'ppt',
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-16T14:20:00Z'
            },
            {
                id: '3',
                nome: 'Exercícios Resolvidos ITIL 4',
                descricao: 'Lista de exercícios com gabarito da PMG Academy',
                arquivo_url: '#',
                arquivo_nome: 'exercicios-itil4.docx',
                arquivo_tamanho_kb: 5200,
                tipo: 'doc',
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-17T09:15:00Z'
            },
            {
                id: '4',
                nome: 'Resumo Conceitos Fundamentais',
                descricao: 'Resumo dos conceitos básicos do ITIL 4',
                arquivo_url: '#',
                arquivo_nome: 'resumo-conceitos.pdf',
                arquivo_tamanho_kb: 8200,
                tipo: 'pdf',
                categoria: 'ITIL 4',
                fonte: 'PMG Academy',
                created_at: '2024-01-18T11:45:00Z'
            }
        ];
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
                    <i class="fas fa-folder-open" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo disponível</h4>
                    <p>Os arquivos da PMG Academy estarão disponíveis em breve.</p>
                </div>
            `;
            return;
        }
        
        // Agrupar arquivos por tipo
        const filesByType = {
            pdf: [],
            ppt: [],
            doc: [],
            outros: []
        };
        
        this.files.forEach(file => {
            const ext = file.tipo || (file.arquivo_nome ? file.arquivo_nome.split('.').pop().toLowerCase() : 'outros');
            
            if (ext === 'pdf') {
                filesByType.pdf.push(file);
            } else if (['ppt', 'pptx'].includes(ext)) {
                filesByType.ppt.push(file);
            } else if (['doc', 'docx'].includes(ext)) {
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
        
        // Botão para baixar tudo (se houver arquivos)
        if (this.files.length > 0) {
            html += `
                <button class="download-all-btn" onclick="pmgManager.downloadAllFiles()" style="margin-top: 20px;">
                    <i class="fas fa-file-archive"></i>
                    Baixar Todos os Arquivos (${this.files.length})
                </button>
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
                'N/A';
            
            const fileName = file.nome || file.arquivo_nome || `Arquivo ${index + 1}`;
            const fileId = file.id || `file-${index}`;
            const fileUrl = file.arquivo_url || '#';
            
            html += `
                <div class="file-item" data-file-id="${fileId}">
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    <span class="file-name" title="${fileName}">
                        ${fileName}
                    </span>
                    <span class="file-size">${fileSize}</span>
                    <div class="file-actions">
                        <a href="${fileUrl}" 
                           target="_blank" 
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
        // Atualizar contagem de arquivos
        const fileCountElement = document.getElementById('pmg-file-count');
        if (fileCountElement) {
            fileCountElement.textContent = this.files.length;
        }
        
        // Calcular tamanho total
        const totalSizeKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
        const totalSizeMB = (totalSizeKB / 1024).toFixed(1);
        const totalSizeElement = document.getElementById('pmg-total-size');
        if (totalSizeElement) {
            totalSizeElement.textContent = totalSizeMB + ' MB';
        }
    }

    async loadInitialStats() {
        try {
            // Carregar do localStorage primeiro
            this.loadStatsFromLocalStorage();
            
            // Tentar carregar do banco (opcional)
            if (this.supabase) {
                try {
                    const { data: stats, error } = await this.supabase
                        .from('material_stats')
                        .select('*')
                        .eq('material_group', 'PMG Academy - ITIL 4')
                        .single();
                    
                    if (!error && stats) {
                        this.stats = {
                            totalViews: stats.total_views || 0,
                            totalDownloads: stats.total_downloads || 0,
                            totalStudents: stats.total_students || 1247
                        };
                        
                        // Salvar no localStorage
                        this.saveStatsToLocalStorage();
                    }
                } catch (dbError) {
                    console.warn('⚠️ Não foi possível carregar estatísticas do banco:', dbError);
                }
            }
            
        } catch (error) {
            console.warn('⚠️ Erro ao carregar estatísticas:', error);
        }
    }

    loadStatsFromLocalStorage() {
        try {
            const stats = localStorage.getItem('pmg_academy_stats');
            if (stats) {
                const parsed = JSON.parse(stats);
                this.stats = {
                    totalViews: parsed.totalViews || 0,
                    totalDownloads: parsed.totalDownloads || 0,
                    totalStudents: parsed.totalStudents || 1247
                };
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar estatísticas do localStorage:', e);
        }
    }

    saveStatsToLocalStorage() {
        try {
            localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('⚠️ Erro ao salvar estatísticas no localStorage:', e);
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
        try {
            // Incrementar contador local
            this.stats.totalViews++;
            this.updateStatsUI();
            this.saveStatsToLocalStorage();
            
            console.log(`👁️ Visualização registrada para arquivo: ${fileId}`);
            
            // Mostrar notificação
            if (window.showNotification) {
                window.showNotification('Visualização registrada!', 'success');
            }
            
        } catch (error) {
            console.error('❌ Erro ao registrar visualização:', error);
        }
    }

    trackDownload(fileId) {
        try {
            // Incrementar contador local
            this.stats.totalDownloads++;
            this.updateStatsUI();
            this.saveStatsToLocalStorage();
            
            console.log(`📥 Download registrado para arquivo: ${fileId}`);
            
            // Mostrar notificação
            if (window.showNotification) {
                window.showNotification('Download iniciado!', 'success');
            }
            
        } catch (error) {
            console.error('❌ Erro ao registrar download:', error);
        }
    }

    downloadAllFiles() {
        try {
            if (this.files.length === 0) {
                alert('Nenhum arquivo disponível para download.');
                return;
            }
            
            if (confirm(`Deseja baixar todos os ${this.files.length} arquivos do PMG Academy?\n\nOs arquivos serão baixados individualmente.`)) {
                // Registrar download múltiplo
                this.trackDownload('all');
                
                // Mostrar notificação
                if (window.showNotification) {
                    window.showNotification(`Iniciando download de ${this.files.length} arquivos...`, 'info');
                }
                
                // Simular download (em ambiente real, os links funcionariam)
                this.files.forEach((file, index) => {
                    setTimeout(() => {
                        if (file.arquivo_url && file.arquivo_url !== '#') {
                            const link = document.createElement('a');
                            link.href = file.arquivo_url;
                            link.download = file.nome || file.arquivo_nome || `arquivo-${index + 1}`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        } else {
                            console.log(`Arquivo ${index + 1}: ${file.nome} - Link não disponível`);
                        }
                    }, index * 500);
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao baixar arquivos:', error);
            if (window.showNotification) {
                window.showNotification('Erro ao baixar arquivos. Tente novamente.', 'error');
            }
        }
    }

    retryLoadFiles() {
        console.log('🔄 Tentando carregar arquivos novamente...');
        this.loadPMGFiles();
    }

    handleError(message) {
        console.error(`❌ ${message}`);
        this.hasError = true;
        
        // Atualizar interface com estado de erro
        const loadingElement = document.getElementById('pmg-files-loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        Usando dados de demonstração...
                    </p>
                </div>
            `;
        }
        
        // Usar dados de exemplo
        this.files = this.getExampleFiles();
        this.updateFileCounters();
        this.updateStatsUI();
    }

    showNotification(message, type = 'info') {
        // Esta função será chamada pela função global showNotification
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
}

// Inicializar automaticamente quando o script carregar
console.log('📚 PMG Academy Manager carregado');
window.PMGAcademyManager = PMGAcademyManager;

// Função auxiliar para expor métodos globalmente
window.pmgManager = null;

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Inicializando PMG Academy Manager...');
        window.pmgManager = new PMGAcademyManager();
    });
} else {
    console.log('🚀 Inicializando PMG Academy Manager (DOM já carregado)...');
    window.pmgManager = new PMGAcademyManager();
}
