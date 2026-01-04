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
        
        // Atualizar interface de autenticação
        updateAuthUI();
        
        // Carregar materiais
        await loadMaterialsFromSupabase(currentCertId);
        
        console.log('✅ Página de materiais inicializada com sucesso');
    }, 1000);
});

// ============================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================

function setupEventListeners() {
    // Input de arquivo
    const fileInput = document.getElementById('fileInputPage');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Drag and drop na área super compacta
    const uploadArea = document.querySelector('.upload-area-super-compact');
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
    const uploadArea = document.querySelector('.upload-area-super-compact');
    if (uploadArea) {
        uploadArea.style.background = '#e8f4fc';
        uploadArea.style.borderColor = '#2980b9';
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.querySelector('.upload-area-super-compact');
    if (uploadArea) {
        uploadArea.style.background = '#f8fafc';
        uploadArea.style.borderColor = '#ddd';
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const uploadArea = document.querySelector('.upload-area-super-compact');
    if (uploadArea) {
        uploadArea.style.background = '#f8fafc';
        uploadArea.style.borderColor = '#ddd';
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
        
        // Testar conexão
        const { data, error } = await supabaseClient
            .from('materiais')
            .select('count')
            .limit(1);
        
        if (error) {
            console.warn('⚠️ Teste de conexão falhou:', error.message);
        } else {
            console.log('✅ Conexão com Supabase OK');
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
        authStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sistema de autenticação não carregado';
        return;
    }
    
    if (window.authManager.isAuthenticated()) {
        currentUser = window.authManager.getUser();
        const userName = currentUser.user_metadata?.full_name || 
                        currentUser.email?.split('@')[0] || 
                        'Usuário';
        
        authStatus.innerHTML = `
            <i class="fas fa-check-circle" style="color: #27ae60; margin-right: 0.5rem;"></i>
            Logado como: <strong>${userName}</strong>
        `;
        
        authContainer.innerHTML = `
            <div class="auth-user-info">
                <div class="auth-user-avatar">
                    ${userName.substring(0, 2).toUpperCase()}
                </div>
                <span class="auth-user-name">${userName}</span>
                <button onclick="logoutFromPage()" class="btn btn-outline btn-sm">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </button>
            </div>
        `;
    } else {
        currentUser = null;
        authStatus.innerHTML = `
            <i class="fas fa-exclamation-circle" style="color: #e74c3c; margin-right: 0.5rem;"></i>
            Não logado
        `;
        
        authContainer.innerHTML = `
            <div style="display: flex; gap: 0.8rem;">
                <a href="index.html#login" class="btn btn-outline btn-sm">
                    <i class="fas fa-sign-in-alt"></i> Entrar
                </a>
                <a href="index.html#register" class="btn btn-primary btn-sm">
                    <i class="fas fa-user-plus"></i> Cadastrar
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
    document.getElementById('certTitle').textContent = cert.title;
    document.getElementById('certLevel').textContent = `Nível: ${cert.level}`;
    document.getElementById('certDescription').textContent = cert.description;
    
    // Aplicar gradiente baseado na cor da certificação
    const gradientStart = cert.color;
    const gradientEnd = darkenColor(cert.color, 30);
    document.getElementById('certificationHero').style.background = 
        `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
    
    // Forçar ícone branco
    const certIcon = document.querySelector('#certIcon i');
    if (certIcon) {
        certIcon.style.color = 'white !important';
        certIcon.style.textShadow = '0 2px 5px rgba(0, 0, 0, 0.4) !important';
    }
    
    // Ajuste especial para AWS
    if (certId === 'aws') {
        const awsIcon = document.querySelector('#certIcon .fa-aws');
        if (awsIcon) {
            awsIcon.style.filter = 'brightness(1.3)';
        }
    }
    
    // Atualizar título da página
    document.title = `StudyCert - ${cert.title}`;
}

// Escurecer cor para gradiente
function darkenColor(color, percent) {
    // Se a cor já for uma cor hexadecimal
    if (color.startsWith('#')) {
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
    // Se for uma cor RGB
    else if (color.startsWith('rgb')) {
        const values = color.match(/\d+/g);
        if (values) {
            let R = Math.max(0, parseInt(values[0]) - percent * 2.55);
            let G = Math.max(0, parseInt(values[1]) - percent * 2.55);
            let B = Math.max(0, parseInt(values[2]) - percent * 2.55);
            return `rgb(${R}, ${G}, ${B})`;
        }
    }
    return color; // Retorna a cor original se não conseguir converter
}

// Verificar autenticação antes de upload
function checkAuthAndUpload() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        alert('Faça login para compartilhar materiais. Você será redirecionado para a página de login.');
        window.location.href = 'index.html#login';
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
        <div style="display: flex; align-items: center; gap: 0.8rem;">
            <div class="material-icon-large ${fileIconClass}" style="width: 50px; height: 50px; font-size: 1.5rem;">
                <i class="fas fa-${fileIconName}"></i>
            </div>
            <div>
                <div style="font-weight: bold; margin-bottom: 0.2rem; font-size: 0.9rem;">${file.name}</div>
                <div style="font-size: 0.8rem; color: #666;">
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
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'}"></i>
        ${message}
    `;
    
    // Adicionar ao corpo
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
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
            showNoMaterials('Erro ao carregar materiais do banco de dados.');
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
    const currentUserId = currentUser?.id;
    
    if (!materials || materials.length === 0) {
        showNoMaterials('Nenhum material encontrado para esta certificação.');
        return;
    }
    
    const materialsHTML = materials.map(material => 
        renderMaterialListItem(material, currentUserId)
    ).join('');
    
    container.innerHTML = materialsHTML;
}

// Renderizar item da lista de materiais
function renderMaterialListItem(material, currentUserId) {
    const fileIconClass = `icon-${material.tipo}`;
    const fileIconName = getFileIcon(material.tipo);
    const isOwner = currentUserId && material.usuario_id === currentUserId;
    
    // Formatar data
    const uploadDate = formatDate(material.data_upload);
    
    // Botão de exclusão com estilos específicos
    const deleteButton = isOwner ? `
        <button class="btn btn-outline" 
                onclick="showDeleteModal('${material.id}', '${material.titulo}')" 
                title="Excluir material"
                style="background: rgba(231, 76, 60, 0.15); border-color: #e74c3c; color: #e74c3c;">
            <i class="fas fa-trash" style="color: #e74c3c;"></i>
        </button>
    ` : '';
    
    return `
        <div class="material-item-improved" data-id="${material.id}">
            <div class="material-icon-large ${fileIconClass}">
                <i class="fas fa-${fileIconName}"></i>
            </div>
            
            <div class="material-content">
                <a href="${material.arquivo_url}" target="_blank" class="material-title" 
                   onclick="recordView('${material.id}')" title="${material.titulo}">
                    ${material.titulo}
                </a>
                
                <div class="material-meta">
                    <span class="material-meta-item" title="Tipo de arquivo">
                        <i class="fas fa-file"></i> ${material.tipo.toUpperCase()}
                    </span>
                    <span class="material-meta-item" title="Tamanho">
                        <i class="fas fa-weight"></i> ${formatFileSize((material.arquivo_tamanho_kb || 0) * 1024)}
                    </span>
                    <span class="material-meta-item" title="Data de upload">
                        <i class="far fa-calendar"></i> ${uploadDate}
                    </span>
                    <span class="material-meta-item" title="Visualizações">
                        <i class="far fa-eye"></i> ${material.visualizacoes || 0}
                    </span>
                    <span class="material-meta-item" title="Downloads">
                        <i class="fas fa-download"></i> ${material.downloads || 0}
                    </span>
                </div>
                
                ${material.descricao ? 
                    `<div class="material-description" title="${material.descricao}">
                        ${material.descricao}
                    </div>` 
                    : ''
                }
            </div>
            
            <div class="material-actions">
                <button class="btn btn-primary" 
                        onclick="downloadMaterial('${material.id}', '${material.arquivo_url}', '${material.titulo}')" 
                        title="Baixar arquivo">
                    <i class="fas fa-download"></i> Baixar
                </button>
                ${deleteButton}
            </div>
        </div>
    `;
}

// Formatar data
function formatDate(dateString) {
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
                    return 'Agora mesmo';
                }
                return `${diffMinutes} min atrás`;
            }
            return `Hoje às ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    } catch (e) {
        return 'Data desconhecida';
    }
}

// Mostrar mensagem quando não há materiais
function showNoMaterials(message) {
    const container = document.getElementById('materialsContainer');
    const isAuthenticated = window.authManager && window.authManager.isAuthenticated();
    
    container.innerHTML = `
        <div class="no-materials-message">
            <i class="fas fa-folder-open"></i>
            <h3>${message}</h3>
            <p>Seja o primeiro a compartilhar um material para esta certificação!</p>
            ${isAuthenticated ? 
                `<button class="btn btn-primary" onclick="checkAuthAndUpload()" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Compartilhar Material
                </button>` : 
                `<a href="index.html#login" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-sign-in-alt"></i> Faça login para compartilhar
                </a>`
            }
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
    document.getElementById('totalViews').textContent = totalViews.toLocaleString();
    document.getElementById('totalDownloads').textContent = totalDownloads.toLocaleString();
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
                .from('
