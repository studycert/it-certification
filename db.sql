-- ============================================
-- STUDY CERT - BANCO DE DADOS COMPLETO (CORRIGIDO)
-- Versão: 1.1.0
-- Data: 2025-03-20
-- Correções: Trigger WHEN clause, Políticas RLS simplificadas
-- ============================================

-- ==================== EXTENSÕES ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== TABELA: USUÁRIOS ====================
CREATE TABLE usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE,
    foto_url VARCHAR(500),
    telefone VARCHAR(20),
    pais VARCHAR(50),
    cidade VARCHAR(50),
    nivel_experiencia VARCHAR(20) DEFAULT 'iniciante',
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'ativo'
);

-- Índices para usuários
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_status ON usuarios(status);
CREATE INDEX idx_usuarios_created_at ON usuarios(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== TABELA: MATERIAIS DE ESTUDO ====================
CREATE TABLE materiais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pdf', 'ppt', 'doc', 'video', 'zip', 'link')),
    tamanho_mb DECIMAL(10,2),
    nome_arquivo VARCHAR(255),
    caminho_arquivo VARCHAR(500),
    url_externa VARCHAR(500),
    visualizacoes INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    curtidas INTEGER DEFAULT 0,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    categoria VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    nivel_dificuldade VARCHAR(20) DEFAULT 'intermediario',
    idioma VARCHAR(20) DEFAULT 'portugues',
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'ativo')),
    motivo_rejeicao TEXT,
    data_publicacao TIMESTAMP WITH TIME ZONE,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Check constraint para garantir que tenha caminho_arquivo OU url_externa
    CONSTRAINT check_caminho_ou_url CHECK (
        (caminho_arquivo IS NOT NULL) OR (url_externa IS NOT NULL)
    )
);

-- Índices para materiais
CREATE INDEX idx_materiais_tipo ON materiais(tipo);
CREATE INDEX idx_materiais_categoria ON materiais(categoria);
CREATE INDEX idx_materiais_status ON materiais(status);
CREATE INDEX idx_materiais_usuario_id ON materiais(usuario_id);
CREATE INDEX idx_materiais_created_at ON materiais(created_at DESC);
CREATE INDEX idx_materiais_visualizacoes ON materiais(visualizacoes DESC);
CREATE INDEX idx_materiais_curtidas ON materiais(curtidas DESC);
CREATE INDEX idx_materiais_tags ON materiais USING GIN(tags);

-- Trigger para materiais
CREATE TRIGGER update_materiais_updated_at 
    BEFORE UPDATE ON materiais 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== TABELA: CERTIFICAÇÕES ====================
CREATE TABLE certificacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    fornecedor VARCHAR(100) NOT NULL,
    codigo_certificacao VARCHAR(50),
    nivel VARCHAR(50),
    categoria VARCHAR(50),
    descricao TEXT,
    link_oficial VARCHAR(500),
    duracao_estudo_horas INTEGER,
    preco_medio DECIMAL(10,2),
    dificuldade VARCHAR(20) CHECK (dificuldade IN ('facil', 'intermediario', 'dificil', 'avancado')),
    popularidade INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    icon_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para certificações
CREATE INDEX idx_certificacoes_nome ON certificacoes(nome);
CREATE INDEX idx_certificacoes_fornecedor ON certificacoes(fornecedor);
CREATE INDEX idx_certificacoes_categoria ON certificacoes(categoria);
CREATE INDEX idx_certificacoes_ativo ON certificacoes(ativo);
CREATE INDEX idx_certificacoes_popularidade ON certificacoes(popularidade DESC);

-- ==================== TABELA: SIMULADOS ====================
CREATE TABLE simulados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    certificacao_id UUID REFERENCES certificacoes(id) ON DELETE SET NULL,
    total_questoes INTEGER NOT NULL,
    tempo_estimado_minutos INTEGER,
    nivel_dificuldade VARCHAR(20) DEFAULT 'intermediario',
    arquivo_url VARCHAR(500),
    visualizacoes INTEGER DEFAULT 0,
    realizacoes INTEGER DEFAULT 0,
    media_pontuacao DECIMAL(5,2),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'ativo')),
    data_publicacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para simulados
