import psycopg2
import sys

conn = psycopg2.connect('postgresql://postgres.oqivxvlljiibncfeucje:Saksham%402007@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres')
with open('migration_final.sql', 'r', encoding='utf-8', errors='ignore') as f:
    sql = f.read()

try:
    with conn.cursor() as cur:
        cur.execute('BEGIN;')
        cur.execute(sql)
        cur.execute('ROLLBACK;')
    print('Syntax validation passed.')
except Exception as e:
    print(f'Validation failed: {e}')
    sys.exit(1)

try:
    with conn.cursor() as cur:
        cur.execute('BEGIN;')
        cur.execute(sql)
        cur.execute('COMMIT;')
    print('Migration applied successfully.')
except Exception as e:
    print(f'Migration failed: {e}')
    sys.exit(1)