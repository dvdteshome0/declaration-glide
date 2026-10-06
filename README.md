# Cargo Connect

You are an expert full-stack web developer. Build a secure, responsive web application for a customs clearing agency to manage client import declarations.
App Name: Customs Clearing Client Portal
Purpose: Track import declarations from submission to final clearance for multiple importer clients.
User Roles:
Admin (Customs Agent): Full access to create, edit, delete, and update all records.
Client (Importer): View-only access to their own declarations after secure login.
Database: Create a collection/table called "ImportDeclarations" with these fields:
importerName (Text, required)
importerTIN (Text, required, unique)
contactPhone (Text, required)
contactEmail (Email, required)
commodity (Text, required, e.g., "Rice 25,000 MT")
hsCode (Text, optional)
declarationNumber (Text, required, unique, format: YYYY-NNNNNN)
billOfLadingNumber (Text, optional)
healthMinistryAppNo (Text, optional)
tradeMinistryAppNo (Text, optional)
declarationStatus (Select, required, options: "Submitted", "Paid", "Cleared", "Exited", "Cancelled", "National Bank Cleared")
nationalBankClearedDate (Date, required if status = "National Bank Cleared")
dateClearedCustoms (Date, optional)
dateExitedPort (Date, optional)
dateSubmitted (Date, auto-filled on creation)
lastUpdated (DateTime, auto-updated on edit)
assignedAgent (Text, optional)
remarks (Long Text, optional)
attachments (File Upload, multiple files allowed, optional)
Pages to Generate:
Landing Page (/):
Professional hero section: "Trusted Customs Clearing Services"
Call-to-action buttons: "Client Login" and "Contact Us"
Features section: "Real-Time Tracking", "Secure Portal", "Expert Clearance"
Footer with contact info
Admin Login Page (/admin-login):
Email + password form
Redirect to Admin Dashboard on successful login
Admin Dashboard (/admin/dashboard):
Summary cards: Total Active, Pending Payment, Awaiting Bank Clearance, Cleared This Month, Cancelled
Search bar (by Declaration Number, Importer Name, or TIN)
"Add New Declaration" button
Table view of all declarations with columns: Declaration #, Importer, Commodity, Status, Date Submitted, Last Updated
Row actions: View, Edit, Delete
Status color coding: Submitted (Yellow), Paid (Blue), Cleared (Green), Exited (Dark Green), Cancelled (Red), National Bank Cleared (Purple)
Add/Edit Declaration Form (/admin/add-declaration, /admin/edit/:id):
Form with all fields from ImportDeclarations collection
Validation: Required fields marked, TIN uniqueness check
Status dropdown with color indicators
Conditional fields: Show nationalBankClearedDate only when status = "National Bank Cleared"
File upload for attachments
Submit button saves to database, redirects to dashboard
Declaration Detail View (/admin/declaration/:id):
Full record display in read-only card layout
Edit and Delete buttons (Admin only)
Download attachments section
Status timeline visualization (Submitted → Paid → Bank Cleared → Customs Cleared → Exited)
Client Login Page (/client-login):
Email + password OR Phone + OTP login
Redirect to Client Portal on successful login
Client Portal (/client/dashboard):
Filtered view: Only show declarations where contactEmail or importerTIN matches logged-in client
Search bar (by Declaration Number or Commodity)
Table view: Declaration #, Commodity, Status, Date Submitted, Last Updated
Click row to view full details (read-only)
Download attachments button
Client Declaration Detail (/client/declaration/:id):
Read-only card view of all fields
No edit or delete options
Download attachments section
"Contact Agent" button (opens email or WhatsApp)
Features to Implement:
Authentication: Secure login for Admin and Clients (use Firebase Auth, Auth0, or built-in auth)
Role-Based Access Control: Admin can do everything; Client can only view their own records
Search & Filter: By status, date range, commodity, declaration number
Export: Admin can export table to CSV/Excel
Notifications: Send email to client when status changes to "Paid", "National Bank Cleared", "Cleared", or "Exited"
Audit Log: Track who updated each record and when (store in separate "AuditLog" collection)
Responsive Design: Works on desktop, tablet, and mobile
Professional UI: Navy blue, white, and gold color scheme; clean, corporate look
Technology Stack:
Frontend: React.js or Next.js
Backend: Node.js with Express or serverless functions
Database: PostgreSQL, MongoDB, or Firebase Firestore
Auth: Firebase Authentication or custom JWT
Hosting: Vercel, Netlify, or Firebase Hosting
If using AI builder: Use closest no-code equivalent (Bubble, Softr, Glide, Wix with database)
Security Requirements:
HTTPS encryption
Password hashing
Role-based access control
Input validation and sanitization
Audit trail for all changes
Deliverables:
Fully functional web app with all pages and features above
Sample data: 5 importers with 3-5 declarations each (different statuses)
Test credentials:
Admin: admin@customsportal.com / password123
Client: client@goldenafrica.com / password123
Deployment instructions or live deployment
Brief user guide (how to add importers, update status, export data)
Example Workflow:
Admin logs in, clicks "Add New Declaration"
Fills in: Importer Name = "Golden Africa Trading PLC", TIN = "TIN123456", Commodity = "Rice 500 MT", Declaration Number = "2026-004521", Status = "Submitted"
Saves record
Later, updates status to "Paid" → "National Bank Cleared" (adds date) → "Cleared" → "Exited"
Client logs in with their email, sees only their declarations, checks real-time status
Start by:
Generating a clickable prototype/mockup of the Admin Dashboard and Client Portal
Setting up the database schema
Implementing authentication and role-based access
Building all CRUD operations for ImportDeclarations
Adding search, filter, and export features
Deploying to a live URL for testing

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://declaration-glide.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/61c8a3c3-eb7a-40e1-934b-1f0b1201473c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
