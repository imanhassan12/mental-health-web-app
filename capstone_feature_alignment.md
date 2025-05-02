# Capstone Feature Implementation & Vision Alignment

## 1. Feature Implementation Status

### ✔️ Features Already Implemented
- [x] Dashboard & Stats (active clients, average mood, upcoming/today's appointments, recent clients, mood trends)
- [x] Session Notes (CRUD, mood rating, filtering by client/date)
- [x] Mood Trend Chart (visualizes mood over time)
- [x] Appointment Calendar (viewing/managing appointments)
- [x] Responsive Design (dashboard and notes pages)
- [x] Risk alerts and safety monitoring
- [x] Advanced analytics (beyond mood)
- [x] Reminders & follow-ups
- [x] EHR/EMR integration (basic export/import)
- [x] Secure messaging & care team collaboration
- [x] Role-based access & permissions
- [x] Security & compliance (HIPAA/GDPR, audit logs)
- [x] Task lists and smart scheduling

### 🌟 "Wow" Features (with Time Estimates)

| Feature                                      | Estimate (hrs) |
|-----------------------------------------------|:--------------:|
| AI-Powered Risk Prediction (basic, rule-based)|      2         |
| Natural Language Processing (NLP) for notes   |      1.5       |
| Real-Time Translation (API integration)       |      0.5       |
| Telehealth Integration (video, basic)         |      1         |

**Subtotal:** 5 hours

---

**Total Estimated Time:** **45 hours**

---

## 2. Feature Alignment with Vision

> **Vision:** Empower mental health practitioners with an integrated, secure, user-friendly platform for comprehensive client management.

| Feature Area                        | Aligned? | Rationale                                                                                   |
|--------------------------------------|----------|---------------------------------------------------------------------------------------------|
| Unified Patient Dashboard            | ✔️       | Centralizes all client info, making management comprehensive and user-friendly.              |
| Smart Clinical Notes                 | ✔️       | Streamlines documentation, improves usability, and supports comprehensive care.              |
| Mood & Symptom Analytics             | ✔️       | Provides actionable insights for practitioners, supporting comprehensive management.          |
| Appointment & Task Management        | ✔️       | Integrates scheduling and follow-ups, reducing friction and supporting holistic care.         |
| Risk & Safety Monitoring             | ✔️       | Enhances client safety and practitioner awareness, a key part of comprehensive management.    |
| Care Team Collaboration              | ✔️       | Fosters integrated care and communication, essential for multidisciplinary teams.             |
| Hospital System Integration          | ✔️       | Ensures the platform fits into existing workflows, making it truly integrated and scalable.   |
| Mobile & Accessibility               | ✔️       | Increases usability and access, making the platform more user-friendly and inclusive.         |
| Security & Compliance                | ✔️       | Critical for trust, privacy, and legal compliance—core to a secure platform.                  |
| AI/NLP/Telehealth "Wow" Features     | ✔️       | These features further empower practitioners and enhance integration and usability.           |

### Summary
Every feature specified is directly aligned with the vision:
- **Integrated:** Features are designed to work together and with hospital systems.
- **Secure:** Security and compliance are foundational, not optional.
- **User-friendly:** Emphasis on intuitive dashboards, streamlined workflows, and accessibility.
- **Comprehensive client management:** Covers the full spectrum from documentation to analytics, collaboration, and patient engagement.

---

### Recommendations for Further Alignment
- Prioritize features that reduce practitioner workload and cognitive load.
- Ensure all data is actionable and easy to interpret.
- Maintain a relentless focus on privacy, security, and seamless integration.

### Security Enhancements (Hospital-Facing, AWS Deployment)
Below are AWS-specific tasks needed to operationalize the security measures, with **realistic implementation estimates**. These are **in addition to** the core 45-hour feature scope.

| Security Task                                                      | AWS Services / Approach                              | Estimate (hrs) |
|--------------------------------------------------------------------|------------------------------------------------------|:--------------:|
| End-to-End Encryption (TLS 1.3, AES-256 at rest)                    | ACM / ALB certificates, S3 & RDS encryption, KMS     |      3         |
| Detailed Audit Logging & Centralized Log Storage                   | CloudTrail, CloudWatch Logs, S3 log buckets, Athena   |      3         |
| Role-Based Access Control (RBAC)                                   | Cognito user pools, IAM roles & policies             |      4         |
| Vulnerability Scans & Pen-Testing Automation                       | AWS Inspector, third-party scanner integration       |      2         |
| Backup & Disaster Recovery Plan                                    | AWS Backup, RDS snapshots, S3 versioning, cross-region|      2         |
| Security Awareness & Training Materials                            | Internal docs, short LMS modules                     |      1         |

**Security Subtotal:** 15 hours

---

### Updated Overall Time Budget
- Core features & "Wow" items: **45 hours**
- AWS-specific security enhancements: **15 hours**

**New Total Estimated Time:** **60 hours**

> Note: The original 4-hour "Security & compliance" item in the core list covers code-level controls (input validation, basic audit hooks, privacy banners). The **additional 15 hours** above are for AWS infrastructure hardening and hospital-grade operational security. 

## Risk Alerts & Safety Monitoring – User Stories
Below user stories define the **minimum viable scope** that delivers real value to clinicians.

| ID | As a… | I want / So that | Acceptance Criteria |
|----|-------|-----------------|---------------------|
| RA-01 | Practitioner | to see **low-mood alerts** on my dashboard so that I can quickly identify clients who may need urgent attention | • When a session note within the past 7 days has mood ≤ 3, an alert appears.<br>• Alert lists client name, date, and mood rating.<br>• If multiple low-mood notes exist for the same client, only the most recent is shown. |
| RA-02 | Practitioner | to **navigate** directly from an alert to the client profile for more context | • Clicking an alert opens `/clients/:id` in a new tab or route. |
| RA-03 | Practitioner | to have the dashboard show **"No alerts"** when none are present | • If API returns empty `alerts` array, an informational "No current risk alerts" message is displayed instead of the list. |
| RA-04 | Practitioner | the alerts list to update automatically after I enter a new session note | • Submitting a new note (with or without low mood) triggers a dashboard refresh (manual page reload acceptable for MVP). |
| RA-05 | Admin | to seed **demo alert data** for training & demo purposes | • Running `node server/scripts/full-demo-setup.js` creates at least one low-mood note that surfaces an alert. |

**Out-of-scope** (future work):
* Acknowledging / dismissing alerts
* Push notifications, email/SMS
* Escalation workflows & audit trail
* Configurable alert thresholds

These stories ensure a **clinically useful, end-to-end risk alert** capability while fitting within a focused 4-hour development window. 

## Advanced Analytics (Diagnosis-Based User Engagement) – User Stories
Provide clinicians with insights into client engagement segmented by diagnosis. Engagement is measured by session attendance, note completion, and mood check-ins.

| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| AA-01 | Practitioner  | to see a chart of client engagement by diagnosis      | • Dashboard shows a bar chart: diagnosis (x-axis), avg. engagement score (y-axis).<br>• Engagement score = weighted sum of attendance, notes, check-ins. |
| AA-02 | Practitioner  | to drill down to see which clients are least engaged  | • Clicking a bar lists clients with that diagnosis, sorted by engagement. |
| AA-03 | Admin         | to export engagement analytics for reporting          | • Button to download CSV of engagement by diagnosis and client. |

**Time Estimate:** 3 hours

---

## Secure Messaging & Care Team Collaboration – User Stories
Enable HIPAA-compliant, role-based messaging between practitioners for coordinated care.

| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| SM-01 | Practitioner  | to send secure messages to other care team members    | • Can select a user from a list and send a message.<br>• Messages are encrypted in transit and at rest. |
| SM-02 | Practitioner  | to see a list of recent conversations                 | • Inbox view shows threads with most recent message preview. |
| SM-03 | Practitioner  | to discuss a specific client in a private thread      | • Can start a thread linked to a client profile.<br>• Only assigned team members can view. |
| SM-04 | Admin         | to audit message access for compliance                | • All message access is logged and exportable by admin. |

**Time Estimate:** 4 hours

---

## Task Lists and Smart Scheduling – User Stories
Allow practitioners to create, assign, and track tasks and suggest optimal appointment times based on availability.

| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| TL-01 | Practitioner  | to create and assign tasks for myself or team members | • Can add a task, assign to user, set due date.<br>• Tasks appear in dashboard and can be marked complete. |
| TL-02 | Practitioner  | to see overdue and upcoming tasks                     | • Dashboard shows tasks sorted by due date, with overdue highlighted. |
| TL-03 | Practitioner  | to get smart suggestions for appointment times        | • When scheduling, system suggests top 3 available slots based on provider and client calendars. |

**Time Estimate:** 2 hours

## Reminders & Follow-ups – User Stories

| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| RF-01 | Practitioner  | to create a reminder or follow-up for a client or myself | • Can add a reminder with message, due date, type (custom/appointment/follow-up), phone number, and recurrence.<br>• Required fields are validated. |
| RF-02 | Practitioner  | to receive reminders via SMS for important events     | • When a reminder is created, an SMS is sent to the specified phone number. |
| RF-03 | Practitioner  | to view, filter, and search all reminders             | • Reminders page lists all reminders.<br>• Can filter by status (pending/done), type, and search by message or phone. |
| RF-04 | Practitioner  | to mark reminders as done when completed              | • Can mark a reminder as done; status updates in the UI. |
| RF-05 | Practitioner  | to edit or update reminders as needed                 | • Can edit any reminder and save changes. |
| RF-06 | Practitioner  | to set up recurring reminders for regular follow-ups  | • Can set recurrence (daily, weekly, monthly, custom); system auto-creates next instance and sends SMS. |
| RF-07 | Practitioner  | to see a summary of reminders (total, pending, done, sent) | • Dashboard/cards show counts for each status. |
| RF-08 | Admin         | to seed demo reminders for training/demo purposes     | • Demo setup script creates sample reminders of each type. |

**Time Estimate:** Already completed 

## EHR/EMR Integration (Basic Export/Import) – User Stories
Enable practitioners and admins to export and import client data for interoperability with hospital systems.

| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| EHR-01 | Practitioner | to export a client's record as a standardized file    | • Can export client data (demographics, notes, appointments) as CSV or FHIR JSON.<br>• Download is available from the client profile page. |
| EHR-02 | Admin        | to import client data from an external system         | • Can upload a CSV or FHIR JSON file.<br>• System parses and creates/updates client records.<br>• Errors are reported clearly. |
| EHR-03 | Practitioner | to see a summary of imported/exported records         | • After import/export, a summary is shown (successes, errors, duplicates). |
| EHR-04 | Admin        | to set global import/export field preferences so that I can standardize data exchange for all users | • There is a UI for admins to select which fields are included in import/export for all users (global default).<br>• The system uses these global preferences for all users unless a per-user override exists. |
| EHR-05 | Admin        | to customize my own import/export field preferences, overriding the global default, so that my workflow is tailored to my needs | • Admins can set their own import/export field preferences.<br>• These preferences override the global default for that admin only. |
| EHR-06 | Admin        | to reset my personal import/export preferences to the global default so that I can easily revert to the organization's standard | • There is a "Reset to Global Default" button in the per-user preferences UI.<br>• Clicking it removes the admin's personal override and reverts to the global default. |
| EHR-07 | Any user     | to see which import/export fields are currently active for me so that I know exactly what data will be included | • The UI displays a summary of the currently active import/export fields for the logged-in user.<br>• The summary updates live after any change to preferences. |
| EHR-08 | Practitioner/Viewer | the system to always use the global field preferences for import/export so that my experience is consistent with organizational standards | • Practitioners and viewers cannot set personal field preferences.<br>• The system always uses the global default for these roles. |
| EHR-09 | Admin        | to be able to set both import and export field preferences independently so that I can control data flow in both directions | • The UI allows separate selection of fields for import and export.<br>• The backend respects these separate preferences for all relevant operations. |

## Security & Compliance (HIPAA/GDPR, Audit Logs) – User Stories

| ID      | As a…         | I want / So that                                      | Acceptance Criteria |
|---------|---------------|-------------------------------------------------------|---------------------|
| SEC-01  | Admin         | to ensure all user actions are logged (audit trail)   | • All logins, data access, edits, exports, and deletions are recorded with user, timestamp, and action.<br>• Audit logs are viewable by admins. |
| SEC-02  | Admin         | to export audit logs for compliance reviews           | • Can export audit logs as CSV or PDF for a given date range. |
| SEC-03  | User          | to be notified about privacy and data usage           | • Privacy policy and consent banner are shown on first login and after updates.<br>• User must accept to proceed. |
| SEC-04  | Admin         | to enforce strong password and authentication policies| • Passwords must meet minimum complexity.<br>• Failed login attempts are rate-limited and logged.<br>• Password reset requires email verification. |
| SEC-06  | User          | to request a copy or deletion of my personal data     | • Users can request data export or deletion (GDPR/CCPA).<br>• Requests are logged and processed by admin. |
| SEC-07  | Admin         | to restrict access based on user roles and permissions| • Only authorized users can access sensitive features (e.g., export, audit logs, admin settings).<br>• Unauthorized access attempts are logged. |
| SEC-09  | Admin         | to configure data retention and deletion policies     | • Can set retention periods for audit logs and user data.<br>• System automatically deletes data after the retention period. |

# Implementing in future

## AI-Powered Risk Prediction – User Stories
| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| AI-01 | Practitioner  | to see automatic risk predictions for my clients      | • Dashboard or client profile displays a risk level (e.g., Low/Medium/High) based on recent session notes, mood ratings, and appointment attendance.<br>• Risk is calculated using simple, transparent rules (e.g., multiple low mood scores, missed appointments). |
| AI-02 | Practitioner  | to understand why a client is flagged as high risk    | • The UI shows which factors contributed to the risk score (e.g., “3 low mood notes in last 2 weeks”). |

## Natural Language Processing (NLP) for Notes – User Stories
| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| NLP-01| Practitioner  | to get key insights or summaries from session notes   | • After saving a session note, the system highlights key topics, mood indicators, or action items extracted from the text. |
| NLP-02| Practitioner  | to see suggested tags or categories for notes         | • When writing or viewing a note, suggested tags (e.g., “anxiety”, “medication”, “follow-up”) are displayed based on NLP analysis. |

## Real-Time Translation (API integration) – User Stories
| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| RT-01 | Practitioner  | to communicate with clients in their preferred language| • Messages and session notes can be translated in real time using a translation API.<br>• The user can select a target language for translation. |
| RT-02 | Client        | to read messages from my care team in my own language | • When a message is received, the client can view it in their preferred language with a “Translate” button. |

## Telehealth Integration (video, basic) – User Stories
| ID    | As a…         | I want / So that                                      | Acceptance Criteria |
|-------|---------------|-------------------------------------------------------|---------------------|
| TH-01 | Practitioner  | to start a secure video session with a client         | • Each appointment or client profile has a “Start Video Session” button that launches a video call (using a service like Twilio or Jitsi). |
| TH-02 | Client        | to join a scheduled video session easily              | • Clients receive a link or button to join their telehealth session at the scheduled time.<br>• Video session is secure and HIPAA-compliant. |
