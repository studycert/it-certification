// ============================================
// SISTEMA DE VIDEOAULAS - SUPABASE
// ============================================

// Configurações
const SUPABASE_URL = 'https://uhbwudgdeyvbkqoflaqw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cmUH9ytPbQ1N3fyPiCU4CA_TrAuK5i4';

// Variáveis globais
let supabaseClient = null;
let currentUser = null;
let currentVideo = null;
let currentUploadFile = null;
let uploadedVideoUrl = null;

// Categorias de videoaulas
const videoCategories = {
    'itil': { name: 'ITIL 4', icon: 'fas fa-cube', color: '#3498db' },
    'linux': { name: 'LPIC-1/LPIC-2', icon: 'fas fa-server', color: '#333333' },
    'aws': { name: 'AWS', icon: 'fab fa-aws', color: '#ff9900' },
    'azure': { name: 'Azure', icon: 'fab fa-microsoft', color: '#0078d4' },
    'security': { name: 'Security+', icon: 'fas fa-shield-alt', color: '#ff6b6b' },
    'ccna': { name: 'CCNA', icon: 'fas fa-network-wired', color: '#00a0d2' },
    'outros': { name: 'Outros', icon: 'fas fa-video', color: '#95a5a6' }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando sistema de videoaulas...');
    
    // Obter parâmetros da URL
    const urlParams = getUrlParams();
    
    // Inicializar Supabase
    await initSupabase();
    
    // Atualizar interface de autenticação
    updateAuthUI();
    
    // Carregar estatísticas
    await loadVideoStats();
    
    // Preencher filtros com parâmetros da URL
    highlightActiveFilters(urlParams);
    
    // Carregar videoaulas com filtros da URL
    await loadVideos(urlParams);
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('✅ Sistema de videoaulas inicializado');
});

// Obter parâmetros da URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        category: params.get('category') || 'all',
        search: params.get('search') || '',
        level: params.get('level') || 'all',
        sort: params.get('sort') || 'recent'
    };
}

// Destacar filtros ativos da URL
function highlightActiveFilters(params) {
    if (params.category && params.category !== 'all') {
        const categorySelect = document.getElementById('filterCategory');
        if (categorySelect) {
            categorySelect.value = params.category;
        }
    }
    
    if (params.search) {
        const searchInput = document.getElementById('searchVideos');
        if (searchInput) {
            searchInput.value = decodeURIComponent(params.search);
            searchInput.style.borderColor = '#3498db';
            searchInput.style.boxShadow = '0 0 0 2px rgba(52, 152, 219, 0.2)';
        }
    }
    
    if (params.level && params.level !== 'all') {
        const levelSelect = document.getElementById('filterLevel');
        if (levelSelect) {
            levelSelect.value = params.level;
        }
    }
    
    if (params.sort && params.sort !== 'recent') {
        const sortSelect = document.getElementById('filterSort');
        if (sortSelect) {
            sortSelect.value = params.sort;
        }
    }
}

// Inicializar Supabase
async function initSupabase() {
    try {
        if (window.authManager && window.authManager.getSupabase()) {
            supabaseClient = window.authManager.getSupabase();
            currentUser = window.authManager.getUser();
            console.log('✅ Usando Supabase do authManager');
        } else {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: true }
            });
            
            // Verificar sessão
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                currentUser = session.user;
            }
            console.log('✅ Criado novo cliente Supabase');
        }
    } catch (error) {
        console.error('❌ Erro ao inicializar Supabase:', error);
    }
}

