// js/config.js
// Configurações do Supabase
const SUPABASE_CONFIG = {
    url: 'https://lkguubynwngnewucgewx.supabase.co',
    anonKey: 'sb_publishable_XIFYyZ49NHXHuDVbFSpWOA_Ovd1CEd3',
    serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3V1Ynlud25nbmV3dWNnZXd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjM0NzY0OSwiZXhwIjoxNzU3OTEzNjQ5fQ.8cvw3vH1ysuJl5qZJf4P-E78jQBcpK25jsM5VfyPynY' // OPCIONAL: para admin
};

// Configurações da aplicação
const APP_CONFIG = {
    name: 'StudyCert',
    version: '1.0.0',
    storageBucket: 'simulados'
};

// Dados estáticos
const STATIC_DATA = {
    certifications: [
        {
            id: 1,
            name: 'Azure Fundamentals',
            vendor: 'Microsoft',
            level: 'Fundamental',
            icon: 'fab fa-microsoft'
        },
        {
            id: 2,
            name: 'AWS Cloud Practitioner',
            vendor: 'AWS',
            level: 'Fundamental',
            icon: 'fab fa-aws'
        },
        {
            id: 3,
            name: 'Security+',
            vendor: 'CompTIA',
            level: 'Intermediário',
            icon: 'fas fa-shield-alt'
        },
        {
            id: 4,
            name: 'ITIL 4 Foundation',
            vendor: 'AXELOS',
            level: 'Fundamental',
            icon: 'fas fa-cube'
        }
    ],
    simulados: [
        {
            id: 1,
            name: 'ITIL 4 Foundation - Simulado 1',
            category: 'ITIL',
            questions: 40,
            time: 60
        },
        {
            id: 2,
            name: 'LPIC-1 - Simulado Completo',
            category: 'Linux',
            questions: 60,
            time: 90
        }
    ]
};

// Inicializar Supabase
window.supabase = supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

console.log('✅ Supabase inicializado com sucesso!');