CREATE INDEX idx_simulados_certificacao_id ON simulados(certificacao_id);
CREATE INDEX idx_simulados_usuario_id ON simulados(usuario_id);
CREATE INDEX idx_simulados_status ON simulados(status);
CREATE INDEX idx_simulados_created_at ON simulados(created_at DESC);
CREATE INDEX idx_simulados_nivel_dificuldade ON simulados(nivel_dificuldade);

-- ==================== TABELA: FORUM_CATEGORIAS ====================
CREATE TABLE forum_categorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_respostas INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TABELA: FORUM_POSTS ====================
CREATE TABLE forum_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    conteudo TEXT NOT NULL,
    categoria_id UUID REFERENCES forum_categorias(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    visualizacoes INTEGER DEFAULT 0,
    respostas INTEGER DEFAULT 0,
    ultima_resposta TIMESTAMP WITH TIME ZONE,
    fixado BOOLEAN DEFAULT FALSE,
    fechado BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para forum_posts
CREATE INDEX idx_forum_posts_categoria_id ON forum_posts(categoria_id);
CREATE INDEX idx_forum_posts_usuario_id ON forum_posts(usuario_id);
CREATE INDEX idx_forum_posts_fixado ON forum_posts(fixado);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);

-- ==================== TABELA: FORUM_RESPOSTAS ====================
CREATE TABLE forum_respostas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    conteudo TEXT NOT NULL,
    resposta_pai_id UUID REFERENCES forum_respostas(id) ON DELETE CASCADE,
    curtidas INTEGER DEFAULT 0,
    melhor_resposta BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para forum_respostas
CREATE INDEX idx_forum_respostas_post_id ON forum_respostas(post_id);
CREATE INDEX idx_forum_respostas_usuario_id ON forum_respostas(usuario_id);
CREATE INDEX idx_forum_respostas_melhor_resposta ON forum_respostas(melhor_resposta);

-- ==================== TABELA: PROGRESSO_USUARIO ====================
CREATE TABLE progresso_usuario (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    certificacao_id UUID REFERENCES certificacoes(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'pausado', 'concluido', 'certificado')),
    progresso_percentual INTEGER DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
    horas_estudadas INTEGER DEFAULT 0,
    data_inicio DATE,
    data_previsao_conclusao DATE,
    data_conclusao DATE,
    nota_final DECIMAL(5,2),
    simulado_realizados INTEGER DEFAULT 0,
    materiais_estudados INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Um usuário só pode ter um progresso por certificação
    UNIQUE(usuario_id, certificacao_id)
);

-- Índices para progresso_usuario
CREATE INDEX idx_progresso_usuario_id ON progresso_usuario(usuario_id);
CREATE INDEX idx_progresso_certificacao_id ON progresso_usuario(certificacao_id);
CREATE INDEX idx_progresso_status ON progresso_usuario(status);

-- ==================== TABELA: COMENTARIOS_MATERIAIS ====================
CREATE TABLE comentarios_materiais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    material_id UUID REFERENCES materiais(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    conteudo TEXT NOT NULL,
    nota_utilidade INTEGER CHECK (nota_utilidade >= 1 AND nota_utilidade <= 5),
    curtidas INTEGER DEFAULT 0,
    resposta_para_id UUID REFERENCES comentarios_materiais(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TABELA: CURTIDAS ====================
CREATE TABLE curtidas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materiais(id) ON DELETE CASCADE,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    resposta_id UUID REFERENCES forum_respostas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) CHECK (tipo IN ('material', 'post', 'resposta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que o usuário só possa curtir uma vez cada item
    UNIQUE(usuario_id, material_id, tipo),
    UNIQUE(usuario_id, post_id, tipo),
    UNIQUE(usuario_id, resposta_id, tipo),
    
    -- Garantir que apenas um dos IDs seja preenchido
    CONSTRAINT check_apenas_um_id CHECK (
        (material_id IS NOT NULL)::integer + 
        (post_id IS NOT NULL)::integer + 
        (resposta_id IS NOT NULL)::integer = 1
    )
);

-- ==================== TABELA: DENUNCIAS ====================
CREATE TABLE denuncias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    material_id UUID REFERENCES materiais(id) ON DELETE CASCADE,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    resposta_id UUID REFERENCES forum_respostas(id) ON DELETE CASCADE,
    comentario_id UUID REFERENCES comentarios_materiais(id) ON DELETE CASCADE,
    motivo VARCHAR(100) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'analise', 'resolvida', 'descartada')),
    moderador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    data_resolucao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que apenas um dos IDs seja preenchido
    CONSTRAINT check_apenas_um_conteudo CHECK (
        (material_id IS NOT NULL)::integer + 
        (post_id IS NOT NULL)::integer + 
        (resposta_id IS NOT NULL)::integer +
        (comentario_id IS NOT NULL)::integer = 1
    )
);

