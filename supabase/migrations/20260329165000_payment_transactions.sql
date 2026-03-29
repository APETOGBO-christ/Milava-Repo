-- Payment transactions table to log all payment attempts and results
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name VARCHAR(50) NOT NULL, -- 'wave', 'orange_money', 'mtn_momo', 'stripe', 'bank_transfer'
  provider_transaction_id VARCHAR(255) UNIQUE, -- External transaction ID from provider
  destination VARCHAR(255) NOT NULL, -- Phone, email, or IBAN
  amount DECIMAL(12, 2) NOT NULL,
  fee DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL, -- amount + fee
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, refunded
  error_message TEXT, -- Error details if failed
  metadata JSONB, -- Provider-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Platform settings table for admin configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table for admin access control
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user', 'creator', 'company', 'admin', 'moderator'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Webhook events table for tracking provider callbacks
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- 'payment.completed', 'payment.failed', 'payment.refunded'
  transaction_id VARCHAR(255),
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processed, failed
  error_message TEXT,
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_withdrawal_id ON payment_transactions(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_creator_id ON payment_transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider_name);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider_name);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Insert default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('withdrawal_threshold', '{"amount": 5000, "currency": "FCFA"}', 'Minimum amount to initiate withdrawal'),
  ('max_withdrawal_amount', '{"amount": 500000, "currency": "FCFA"}', 'Maximum withdrawal amount per transaction'),
  ('processing_days', '{"days": 2}', 'Expected processing time in days'),
  ('platform_fee_percentage', '{"percentage": 2.5}', 'Platform fee percentage on withdrawals'),
  ('auto_processing', '{"enabled": false}', 'Enable automatic withdrawal processing'),
  ('maintenance_mode', '{"enabled": false}', 'Platform maintenance mode'),
  ('max_simultaneous_payments', '{"count": 5}', 'Maximum concurrent payment processes')
ON CONFLICT (key) DO NOTHING;
