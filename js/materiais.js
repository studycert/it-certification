// ============================================
// JAVASCRIPT PARA PÁGINA DE MATERIAIS
// ============================================

// Configurações
const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';

// Mapeamento de certificações
const certifications = {
    'itil4': { 
        title: 'ITIL 4 Foundation', 
        level: 'Foundation', 
        icon: 'fas fa-cube', 
        color: '#3498db',
        description: 'Framework de gerenciamento de serviços de TI. Acesse guias, resumos e recursos para sua preparação.'
    },
    'azure': { 
        title: 'Microsoft Azure', 
        level: 'Cloud', 
        icon: 'fab fa-microsoft', 
        color: '#0078d4',
        description: 'Guias de estudo, resumos e recursos para certificações Azure (AZ-900, AZ-104, etc.)'
    },
    'aws': { 
        title: 'Amazon AWS', 
        level: 'Cloud', 
        icon: 'fab fa-aws', 
        color: '#ff9900',
        description: 'Material para Cloud Practitioner, Solutions Architect e outras certificações AWS'
    },
    'lpic': { 
        title: 'LPIC-1 e LPIC-2', 
        level: 'Linux', 
        icon: 'fas fa-server', 
        color: '#333333',
        description: 'Recursos para certificações Linux Professional Institute'
    },
    'security': { 
        title: 'Security+', 
        level: 'Segurança', 
        icon: 'fas fa-shield-alt', 
        color: '#ff6b6b',
        description: 'Material para preparação da certificação CompTIA Security+'
    },
    'ccna': { 
        title: 'CCNA', 
        level: 'Rede', 
        icon: 'fas fa-network-wired', 
        color: '#00a0d2',
        description: 'Recursos para Cisco Certified Network Associate'
    }
};

// Variáveis globais
let supabaseClient = null;
let currentUploadFile = null;
let currentCertId = 'itil4';
let currentFileType = 'pdf';
let materialToDelete = null;
let currentUser = null;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando página de materiais...');
    
    // Inicializar elementos com estado padrão
    initializeDefaultState();
    
    // Configurar eventos
    setupEventListeners();
    
    // Aguardar carregamento do authManager
    setTimeout(async () => {
        // Inicializar Supabase
        await initSupabase();
        
        // Obter certificação da URL
        currentCertId = getUrlParameter('cert') || 'itil4';
        
        // Carregar informações da certificação
        loadCertification(currentCertId);
        
        // Atualizar interface de autenticação (sem mensagem inicial)
        updateAuthUI();
        
        // Mostrar barra de autenticação
        document.getElementById('authBar').style.display = 'block';
        
        // Carregar materiais
        await loadMaterialsFromSupabase(currentCertId);
        
        console.log('✅ Página de materiais inicializada com sucesso');
    }, 300);
});

// Inicializar estado padrão dos elementos
function initializeDefaultState() {
    // Remover mensagens de carregamento iniciais
    document.getElementById('currentCertification').textContent = 'Certificação';
    document.getElementById('certTitle').textContent = 'Certificação';
    document.getElementById('certLevel').textContent = 'Nível: Carregando...';
}

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================

function setupEventListeners() {
    // Input de arquivo
    const fileInput = document.getElementById('fileInputPage');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Drag and drop
    const uploadArea = document.querySelector('.upload-area-compact');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    // Filtros
    document.getElementById('filterType')?.addEventListener('change', handleFilterChange);
    document.getElementById('filterSort')?.addEventListener('change', handleFilterChange);
    document.getElementById('searchMaterial')?.addEventListener('input', handleFilterChange);
    
    // Fechar modais ao clicar fora
    setupModalClickOutside();
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.querySelector('.upload-area-compact');
    if (uploadArea) {
        uploadArea.style.background = '#e8f4fc';
        uploadArea.style.borderColor = '#2980b9';
        uploadArea.style.transform = 'translateY(-3px)';
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.querySelector('.upload-area-compact');
    if (uploadArea) {
        uploadArea.style.background = '#f8fafc';
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.transform = 'translateY(0)';
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.querySelector('.upload-area-compact');
    if (uploadArea) {
        uploadArea.style.background = '#f8fafc';
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.transform = 'translateY(0)';
    }
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        handleFileDrop(files);
    }
}

function setupModalClickOutside() {
    // Modal de upload
    document.getElementById('uploadModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeUploadModal();
        }
    });
    
    // Modal de exclusão
    document.getElementById('deleteConfirmModal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeDeleteModal();
        }
    });
}