-- ==================== TABELA: NOTIFICACOES ====================
CREATE TABLE notificacoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    link VARCHAR(500),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificações
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_created_at ON notificacoes(created_at DESC);

-- ==================== TABELA: CONFIGURACOES ====================
CREATE TABLE configuracoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(50),
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== VIEWS ÚTEIS ====================
-- View para estatísticas do fórum
CREATE VIEW view_estatisticas_forum AS
SELECT 
    fc.nome as categoria,
    COUNT(fp.id) as total_posts,
    COALESCE(SUM(fp.respostas), 0) as total_respostas,
    MAX(fp.created_at) as ultimo_post,
    COUNT(DISTINCT fp.usuario_id) as usuarios_ativos
FROM forum_categorias fc
LEFT JOIN forum_posts fp ON fc.id = fp.categoria_id
WHERE fc.ativo = TRUE
GROUP BY fc.id, fc.nome, fc.ordem
ORDER BY fc.ordem, fc.nome;

-- View para materiais mais populares
CREATE VIEW view_materiais_populares AS
SELECT 
    m.id,
    m.titulo,
    m.tipo,
    m.categoria,
    m.visualizacoes,
    m.downloads,
    m.curtidas,
    u.nome as autor,
    m.created_at,
    RANK() OVER (PARTITION BY m.categoria ORDER BY m.curtidas DESC, m.visualizacoes DESC) as ranking_categoria
FROM materiais m
LEFT JOIN usuarios u ON m.usuario_id = u.id
WHERE m.status = 'aprovado'
ORDER BY m.curtidas DESC, m.visualizacoes DESC;

-- View para progresso dos usuários
CREATE VIEW view_progresso_usuarios AS
SELECT 
    u.nome,
    u.email,
    c.nome as certificacao,
    pu.progresso_percentual,
    pu.status as status_progresso,
    pu.horas_estudadas,
    pu.data_inicio,
    pu.data_previsao_conclusao
FROM progresso_usuario pu
JOIN usuarios u ON pu.usuario_id = u.id
LEFT JOIN certificacoes c ON pu.certificacao_id = c.id
WHERE u.status = 'ativo';

-- ==================== FUNÇÕES ====================
-- Função para atualizar contadores
CREATE OR REPLACE FUNCTION atualizar_contador_respostas()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_posts 
        SET respostas = respostas + 1,
            ultima_resposta = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_posts 
        SET respostas = respostas - 1
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de respostas
CREATE TRIGGER tr_atualizar_respostas
    AFTER INSERT OR DELETE ON forum_respostas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_contador_respostas();

-- Função para atualizar curtidas (VERSÃO CORRIGIDA)
CREATE OR REPLACE FUNCTION atualizar_curtidas_material()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.material_id IS NOT NULL THEN
            UPDATE materiais 
            SET curtidas = curtidas + 1 
            WHERE id = NEW.material_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.material_id IS NOT NULL THEN
            UPDATE materiais 
            SET curtidas = curtidas - 1 
            WHERE id = OLD.material_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger corrigido para curtidas de materiais (SEM WHEN clause problemática)
CREATE TRIGGER tr_atualizar_curtidas_material
    AFTER INSERT OR DELETE ON curtidas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_curtidas_material();

