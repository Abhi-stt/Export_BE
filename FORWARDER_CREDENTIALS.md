# Forwarder Login Credentials

## Overview
All forwarders in the system have been assigned passwords. This document lists all available forwarder accounts.

---

## 🚛 FORWARDER ADMIN
**Full Dashboard Access** - Can create and manage sub-forwarders

- **Name:** Forwarder Admin
- **Email:** `forwarder@export.com`
- **Password:** `forwarder123`
- **Designation:** Forwarder Admin
- **Access:** Full Forwarder Dashboard with Management section

---

## 🚚 SUB-FORWARDERS
**My Tasks Dashboard** - Can manage only their assigned tasks

### 1. Pickup Forwarder
- **Name:** Pickup Forwarder
- **Email:** `pickup@export.com`
- **Password:** `pickup123`
- **Designation:** Pickup Forwarder
- **Dashboard:** 🚛 Pickup Forwarder Dashboard

### 2. Transit Forwarder
- **Name:** Transit Forwarder
- **Email:** `transit@export.com`
- **Password:** `transit123`
- **Designation:** Transit Forwarder
- **Dashboard:** 🚚 Transit Forwarder Dashboard

### 3. Port Loading Specialist
- **Name:** Port Loading Forwarder
- **Email:** `portloading@export.com`
- **Password:** `port123`
- **Designation:** Port Loading Specialist
- **Dashboard:** 🚢 Port Loading Dashboard

### 4. Shipping Coordinator
- **Name:** Shipping Forwarder
- **Email:** `shipping@export.com`
- **Password:** `ship123`
- **Designation:** Shipping Coordinator
- **Dashboard:** ⛴️ On Ship Dashboard

### 5. Delivery Specialist
- **Name:** Delivery Forwarder
- **Email:** `delivery@export.com`
- **Password:** `delivery123`
- **Designation:** Delivery Specialist
- **Dashboard:** 📍 Delivery Dashboard

---

## How to Create New Sub-Forwarders

1. **Login as Forwarder Admin:**
   - Email: `forwarder@export.com`
   - Password: `forwarder123`

2. **Go to Dashboard → Management Tab**

3. **Click "Create Forwarder" button**

4. **Fill in the form:**
   - Name
   - Email
   - **Password** (minimum 6 characters) ⚠️ Important!
   - Phone
   - Company
   - Specialization (Pickup, Transit, Port Loading, On Ship, Destination)

5. **Click "Create Authorized Forwarder"**

6. **Share credentials** with the new sub-forwarder

---

## Default Password Policy

- **Existing Forwarders:** Have predefined passwords (see above)
- **New Forwarders:** Password is set by the Forwarder Admin during creation
- **Minimum Length:** 6 characters
- **Security:** All passwords are hashed using bcrypt before storage

---

## Testing

To test the system with different forwarder roles:

1. **Test as Forwarder Admin:**
   - Login with `forwarder@export.com` / `forwarder123`
   - You'll see full dashboard with Management section
   - Can create new orders, view all assignments, manage sub-forwarders

2. **Test as Sub-Forwarder:**
   - Login with any sub-forwarder credentials (e.g., `pickup@export.com` / `pickup123`)
   - You'll see simplified "My Tasks" dashboard
   - Can only see and manage tasks assigned to you

---

## Troubleshooting

**Q: I forgot a sub-forwarder's password**
A: The Forwarder Admin needs to create a new account or contact system admin for password reset

**Q: Sub-forwarder sees full dashboard instead of "My Tasks"**
A: Check the user's designation - it should NOT include "admin" (case-insensitive)

**Q: Can't create new forwarder - "User already exists"**
A: Email addresses must be unique. Use a different email or delete the existing user first

---

Last Updated: October 1, 2025

