# TrustShare – Secure File Sharing & Activity Monitoring System

> A secure file-sharing platform that protects files using AES-256-GCM encryption and provides authentication, authorization, permission-based sharing, temporary access, access revocation, activity monitoring, security notifications, reports, analytics, and cloud deployment.

---

## 📌 Project Overview

**TrustShare** is a secure file-sharing and activity-monitoring system developed as part of the **Infosys Springboard** project.

The main purpose of TrustShare is to provide a secure and controlled environment for uploading, storing, sharing, and monitoring files.

Traditional file-sharing systems can create security risks when files are stored without encryption, shared without proper permissions, or accessed without sufficient monitoring.

TrustShare addresses these problems by combining:

- Secure user authentication
- JWT-based authentication
- bcrypt password hashing
- AES-256-GCM server-side encryption
- Protected encryption-key management
- Secure cloud storage
- Permission-based file sharing
- Temporary access links
- Share revocation
- Activity and audit logging
- Security notifications
- Suspicious activity monitoring
- File activity reports
- Storage analytics
- Responsive user interface
- Docker containerization
- Cloud deployment
- End-to-end security testing

---

# 🎯 Problem Statement

File sharing is commonly used in educational institutions, organizations, businesses, and collaborative environments.

However, conventional file-sharing approaches may have security problems such as:

- Unauthorized access to files
- Unencrypted file storage
- Insufficient permission control
- Shared links remaining active for too long
- Difficulty revoking access
- Lack of file activity tracking
- Limited visibility into failed login attempts
- Difficulty identifying suspicious activities
- Security risks during cloud deployment

The objective of TrustShare is to solve these problems by creating a secure file-sharing platform where:

1. Users are authenticated.
2. Files are encrypted before storage.
3. Access is controlled through permissions.
4. Temporary access can be created.
5. Access can be revoked.
6. File activities are recorded.
7. Security events can be monitored.
8. The system can be deployed and tested in a production environment.

---

# 🎯 Project Objectives

The major objectives of TrustShare are:

- Build a secure file-sharing platform.
- Implement user registration and authentication.
- Protect passwords using bcrypt hashing.
- Use JWT authentication for protected API access.
- Encrypt files using AES-256-GCM.
- Store encrypted files in cloud storage.
- Protect encryption keys separately from encrypted files.
- Implement permission-based file sharing.
- Support Read, Write, and Read/Write permissions.
- Implement temporary file access.
- Validate temporary-link expiration.
- Allow users to revoke shared access.
- Prevent unauthorized file downloads.
- Maintain activity and audit logs.
- Generate security notifications.
- Monitor failed login attempts.
- Detect suspicious security activities.
- Provide file activity and security reports.
- Provide storage analytics.
- Build a responsive user interface.
- Containerize the application using Docker.
- Deploy the frontend and backend to the cloud.
- Perform security and functional testing.
- Validate the complete end-to-end workflow.

---

# 🏗️ Project Scope

TrustShare is divided into the following major modules.

### 1. Authentication Module

- User registration
- User login
- Password hashing
- Password reset
- JWT authentication
- Protected API endpoints
- Authentication validation

### 2. File Management Module

- File upload
- File validation
- AES-256-GCM encryption
- Secure cloud storage
- Authorized download
- File activity tracking

### 3. File Sharing Module

- Share files with users
- Read permission
- Write permission
- Read/Write permission
- Temporary access
- Expiration validation
- Revoke access
- Unauthorized download prevention

### 4. Monitoring Module

- Activity logging
- Audit logging
- Failed-login monitoring
- Security notifications
- Suspicious activity detection
- File activity reports
- Storage analytics

### 5. Deployment Module

- Docker
- Docker Compose
- Frontend production build
- Backend production deployment
- Render deployment
- Production testing

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- HTML
- CSS

## Backend

- Python
- FastAPI
- Uvicorn

## Database

- SQLite
- SQLAlchemy

## Security

- AES-256-GCM
- JWT
- bcrypt
- HTTPS/TLS in production

## Cloud Storage

- Supabase Storage

## Deployment

- Docker
- Docker Compose
- Render

## Development & Testing Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- Chrome DevTools

---

# 🏛️ System Architecture

```text
                         ┌─────────────────────┐
                         │        USER         │
                         │  Browser / Mobile   │
                         └──────────┬──────────┘
                                    │
                                  HTTPS
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    React + Vite     │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                                  REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │                     │
                         │ Authentication      │
                         │ Authorization       │
                         │ File Management     │
                         │ Encryption          │
                         │ Sharing             │
                         │ Activity Logging    │
                         │ Notifications       │
                         └─────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │     SQLite      │           │    Supabase     │
          │    Database     │           │     Storage     │
          │                 │           │                 │
          │ Users           │           │ Encrypted Files │
          │ File Metadata   │           │ Protected Keys  │
          │ Sharing Data    │           │                 │
          │ Activity Data   │           │                 │
          └─────────────────┘           └─────────────────┘