-- ==================== DADOS INICIAIS ====================
-- Inserir categorias do fórum
INSERT INTO forum_categorias (nome, descricao, icone, ordem) VALUES
('Microsoft Azure', 'Certificações e tecnologias Microsoft Azure', 'fab fa-microsoft', 1),
('Amazon AWS', 'Certificações e serviços Amazon Web Services', 'fab fa-aws', 2),
('Linux LPIC', 'Certificações LPIC-1 e LPIC-2', 'fas fa-server', 3),
('ITIL & Governança', 'ITIL 4, COBIT e frameworks de governança', 'fas fa-cube', 4),
('Security & Cybersecurity', 'Segurança da informação e cybersecurity', 'fas fa-shield-alt', 5),
('Cloud Computing', 'Conceitos gerais de computação em nuvem', 'fas fa-cloud', 6),
('Redes & Infraestrutura', 'CCNA, redes e infraestrutura de TI', 'fas fa-network-wired', 7),
('Desenvolvimento', 'Desenvolvimento de software e DevOps', 'fas fa-code', 8),
('Dados & Analytics', 'Banco de dados, Big Data e Analytics', 'fas fa-database', 9),
('Dúvidas Gerais', 'Dúvidas sobre carreira e estudos em TI', 'fas fa-question-circle', 10);

-- Inserir certificações iniciais
INSERT INTO certificacoes (nome, fornecedor, codigo_certificacao, nivel, categoria, descricao, dificuldade, icon_name) VALUES
('Azure Fundamentals', 'Microsoft', 'AZ-900', 'Fundamental', 'Cloud', 'Conceitos fundamentais de nuvem e serviços Azure', 'facil', 'fab fa-microsoft'),
('Azure Administrator', 'Microsoft', 'AZ-104', 'Associate', 'Cloud', 'Implementação, gerenciamento e monitoramento de ambientes Azure', 'intermediario', 'fab fa-microsoft'),
('AWS Cloud Practitioner', 'AWS', 'CLF-C02', 'Fundamental', 'Cloud', 'Fundamentos da AWS e conceitos de computação em nuvem', 'facil', 'fab fa-aws'),
('AWS Solutions Architect', 'AWS', 'SAA-C03', 'Associate', 'Cloud', 'Projeto e implantação de sistemas escaláveis na AWS', 'intermediario', 'fab fa-aws'),
('Security+', 'CompTIA', 'SY0-601', 'Fundamental', 'Security', 'Fundamentos de cybersecurity e segurança da informação', 'intermediario', 'fas fa-shield-alt'),
('ITIL 4 Foundation', 'AXELOS', 'ITIL4-FND', 'Fundamental', 'Governança', 'Framework de gerenciamento de serviços de TI', 'facil', 'fas fa-cube'),
('LPIC-1', 'Linux Professional Institute', '101-500/102-500', 'Fundamental', 'Linux', 'Administração de sistemas Linux nível 1', 'intermediario', 'fas fa-server'),
('LPIC-2', 'Linux Professional Institute', '201-450/202-450', 'Advanced', 'Linux', 'Administração de sistemas Linux nível avançado', 'dificil', 'fas fa-server'),
('CCNA', 'Cisco', '200-301', 'Associate', 'Redes', 'Cisco Certified Network Associate', 'intermediario', 'fas fa-network-wired'),
('Data Fundamentals', 'Microsoft', 'DP-900', 'Fundamental', 'Dados', 'Conceitos fundamentais de dados e analytics', 'facil', 'fas fa-database');

-- Inserir configurações do sistema
INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
('site_nome', 'StudyCert', 'string', 'Nome do site'),
('site_descricao', 'Plataforma de certificações em TI', 'string', 'Descrição do site'),
('upload_max_size_mb', '100', 'number', 'Tamanho máximo de upload em MB'),
('upload_allowed_types', 'pdf,ppt,pptx,doc,docx,zip,mp4,html,htm', 'array', 'Tipos de arquivos permitidos'),
('forum_posts_per_page', '20', 'number', 'Posts por página no fórum'),
('materiais_per_page', '12', 'number', 'Materiais por página'),
('simulados_per_page', '10', 'number', 'Simulados por página'),
('moderation_enabled', 'true', 'boolean', 'Moderação ativada'),
('registration_enabled', 'true', 'boolean', 'Registro de novos usuários ativado'),
('maintenance_mode', 'false', 'boolean', 'Modo de manutenção');

