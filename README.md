# TrustShare – Secure File Sharing & Activity Monitoring System

TrustShare is a secure file-sharing platform designed to protect files during storage and sharing while providing activity monitoring, notifications, security reports, and access control.

The system uses AES-256 encryption for file protection, JWT-based authentication, bcrypt password hashing, permission-based sharing, temporary access links, audit logging, and secure cloud storage.

---

## 1. Project Overview

TrustShare allows users to:

- Register and securely log in
- Upload files
- Encrypt files using AES-256
- Store encrypted files in cloud storage
- Download files securely after authorization
- Share files with other users
- Control sharing permissions
- Create temporary file access
- Revoke file access
- Monitor file activities
- Receive security notifications
- View file activity and security reports
- Analyze storage usage
- Detect suspicious activities

---

## 2. Main Features

### Authentication & Security

- User registration and login
- JWT authentication
- bcrypt password hashing
- Forgot/reset password functionality
- Protected API endpoints
- Authentication and authorization checks
- Invalid/expired JWT rejection

### File Security

- AES-256-GCM file encryption
- Server-side encryption before cloud storage
- Secure encryption-key management
- Encrypted key storage in Supabase
- Separate master key protection using `KEY_ENCRYPTION_SECRET`

### File Sharing

- Share files with other users
- Read permission
- Write permission
- Read/Write permission
- Revoke access
- Temporary access links
- Expiration validation
- Unauthorized download prevention

### Monitoring & Security

- Activity/audit logging
- Failed-login monitoring
- Security notifications
- Suspicious activity detection
- File activity reports
- Storage analytics

---

## 3. Technology Stack

### Frontend

- React
- Vite
- HTML
- CSS
- JavaScript

### Backend

- Python
- FastAPI
- Uvicorn

### Database

- SQLite for the current application environment
- SQLAlchemy

### Security

- AES-256-GCM
- JWT
- bcrypt
- HTTPS/TLS in production

### Cloud Storage

- Supabase Storage

### Deployment

- Docker
- Docker Compose
- Render

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- Chrome DevTools

---

## 4. System Architecture

```text
                    ┌─────────────────────┐
                    │      User           │
                    │ Browser / Mobile    │
                    └──────────┬──────────┘
                               │
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │ React + Vite        │
                    │ TrustShare Frontend │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │ FastAPI Backend     │
                    │ Authentication      │
                    │ Authorization       │
                    │ Encryption          │
                    │ Activity Logging    │
                    └───────┬─────┬───────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌─────────────────┐            ┌─────────────────┐
       │ Database        │            │ Supabase        │
       │ User/File Data  │            │ Encrypted Files │
       │ Sharing Data    │            │ Protected Keys  │
       └─────────────────┘            └─────────────────┘