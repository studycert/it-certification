// Configurações do Supabase
const SUPABASE_CONFIG = {
    url: 'https://lkguubynwngnewucgewx.supabase.co',
    anonKey: 'sb_publishable_XIFYyZ49NHXHuDVbFSpWOA_Ovd1CEd3',
    tables: {
        users: 'users',
        simulados: 'simulados',
        questions: 'questions',
        userProgress: 'user_progress',
        userAnswers: 'user_answers',
        certificationAttempts: 'certification_attempts'
    },
    storage: {
        buckets: {
            simulados: 'simulados',
            avatars: 'avatars',
            certificates: 'certificates'
        }
    }
};

// Configurações da aplicação
const APP_CONFIG = {
    name: 'StudyCert',
    version: '1.0.0',
    description: 'Plataforma de Estudos para Certificações de TI',
    author: 'StudyCert Team',
    repository: 'https://github.com/study-cert/study-cert-web',
    
    // Configurações de API
    api: {
        baseURL: 'https://api.study-cert.com/v1',
        timeout: 30000,
        retryAttempts: 3
    },
    
    // Configurações de armazenamento
    storage: {
        simuladosBucket: 'simulados',
        userDataPrefix: 'studycert_user_',
        cacheDuration: 24 * 60 * 60 * 1000, // 24 horas em milissegundos
        localStorageKeys: {
            userToken: 'studycert_auth_token',
            userProfile: 'studycert_user_profile',
            examProgress: 'studycert_exam_progress',
            preferences: 'studycert_user_preferences'
        }
    },
    
    // Configurações de UI/UX
    ui: {
        theme: {
            primaryColor: '#4361ee',
            secondaryColor: '#3f37c9',
            accentColor: '#4cc9f0',
            successColor: '#4ade80',
            warningColor: '#fbbf24',
            errorColor: '#f87171',
            darkMode: false
        },
        animation: {
            enabled: true,
            duration: 300
        },
        pagination: {
            itemsPerPage: 10,
            maxVisiblePages: 5
        }
    },
    
    // Configurações de exames/simulados
    exam: {
        defaultQuestionTime: 90, // segundos por questão
        maxAttemptsPerDay: 5,
        reviewModeEnabled: true,
        allowSkippingQuestions: false,
        showResultsImmediately: true,
        passingScore: 70, // porcentagem
        categories: ['TI', 'Cloud', 'Segurança', 'Redes', 'DevOps']
    },
    
    // Configurações de notificações
    notifications: {
        enabled: true,
        reminderFrequency: 'daily',
        examReminders: true,
        progressUpdates: true,
        newContentAlerts: true
    },
    
    // Configurações de analytics
    analytics: {
        enabled: true,
        provider: 'mixpanel', // ou 'google-analytics', 'amplitude'
        trackingId: 'STUDYCERT_TRACKING',
        logErrors: true
    }
};

// Configurações de segurança
const SECURITY_CONFIG = {
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    sessionTimeout: 60 * 60 * 1000, // 1 hora
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
    enable2FA: false,
    dataEncryption: true
};

