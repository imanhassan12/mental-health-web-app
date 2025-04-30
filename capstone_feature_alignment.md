# Capstone Feature Implementation & Vision Alignment

## 1. Feature Implementation Status

### ✔️ Features Already Implemented
- [x] Dashboard & Stats (active clients, average mood, upcoming/today's appointments, recent clients, mood trends)
- [x] Session Notes (CRUD, mood rating, filtering by client/date)
- [x] Mood Trend Chart (visualizes mood over time)
- [x] Appointment Calendar (viewing/managing appointments)
- [x] Responsive Design (dashboard and notes pages)

### ❌ Features Not Yet Implemented (with Time Estimates)

| Feature                                      | Estimate (hrs) |
|-----------------------------------------------|:--------------:|
| Risk alerts and safety monitoring             |      4         |
| Advanced analytics (beyond mood)              |      3         |
| Reminders & follow-ups                        |      3         |
| EHR/EMR integration (basic export/import)     |      5         |
| Secure messaging & care team collaboration    |      4         |
| Patient engagement portal                     |      4         |
| Role-based access & permissions               |      3         |
| Accessibility (WCAG compliance improvements)  |      2         |
| Security & compliance (HIPAA/GDPR, audit logs)|      4         |
| Task lists and smart scheduling               |      2         |

**Subtotal:** 35 hours

### 🌟 "Wow" Features (with Time Estimates)

| Feature                                      | Estimate (hrs) |
|-----------------------------------------------|:--------------:|
| AI-Powered Risk Prediction (basic, rule-based)|      2         |
| Natural Language Processing (NLP) for notes   |      1.5       |
| Real-Time Translation (API integration)       |      0.5       |
| Telehealth Integration (video, basic)         |      1         |

**Subtotal:** 5 hours

---

**Total Estimated Time:** **40 hours**

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
| Patient Engagement Portal            | ✔️       | Empowers clients and supports practitioners with more data and engagement.                    |
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
Below are AWS-specific tasks needed to operationalize the security measures, with **realistic implementation estimates**. These are **in addition to** the core 40-hour feature scope.

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
- Core features & "Wow" items: **40 hours**
- AWS-specific security enhancements: **15 hours**

**New Total Estimated Time:** **55 hours**

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