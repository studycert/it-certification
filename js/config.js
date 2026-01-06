// Configurações do Supabase
const SUPABASE_CONFIG = {
    url: 'https://uhbwudgdeyvbkqoflaqw.supabase.co',
    // Use a SERVICE ROLE KEY ou ANON KEY correta
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnd1ZGdkZXl2Ymtxb2ZsYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3OTU3OTgsImV4cCI6MjA0OTM3MTc5OH0.u5q7aPGiEQ60FZbzKodT2F3nk0EdXk2gP4BPrA40s70'
};

// Expor para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
console.log('✅ Configuração do Supabase carregada');

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
