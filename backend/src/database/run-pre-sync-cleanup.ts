// pg is a transitive dependency via typeorm
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('pg');

interface DatabaseConnectionOptions {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

export async function runPreSyncCleanup(
  options: DatabaseConnectionOptions,
): Promise<void> {
  const client = new Client({
    host: options.host ?? 'localhost',
    port: options.port ?? 5432,
    user: options.username,
    password: options.password,
    database: options.database,
  });

  await client.connect();

  try {
    await client.query(`
      DELETE FROM sales_entries
      WHERE receipt_voucher_id IN (
        SELECT id FROM receipt_vouchers WHERE receivable_id IS NULL
      )
    `);

    await client.query(`
      DELETE FROM receipt_vouchers
      WHERE receivable_id IS NULL
    `);

    await client.query(`
      UPDATE receivables r
      SET
        status = 'unpaid',
        paid_at = NULL,
        payment_method_id = NULL,
        bank_detail = NULL,
        cheque_number = NULL,
        cheque_date = NULL,
        transaction_reference = NULL
      WHERE r.status = 'paid'
        AND NOT EXISTS (
          SELECT 1 FROM receipt_vouchers rv WHERE rv.receivable_id = r.id
        )
    `);
  } finally {
    await client.end();
  }
}