// Atualizar interface de autenticação
function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const authContainer = document.getElementById('authContainer');
    const uploadSection = document.getElementById('uploadSection');
    
    if (!window.authManager) {
        if (authStatus) authStatus.innerHTML = '<i class="fas fa-user"></i> Autenticação';
        return;
    }
    
    if (window.authManager.isAuthenticated()) {
        const user = window.authManager.getUser();
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
        
        if (authStatus) {
            authStatus.innerHTML = `
                <i class="fas fa-user-circle" style="color: #27ae60;"></i>
                <span style="margin-left: 0.5rem;">${userName}</span>
            `;
        }
        
        if (authContainer) {
            authContainer.innerHTML = `
                <button onclick="logoutFromVideos()" class="btn btn-outline btn-sm">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </button>
            `;
        }
        
        // Mostrar seção de upload para usuários autenticados
        if (uploadSection) {
            uploadSection.style.display = 'block';
        }
    } else {
        if (authStatus) {
            authStatus.innerHTML = `
                <i class="fas fa-user" style="color: #95a5a6;"></i>
                <span style="margin-left: 0.5rem;">Visitante</span>
            `;
        }
        
        if (authContainer) {
            authContainer.innerHTML = `
                <a href="index.html#login" class="btn btn-outline btn-sm">
                    <i class="fas fa-sign-in-alt"></i> Entrar
                </a>
            `;
        }
    }
}

// Logout da página de vídeos
async function logoutFromVideos() {
    if (window.authManager) {
        await window.authManager.logout();
        updateAuthUI();
        window.location.reload();
    }
}

// Configurar eventos
function setupEventListeners() {
    // Busca em tempo real
    const searchInput = document.getElementById('searchVideos');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchVideos, 300));
    }
    
    // Filtros
    const filterCategory = document.getElementById('filterCategory');
    const filterLevel = document.getElementById('filterLevel');
    const filterSort = document.getElementById('filterSort');
    
    if (filterCategory) filterCategory.addEventListener('change', searchVideos);
    if (filterLevel) filterLevel.addEventListener('change', searchVideos);
    if (filterSort) filterSort.addEventListener('change', searchVideos);
    
    // Input de arquivo de vídeo
    const videoFileInput = document.getElementById('videoFileInput');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', handleVideoFileSelect);
    }
}

// Debounce para busca
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// CARREGAMENTO DE VIDEOAULAS
// ============================================

// Carregar estatísticas
async function loadVideoStats() {
    try {
        if (!supabaseClient) return;
        
        const { data: videos, error } = await supabaseClient
            .from('video_aulas')
            .select('*')
            .eq('publico', true);
        
        if (error) throw error;
        
        // Calcular estatísticas
        const totalVideos = videos?.length || 0;
        
        // Calcular duração total (em horas)
        let totalDuration = 0;
        videos?.forEach(video => {
            const duration = parseDuration(video.duracao || '0:00');
            totalDuration += duration;
        });
        const totalHours = Math.floor(totalDuration / 60);
        
        // Contar instrutores únicos
        const instructors = new Set(videos?.map(v => v.instrutor_id || v.instrutor_nome));
        const totalInstructors = instructors.size;
        
        // Atualizar interface
        const totalVideosEl = document.getElementById('totalVideos');
        const totalDurationEl = document.getElementById('totalDuration');
        const totalInstructorsEl = document.getElementById('totalInstructors');
        
        if (totalVideosEl) totalVideosEl.textContent = totalVideos;
        if (totalDurationEl) totalDurationEl.textContent = totalHours + 'h';
        if (totalInstructorsEl) totalInstructorsEl.textContent = totalInstructors;
        
    } catch (error) {
        console.error('❌ Erro ao carregar estatísticas:', error);
    }
}

// Converter duração (string) para minutos
function parseDuration(durationStr) {
    try {
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    } catch {
        return 0;
    }
}

// Carregar videoaulas
async function loadVideos(filters = {}) {
    try {
        console.log('📥 Carregando videoaulas...', filters);
        
        if (!supabaseClient) {
            showNoVideos('Erro de conexão com o servidor.');
            return;
        }
        
        // Construir consulta
        let query = supabaseClient
            .from('video_aulas')
            .select('*')
            .eq('publico', true);
        
        // Aplicar filtros
        if (filters.category && filters.category !== 'all') {
            query = query.eq('categoria', filters.category);
        }
        
        if (filters.level && filters.level !== 'all') {
            query = query.eq('nivel', filters.level);
        }
        
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            query = query.or(`titulo.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%,tags.ilike.%${searchTerm}%`);
        }
        
        // Ordenação
        switch(filters.sort || 'recent') {
            case 'recent':
                query = query.order('data_upload', { ascending: false });
                break;
            case 'popular':
                query = query.order('visualizacoes', { ascending: false });
                break;
            case 'duration':
                query = query.order('duracao_segundos', { ascending: false });
                break;
            case 'rating':
                query = query.order('avaliacao_media', { ascending: false });
                break;
        }
        
        // Executar consulta
        const { data, error } = await query.limit(50);
        
        if (error) throw error;
        
        console.log(`✅ ${data?.length || 0} videoaulas carregadas`);
        renderVideos(data || []);
        
    } catch (error) {
        console.error('❌ Erro ao carregar videoaulas:', error);
        showNoVideos('Erro ao carregar videoaulas.');
    }
}