// ============================================
// INICIALIZAÇÃO DO SUPABASE
// ============================================

async function initSupabase() {
    try {
        // Usar authManager se disponível
        if (window.authManager && window.authManager.getSupabase()) {
            supabaseClient = window.authManager.getSupabase();
            console.log('✅ Usando Supabase do authManager');
        } else {
            // Criar novo cliente
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: true }
            });
            console.log('✅ Criado novo cliente Supabase');
        }
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
    }
}

// ============================================
// AUTENTICAÇÃO
// ============================================

function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const authContainer = document.getElementById('authContainer');
    
    if (!window.authManager) {
        authStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Autenticação';
        return;
    }
    
    if (window.authManager.isAuthenticated()) {
        currentUser = window.authManager.getUser();
        const userName = currentUser.user_metadata?.full_name || 
                        currentUser.email?.split('@')[0] || 
                        'Usuário';
        
        authStatus.innerHTML = `
            <i class="fas fa-user-circle" style="color: #27ae60; margin-right: 0.5rem;"></i>
            <span>${userName}</span>
        `;
        
        authContainer.innerHTML = `
            <div class="auth-user-info-compact">
                <button onclick="logoutFromPage()" class="btn btn-outline btn-sm">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </button>
            </div>
        `;
    } else {
        currentUser = null;
        authStatus.innerHTML = `
            <i class="fas fa-user" style="color: #95a5a6; margin-right: 0.5rem;"></i>
            <span>Visitante</span>
        `;
        
        authContainer.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <a href="index.html#login" class="btn btn-outline btn-sm">
                    <i class="fas fa-sign-in-alt"></i> Entrar
                </a>
            </div>
        `;
    }
}

async function logoutFromPage() {
    if (window.authManager) {
        try {
            await window.authManager.logout();
            updateAuthUI();
            // Recarregar a página para atualizar o estado
            setTimeout(() => window.location.reload(), 500);
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// Obter parâmetro da URL
function getUrlParameter(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Carregar informações da certificação
function loadCertification(certId) {
    const cert = certifications[certId] || certifications['itil4'];
    
    // Atualizar elementos da página
    document.getElementById('currentCertification').textContent = cert.title;
    document.getElementById('certIcon').innerHTML = `<i class="${cert.icon}"></i>`;
    document.getElementById('certIcon').style.color = cert.color;
    document.getElementById('certTitle').textContent = cert.title;
    document.getElementById('certLevel').textContent = `Nível: ${cert.level}`;
    document.getElementById('certDescription').textContent = cert.description;
    
    // Aplicar gradiente no hero
    const hero = document.getElementById('certificationHero');
    hero.style.background = `linear-gradient(135deg, ${cert.color} 0%, ${darkenColor(cert.color, 20)} 100%)`;
    
    // Atualizar título da página
    document.title = `StudyCert - ${cert.title}`;
    
    // Suavizar transição
    setTimeout(() => {
        hero.style.transition = 'background 0.5s ease';
    }, 100);
}

// Escurecer cor para gradiente
function darkenColor(color, percent) {
    let num = parseInt(color.replace("#", ""), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) - amt;
    let G = (num >> 8 & 0x00FF) - amt;
    let B = (num & 0x0000FF) - amt;
    
    return "#" + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// Verificar autenticação antes de upload
function checkAuthAndUpload() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        showNotification('Faça login para compartilhar materiais.', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html#login';
        }, 1500);
        return;
    }
    
    document.getElementById('fileInputPage').click();
}

// Manipular seleção de arquivo
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamanho do arquivo (100MB máximo)
    const maxSize = 100 * 1024 * 1024; // 100MB em bytes
    if (file.size > maxSize) {
        alert('Arquivo muito grande! O tamanho máximo permitido é 100MB.');
        return;
    }
    
    showUploadForm(file);
}

// Manipular drop de arquivo
function handleFileDrop(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file) return;
    
    // Validar tamanho do arquivo
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('Arquivo muito grande! O tamanho máximo permitido é 100MB.');
        return;
    }
    
    showUploadForm(file);
}

// Mostrar formulário de upload
function showUploadForm(file) {
    currentUploadFile = file;
    currentFileType = detectFileType(file.name);
    
    // Atualizar informações do arquivo no modal
    const fileIconClass = `icon-${currentFileType}`;
    const fileIconName = getFileIcon(currentFileType);
    
    document.getElementById('selectedFileInfo').innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="material-icon-large ${fileIconClass}" style="width: 60px; height: 60px;">
                <i class="fas fa-${fileIconName}"></i>
            </div>
            <div>
                <div style="font-weight: bold; margin-bottom: 0.3rem;">${file.name}</div>
                <div style="font-size: 0.9rem; color: #666;">
                    ${formatFileSize(file.size)} • ${currentFileType.toUpperCase()}
                </div>
            </div>
        </div>
    `;
    
    // Preencher título automaticamente
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('materialTitle').value = fileNameWithoutExt;
    
    // Resetar campos
    document.getElementById('materialDescription').value = '';
    document.getElementById('uploadFormContainer').style.display = 'block';
    document.getElementById('uploadProgressContainer').style.display = 'none';
    
    // Mostrar modal
    document.getElementById('uploadModal').style.display = 'flex';
}

