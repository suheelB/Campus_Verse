# CampusVerse — Security and Privacy Policy

## 1. Authentication & Session Management
- Passwords are securely hashed using BCrypt with strength factor 12.
- Stateless JWT bearer tokens expire according to `JWT_EXPIRATION_MS`. Current logout removes the token from browser storage; server-side invalidation/denylisting is not implemented yet.

## 2. Authorization & Tenant Scoping
- **Role-Based Access Control (RBAC)**: Platform roles (Student, College Admin, Platform Admin) and club roles (President, Officer, etc.).
- **Resource Ownership**: Users can only modify their own profiles and resources they own.
- **Tenant Isolation**: All queries and resource lookups are strictly scoped by `college_id`. A user from College A cannot access private data from College B.
- Club endpoints scope directory, detail, creator request history, membership lists, and decisions to the authenticated user's college. Foreign-college club details return not found.
- College and platform administrator checks read `platform_role_assignments` server-side; student registration cannot set a privileged role.
- Club officers need an active membership whose server-stored club role includes `MANAGE_MEMBERS` to process applications or assign a role. Applicants cannot approve their own request.
- The creator becomes a club officer only after a college administrator approves the club request. Admin provisioning currently requires a trusted operational process; there is no public role-grant route.

## 3. Data Protection
- No plaintext passwords, API keys, or secrets stored in code or logs.
- Database connections use TLS in production.
- Inputs are validated using Bean Validation (Jakarta Validation) and DTOs.
- Parameterized queries via JPA/Hibernate prevent SQL injection.

## 4. Audit Logging
- `audit_logs` is part of the planned schema, but club creation/approval, membership decisions, and role assignments are not yet recorded there. Add audit writes before pilot use.

## 5. Privacy
- Minimum necessary data collection.
- Profile visibility settings let students control what others see.
- Data retention policies for event registrations, attendance, and activity records.
