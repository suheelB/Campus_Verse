# CampusVerse — Security and Privacy Policy

## 1. Authentication & Session Management
- Passwords are securely hashed using BCrypt with strength factor 12.
- Session or token-based authentication is enforced on all non-public endpoints.
- Tokens/sessions expire correctly and support explicit logout and invalidation.

## 2. Authorization & Tenant Scoping
- **Role-Based Access Control (RBAC)**: Platform roles (Student, College Admin, Platform Admin) and club roles (President, Officer, etc.).
- **Resource Ownership**: Users can only modify their own profiles and resources they own.
- **Tenant Isolation**: All queries and resource lookups are strictly scoped by `college_id`. A user from College A cannot access private data from College B.
- **Backend Enforcement**: Frontend permission checks are purely for UI rendering (hiding/disabling unauthorized buttons). The backend independently verifies permissions for every request.

## 3. Data Protection
- No plaintext passwords, API keys, or secrets stored in code or logs.
- Database connections use TLS in production.
- Inputs are validated using Bean Validation (Jakarta Validation) and DTOs.
- Parameterized queries via JPA/Hibernate prevent SQL injection.

## 4. Audit Logging
- Security-sensitive actions (role changes, club approvals, event approvals, administrative overrides) generate immutable audit log entries in the `audit_logs` table.
- Audit logs record actor ID, action, resource type, resource ID, timestamp, and non-sensitive metadata.

## 5. Privacy
- Minimum necessary data collection.
- Profile visibility settings let students control what others see.
- Data retention policies for event registrations, attendance, and activity records.