// Detectar tipo de arquivo
function detectFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const typeMap = {
        // PDF
        'pdf': 'pdf',
        
        // Documentos
        'doc': 'doc',
        'docx': 'doc',
        'odt': 'doc',
        
        // Apresentações
        'ppt': 'ppt',
        'pptx': 'ppt',
        'odp': 'ppt',
        
        // Texto
        'txt': 'txt',
        'rtf': 'txt',
        'md': 'txt',
        
        // Arquivos compactados
        'zip': 'zip',
        'rar': 'zip',
        '7z': 'zip',
        'tar': 'zip',
        'gz': 'zip',
        
        // Vídeos
        'mp4': 'video',
        'avi': 'video',
        'mov': 'video',
        'mkv': 'video',
        'webm': 'video',
        'wmv': 'video',
        'flv': 'video',
        
        // Imagens (opcional)
        'jpg': 'other',
        'jpeg': 'other',
        'png': 'other',
        'gif': 'other',
        'svg': 'other'
    };
    
    return typeMap[ext] || 'other';
}

// Obter ícone do arquivo
function getFileIcon(fileType) {
    const iconMap = {
        'pdf': 'file-pdf',
        'doc': 'file-word',
        'ppt': 'file-powerpoint',
        'txt': 'file-alt',
        'zip': 'file-archive',
        'video': 'file-video',
        'other': 'file'
    };
    
    return iconMap[fileType] || 'file';
}

// Formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Fechar modal de upload
function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
    document.getElementById('fileInputPage').value = '';
    currentUploadFile = null;
}

