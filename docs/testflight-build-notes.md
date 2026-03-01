# TestFlight Build Notes

## Build 14 - v1.0.0 (pending)

**What to Test:**
- Generate seed phrases with 12, 15, 18, 21, and 24 word counts
- Split a seed phrase into shares (try various N/M configurations: 3-of-5, 2-of-3, etc.)
- Export shares as PDF with QR codes -- verify QR codes are scannable
- Scan QR code shares with camera to reconstruct the seed phrase
- Import an existing seed phrase and split it
- Enable passphrase (25th word) and verify it carries through split/reconstruct
- Enable Ledger-compatible derivation and verify derived addresses
- Store a seed phrase in the vault, close and reopen the app, verify vault loads
- Enable PIN protection, close and reopen the app, verify PIN prompt appears
- Switch between light and dark themes in settings
- Review the About page for accuracy

**Known Issues:**
- None reported

**Changes from Build 13:**
- Removed "Built with Expo, React Native, and ethers.js" from About footer
- Fixed email obfuscation formatting in Contact section

---

## Build 13 - v1.0.0

**Summary:** First successful App Store production build. Credentials and provisioning resolved.

**What to Test:**
- Full generate -> split -> export -> scan -> reconstruct workflow
- Vault creation, encryption, and PIN protection
- QR code scanning reliability under various lighting conditions
- PDF export formatting and print layout
- Theme switching (light/dark)
- All seed phrase word count options (12-24)
- Various share configurations (minimum 2-of-3 up to higher counts)

**Known Issues:**
- About footer displays "Built with Expo, React Native, and ethers.js" (removed in build 14)
- Email in Contact section shows inconsistent bracket formatting (fixed in build 14)
