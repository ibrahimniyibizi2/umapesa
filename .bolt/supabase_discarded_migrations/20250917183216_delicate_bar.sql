-- UmaPesa Database Schema
CREATE DATABASE IF NOT EXISTS umapesa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE umapesa_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    country ENUM('mozambique', 'rwanda') NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    account_number VARCHAR(20) UNIQUE NOT NULL,
    total_transactions INT DEFAULT 0,
    total_volume DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'suspended') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sender_id VARCHAR(36) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    recipient_country ENUM('mozambique', 'rwanda') NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency ENUM('MZN', 'RWF') NOT NULL,
    converted_amount DECIMAL(15,2) NOT NULL CHECK (converted_amount > 0),
    converted_currency ENUM('MZN', 'RWF') NOT NULL,
    exchange_rate DECIMAL(10,6) NOT NULL CHECK (exchange_rate > 0),
    fee DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    type ENUM('send', 'receive') DEFAULT 'send',
    reference VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    payment_method VARCHAR(50),
    payment_method_fee DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    creator_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL CHECK (LENGTH(title) >= 10),
    description TEXT NOT NULL CHECK (LENGTH(description) >= 50),
    goal_amount DECIMAL(15,2) NOT NULL CHECK (goal_amount > 0),
    raised_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (raised_amount >= 0),
    currency ENUM('MZN', 'RWF') NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    end_date TIMESTAMP NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    campaign_id VARCHAR(36) NOT NULL,
    contributor_name VARCHAR(255) NOT NULL,
    contributor_email VARCHAR(255),
    contributor_phone VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency ENUM('MZN', 'RWF') NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    from_currency ENUM('MZN', 'RWF') NOT NULL,
    to_currency ENUM('MZN', 'RWF') NOT NULL,
    rate DECIMAL(10,6) NOT NULL CHECK (rate > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_currency_pair (from_currency, to_currency)
);

-- Fee structures table
CREATE TABLE IF NOT EXISTS fee_structures (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    min_amount DECIMAL(15,2) NOT NULL CHECK (min_amount >= 0),
    max_amount DECIMAL(15,2) NOT NULL CHECK (max_amount > min_amount),
    fee_type ENUM('percentage', 'fixed') NOT NULL,
    fee_value DECIMAL(10,4) NOT NULL CHECK (fee_value >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type ENUM('card', 'mobile_money') NOT NULL,
    fee_percentage DECIMAL(5,2) NOT NULL CHECK (fee_percentage >= 0),
    provider VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- API logs table
CREATE TABLE IF NOT EXISTS api_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    transaction_id VARCHAR(36),
    api_name VARCHAR(255) NOT NULL,
    request_data JSON,
    response_data JSON,
    status ENUM('success', 'error', 'pending') NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Insert default data
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('MZN', 'RWF', 18.5000),
('RWF', 'MZN', 0.0540);

INSERT INTO fee_structures (name, min_amount, max_amount, fee_type, fee_value) VALUES
('Standard Transfer Fee', 100.00, 999.99, 'fixed', 150.0000),
('High Value Transfer Fee', 1000.00, 999999.99, 'percentage', 10.0000);

INSERT INTO payment_methods (name, type, fee_percentage, provider) VALUES
('Visa/Mastercard', 'card', 7.00, 'Flutterwave'),
('M-Pesa', 'mobile_money', 10.00, 'Vodacom'),
('eMola', 'mobile_money', 10.00, 'mCel');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_number ON users(account_number);
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_campaigns_creator_id ON campaigns(creator_id);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_contributions_campaign_id ON contributions(campaign_id);
CREATE INDEX idx_contributions_payment_status ON contributions(payment_status);