// Processar upload do arquivo
async function processUpload() {
    const title = document.getElementById('materialTitle').value.trim();
    const description = document.getElementById('materialDescription').value.trim();
    const file = currentUploadFile;
    
    // Validações
    if (!title) {
        alert('Por favor, insira um título para o material.');
        document.getElementById('materialTitle').focus();
        return;
    }
    
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'index.html#login';
        return;
    }
    
    const user = window.authManager.getUser();
    if (!user || !user.id) {
        alert('Erro: usuário não identificado.');
        return;
    }
    
    // Mostrar progresso
    document.getElementById('uploadFormContainer').style.display = 'none';
    document.getElementById('uploadProgressContainer').style.display = 'block';
    
    try {
        console.log('🚀 Iniciando upload para usuário:', user.email);
        
        // Limpar nome do arquivo
        const cleanFileName = file.name
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/\s+/g, '_')
            .replace(/[^\w\.\-]/g, '')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
        
        const fileName = `material_${Date.now()}_${cleanFileName}`;
        const filePath = `${currentCertId}/${user.id}/${fileName}`;
        
        console.log('📤 Upload para:', filePath);
        
        // Simular progresso
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 3;
            if (progress > 70) {
                clearInterval(progressInterval);
            }
            updateProgressBar(progress, 'modal');
        }, 100);
        
        // Fazer upload real para o storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('materiais')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        clearInterval(progressInterval);
        
        if (uploadError) {
            console.error('❌ Erro no upload:', uploadError);
            throw new Error(`Falha no upload: ${uploadError.message}`);
        }
        
        console.log('✅ Upload bem-sucedido:', uploadData);
        updateProgressBar(80, 'modal');
        
        // Obter URL pública
        const { data: urlData } = supabaseClient.storage
            .from('materiais')
            .getPublicUrl(filePath);
        
        console.log('🔗 URL pública:', urlData.publicUrl);
        
        // Preparar dados para salvar no banco
        const materialData = {
            titulo: title,
            descricao: description || null,
            tipo: currentFileType,
            certificacao: currentCertId,
            arquivo_url: urlData.publicUrl,
            arquivo_nome: file.name,
            arquivo_tamanho_kb: Math.round(file.size / 1024),
            usuario_id: user.id,
            visualizacoes: 0,
            downloads: 0,
            publico: true,
            data_upload: new Date().toISOString()
        };
        
        // Salvar no banco de dados
        const { data: dbData, error: dbError } = await supabaseClient
            .from('materiais')
            .insert([materialData])
            .select()
            .single();
        
        if (dbError) {
            console.error('❌ Erro ao salvar no banco:', dbError);
            throw new Error(`Erro ao salvar informações: ${dbError.message}`);
        }
        
        console.log('✅ Material salvo no banco:', dbData);
        
        // Concluir
        updateProgressBar(100, 'modal');
        
        setTimeout(() => {
            closeUploadModal();
            showNotification('🎉 Material compartilhado com sucesso!', 'success');
            
            // Recarregar materiais
            loadMaterialsFromSupabase(currentCertId);
        }, 800);
        
    } catch (error) {
        console.error('❌ Erro no processo de upload:', error);
        showNotification(`❌ Erro: ${error.message}`, 'error');
        closeUploadModal();
    }
}

// Atualizar barra de progresso
function updateProgressBar(percent, type = 'page') {
    const progressBar = type === 'modal' ? 
        document.getElementById('modalProgressBar') : 
        document.getElementById('progressBar');
        
    const progressPercent = type === 'modal' ? 
        document.getElementById('modalProgressPercent') : 
        document.getElementById('progressPercent');
    
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    
    if (progressPercent) {
        progressPercent.textContent = percent + '%';
    }
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          type === 'warning' ? 'exclamation-triangle' : 
                          'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Adicionar ao corpo
    document.body.appendChild(notification);
    
    // Estilos dinâmicos
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        background: type === 'success' ? '#27ae60' : 
                   type === 'error' ? '#e74c3c' : 
                   type === 'warning' ? '#f39c12' : '#3498db',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideInRight 0.3s ease-out'
    });
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ============================================
// CARREGAMENTO DE MATERIAIS
// ============================================

