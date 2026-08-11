# IKSHOVIA V3 — Development Test Credentials

This document contains credentials for local development and testing of system roles. These credentials must NEVER be displayed in the public UI or exposed to unauthenticated visitors.

---

## 1. Learner Account (USER)
- **Role:** `USER`
- **Name:** Akash
- **Email:** `student@ikshovia.com`
- **Password:** `Akash@123`
- **Target Exam:** UPSC CSE 2026
- **Permissions:** Full access to the Learner Application, Personal Intelligence Dashboard, Study Goals, AI Tutor, PYQs, and Current Affairs.

---

## 2. Admin Account (ADMIN)
- **Role:** `ADMIN`
- **Name:** Akash Singh
- **Email:** `admin@ikshovia.com`
- **Password:** `AkashAdmin@123`
- **Permissions:** Learner Application access + Admin Control Panel & Question Generation Studio.

---

## 3. Super Admin Account (SUPER_ADMIN)
- **Role:** `SUPER_ADMIN`
- **Name:** Akash Pratap Singh
- **Email:** `superadmin@ikshovia.com`
- **Password:** `AkashSuper@123`
- **Permissions:** Learner Application access + Admin Control Panel + Super Admin Console (RBAC Management, Audit Logs, System Settings, Administrator Creation/Removal).

---

## Security Verification Rules
- Credentials are verified server-side against secure `scryptSync` salted password hashes.
- API endpoints enforcement:
  - `/api/admin/*` enforces `ADMIN` or `SUPER_ADMIN` role (403 for `USER`).
  - `/api/superadmin/*` enforces `SUPER_ADMIN` role (403 for `USER` or `ADMIN`).
- Passwords are never returned in API responses or stored in frontend state/localStorage.
