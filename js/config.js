// Configurações do Supabase
const SUPABASE_CONFIG = {
    url: 'https://lkguubynwngnewucgewx.supabase.co',
    anonKey: 'sb_publishable_XIFYyZ49NHXHuDVbFSpWOA_Ovd1CEd3'
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