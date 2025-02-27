# PostgreSQL Change Data Capture (CDC) Setup Guide

This guide covers how to configure PostgreSQL for Change Data Capture using Debezium, with special focus on capturing "before" values in change events.

## Prerequisites

- PostgreSQL server (version 9.6 or higher)
- Appropriate database permissions to modify system settings

## Step 1: Configure PostgreSQL for Logical Replication

Run the following commands to set the necessary parameters:

```sql
-- Check current WAL level
SHOW wal_level;

-- Set WAL level to logical and increase replication slots/senders
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

-- Verify the settings
SELECT name, setting FROM pg_settings 
WHERE name IN ('wal_level', 'max_replication_slots', 'max_wal_senders');
```

**Note**: After changing these settings, you will need to restart the PostgreSQL server for them to take effect.

## Step 2: Configure Tables for Full Replica Identity

By default, PostgreSQL only includes primary key values in the "before" section of change events. To capture the full row data in "before" values, you need to set REPLICA IDENTITY to FULL:

```sql
-- Check current REPLICA IDENTITY setting
-- 'd' means DEFAULT (primary key only)
-- 'f' means FULL (entire row data)
SELECT relname, relreplident 
FROM pg_class 
WHERE relname = 'user_messages' AND relkind = 'r';

-- Set REPLICA IDENTITY to FULL for your table
ALTER TABLE public.user_messages REPLICA IDENTITY FULL;
```

You'll need to run this ALTER TABLE command for each table where you want to capture full "before" values.

## Step 3: Configure Debezium Connector

Create a separate Debezium connector configuration for your messages database. This step depends on your specific Debezium deployment method (Kafka Connect, etc.).

## Verifying Your Setup

After completing the setup, you should see both "before" and "after" values in your change events when data is modified.

## Troubleshooting

If you're not seeing "before" values in your change events:

1. Verify that REPLICA IDENTITY is set to FULL for your table:
   ```sql
   SELECT relname, relreplident FROM pg_class WHERE relname = 'your_table' AND relkind = 'r';
   ```
   The value should be 'f' for FULL.

2. Ensure the PostgreSQL server was restarted after changing the WAL settings.

3. Check that your Debezium connector is properly configured to capture these events.
