CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE
);

CREATE TABLE permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE
);

CREATE TABLE role_permissions (
  role_id INT,
  permission_id INT,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  role_id INT,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255)
);

-- Store hash of refresh token, not raw token
CREATE TABLE refresh_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  token_hash VARCHAR(64),
  expires_at DATETIME NOT NULL
);

-- Seed roles (1=ADMIN, 2=USER)
INSERT INTO roles (id, name) VALUES (1, 'ADMIN'), (2, 'USER');

-- Seed permissions
INSERT INTO permissions (id, name) VALUES
  (1, 'VIEW_USERS'),
  (2, 'DELETE_USER'),
  (3, 'CHANGE_ROLE');

-- ADMIN has all; USER has none for admin routes
INSERT INTO role_permissions (role_id, permission_id) VALUES
  (1, 1), (1, 2), (1, 3);
