# Security Specification for Class Cash Book Realtime Sync

## Data Invariants
1. Class documents must have valid alphanumeric IDs up to 128 characters.
2. The payload must contain valid `classConfig`, `students`, `jimpitanRecords`, and `transactions` fields.
3. Strings and arrays must have bounded lengths to prevent denial-of-wallet resource exhaustion.

## Access Rules
1. Read access is open to all visitors/parents/teachers accessing the shared application link to inspect real-time financial transparency.
2. Writes validate payload structure and field boundaries.
