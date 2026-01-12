// Arquivo: js/pmg-academy.js
// Sistema PMG Academy - Busca direta na tabela materiais

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
        
        // Configuração do Supabase
        const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDgxOTcsImV4cCI6MjA0OTQ4NDE5N30.92T3gmlMbI_mst6h1mk15yE0J1CvH6B1fZkPSlUj3vY';
        
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false },
            global: { headers: { 'apikey': SUPABASE_KEY } }
        });
        
        console.log('✅ PMG Academy Manager inicializado');
    }

    async loadPMGFiles() {
        if (this.isLoading) return;
        
        console.log('📥 Carregando arquivos da tabela materiais...');
        
        this.isLoading = true;
        const loadingElement = document.getElementById('pmg-files-loading');
        const filesListElement = document.getElementById('pmg-files-list');
        
        try {
            // Mostrar loading
            if (loadingElement) {
                loadingElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Buscando arquivos...</span>';
                loadingElement.style.display = 'block';
            }
            
            // CONSULTA 1: Buscar TODOS os materiais primeiro (sem filtro)
            console.log('🔍 Buscando todos os materiais...');
            const { data: allMaterials, error: allError } = await this.supabase
                .from('materiais')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (allError) {
                console.error('❌ Erro na consulta geral:', allError);
                throw allError;
            }
            
            console.log(`📊 Total de materiais encontrados: ${allMaterials ? allMaterials.length : 0}`);
            
            if (allMaterials && allMaterials.length > 0) {
                console.log('📋 Primeiros 5 materiais:', allMaterials.slice(0, 5));
            }
            
            // Filtrar localmente para PMG Academy/ITIL
            this.files = allMaterials ? allMaterials.filter(material => {
                // Verificar se é ITIL 4 ou PMG Academy
                const categoria = material.categoria || '';
                const nome = material.nome || '';
                const descricao = material.descricao || '';
                const fonte = material.fonte || '';
                
                const isITIL = categoria.toLowerCase().includes('itil') || 
                               nome.toLowerCase().includes('itil') ||
                               descricao.toLowerCase().includes('itil');
                
                const isPMG = fonte.toLowerCase().includes('pmg') ||
                             nome.toLowerCase().includes('pmg') ||
                             descricao.toLowerCase().includes('pmg');
                
                // Incluir todos para teste
                return true; // REMOVA ESTA LINHA DEPOIS DO TESTE
                // return isITIL || isPMG; // DESCOMENTE ESTA LINHA DEPOIS DO TESTE
                
            }) : [];
            
            console.log(`📦 Materiais filtrados para PMG/ITIL: ${this.files.length}`);
            
            // Se nenhum arquivo, mostrar todos para debug
            if (this.files.length === 0 && allMaterials && allMaterials.length > 0) {
                console.log('⚠️ Nenhum filtrado, mostrando todos para debug');
                this.files = allMaterials;
            }
            
            // Atualizar interface
            if (loadingElement) loadingElement.style.display = 'none';
            if (filesListElement) {
                filesListElement.style.display = 'block';
                this.renderFiles();
            }
            
            this.updateFileCounters();
            this.updateStatsUI();
            
            console.log('✅ Arquivos carregados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao carregar arquivos:', error);
            this.showError('Erro ao carregar arquivos: ' + error.message);
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
                    <i class="fas fa-database" style="font-size: 2.5rem; margin-bottom: 15px; display: block; color: #bdc3c7;"></i>
                    <h4 style="color: #2C3E50; margin-bottom: 10px;">Nenhum arquivo encontrado</h4>
                    <p>Não foram encontrados arquivos no banco de dados.</p>
                    <button onclick="pmgManager.debugMaterials()" 
                            style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                        <i class="fas fa-bug"></i> Ver Dados do Banco
                    </button>
                </div>
            `;
            return;
        }
        
        console.log(`🎨 Renderizando ${this.files.length} arquivos`);
        
        let html = `
            <div style="margin-bottom: 20px; padding: 10px; background: #e8f4f8; border-radius: 6px; border-left: 4px solid #3498db;">
                <p style="margin: 0; color: #2C3E50; font-size: 0.9em;">
                    <i class="fas fa-info-circle"></i> 
                    Mostrando ${this.files.length} arquivos da tabela 'materiais'
                </p>
            </div>
        `;
        
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
            const icon = this.getCategoryIcon(category);
            
            html += `
                <div class="file-category">
                    <h5 style="color: ${color};">
                        <i class="fas ${icon}"></i> ${category} (${files.length})
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
        
        // Estatísticas
        html += `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0; color: #2C3E50; font-weight: 600;">
                            <i class="fas fa-chart-bar"></i> Resumo
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

    renderFileItem(file, index) {
        const fileId = file.id || `file-${index}`;
        const fileName = file.nome || file.arquivo_nome || `Arquivo ${index + 1}`;
        const fileDesc = file.descricao || 'Sem descrição';
        const fileUrl = file.arquivo_url || file.url || '#';
        const fileSize = file.arquivo_tamanho_kb ? 
            (file.arquivo_tamanho_kb / 1024).toFixed(1) + ' MB' : 
            'N/A';
        
        const fileType = this.getFileType(file);
        const typeColor = this.getTypeColor(fileType);
        const typeIcon = this.getTypeIcon(fileType);
        
        // Formatar data
        let fileDate = '';
        if (file.created_at) {
            const date = new Date(file.created_at);
            fileDate = date.toLocaleDateString('pt-BR');
        }
        
        return `
            <div class="file-item" data-file-id="${fileId}">
                <i class="fas ${typeIcon}" style="color: ${typeColor};"></i>
                <div style="flex: 1; min-width: 0;">
                    <div class="file-name" title="${fileName}">
                        ${fileName}
                    </div>
                    <div class="file-description" style="color: #666; font-size: 0.85em; margin-top: 3px;">
                        ${fileDesc}
                    </div>
                    <div style="display: flex; gap: 10px; font-size: 0.75em; color: #95a5a6; margin-top: 5px;">
                        ${file.categoria ? `<span><i class="fas fa-tag"></i> ${file.categoria}</span>` : ''}
                        ${file.fonte ? `<span><i class="fas fa-building"></i> ${file.fonte}</span>` : ''}
                        ${fileDate ? `<span><i class="far fa-calendar"></i> ${fileDate}</span>` : ''}
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

    getFileType(file) {
        const fileName = (file.arquivo_nome || '').toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'ppt';
        if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'doc';
        if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
        if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) return 'zip';
        return 'other';
    }

    getTypeColor(type) {
        const colors = {
            pdf: '#e74c3c',
            ppt: '#e67e22',
            doc: '#3498db',
            html: '#9b59b6',
            zip: '#2ecc71',
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
            'Security': '#27ae60'
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
            'Security': 'fa-shield-alt'
        };
        return icons[category] || 'fa-folder';
    }

    getTotalSize() {
        const totalKB = this.files.reduce((sum, file) => sum + (file.arquivo_tamanho_kb || 0), 0);
        return (totalKB / 1024).toFixed(1);
    }

    updateFileCounters() {
        const fileCountElement = document.getElementById('pmg-file-count');
        if (fileCountElement) {
            fileCountElement.textContent = this.files.length;
        }
        
        const totalSizeElement = document.getElementById('pmg-total-size');
        if (totalSizeElement) {
            totalSizeElement.textContent = this.getTotalSize() + ' MB';
        }
        
        // Atualizar estatísticas gerais da página
        const totalMaterialsElement = document.getElementById('totalMaterials');
        if (totalMaterialsElement) {
            totalMaterialsElement.textContent = this.files.length;
        }
        
        const totalSizeGlobalElement = document.getElementById('totalSize');
        if (totalSizeGlobalElement) {
            totalSizeGlobalElement.textContent = this.getTotalSize() + ' MB';
        }
    }

    updateStatsUI() {
        // Calcular estatísticas estimadas baseadas nos arquivos
        const estimatedViews = this.files.length * 15;
        const estimatedDownloads = this.files.length * 8;
        const estimatedStudents = Math.floor(this.files.length * 4.5);
        
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

    async debugMaterials() {
        try {
            console.log('🔧 Depurando tabela materiais...');
            
            const { data, error } = await this.supabase
                .from('materiais')
                .select('*')
                .limit(10);
            
            if (error) {
                console.error('❌ Erro:', error);
                alert('Erro ao acessar tabela materiais: ' + error.message);
                return;
            }
            
            console.log('📋 Dados da tabela materiais:', data);
            
            let debugInfo = `Tabela 'materiais' encontrada!\n\n`;
            debugInfo += `Total de registros na amostra: ${data.length}\n\n`;
            
            data.forEach((item, index) => {
                debugInfo += `--- Registro ${index + 1} ---\n`;
                debugInfo += `ID: ${item.id}\n`;
                debugInfo += `Nome: ${item.nome || 'N/A'}\n`;
                debugInfo += `Categoria: ${item.categoria || 'N/A'}\n`;
                debugInfo += `Fonte: ${item.fonte || 'N/A'}\n`;
                debugInfo += `Arquivo: ${item.arquivo_nome || 'N/A'}\n`;
                debugInfo += `URL: ${item.arquivo_url ? 'Disponível' : 'N/A'}\n\n`;
            });
            
            alert(debugInfo);
            
            // Atualizar com os dados reais
            this.files = data;
            this.renderFiles();
            this.updateFileCounters();
            
        } catch (error) {
            console.error('❌ Erro na depuração:', error);
            alert('Erro: ' + error.message);
        }
    }

    trackView(fileId) {
        console.log(`👁️ Visualização registrada: ${fileId}`);
        this.stats.totalViews++;
        this.updateStatsUI();
    }

    trackDownload(fileId) {
        console.log(`📥 Download registrado: ${fileId}`);
        this.stats.totalDownloads++;
        this.updateStatsUI();
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
                    <button onclick="pmgManager.loadPMGFiles()" 
                            style="background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                    <button onclick="pmgManager.debugMaterials()" 
                            style="background: #95a5a6; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; margin-left: 10px; cursor: pointer;">
                        <i class="fas fa-bug"></i> Depurar
                    </button>
                </div>
            `;
        }
    }
}

// Inicialização automática
console.log('📚 PMG Academy Manager carregado');
window.PMGAcademyManager = PMGAcademyManager;

// Criar instância global
window.pmgManager = new PMGAcademyManager();

// Quando o DOM estiver pronto, carregar os arquivos se o card estiver aberto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, PMG Manager pronto');
    
    // Verificar se estamos na página ITIL 4 e abrir automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    const cert = urlParams.get('cert');
    
    if (cert === 'itil4') {
        setTimeout(() => {
            console.log('🎯 Página ITIL 4 detectada, abrindo card PMG...');
            togglePmgFiles();
        }, 500);
    }
});