// Dados estáticos
const STATIC_DATA = {
    certifications: [
        {
            id: 1,
            name: 'Azure Fundamentals',
            vendor: 'Microsoft',
            level: 'Fundamental',
            icon: 'fab fa-microsoft',
            color: '#0078d4',
            description: 'Certificação fundamental de cloud da Microsoft Azure',
            examCode: 'AZ-900',
            duration: 60,
            questions: 40,
            passingScore: 700,
            resources: ['docs.microsoft.com', 'learn.microsoft.com'],
            popularity: 95
        },
        {
            id: 2,
            name: 'AWS Cloud Practitioner',
            vendor: 'AWS',
            level: 'Fundamental',
            icon: 'fab fa-aws',
            color: '#FF9900',
            description: 'Certificação fundamental de cloud da Amazon Web Services',
            examCode: 'CLF-C01',
            duration: 90,
            questions: 65,
            passingScore: 700,
            resources: ['aws.amazon.com/certification', 'aws.training'],
            popularity: 92
        },
        {
            id: 3,
            name: 'Security+',
            vendor: 'CompTIA',
            level: 'Intermediário',
            icon: 'fas fa-shield-alt',
            color: '#e81e25',
            description: 'Certificação global em segurança de TI',
            examCode: 'SY0-601',
            duration: 90,
            questions: 90,
            passingScore: 750,
            resources: ['comptia.org', 'professormesser.com'],
            popularity: 88
        },
        {
            id: 4,
            name: 'ITIL 4 Foundation',
            vendor: 'AXELOS',
            level: 'Fundamental',
            icon: 'fas fa-cube',
            color: '#00b0b9',
            description: 'Certificação em gerenciamento de serviços de TI',
            examCode: 'ITIL-4-FND',
            duration: 60,
            questions: 40,
            passingScore: 65,
            resources: ['axelos.com', 'itil-foundation.com'],
            popularity: 85
        },
        {
            id: 5,
            name: 'Google Cloud Digital Leader',
            vendor: 'Google',
            level: 'Fundamental',
            icon: 'fab fa-google',
            color: '#4285F4',
            description: 'Certificação fundamental de cloud do Google',
            examCode: 'Digital-Leader',
            duration: 90,
            questions: 50,
            passingScore: 70,
            resources: ['cloud.google.com/certification'],
            popularity: 78
        },
        {
            id: 6,
            name: 'CCNA',
            vendor: 'Cisco',
            level: 'Intermediário',
            icon: 'fas fa-network-wired',
            color: '#1ba0d7',
            description: 'Certificação em redes Cisco',
            examCode: '200-301',
            duration: 120,
            questions: 102,
            passingScore: 'Varia',
            resources: ['cisco.com', 'cbtnuggets.com'],
            popularity: 90
        }
    ],
    
    simulados: [
        {
            id: 1,
            name: 'ITIL 4 Foundation - Simulado 1',
            category: 'ITIL',
            questions: 40,
            time: 60,
            difficulty: 'Médio',
            certificationId: 4,
            price: 0,
            isFree: true,
            attempts: 1234,
            averageScore: 72,
            lastUpdated: '2024-01-15',
            tags: ['ITIL', 'Gerenciamento', 'Fundamental'],
            description: 'Simulado completo para ITIL 4 Foundation com questões atualizadas'
        },
        {
            id: 2,
            name: 'LPIC-1 - Simulado Completo',
            category: 'Linux',
            questions: 60,
            time: 90,
            difficulty: 'Avançado',
            certificationId: null,
            price: 29.90,
            isFree: false,
            attempts: 856,
            averageScore: 65,
            lastUpdated: '2024-01-10',
            tags: ['Linux', 'LPIC', 'Sistemas'],
            description: 'Simulado abrangente para certificação LPIC-1'
        },
        {
            id: 3,
            name: 'AZ-900 - Teste Prático',
            category: 'Azure',
            questions: 30,
            time: 45,
            difficulty: 'Fácil',
            certificationId: 1,
            price: 0,
            isFree: true,
            attempts: 2543,
            averageScore: 78,
            lastUpdated: '2024-01-20',
            tags: ['Azure', 'Cloud', 'Fundamental'],
            description: 'Teste prático para Azure Fundamentals (AZ-900)'
        },
        {
            id: 4,
            name: 'Security+ - Simulado Avançado',
            category: 'Segurança',
            questions: 75,
            time: 110,
            difficulty: 'Difícil',
            certificationId: 3,
            price: 49.90,
            isFree: false,
            attempts: 567,
            averageScore: 68,
            lastUpdated: '2024-01-05',
            tags: ['Security', 'CompTIA', 'Cibersegurança'],
            description: 'Simulado avançado com questões complexas de Security+'
        }
    ],
    
    // Dados de questões exemplo (para demonstração)
    sampleQuestions: [
        {
            id: 101,
            text: 'Qual é o propósito principal do Service Value System no ITIL 4?',
            options: [
                'Gerenciar incidentes de forma eficiente',
                'Criar valor por meio de produtos e serviços',
                'Automatizar processos de TI',
                'Reduzir custos operacionais'
            ],
            correctAnswer: 1,
            explanation: 'O SVS permite que a organização crie valor por meio de produtos e serviços.',
            category: 'ITIL',
            difficulty: 'Médio',
            tags: ['ITIL', 'SVS', 'Valor']
        }
    ],
    
    // Dados de níveis de dificuldade
    difficultyLevels: [
        { id: 1, name: 'Fácil', color: '#4ade80', minScore: 0, maxScore: 60 },
        { id: 2, name: 'Médio', color: '#fbbf24', minScore: 61, maxScore: 80 },
        { id: 3, name: 'Difícil', color: '#f87171', minScore: 81, maxScore: 100 }
    ],
    
    // Categorias de questões
    questionCategories: [
        'TI Geral',
        'Cloud Computing',
        'Segurança da Informação',
        'Redes e Infraestrutura',
        'Sistemas Operacionais',
        'Banco de Dados',
        'DevOps',
        'Governança de TI',
        'Compliance',
        'Desenvolvimento'
    ],
    
    // Idiomas suportados
    supportedLanguages: [
        { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
        { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
        { code: 'es-ES', name: 'Español', flag: '🇪🇸' }
    ],
    
    // Planos de assinatura
    subscriptionPlans: [
        {
            id: 'free',
            name: 'Gratuito',
            price: 0,
            features: [
                '3 simulados gratuitos por mês',
                'Acesso a questões básicas',
                'Estatísticas de desempenho',
                'Comunidade de apoio'
            ],
            limitations: ['Sem simulados premium', 'Anúncios ativos']
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 29.90,
            features: [
                'Simulados ilimitados',
                'Acesso a todas as questões',
                'Relatórios detalhados',
                'Suporte prioritário',
                'Sem anúncios'
            ],
            popular: true
        },
        {
            id: 'enterprise',
            name: 'Empresa',
            price: 99.90,
            features: [
                'Tudo do plano Pro',
                'Gestão de múltiplos usuários',
                'Relatórios personalizados',
                'Integração com LMS',
                'Suporte 24/7'
            ]
        }
    ]
};

// Configurações de ambiente
const ENV_CONFIG = {
    development: {
        debug: true,
        logLevel: 'debug',
        apiURL: 'http://localhost:3000/api',
        enableMockData: true
    },
    production: {
        debug: false,
        logLevel: 'error',
        apiURL: 'https://api.study-cert.com/v1',
        enableMockData: false
    },
    staging: {
        debug: true,
        logLevel: 'info',
        apiURL: 'https://staging-api.study-cert.com/v1',
        enableMockData: false
    }
};

// Configurações de integração
const INTEGRATION_CONFIG = {
    payment: {
        stripe: {
            publicKey: 'pk_live_XXXXXXXXXXXXXXXXXXXXXXXX',
            currency: 'BRL',
            country: 'BR'
        },
        pagseguro: {
            email: 'vendas@study-cert.com',
            token: 'PAGSEGURO_TOKEN'
        }
    },
    email: {
        provider: 'sendgrid',
        apiKey: 'SG.XXXXXXXXXXXXXXXX',
        templates: {
            welcome: 'd-welcome-template-id',
            examCompleted: 'd-exam-completed-id',
            passwordReset: 'd-password-reset-id'
        }
    }
};

// Exportação dos módulos
export {
    SUPABASE_CONFIG,
    APP_CONFIG,
    SECURITY_CONFIG,
    STATIC_DATA,
    ENV_CONFIG,
    INTEGRATION_CONFIG
};

// Exportação padrão (para compatibilidade)
export default {
    SUPABASE_CONFIG,
    APP_CONFIG,
    SECURITY_CONFIG,
    STATIC_DATA,
    ENV_CONFIG,
    INTEGRATION_CONFIG
};