async function loadMaterialsFromSupabase(certId, filterType = 'all', sortBy = 'date_desc', searchTerm = '') {
    try {
        console.log('📥 Carregando materiais para:', certId);
        
        if (!supabaseClient) {
            console.error('❌ Supabase não inicializado');
            showNoMaterials('Erro de conexão com o banco de dados.');
            return;
        }
        
        // Construir consulta
        let query = supabaseClient
            .from('materiais')
            .select('*')
            .eq('certificacao', certId)
            .eq('publico', true);
        
        // Aplicar filtros
        if (filterType !== 'all') {
            query = query.eq('tipo', filterType);
        }
        
        if (searchTerm) {
            query = query.or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`);
        }
        
        // Ordenação
        switch(sortBy) {
            case 'date_desc': 
                query = query.order('data_upload', { ascending: false }); 
                break;
            case 'date_asc': 
                query = query.order('data_upload', { ascending: true }); 
                break;
            case 'views_desc': 
                query = query.order('visualizacoes', { ascending: false }); 
                break;
            case 'name_asc': 
                query = query.order('titulo', { ascending: true }); 
                break;
        }
        
        // Executar consulta
        const { data, error } = await query;
        
        if (error) {
            console.error('❌ Erro ao carregar materiais:', error);
            showNoMaterials('Erro ao carregar materiais.');
            return;
        }
        
        console.log(`✅ ${data?.length || 0} materiais carregados`);
        updateMaterialsInterface(data || []);
        updateStats(data || []);
        
    } catch (error) {
        console.error('❌ Erro:', error);
        showNoMaterials('Erro na conexão com o servidor.');
    }
}

// Atualizar interface com lista de materiais
function updateMaterialsInterface(materials) {
    const container = document.getElementById('materialsContainer');
    const countElement = document.getElementById('materialsCount');
    const currentUserId = currentUser?.id;
    
    if (!materials || materials.length === 0) {
        countElement.textContent = '0 materiais';
        showNoMaterials('Nenhum material encontrado para esta certificação.');
        return;
    }
    
    countElement.textContent = `${materials.length} material${materials.length !== 1 ? 's' : ''}`;
    
    const materialsHTML = materials.map(material => 
        renderMaterialListItem(material, currentUserId)
    ).join('');
    
    container.innerHTML = materialsHTML;
}

// Renderizar item da lista de materiais (COMPACTO)
function renderMaterialListItem(material, currentUserId) {
    const fileIconClass = `icon-${material.tipo}`;
    const fileIconName = getFileIcon(material.tipo);
    const isOwner = currentUserId && material.usuario_id === currentUserId;
    
    // Formatar data de forma compacta
    const uploadDate = formatDateCompact(material.data_upload);
    
    return `
        <div class="material-item-compact" data-id="${material.id}">
            <div class="material-icon-compact ${fileIconClass}">
                <i class="fas fa-${fileIconName}"></i>
            </div>
            
            <div class="material-content-compact">
                <div class="material-header-compact">
                    <a href="${material.arquivo_url}" target="_blank" class="material-title-compact" 
                       onclick="recordView('${material.id}')" title="${material.titulo}">
                        ${material.titulo}
                    </a>
                    <div class="material-meta-compact">
                        <span title="Tipo de arquivo">
                            <i class="fas fa-file"></i> ${material.tipo.toUpperCase()}
                        </span>
                        <span title="Tamanho">
                            • ${formatFileSizeCompact((material.arquivo_tamanho_kb || 0) * 1024)}
                        </span>
                        <span title="Data de upload">
                            • ${uploadDate}
                        </span>
                    </div>
                </div>
                
                ${material.descricao ? 
                    `<div class="material-description-compact" title="${material.descricao}">
                        ${material.descricao}
                    </div>` 
                    : ''
                }
                
                <div class="material-stats-compact">
                    <span title="Visualizações">
                        <i class="far fa-eye"></i> ${material.visualizacoes || 0}
                    </span>
                    <span title="Downloads">
                        <i class="fas fa-download"></i> ${material.downloads || 0}
                    </span>
                </div>
            </div>
            
            <div class="material-actions-compact">
                <button class="btn btn-primary btn-sm" 
                        onclick="downloadMaterial('${material.id}', '${material.arquivo_url}', '${material.titulo}')" 
                        title="Baixar arquivo">
                    <i class="fas fa-download"></i>
                </button>
                ${isOwner ? `
                    <button class="btn btn-outline btn-sm" 
                            onclick="showDeleteModal('${material.id}', '${material.titulo}')" 
                            title="Excluir material">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Formatar data de forma compacta
function formatDateCompact(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours < 1) {
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                if (diffMinutes < 1) {
                    return 'Agora';
                }
                return `${diffMinutes} min`;
            }
            return `${diffHours}h`;
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `${diffDays}d`;
        } else {
            return date.getDate().toString().padStart(2, '0') + '/' + 
                   (date.getMonth() + 1).toString().padStart(2, '0');
        }
    } catch (e) {
        return '--/--';
    }
}

// Formatar tamanho de arquivo de forma compacta
function formatFileSizeCompact(bytes) {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + sizes[i];
}

// Mostrar mensagem quando não há materiais
function showNoMaterials(message) {
    const container = document.getElementById('materialsContainer');
    const isAuthenticated = window.authManager && window.authManager.isAuthenticated();
    
    container.innerHTML = `
        <div class="no-materials-message-compact">
            <i class="fas fa-folder-open"></i>
            <div>
                <h4>${message}</h4>
                <p>Seja o primeiro a compartilhar um material!</p>
                ${isAuthenticated ? 
                    `<button class="btn btn-primary btn-sm" onclick="checkAuthAndUpload()">
                        <i class="fas fa-plus"></i> Compartilhar Material
                    </button>` : 
                    `<a href="index.html#login" class="btn btn-primary btn-sm">
                        <i class="fas fa-sign-in-alt"></i> Faça login
                    </a>`
                }
            </div>
        </div>
    `;
}

// Atualizar estatísticas
function updateStats(materials) {
    const totalMaterials = materials.length;
    const totalSize = materials.reduce((sum, material) => sum + (material.arquivo_tamanho_kb || 0), 0) / 1024;
    const totalViews = materials.reduce((sum, material) => sum + (material.visualizacoes || 0), 0);
    const totalDownloads = materials.reduce((sum, material) => sum + (material.downloads || 0), 0);
    
    document.getElementById('totalMaterials').textContent = totalMaterials;
    document.getElementById('totalSize').textContent = totalSize.toFixed(1) + ' MB';
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalDownloads').textContent = totalDownloads;
}

// Manipular mudanças nos filtros
function handleFilterChange() {
    const filterType = document.getElementById('filterType').value;
    const sortBy = document.getElementById('filterSort').value;
    const searchTerm = document.getElementById('searchMaterial').value;
    
    loadMaterialsFromSupabase(currentCertId, filterType, sortBy, searchTerm);
}

// Registrar visualização
async function recordView(materialId) {
    try {
        if (supabaseClient) {
            await supabaseClient
                .from('materiais')
                .update({ visualizacoes: supabaseClient.raw('visualizacoes + 1') })
                .eq('id', materialId);
        }
    } catch (error) {
        console.error('Erro ao registrar visualização:', error);
    }
}

// Baixar material
async function downloadMaterial(materialId, fileUrl, fileName) {
    try {
        // Registrar download
        if (supabaseClient) {
            await supabaseClient
                .from('materiais')
                .update({ downloads: supabaseClient.raw('downloads + 1') })
                .eq('id', materialId);
        }
        
        // Criar link de download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download iniciado:', fileName);
        showNotification('Download iniciado!', 'success');
        
        // Atualizar contador localmente
        setTimeout(() => {
            loadMaterialsFromSupabase(currentCertId);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao baixar:', error);
        // Fallback: abrir em nova aba
        window.open(fileUrl, '_blank');
        showNotification('Abrindo arquivo em nova guia...', 'info');
    }
}

// ============================================
// FUNÇÕES DE EXCLUSÃO
// ============================================

// Mostrar modal de exclusão
function showDeleteModal(materialId, materialTitle) {
    materialToDelete = {
        id: materialId,
        title: materialTitle
    };
    
    document.getElementById('deleteMaterialName').textContent = materialTitle;
    document.getElementById('deleteConfirmModal').style.display = 'flex';
}

// Fechar modal de exclusão
function closeDeleteModal() {
    materialToDelete = null;
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

// Confirmar exclusão do material
async function confirmDeleteMaterial() {
    if (!materialToDelete) {
        showNotification('Erro: Nenhum material selecionado para exclusão.', 'error');
        closeDeleteModal();
        return;
    }
    
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        showNotification('Sessão expirada. Faça login novamente.', 'error');
        closeDeleteModal();
        window.location.href = 'index.html#login';
        return;
    }
    
    const currentUser = window.authManager.getUser();
    if (!currentUser || !currentUser.id) {
        showNotification('Erro: usuário não identificado.', 'error');
        closeDeleteModal();
        return;
    }
    
    try {
        console.log('🗑️ Iniciando exclusão do material:', materialToDelete.id);
        
        // 1. Primeiro buscar o material para obter informações
        const { data: material, error: fetchError } = await supabaseClient
            .from('materiais')
            .select('*')
            .eq('id', materialToDelete.id)
            .single();
        
        if (fetchError) {
            console.error('❌ Erro ao buscar material:', fetchError);
            throw new Error('Material não encontrado.');
        }
        
        // 2. Verificar se o usuário é o dono
        if (material.usuario_id !== currentUser.id) {
            showNotification('Você só pode excluir seus próprios materiais.', 'error');
            closeDeleteModal();
            return;
        }
        
        // 3. Extrair caminho do arquivo da URL para excluir do Storage
        const fileUrl = material.arquivo_url;
        console.log('🔗 URL do arquivo:', fileUrl);
        
        // Extrair o caminho do arquivo do bucket
        const urlParts = fileUrl.split('/materiais/');
        if (urlParts.length > 1) {
            const filePath = urlParts[1];
            console.log('📁 Caminho do arquivo no storage:', filePath);
            
            // Excluir do Storage
            const { error: storageError } = await supabaseClient.storage
                .from('materiais')
                .remove([filePath]);
            
            if (storageError) {
                console.warn('⚠️ Não foi possível excluir do storage:', storageError.message);
                // Continuar mesmo se falhar no storage
            } else {
                console.log('✅ Arquivo excluído do storage');
            }
        }
        
        // 4. Excluir do banco de dados
        const { error: deleteError } = await supabaseClient
            .from('materiais')
            .delete()
            .eq('id', materialToDelete.id);
        
        if (deleteError) {
            console.error('❌ Erro ao excluir do banco:', deleteError);
            throw new Error(`Erro ao excluir material: ${deleteError.message}`);
        }
        
        console.log('✅ Material excluído com sucesso');
        
        // Fechar modal e mostrar mensagem
        closeDeleteModal();
        showNotification('✅ Material excluído com sucesso!', 'success');
        
        // Recarregar a lista de materiais
        loadMaterialsFromSupabase(currentCertId);
        
    } catch (error) {
        console.error('❌ Erro na exclusão:', error);
        showNotification(`❌ Erro: ${error.message}`, 'error');
        closeDeleteModal();
    }
}
// Arquivo: materiais.js (adição)

// Função para rastrear downloads
function trackDownload(materialId) {
    // Salvar no localStorage
    let downloads = JSON.parse(localStorage.getItem('studyCert_downloads') || '{}');
    
    if (!downloads[materialId]) {
        downloads[materialId] = {
            count: 0,
            lastDownload: null
        };
    }
    
    downloads[materialId].count++;
    downloads[materialId].lastDownload = new Date().toISOString();
    
    localStorage.setItem('studyCert_downloads', JSON.stringify(downloads));
    
    // Atualizar contador na página
    const counterElement = document.getElementById(`downloads-${materialId}`);
    if (counterElement) {
        const currentCount = parseInt(counterElement.textContent) || 0;
        counterElement.textContent = currentCount + 1;
    }
    
    // Incrementar contador de views também
    trackView(materialId);
    
    console.log(`Download registrado: ${materialId}`);
}

// Função para rastrear visualizações
function trackView(materialId) {
    let views = JSON.parse(localStorage.getItem('studyCert_views') || '{}');
    
    if (!views[materialId]) {
        views[materialId] = {
            count: 0,
            lastView: null
        };
    }
    
    views[materialId].count++;
    views[materialId].lastView = new Date().toISOString();
    
    localStorage.setItem('studyCert_views', JSON.stringify(views));
    
    // Atualizar contador na página
    const viewsElement = document.getElementById(`views-${materialId}`);
    if (viewsElement) {
        const currentViews = parseInt(viewsElement.textContent) || 0;
        viewsElement.textContent = currentViews + 1;
    }
}

// Carregar estatísticas do localStorage quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Carregar estatísticas para o material PMG Academy
    loadMaterialStats('itil4-pmg-academy');
});

function loadMaterialStats(materialId) {
    // Carregar downloads
    const downloads = JSON.parse(localStorage.getItem('studyCert_downloads') || '{}');
    const downloadsElement = document.getElementById(`downloads-${materialId}`);
    if (downloadsElement && downloads[materialId]) {
        downloadsElement.textContent = downloads[materialId].count || 0;
    }
    
    // Carregar visualizações
    const views = JSON.parse(localStorage.getItem('studyCert_views') || '{}');
    const viewsElement = document.getElementById(`views-${materialId}`);
    if (viewsElement && views[materialId]) {
        viewsElement.textContent = views[materialId].count || 0;
    }
}

// Função para mostrar modal de exclusão (apenas para demonstração)
function showDeleteModal(materialId) {
    if (!authManager.isAuthenticated()) {
        alert('Você precisa estar logado para excluir materiais.');
        return;
    }
    
    const deleteModal = document.getElementById('deleteConfirmModal');
    const materialName = document.getElementById('deleteMaterialName');
    
    if (materialId === 'itil4-pmg-academy') {
        materialName.textContent = 'ITIL® 4 Foundation | PMG Academy';
    }
    
    deleteModal.style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

function confirmDeleteMaterial() {
    // Aqui você implementaria a lógica real de exclusão
    alert('Funcionalidade de exclusão em desenvolvimento. No ambiente real, isso removeria o material do banco de dados.');
    closeDeleteModal();
}
