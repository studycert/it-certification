// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Mostra TODOS os arquivos e corrige botões

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
            // Usar a configuração do config.js
            if (typeof SUPABASE_CONFIG === 'undefined') {
                throw new Error('Configuração do Supabase não encontrada');
            }
            
            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                {
                    auth: { persistSession: false },
                    global: { 
                        headers: { 
                            'apikey': SUPABASE_CONFIG.anonKey,
                            'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                        } 
                    }
                }
            );
            
            console.log('✅ Supabase inicializado com sucesso');
            
            // Testar conexão
            await this.testConnection();
            
        } catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            this.handleError('Erro na inicialização: ' + error.message);
        }
    }

    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('materiais')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            console.log('✅ Conexão testada com sucesso');
            
        } catch (error) {
            console.error('❌ Falha no teste de conexão:', error);
            throw error;
        }
    }

    async loadPMGFiles() {
        if (this.isLoading) return;
        
        console.log('📥 Buscando TODOS os arquivos da tabela materiais...');
        
        this.isLoading = true;
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        try {
            // Mostrar loading
            if (loadingElement) {
                loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Carregando todos os arquivos...</span>';
                loadingElement.style.display = 'block';
            }
            
            // BUSCA 1: Buscar TODOS os materiais SEM filtro
            console.log('🔍 Buscando todos os materiais (sem filtro)...');
            const { data: allMaterials, error } = await this.supabase
                .from('materiais')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Erro na busca completa:', error);
                throw error;
            }
            
            console.log(`📊 Total encontrado: ${allMaterials ? allMaterials.length : 0} arquivos`);
            
            // MOSTRAR TUDO no console para debug
            if (allMaterials && allMaterials.length > 0) {
                console.log('📋 Lista completa de arquivos:');
                allMaterials.forEach((file, index) => {
                    console.log(`${index + 1}. ${file.nome || 'Sem nome'} | Categoria: ${file.categoria || 'N/A'} | Fonte: ${file.fonte || 'N/A'} | URL: ${file.arquivo_url ? 'SIM' : 'NÃO'}`);
                });
            }
            
            // Usar TODOS os arquivos encontrados (SEM FILTRAR)
            this.files = allMaterials || [];
            
            console.log(`📦 Mostrando ${this.files.length} arquivos (todos)`);
            
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
            this.updateStatsUI();
            
            console.log('✅ Todos os arquivos carregados com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao carregar arquivos:', error);
            this.showError('Erro ao carregar: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    renderFiles() {
        const filesListElement = document.getElementById('pmg-files-list');
        if (!filesListElement) return;
        
        if (this.files.length === 0) {
            filesListElement.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo encontrado</h4>
                    <p>A tabela 'materiais' está vazia.</p>
                </div>
            `;
            return;
        }
        
        console.log(`🎨 Renderizando ${this.files.length} arquivos`);
        
        // Agrupar por categoria para organização
        const groupedByCategory = {};
        this.files.forEach(file => {
            const category = file.categoria || 'Geral';
            if (!groupedByCategory[category]) {
                groupedByCategory[category] = [];
            }
            groupedByCategory[category].push(file);
        });
        
        let html = `
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 10px 15px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #155724; font-size: 0.9em;">
                    <i class="fas fa-database"></i>
                    ${this.files.length} arquivos encontrados no banco de dados
                </p>
            </div>
        `;
        
        // Renderizar cada categoria
        Object.entries(groupedByCategory).forEach(([category, files]) => {
            html += this.renderCategorySection(category, files);
        });
        
        // Botão para baixar todos
        if (this.files.length > 0) {
            html += `
                <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                    <button onclick="pmgManager.downloadAllFiles()" class="download-all-btn">
                        <i class="fas fa-download"></i> Baixar Todos os ${this.files.length} Arquivos
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
        
        // Formatar data se disponível
        let fileDate = '';
        if (file.created_at) {
            try {
                const date = new Date(file.created_at);
                fileDate = date.toLocaleDateString('pt-BR');
            } catch (e) {
                console.warn('Erro ao formatar data:', e);
            }
        }
        
        // Verificar se a URL é válida
        const hasValidUrl = fileUrl && fileUrl !== '#' && fileUrl !== 'undefined' && fileUrl.startsWith('http');
        
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
                        ${fileDate ? `<span><i class="far fa-calendar"></i> ${fileDate}</span>` : ''}
                        ${hasValidUrl ? `<span style="color: #27ae60;"><i class="fas fa-check-circle"></i> Disponível</span>` : 
                          `<span style="color: #e74c3c;"><i class="fas fa-times-circle"></i> Sem link</span>`}
                    </div>
                </div>
                <span class="file-size">${fileSize}</span>
                <div class="file-actions">
                    ${hasValidUrl ? `
                        <a href="${fileUrl}" 
                           target="_blank" 
                           class="btn-view" 
                           onclick="event.stopPropagation(); pmgManager.trackView('${fileId}');" 
                           title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="${fileUrl}" 
                           download="${fileName.replace(/[^a-z0-9.]/gi, '_')}" 
                           class="btn-download" 
                           onclick="event.stopPropagation(); pmgManager.trackDownload('${fileId}');" 
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

    getFileType(file) {
        const fileName = (file.arquivo_nome || '').toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'ppt';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'doc';
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
        if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z')) return 'zip';
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) return 'image';
        if (fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov')) return 'video';
        if (fileName.endsWith('.mp3') || fileName.endsWith('.wav')) return 'audio';
        return 'other';
    }

    getTypeColor(type) {
        const colors = {
            pdf: '#e74c3c',
            ppt: '#e67e22',
            doc: '#3498db',
            html: '#9b59b6',
            zip: '#2ecc71',
            image: '#e74c8c',
            video: '#8e44ad',
            audio: '#f39c12',
            other: '#7f8c8d'
        };
        return colors[type] || colors.other;
    }

    getTypeIcon(type) {
        const icons = {
            pdf: 'fa-file-pdf',
            ppt: 'fa-file-powerpoint',
            doc: 'fa-file-word',
            html: 'fa-file-code',
            zip: 'fa-file-archive',
            image: 'fa-file-image',
            video: 'fa-file-video',
            audio: 'fa-file-audio',
            other: 'fa-file'
        };
        return icons[type] || icons.other;
    }

    getCategoryColor(category) {
        const colors = {
            'ITIL 4': '#154360',
            'ITIL': '#1B4F72',
            'Azure': '#0078D4',
            'AWS': '#FF9900',
            'Linux': '#E95420',
            'Security': '#27ae60',
            'Cloud': '#3498db',
            'Redes': '#9b59b6',
            'Dados': '#16a085',
            'Geral': '#2C3E50'
        };
        return colors[category] || '#2C3E50';
    }

    getCategoryIcon(category) {
        const icons = {
            'ITIL 4': 'fa-cube',
            'ITIL': 'fa-cube',
            'Azure': 'fa-microsoft',
            'AWS': 'fa-aws',
            'Linux': 'fa-server',
            'Security': 'fa-shield-alt',
            'Cloud': 'fa-cloud',
            'Redes': 'fa-network-wired',
            'Dados': 'fa-database',
            'Geral': 'fa-folder'
        };
        return icons[category] || 'fa-folder';
    }

    updateFileCounters() {
        const fileCountElement = document.getElementById('pmg-file-count');
        if (fileCountElement) {
            fileCountElement.textContent = this.files.length;
        }
        
        const totalSizeElement = document.getElementById('pmg-total-size');
        if (totalSizeElement) {
            const totalKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
            totalSizeElement.textContent = (totalKB / 1024).toFixed(1) + ' MB';
        }
        
        // Atualizar também os contadores gerais da página
        const totalMaterialsElement = document.getElementById('totalMaterials');
        if (totalMaterialsElement) {
            totalMaterialsElement.textContent = this.files.length;
        }
        
        const totalSizeGlobalElement = document.getElementById('totalSize');
        if (totalSizeGlobalElement) {
            const totalKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
            totalSizeGlobalElement.textContent = (totalKB / 1024).toFixed(1) + ' MB';
        }
    }

    updateStatsUI() {
        // Calcular estatísticas baseadas nos arquivos
        const estimatedViews = this.files.length * 25;
        const estimatedDownloads = this.files.length * 12;
        const estimatedStudents = Math.floor(this.files.length * 6);
        
        this.stats = {
            totalViews: estimatedViews,
            totalDownloads: estimatedDownloads,
            totalStudents: estimatedStudents
        };
        
        const viewsElement = document.getElementById('pmg-total-views');
        const downloadsElement = document.getElementById('pmg-total-downloads');
        const studentsElement = document.getElementById('pmg-students');
        
        if (viewsElement) viewsElement.textContent = estimatedViews.toLocaleString();
        if (downloadsElement) downloadsElement.textContent = estimatedDownloads.toLocaleString();
        if (studentsElement) studentsElement.textContent = estimatedStudents.toLocaleString();
    }

    trackView(fileId) {
        console.log(`👁️ Visualizando arquivo: ${fileId}`);
        this.stats.totalViews++;
        this.updateStatsUI();
        
        // Salvar no localStorage
        try {
            localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Não foi possível salvar estatísticas:', e);
        }
        
        // Mostrar notificação
        if (window.showNotification) {
            window.showNotification('Abrindo arquivo...', 'info');
        }
    }

    trackDownload(fileId) {
        console.log(`📥 Baixando arquivo: ${fileId}`);
        this.stats.totalDownloads++;
        this.updateStatsUI();
        
        // Salvar no localStorage
        try {
            localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Não foi possível salvar estatísticas:', e);
        }
        
        // Mostrar notificação
        if (window.showNotification) {
            window.showNotification('Iniciando download...', 'success');
        }
    }

    downloadAllFiles() {
        if (this.files.length === 0) {
            alert('Nenhum arquivo disponível para download.');
            return;
        }
        
        // Filtrar apenas arquivos com URL válida
        const downloadableFiles = this.files.filter(file => {
            const url = file.arquivo_url;
            return url && url !== '#' && url !== 'undefined' && url.startsWith('http');
        });
        
        if (downloadableFiles.length === 0) {
            alert('Nenhum arquivo possui link de download disponível.');
            return;
        }
        
        if (confirm(`Deseja baixar ${downloadableFiles.length} arquivos?\n\nOs arquivos serão baixados individualmente.`)) {
            this.trackDownload('all');
            
            downloadableFiles.forEach((file, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = file.arquivo_url;
                    link.download = file.nome || file.arquivo_nome || `arquivo-${index + 1}`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    console.log(`📥 Download iniciado: ${file.nome}`);
                }, index * 500); // Delay entre downloads
            });
            
            if (window.showNotification) {
                window.showNotification(`Iniciando download de ${downloadableFiles.length} arquivos...`, 'info');
            }
        }
    }

    async showAllMaterials() {
        // Método para debug: mostrar todos os materiais no console
        try {
            const { data: materials, error } = await this.supabase
                .from('materiais')
                .select('*');
            
            if (error) throw error;
            
            console.log('📋 TODOS OS MATERIAIS NO BANCO:', materials);
            
            let debugInfo = `Total: ${materials.length} materiais\n\n`;
            materials.forEach((mat, idx) => {
                debugInfo += `${idx + 1}. ${mat.nome || 'Sem nome'}\n`;
                debugInfo += `   Categoria: ${mat.categoria || 'N/A'}\n`;
                debugInfo += `   Fonte: ${mat.fonte || 'N/A'}\n`;
                debugInfo += `   URL: ${mat.arquivo_url || 'N/A'}\n`;
                debugInfo += `   Tamanho: ${mat.arquivo_tamanho_kb ? (mat.arquivo_tamanho_kb / 1024).toFixed(1) + ' MB' : 'N/A'}\n\n`;
            });
            
            alert(debugInfo);
            
        } catch (error) {
            console.error('❌ Erro ao buscar todos os materiais:', error);
            alert('Erro: ' + error.message);
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
                        <button onclick="pmgManager.loadPMGFiles()" 
                                style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                            <i class="fas fa-redo"></i> Tentar Novamente
                        </button>
                        <button onclick="pmgManager.showAllMaterials()" 
                                style="background: #95a5a6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-search"></i> Ver Todos no Console
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

// Inicialização automática
console.log('📚 PMG Academy Manager carregado');
window.PMGAcademyManager = PMGAcademyManager;

// Criar instância global
window.pmgManager = new PMGAcademyManager();

// Quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, PMG Manager pronto');
    
    // Verificar se estamos na página ITIL 4
    const urlParams = new URLSearchParams(window.location.search);
    const cert = urlParams.get('cert');
    
    if (cert === 'itil4') {
        console.log('🎯 Página ITIL 4 detectada');
        
        // Pequeno delay para garantir inicialização
        setTimeout(() => {
            const pmgCard = document.querySelector('.pmg-academy-card');
            if (pmgCard && window.togglePmgFiles) {
                console.log('📂 Abrindo card PMG Academy automaticamente...');
                togglePmgFiles();
            }
        }, 800);
    }
});
