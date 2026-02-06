# License Management System

## Overview
The License Management System allows administrators to control access to the AI CRM based on a signed JWT license key. This ensures that only authorized instances of the application can run and helps manage feature entitlements (e.g., maximum seats, specific AI capabilities).

## How it Works

1.  **License Key Generation**:
    *   Keys are generated offline using an Ed25519 private key.
    *   The license is a JWT containing claims like `business_name`, `plan`, `features`, `max_seats`, and `expires_at`.
    *   The JWT is signed with the private key.

2.  **License Verification**:
    *   The application holds the corresponding Ed25519 *public key*.
    *   On every request (via middleware), the system verifies the signature of the stored license key.
    *   If the signature is invalid or the license has expired, the request is blocked with a `402 Payment Required` error.
    *   Critical endpoints (like `/auth`, `/admin/license`) are exempted from this check to allow for login and license activation.

3.  **Activation**:
    *   Administrators upload the license key string via the Admin Panel -> Security -> License tab.
    *   The key is verified and stored in the `ai_configs` table in the database.

## Admin Panel Features

*   **View Status**: See the current license status (Active, Missing, Invalid).
*   **License Details**: View the business name, plan, expiration date, and enabled features.
*   **Upload/Update**: Paste a new license key to activate or renew the subscription.

## Troubleshooting

*   **"No License Key Found"**: This means no license has been uploaded yet. Go to the Admin Panel and upload a valid key.
*   **"License Invalid"**: The key may be malformed, signed by the wrong private key, or tampered with.
*   **"License Expired"**: The `expires_at` date in the token has passed. A new key is required.

## Technical Details

*   **Algorithm**: EdDSA (Ed25519)
*   **Library**: `pyjwt`, `cryptography`
*   **Storage**: `ai_configs.license_key` (Text column)
