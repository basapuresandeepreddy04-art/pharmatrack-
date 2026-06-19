-- ============================================================
--  Pharma Inventory & Expiry Alert System - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS pharma_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pharma_inventory;

-- ── Users (Owners) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('owner') NOT NULL DEFAULT 'owner',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Medicines ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicines (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(200)   NOT NULL,
  batch_number   VARCHAR(100)   NOT NULL,
  stock_quantity INT            NOT NULL DEFAULT 0,
  price          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  expiry_date    DATE           NOT NULL,
  created_by     INT            NOT NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_medicine_user FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT chk_price_non_negative CHECK (price >= 0)
);

-- ── Sales (invoice header) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number   VARCHAR(50)   NOT NULL UNIQUE,
  customer_name    VARCHAR(150)  DEFAULT NULL,
  customer_phone   VARCHAR(20)   DEFAULT NULL,
  total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_by       INT           NOT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sale_user FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE CASCADE
);

-- ── Sale Items (invoice line items) ──────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  sale_id         INT           NOT NULL,
  medicine_id     INT           NOT NULL,
  medicine_name   VARCHAR(200)  NOT NULL,
  quantity        INT           NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_saleitem_sale FOREIGN KEY (sale_id)
    REFERENCES sales (id) ON DELETE CASCADE,
  CONSTRAINT fk_saleitem_medicine FOREIGN KEY (medicine_id)
    REFERENCES medicines (id) ON DELETE RESTRICT
);

-- ── Alerts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id  INT          NOT NULL,
  alert_type   ENUM('low_stock', 'expiry') NOT NULL,
  message      VARCHAR(500) NOT NULL,
  is_read      BOOLEAN      DEFAULT FALSE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_medicine FOREIGN KEY (medicine_id)
    REFERENCES medicines (id) ON DELETE CASCADE
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX idx_medicines_expiry   ON medicines (expiry_date);
CREATE INDEX idx_medicines_stock    ON medicines (stock_quantity);
CREATE INDEX idx_alerts_medicine    ON alerts (medicine_id);
CREATE INDEX idx_alerts_read        ON alerts (is_read);
CREATE INDEX idx_sales_created_at   ON sales (created_at);
CREATE INDEX idx_saleitems_sale     ON sale_items (sale_id);
CREATE INDEX idx_saleitems_medicine ON sale_items (medicine_id);
