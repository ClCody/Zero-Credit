-- ==============================================================================
-- ZERO CREDIT (TWA) - ДАТАБАЗОВАЯ СХЕМА (SQLITE / POSTGRESQL СОВМЕСТИМАЯ)
-- ==============================================================================

-- 1. Студенты (Игроки)
CREATE TABLE IF NOT EXISTS users (
    telegram_id BIGINT PRIMARY KEY,
    username VARCHAR(64),
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(16) DEFAULT 'player', -- 'admin', 'moderator', 'player'
    character_class VARCHAR(32) DEFAULT 'cardsharp', -- 'cardsharp', 'crypto_illusionist', 'red_teamer', 'social_engineer'
    hype_xp INT DEFAULT 0,
    luck_chips INT DEFAULT 0,
    jester_keys INT DEFAULT 0,
    level INT DEFAULT 1,
    is_bankrupt BOOLEAN DEFAULT FALSE,
    bankrupt_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Преподаватели (Боссы)
CREATE TABLE IF NOT EXISTS bosses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    subject_name VARCHAR(128) NOT NULL,
    exam_type VARCHAR(16) NOT NULL, -- 'credit' (зачет) или 'exam' (экзамен)
    total_hp INT DEFAULT 100,
    current_hp INT DEFAULT 100,
    insta_kill_threshold INT DEFAULT 65, -- 65 для зачета, 85 для экзамена на 5
    is_defeated BOOLEAN DEFAULT FALSE
);

-- 3. Синдикаты (Студенческие бригады / гильдии)
CREATE TABLE IF NOT EXISTS syndicates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    motto VARCHAR(255),
    leader_id BIGINT REFERENCES users(telegram_id),
    sync_rate DECIMAL(3, 2) DEFAULT 1.00,
    shared_chips INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Участники синдиката
CREATE TABLE IF NOT EXISTS syndicate_members (
    syndicate_id INT REFERENCES syndicates(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    party_role VARCHAR(32) DEFAULT 'tank', -- 'tank', 'striker', 'analyst', 'diplomat'
    contribution_pts INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (syndicate_id, user_id)
);

-- 4. Инвентарь (Стаки предметов RoR2)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL,
    stack_count INT DEFAULT 1,
    is_locked BOOLEAN DEFAULT FALSE, -- блокируется при банкротстве
    UNIQUE(user_id, item_id)
);

-- 5. Карточные Дейлики (Микро-квесты)
CREATE TABLE IF NOT EXISTS daily_quests (
    id VARCHAR(32) PRIMARY KEY,
    tarot_card VARCHAR(32) NOT NULL, -- 'Magician', 'Emperor', etc.
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    reward_type VARCHAR(32) NOT NULL, -- 'chips', 'xp', 'keys', 'item'
    reward_amount INT DEFAULT 0
);

-- Активные дейлики студентов
CREATE TABLE IF NOT EXISTS user_daily_quests (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    quest_id VARCHAR(32) REFERENCES daily_quests(id),
    assigned_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, quest_id, assigned_date)
);

-- 6. Аномалии Балагана (Модификаторы недель)
CREATE TABLE IF NOT EXISTS carnival_anomalies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    active_from TIMESTAMP NOT NULL,
    active_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT FALSE
);

-- 7. Сделка с Кардистри (Контракты Кредита Нулевого Баланса)
CREATE TABLE IF NOT EXISTS cardistry_deals (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    contract_type VARCHAR(64) NOT NULL, -- 'sleeve_ace', 'checkpoint_vabank'
    granted_item_id VARCHAR(64),
    granted_chips INT DEFAULT 0,
    debt_condition TEXT NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(16) DEFAULT 'active', -- 'active', 'repaid', 'defaulted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Публичный Аудит-Лог (Tamper-Evident Ledger кафедры ИБ)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    boss_id INT REFERENCES bosses(id) NULL,
    event_type VARCHAR(32) NOT NULL, -- 'attendance', 'recitation', 'checkpoint', 'deal', 'chest'
    payload JSONB NULL,
    points_awarded INT DEFAULT 0,
    verified_by BIGINT REFERENCES users(telegram_id),
    prev_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