-- ==================== POLÍTICAS RLS (SIMPLIFICADAS) ====================
-- NOTA: No Supabase, as políticas RLS devem ser configuradas após criar a autenticação
-- Estas são políticas básicas. No Supabase, você usará auth.uid() e auth.role()

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (para desenvolvimento - ajuste para produção)
CREATE POLICY "Todos podem ver usuários ativos" 
    ON usuarios FOR SELECT 
    USING (status = 'ativo');

CREATE POLICY "Todos podem ver materiais aprovados" 
    ON materiais FOR SELECT 
    USING (status IN ('aprovado', 'ativo'));

CREATE POLICY "Todos podem ver simulados aprovados" 
    ON simulados FOR SELECT 
    USING (status IN ('aprovado', 'ativo'));

CREATE POLICY "Todos podem ver posts do fórum" 
    ON forum_posts FOR SELECT 
    USING (true);

CREATE POLICY "Todos podem ver respostas do fórum" 
    ON forum_respostas FOR SELECT 
    USING (true);

-- Para produção, adicione estas políticas APÓS configurar autenticação:
/*
CREATE POLICY "Usuários podem ver seu próprio perfil" 
    ON usuarios FOR SELECT 
    USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem inserir materiais" 
    ON materiais FOR INSERT 
    WITH CHECK (auth.uid()::text = usuario_id::text);
*/

-- ==================== FUNÇÕES DE UTILIDADE ====================
-- Função para buscar materiais por categoria
CREATE OR REPLACE FUNCTION buscar_materiais_por_categoria(
    p_categoria VARCHAR(50),
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    titulo VARCHAR,
    tipo VARCHAR,
    categoria VARCHAR,
    visualizacoes INTEGER,
    curtidas INTEGER,
    autor_nome VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.titulo,
        m.tipo,
        m.categoria,
        m.visualizacoes,
        m.curtidas,
        u.nome as autor_nome,
        m.created_at
    FROM materiais m
    LEFT JOIN usuarios u ON m.usuario_id = u.id
    WHERE m.categoria = p_categoria 
        AND m.status IN ('aprovado', 'ativo')
    ORDER BY m.curtidas DESC, m.visualizacoes DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas
CREATE OR REPLACE FUNCTION atualizar_estatisticas_usuario(
    p_usuario_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Atualizar contagem de materiais do usuário
    UPDATE usuarios
    SET 
        updated_at = NOW()
    WHERE id = p_usuario_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== ÍNDICES ADICIONAIS PARA PERFORMANCE ====================
CREATE INDEX idx_materiais_data_publicacao ON materiais(data_publicacao DESC) WHERE status = 'aprovado';
CREATE INDEX idx_simulados_certificacao_status ON simulados(certificacao_id, status);
CREATE INDEX idx_forum_posts_tags ON forum_posts USING GIN(tags);
CREATE INDEX idx_progresso_data_conclusao ON progresso_usuario(data_conclusao) WHERE status = 'concluido';

-- ==================== COMMENTS (Documentação) ====================
COMMENT ON TABLE usuarios IS 'Armazena informações dos usuários da plataforma';
COMMENT ON TABLE materiais IS 'Armazena materiais de estudo enviados pelos usuários';
COMMENT ON TABLE certificacoes IS 'Catálogo de certificações disponíveis na plataforma';
COMMENT ON TABLE simulados IS 'Simulados de certificação enviados pelos usuários';
COMMENT ON TABLE forum_posts IS 'Posts do fórum de discussão';
COMMENT ON TABLE progresso_usuario IS 'Acompanhamento do progresso dos usuários nas certificações';

COMMENT ON COLUMN usuarios.nivel_experiencia IS 'iniciante, intermediario, avancado, especialista';
COMMENT ON COLUMN materiais.status IS 'pendente, aprovado, rejeitado, ativo';
COMMENT ON COLUMN simulados.status IS 'pendente, aprovado, rejeitado, ativo';
COMMENT ON COLUMN progresso_usuario.status IS 'nao_iniciado, em_andamento, pausado, concluido, certificado';

-- ==================== FIM DO SCRIPT ====================