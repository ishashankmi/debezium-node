to get before value as well, set replica identity for full via this query

ALTER TABLE your_table REPLICA IDENTITY FULL;

SHOW wal_level;

ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_replication_slots = 10;
ALTER SYSTEM SET max_wal_senders = 10;

SELECT name, setting
FROM pg_settings
WHERE name IN ('wal_level', 'max_replication_slots', 'max_wal_senders');

// relkind should be full, if its on r then it means you will get before value only on primary key change

SELECT relname, relreplident
FROM pg_class
WHERE relname = 'user_messages' AND relkind = 'r';

//The value is likely 'd' (DEFAULT) which only includes primary key values in the before section.
// Change the REPLICA IDENTITY to FULL:

sqlCopyALTER TABLE public.user_messages REPLICA IDENTITY FULL;

/\*

To summarize what you've accomplished:

Created a separate Debezium connector for your messages database
Set REPLICA IDENTITY to FULL for your tables
Successfully captured both before and after values in your change events

\*/