// Renderizar videoaulas na grid
function renderVideos(videos) {
    const grid = document.getElementById('videosGrid');
    const countElement = document.getElementById('videoCount');
    
    if (!videos || videos.length === 0) {
        if (countElement) countElement.textContent = '0 videoaulas';
        showNoVideos('Nenhuma videoaula encontrada.');
        return;
    }
    
    if (countElement) {
        countElement.textContent = `${videos.length} videoaula${videos.length !== 1 ? 's' : ''}`;
    }
    
    const videosHTML = videos.map(video => renderVideoCard(video)).join('');
    if (grid) {
        grid.innerHTML = videosHTML;
        
        // Adicionar eventos de clique aos cards
        document.querySelectorAll('.video-card').forEach(card => {
            const videoId = card.getAttribute('data-id');
            card.addEventListener('click', () => openVideoModal(videoId));
        });
    }
}

// Renderizar card de vídeo
function renderVideoCard(video) {
    const category = videoCategories[video.categoria] || videoCategories['outros'];
    const thumbnail = video.thumbnail_url || `https://via.placeholder.com/400x225/cccccc/666666?text=${encodeURIComponent(video.titulo.substring(0, 30))}`;
    
    return `
        <div class="video-card" data-id="${video.id}">
            <div class="video-thumbnail">
                <img src="${thumbnail}" alt="${video.titulo}" loading="lazy">
                <div class="video-overlay">
                    <div class="play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <span class="video-duration">${video.duracao || '00:00'}</span>
            </div>
            
            <div class="video-content">
                <h3 class="video-title" title="${video.titulo}">
                    ${video.titulo}
                </h3>
                
                <div class="video-meta-small">
                    <span>
                        <i class="fas ${category.icon}" style="color: ${category.color};"></i>
                        ${category.name}
                    </span>
                    <span>
                        <i class="fas fa-signal"></i>
                        ${video.nivel || 'N/A'}
                    </span>
                </div>
                
                <div class="video-stats">
                    <span><i class="fas fa-eye"></i> ${video.visualizacoes || 0}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${video.curtidas || 0}</span>
                    <span><i class="far fa-calendar"></i> ${formatDateShort(video.data_upload)}</span>
                </div>
                
                ${video.tags ? `
                    <div class="video-tags">
                        ${video.tags.split(',').slice(0, 3).map(tag => 
                            `<span class="video-tag">${tag.trim()}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Formatar data curta
function formatDateShort(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays}d`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
        
        return date.getDate() + '/' + (date.getMonth() + 1);
    } catch {
        return '--/--';
    }
}

// Mostrar mensagem quando não há vídeos
function showNoVideos(message) {
    const grid = document.getElementById('videosGrid');
    const isAuthenticated = window.authManager && window.authManager.isAuthenticated();
    
    if (!grid) return;
    
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-video-slash" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
            <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${message}</h3>
            <p style="color: var(--gray); margin-bottom: 1.5rem;">Seja o primeiro a compartilhar uma videoaula!</p>
            ${isAuthenticated ? 
                `<button class="btn btn-primary" onclick="checkAuthAndUploadVideo()">
                    <i class="fas fa-plus"></i> Compartilhar Videoaula
                </button>` : 
                `<a href="index.html#login" class="btn btn-primary">
                    <i class="fas fa-sign-in-alt"></i> Faça login para compartilhar
                </a>`
            }
        </div>
    `;
}

// Buscar videoaulas
function searchVideos() {
    const searchTerm = document.getElementById('searchVideos').value;
    const category = document.getElementById('filterCategory').value;
    const level = document.getElementById('filterLevel').value;
    const sort = document.getElementById('filterSort').value;
    
    loadVideos({
        search: searchTerm,
        category: category,
        level: level,
        sort: sort
    });
}

// ============================================
// PLAYER DE VÍDEO
// ============================================

// Abrir modal do vídeo
async function openVideoModal(videoId) {
    try {
        console.log('🎬 Abrindo vídeo:', videoId);
        
        if (!supabaseClient) {
            showNotification('Erro de conexão com o servidor.', 'error');
            return;
        }
        
        // Buscar informações do vídeo
        const { data: video, error } = await supabaseClient
            .from('video_aulas')
            .select('*')
            .eq('id', videoId)
            .single();
        
        if (error) throw error;
        
        currentVideo = video;
        
        // Registrar visualização
        await recordVideoView(videoId);
        
        // Atualizar modal
        updateVideoModal(video);
        
        // Mostrar modal
        const videoModal = document.getElementById('videoModal');
        const modalVideoContainer = document.getElementById('modalVideoContainer');
        const uploadProgressModal = document.getElementById('uploadProgressModal');
        
        if (videoModal) videoModal.style.display = 'flex';
        if (modalVideoContainer) modalVideoContainer.style.display = 'block';
        if (uploadProgressModal) uploadProgressModal.style.display = 'none';
        
        // Configurar player de vídeo
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
            videoPlayer.src = video.video_url;
            videoPlayer.load();
        }
        
        // Atualizar botões
        updateVideoButtons();
        
    } catch (error) {
        console.error('❌ Erro ao abrir vídeo:', error);
        showNotification('Erro ao carregar a videoaula.', 'error');
    }
}

// Atualizar modal do vídeo
function updateVideoModal(video) {
    const category = videoCategories[video.categoria] || videoCategories['outros'];
    
    const videoTitle = document.getElementById('videoTitle');
    const videoInstructor = document.getElementById('videoInstructor');
    const videoDuration = document.getElementById('videoDuration');
    const videoViews = document.getElementById('videoViews');
    const videoDate = document.getElementById('videoDate');
    const videoDescription = document.getElementById('videoDescription');
    const likeCount = document.getElementById('likeCount');
    
    if (videoTitle) videoTitle.textContent = video.titulo;
    if (videoInstructor) videoInstructor.textContent = video.instrutor_nome || 'Instrutor';
    if (videoDuration) videoDuration.textContent = video.duracao || '00:00';
    if (videoViews) videoViews.textContent = video.visualizacoes || 0;
    if (videoDate) videoDate.textContent = formatDateLong(video.data_upload);
    if (videoDescription) videoDescription.textContent = video.descricao || 'Sem descrição disponível.';
    if (likeCount) likeCount.textContent = video.curtidas || 0;
}

// Formatar data longa
function formatDateLong(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return '--/--/----';
    }
}

// Fechar modal do vídeo
function closeVideoModal() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
    
    const videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.style.display = 'none';
    }
    
    currentVideo = null;
}

// Registrar visualização
async function recordVideoView(videoId) {
    try {
        if (!supabaseClient) return;
        
        await supabaseClient
            .from('video_aulas')
            .update({ visualizacoes: supabaseClient.raw('visualizacoes + 1') })
            .eq('id', videoId);
        
        // Atualizar contador localmente
        if (currentVideo) {
            currentVideo.visualizacoes = (currentVideo.visualizacoes || 0) + 1;
            const videoViews = document.getElementById('videoViews');
            if (videoViews) {
                videoViews.textContent = currentVideo.visualizacoes;
            }
        }
        
    } catch (error) {
        console.error('Erro ao registrar visualização:', error);
    }
}

// Curtir vídeo
async function likeVideo() {
    if (!currentUser) {
        showNotification('Faça login para curtir vídeos.', 'warning');
        return;
    }
    
    if (!currentVideo || !supabaseClient) {
        showNotification('Erro ao curtir vídeo.', 'error');
        return;
    }
    
    try {
        const button = document.getElementById('likeButton');
        const likeCount = document.getElementById('likeCount');
        
        // Verificar se já curtiu
        const { data: existingLike } = await supabaseClient
            .from('video_curtidas')
            .select('id')
            .eq('video_id', currentVideo.id)
            .eq('usuario_id', currentUser.id)
            .single();
        
        if (existingLike) {
            // Remover curtida
            await supabaseClient
                .from('video_curtidas')
                .delete()
                .eq('id', existingLike.id);
            
            await supabaseClient
                .from('video_aulas')
                .update({ curtidas: supabaseClient.raw('curtidas - 1') })
                .eq('id', currentVideo.id);
            
            currentVideo.curtidas = (currentVideo.curtidas || 1) - 1;
            if (button) {
                button.innerHTML = '<i class="far fa-thumbs-up"></i> ' + currentVideo.curtidas;
            }
            showNotification('Curtida removida.', 'info');
            
        } else {
            // Adicionar curtida
            await supabaseClient
                .from('video_curtidas')
                .insert([{
                    video_id: currentVideo.id,
                    usuario_id: currentUser.id,
                    data_curtida: new Date().toISOString()
                }]);
            
            await supabaseClient
                .from('video_aulas')
                .update({ curtidas: supabaseClient.raw('curtidas + 1') })
                .eq('id', currentVideo.id);
            
            currentVideo.curtidas = (currentVideo.curtidas || 0) + 1;
            if (button) {
                button.innerHTML = '<i class="fas fa-thumbs-up" style="color: #3498db;"></i> ' + currentVideo.curtidas;
            }
            showNotification('Videoaula curtida!', 'success');
        }
        
        if (likeCount) {
            likeCount.textContent = currentVideo.curtidas;
        }
        
    } catch (error) {
        console.error('❌ Erro ao curtir vídeo:', error);
        showNotification('Erro ao processar curtida.', 'error');
    }
}

// Adicionar à lista "Assistir Depois"
async function toggleWatchLater() {
    if (!currentUser) {
        showNotification('Faça login para usar esta função.', 'warning');
        return;
    }
    
    showNotification('Funcionalidade em desenvolvimento.', 'info');
}

// Baixar vídeo
function downloadVideo() {
    if (!currentVideo || !currentVideo.video_url) {
        showNotification('Vídeo não disponível para download.', 'error');
        return;
    }
    
    const link = document.createElement('a');
    link.href = currentVideo.video_url;
    link.download = `${currentVideo.titulo.replace(/\s+/g, '_')}.mp4`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Download iniciado!', 'success');
}

// Atualizar botões do vídeo
function updateVideoButtons() {
    if (!currentUser || !currentVideo) return;
    
    // Verificar se já curtiu
    checkIfLiked();
}

// Verificar se usuário já curtiu o vídeo
async function checkIfLiked() {
    if (!currentUser || !currentVideo || !supabaseClient) return;
    
    try {
        const { data: existingLike } = await supabaseClient
            .from('video_curtidas')
            .select('id')
            .eq('video_id', currentVideo.id)
            .eq('usuario_id', currentUser.id)
            .single();
        
        const button = document.getElementById('likeButton');
        if (button) {
            if (existingLike) {
                button.innerHTML = '<i class="fas fa-thumbs-up" style="color: #3498db;"></i> ' + (currentVideo.curtidas || 0);
            } else {
                button.innerHTML = '<i class="far fa-thumbs-up"></i> ' + (currentVideo.curtidas || 0);
            }
        }
        
    } catch (error) {
        // Não faz nada se não encontrar curtida
    }
}

// ============================================
// UPLOAD DE VIDEOAULAS
// ============================================

// Verificar autenticação antes do upload
function checkAuthAndUploadVideo() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        showNotification('Faça login para compartilhar videoaulas.', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html#login';
        }, 1500);
        return;
    }
    
    const videoFileInput = document.getElementById('videoFileInput');
    if (videoFileInput) {
        videoFileInput.click();
    }
}

// Manipular seleção de arquivo de vídeo
function handleVideoFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    const validTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime', 'video/x-matroska'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|avi|mov|mkv)$/i)) {
        showNotification('Formato de vídeo não suportado. Use MP4, WebM, AVI ou MOV.', 'error');
        return;
    }
    
    // Validar tamanho (500MB máximo)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('Vídeo muito grande! O tamanho máximo é 500MB.', 'error');
        return;
    }
    
    currentUploadFile = file;
    showUploadProgress();
}

// Mostrar progresso de upload
function showUploadProgress() {
    // Mostrar modal de progresso
    const videoModal = document.getElementById('videoModal');
    const modalVideoContainer = document.getElementById('modalVideoContainer');
    const uploadProgressModal = document.getElementById('uploadProgressModal');
    
    if (videoModal) videoModal.style.display = 'flex';
    if (modalVideoContainer) modalVideoContainer.style.display = 'none';
    if (uploadProgressModal) uploadProgressModal.style.display = 'block';
    
    // Atualizar informações do arquivo
    const uploadFileName = document.getElementById('uploadFileName');
    const uploadFileSize = document.getElementById('uploadFileSize');
    
    if (uploadFileName) uploadFileName.textContent = currentUploadFile.name;
    if (uploadFileSize) uploadFileSize.textContent = `Tamanho: ${formatFileSize(currentUploadFile.size)}`;
    
    // Iniciar upload
    uploadVideoFile();
}

// Fazer upload do arquivo de vídeo
async function uploadVideoFile() {
    if (!currentUser || !currentUploadFile || !supabaseClient) {
        showNotification('Erro: usuário ou arquivo não identificado.', 'error');
        return;
    }
    
    try {
        const user = currentUser;
        
        // Limpar nome do arquivo
        const cleanFileName = currentUploadFile.name
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w\.\-]/g, '')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
        
        const fileName = `video_${Date.now()}_${cleanFileName}`;
        const filePath = `videos/${user.id}/${fileName}`;
        
        console.log('📤 Iniciando upload para:', filePath);
        
        // Atualizar progresso inicial
        updateUploadProgress(5, 0, 0);
        
        // Fazer upload
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('video_aulas')
            .upload(filePath, currentUploadFile, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
            console.error('❌ Erro no upload:', uploadError);
            throw new Error(`Falha no upload: ${uploadError.message}`);
        }
        
        console.log('✅ Upload concluído:', uploadData);
        
        // Obter URL pública
        const { data: urlData } = supabaseClient.storage
            .from('video_aulas')
            .getPublicUrl(filePath);
        
        uploadedVideoUrl = urlData.publicUrl;
        console.log('🔗 URL do vídeo:', uploadedVideoUrl);
        
        // Atualizar progresso para 100%
        updateUploadProgress(100, 0, 0);
        
        // Mostrar formulário de detalhes
        setTimeout(() => {
            closeVideoModal();
            showUploadForm();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro no upload:', error);
        showNotification(`Erro no upload: ${error.message}`, 'error');
        closeVideoModal();
    }
}

// Atualizar progresso do upload
function updateUploadProgress(percent, speed, remainingBytes) {
    const progressBar = document.getElementById('modalProgressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressStatus = document.getElementById('progressStatus');
    const timeRemaining = document.getElementById('uploadTimeRemaining');
    
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    
    if (progressPercent) {
        progressPercent.textContent = percent + '%';
    }
    
    if (progressStatus) {
        progressStatus.textContent = percent < 100 ? 'Enviando...' : 'Upload concluído!';
    }
    
    if (timeRemaining && speed > 0 && remainingBytes > 0) {
        const secondsRemaining = Math.round(remainingBytes / speed);
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = secondsRemaining % 60;
        timeRemaining.textContent = `Tempo restante: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (timeRemaining) {
        timeRemaining.textContent = percent < 100 ? 'Calculando...' : 'Concluído!';
    }
}

// Formatar tamanho do arquivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Mostrar formulário de upload
function showUploadForm() {
    const uploadFormModal = document.getElementById('uploadFormModal');
    if (uploadFormModal) {
        uploadFormModal.style.display = 'flex';
    }
    
    // Preencher título automaticamente
    if (currentUploadFile) {
        const videoTitleInput = document.getElementById('videoTitleInput');
        if (videoTitleInput) {
            const fileNameWithoutExt = currentUploadFile.name.replace(/\.[^/.]+$/, "");
            videoTitleInput.value = fileNameWithoutExt;
        }
    }
}

// Fechar formulário de upload
function closeUploadFormModal() {
    const uploadFormModal = document.getElementById('uploadFormModal');
    if (uploadFormModal) {
        uploadFormModal.style.display = 'none';
    }
    
    const videoUploadForm = document.getElementById('videoUploadForm');
    if (videoUploadForm) {
        videoUploadForm.reset();
    }
    
    currentUploadFile = null;
    uploadedVideoUrl = null;
}

// Enviar formulário de vídeo
async function submitVideoForm() {
    if (!currentUser || !uploadedVideoUrl) {
        showNotification('Erro: vídeo não carregado.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitVideoBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    
    try {
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
            submitBtn.disabled = true;
        }
        
        const user = currentUser;
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
        
        // Obter valores dos campos
        const videoTitleInput = document.getElementById('videoTitleInput');
        const videoDescriptionInput = document.getElementById('videoDescriptionInput');
        const videoCategorySelect = document.getElementById('videoCategorySelect');
        const videoLevelSelect = document.getElementById('videoLevelSelect');
        const videoTagsInput = document.getElementById('videoTagsInput');
        const videoThumbnailInput = document.getElementById('videoThumbnailInput');
        
        if (!videoTitleInput || !videoCategorySelect || !videoLevelSelect) {
            throw new Error('Campos obrigatórios não encontrados.');
        }
        
        // Obter duração do vídeo (simplificado)
        const videoDuration = await getVideoDuration(currentUploadFile);
        
        // Preparar dados da videoaula
        const videoData = {
            titulo: videoTitleInput.value.trim(),
            descricao: videoDescriptionInput ? videoDescriptionInput.value.trim() : null,
            categoria: videoCategorySelect.value,
            nivel: videoLevelSelect.value,
            tags: videoTagsInput ? videoTagsInput.value.trim() : null,
            thumbnail_url: videoThumbnailInput ? videoThumbnailInput.value.trim() : null,
            video_url: uploadedVideoUrl,
            duracao: formatDuration(videoDuration),
            duracao_segundos: videoDuration,
            arquivo_nome: currentUploadFile.name,
            arquivo_tamanho_mb: Math.round(currentUploadFile.size / (1024 * 1024) * 100) / 100,
            instrutor_id: user.id,
            instrutor_nome: userName,
            instrutor_email: user.email,
            visualizacoes: 0,
            curtidas: 0,
            avaliacao_media: 0,
            publico: true,
            data_upload: new Date().toISOString()
        };
        
        // Salvar no banco de dados
        const { data, error } = await supabaseClient
            .from('video_aulas')
            .insert([videoData])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ Videoaula salva no banco:', data);
        
        showNotification('🎉 Videoaula publicada com sucesso!', 'success');
        
        // Fechar modal e limpar
        closeUploadFormModal();
        
        // Recarregar lista de vídeos
        setTimeout(() => {
            loadVideoStats();
            loadVideos();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar videoaula:', error);
        showNotification(`Erro: ${error.message}`, 'error');
        
        if (submitBtn) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Obter duração do vídeo (simplificado)
function getVideoDuration(videoFile) {
    return new Promise((resolve) => {
        // Criar elemento de vídeo temporário
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        
        video.onerror = function() {
            console.warn('⚠️ Não foi possível obter duração do vídeo');
            resolve(0); // Fallback
        };
        
        video.src = URL.createObjectURL(videoFile);
    });
}

// Formatar duração (segundos para MM:SS)
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

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
    
    // Estilos
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
        animation: 'slideInRight 0.3s ease-out',
        maxWidth: '400px',
        wordBreak: 'break-word'
    });
    
    // Adicionar estilos de animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Adicionar ao corpo
    document.body.appendChild(notification);
    
    // Remover após 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Expor funções globais
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.searchVideos = searchVideos;
window.checkAuthAndUploadVideo = checkAuthAndUploadVideo;
window.likeVideo = likeVideo;
window.toggleWatchLater = toggleWatchLater;
window.downloadVideo = downloadVideo;
window.logoutFromVideos = logoutFromVideos;
window.closeUploadFormModal = closeUploadFormModal;
window.submitVideoForm = submitVideoForm;
