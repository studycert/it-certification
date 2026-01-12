// Arquivo: js/pmg-academy.js

class PMGAcademyManager {
    constructor() {
        this.supabase = null;
        this.files = [];
        this.stats = {
            totalViews: 0,
            totalDownloads: 0,
            totalStudents: 0
        };
        this.init();
    }

    async init() {
        try {
            // Inicializar Supabase
            const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
            const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';
            
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: false
                }
            });
            
            console.log('PMG Academy Manager inicializado');
            
            // Carregar estatísticas iniciais
            await this.loadInitialStats();
            
        } catch (error) {
            console.error('Erro ao inicializar PMG Academy Manager:', error);
        }
    }

    async loadPMGFiles() {
        try {
            const loadingElement = document.getElementById('pmg-files-loading');
            const filesListElement = document.getElementById('pmg-files-list');
            
            // Mostrar loading
            if (loadingElement) loadingElement.style.display = 'block';
            if (filesListElement) filesListElement.style.display = 'none';
            
            // Buscar arquivos do Supabase
            const { data: files, error } = await this.supabase
                .from('materiais')
                .select('*')
                .eq('categoria', 'ITIL 4')
                .ilike('fonte', '%PMG Academy%')
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            this.files = files || [];
            
            // Esconder loading e mostrar arquivos
            if (loadingElement) loadingElement.style.display = 'none';
            if (filesListElement) {
                filesListElement.style.display = 'block';
                this.renderFiles();
            }
            
            // Atualizar contadores
            this.updateFileCounters();
            
            console.log(`Carregados ${this.files.length} arquivos do PMG Academy`);
            
        } catch (error) {
            console.error('Erro ao carregar arquivos PMG:', error);
            const loadingElement = document.getElementById('pmg-files-loading');
            if (loadingElement) {
                loadingElement.innerHTML = 
                    '<span style="color: #e74c3c; display: flex; align-items: center; gap: 10px;">' +
                    '<i class="fas fa-exclamation-circle"></i>' +
                    'Erro ao carregar arquivos. Tente novamente.' +
                    '</span>';
            }
        }
    }

    renderFiles() {
        const filesListElement = document.getElementById('pmg-files-list');
        if (!filesListElement || this.files.length === 0) {
            filesListElement.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #bdc3c7;"></i>
                    <p>Nenhum arquivo encontrado.</p>
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
            const fileName = file.arquivo_nome || '';
            const ext = fileName.split('.').pop().toLowerCase();
            
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
        
        // Botão para baixar tudo
        if (this.files.length > 0) {
            html += `
                <button class="download-all-btn" onclick="pmgManager.downloadAllFiles()">
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
            
            html += `
                <div class="file-item" data-file-id="${fileId}">
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    <span class="file-name" title="${fileName}">
                        ${fileName}
                    </span>
                    <span class="file-size">${fileSize}</span>
                    <div class="file-actions">
                        <a href="${file.arquivo_url}" 
                           target="_blank" 
                           class="btn-view"
                           onclick="pmgManager.trackView('${fileId}')"
                           title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </a>
                        <a href="${file.arquivo_url}" 
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
            // Carregar estatísticas do localStorage primeiro
            this.loadStatsFromLocalStorage();
            
            // Tentar carregar do banco
            const { data: stats, error } = await this.supabase
                .from('material_stats')
                .select('*')
                .eq('material_group', 'PMG Academy - ITIL 4')
                .single();
            
            if (!error && stats) {
                this.stats = {
                    totalViews: stats.total_views || 0,
                    totalDownloads: stats.total_downloads || 0,
                    totalStudents: stats.total_students || 0
                };
                
                // Salvar no localStorage
                this.saveStatsToLocalStorage();
            }
            
            this.updateStatsUI();
            
        } catch (error) {
            console.warn('Não foi possível carregar estatísticas do banco:', error);
            // Usar estatísticas do localStorage
            this.updateStatsUI();
        }
    }

    loadStatsFromLocalStorage() {
        try {
            const stats = localStorage.getItem('pmg_academy_stats');
            if (stats) {
                this.stats = JSON.parse(stats);
            }
        } catch (e) {
            console.warn('Erro ao carregar estatísticas do localStorage:', e);
        }
    }

    saveStatsToLocalStorage() {
        try {
            localStorage.setItem('pmg_academy_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Erro ao salvar estatísticas no localStorage:', e);
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

    async trackView(fileId) {
        try {
            // Incrementar contador local
            this.stats.totalViews++;
            this.updateStatsUI();
            this.saveStatsToLocalStorage();
            
            // Atualizar no banco (se disponível)
            try {
                await this.supabase
                    .from('material_stats')
                    .upsert({
                        material_group: 'PMG Academy - ITIL 4',
                        total_views: this.stats.totalViews,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'material_group'
                    });
            } catch (dbError) {
                console.warn('Não foi possível atualizar estatísticas no banco:', dbError);
            }
            
        } catch (error) {
            console.error('Erro ao registrar visualização:', error);
        }
    }

    async trackDownload(fileId) {
        try {
            // Incrementar contador local
            this.stats.totalDownloads++;
            this.updateStatsUI();
            this.saveStatsToLocalStorage();
            
            // Atualizar no banco (se disponível)
            try {
                await this.supabase
                    .from('material_stats')
                    .upsert({
                        material_group: 'PMG Academy - ITIL 4',
                        total_downloads: this.stats.totalDownloads,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'material_group'
                    });
            } catch (dbError) {
                console.warn('Não foi possível atualizar estatísticas no banco:', dbError);
            }
            
        } catch (error) {
            console.error('Erro ao registrar download:', error);
        }
    }

    async downloadAllFiles() {
        try {
            if (this.files.length === 0) {
                alert('Nenhum arquivo disponível para download.');
                return;
            }
            
            if (confirm(`Deseja baixar todos os ${this.files.length} arquivos do PMG Academy?\n\nOs arquivos serão baixados individualmente.`)) {
                // Registrar download múltiplo
                await this.trackDownload('all');
                
                // Baixar cada arquivo individualmente
                this.files.forEach((file, index) => {
                    setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = file.arquivo_url;
                        link.download = file.nome || file.arquivo_nome || `arquivo-${index + 1}`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }, index * 300); // Delay entre downloads
                });
                
                // Mostrar notificação
                this.showNotification(`Iniciando download de ${this.files.length} arquivos...`, 'success');
            }
            
        } catch (error) {
            console.error('Erro ao baixar arquivos:', error);
            this.showNotification('Erro ao baixar arquivos. Tente novamente.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Adicionar animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Exportar para uso global
window.PMGAcademyManager = PMGAcademyManager;
