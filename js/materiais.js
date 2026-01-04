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
        gradient: 'linear-gradient(135deg, #3498db 0%, #1a5276 100%)',
        description: 'Framework de gerenciamento de serviços de TI. Acesse guias, resumos e recursos para sua preparação.'
    },
    'azure': { 
        title: 'Microsoft Azure', 
        level: 'Cloud', 
        icon: 'fab fa-microsoft', 
        color: '#0078d4',
        gradient: 'linear-gradient(135deg, #0078d4 0%, #004578 100%)',
        description: 'Guias de estudo, resumos e recursos para certificações Azure (AZ-900, AZ-104, etc.)'
    },
    'aws': { 
        title: 'Amazon AWS', 
        level: 'Cloud', 
        icon: 'fab fa-aws', 
        color: '#ff9900',
        gradient: 'linear-gradient(135deg, #ff9900 0%, #b36b00 100%)',
        description: 'Material para Cloud Practitioner, Solutions Architect e outras certificações AWS'
    },
    'lpic': { 
        title: 'LPIC-1 e LPIC-2', 
        level: 'Linux', 
        icon: 'fas fa-server', 
        color: '#333333',
        gradient: 'linear-gradient(135deg, #333333 0%, #000000 100%)',
        description: 'Recursos para certificações Linux Professional Institute'
    },
    'security': { 
        title: 'Security+', 
        level: 'Segurança', 
        icon: 'fas fa-shield-alt', 
        color: '#ff6b6b',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #c0392b 100%)',
        description: 'Material para preparação da certificação CompTIA Security+'
    },
    'ccna': { 
        title: 'CCNA', 
        level: 'Rede', 
        icon: 'fas fa-network-wired', 
        color: '#00a0d2',
        gradient: 'linear-gradient(135deg, #00a0d2 0%, #00698c 100%)',
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
    
    // Obter certificação da URL IMEDIATAMENTE
    currentCertId = getUrlParameter('cert') || 'itil4';
    
    // Carregar informações da certificação IMEDIATAMENTE
    loadCertification(currentCertId);
    
    // Configurar eventos
    setupEventListeners();
    
    // Aguardar carregamento do authManager
    setTimeout(async () => {
        // Inicializar Supabase
        await initSupabase();
        
        // Atualizar interface de autenticação
        updateAuthUI();
        
        // Carregar materiais
        await loadMaterialsFromSupabase(currentCertId);
        
        console.log('✅ Página de materiais inicializada com sucesso');
    }, 100);
});

// ... (o resto do código permanece igual, apenas modifiquei a função loadCertification) ...

// Carregar informações da certificação
function loadCertification(certId) {
    const cert = certifications[certId] || certifications['itil4'];
    
    // Atualizar elementos da página IMEDIATAMENTE
    document.getElementById('currentCertification').textContent = cert.title;
    document.getElementById('certIcon').innerHTML = `<i class="${cert.icon}"></i>`;
    document.getElementById('certTitle').textContent = cert.title;
    document.getElementById('certLevel').textContent = `Nível: ${cert.level}`;
    document.getElementById('certDescription').textContent = cert.description;
    
    // Aplicar gradiente imediatamente usando o gradiente predefinido
    const certificationHero = document.getElementById('certificationHero');
    if (certificationHero) {
        certificationHero.style.background = cert.gradient;
    }
    
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

// ... (o resto do código permanece igual) ...
