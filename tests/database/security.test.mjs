import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';

const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const stranger = '00000000-0000-4000-8000-000000000002';
const publicId = '10000000-0000-4000-8000-000000000001';
const privateId = '10000000-0000-4000-8000-000000000002';
const receiptId = '20000000-0000-4000-8000-000000000001';

before(async () => {
  await db.exec(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
  `);
  const files = (await readdir('supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files.slice(0, -1))
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
  await db.exec(`
    INSERT INTO auth.users VALUES ('${owner}'), ('${stranger}');
    INSERT INTO commitments(id, user_id, founder_type, commitment_text, daily_action, deadline, is_public)
    VALUES ('${publicId}', '${owner}', 'Founder', 'Ship a synthetic demo', 'Write one test', now() + interval '30 days', true),
           ('${privateId}', '${stranger}', 'Founder', 'Private synthetic goal', 'Read one page', now() + interval '30 days', false);
    INSERT INTO daily_progress(commitment_id,day_number,completed) VALUES ('${privateId}', 1, true);
    INSERT INTO accountability_receipts(id,user_id,commitment_id,week_number,commitment_text,agent_mode,title,mirror,prompt)
    VALUES ('${receiptId}','${owner}','${publicId}',1,'Ship a synthetic demo','normal','Record','Mirror','Prompt');
  `);
  await db.exec(await readFile(`supabase/migrations/${files.at(-1)}`, 'utf8'));
});
after(() => db.close());
async function as(role, uid, fn) {
  return db.transaction(async (tx) => {
    await tx.exec(`SET LOCAL ROLE ${role}`);
    await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [
      uid || '',
    ]);
    return fn(tx);
  });
}
const count = async (tx, table) =>
  Number((await tx.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n);

test('visitors see only public commitments and no private progress', async () => {
  await as('anon', null, async (tx) => {
    assert.equal(await count(tx, 'commitments'), 1);
    assert.equal(await count(tx, 'daily_progress'), 0);
    assert.equal(await count(tx, 'commitments_feed'), 1);
  });
});
test('owners can read their private commitments and progress', async () => {
  await as('authenticated', stranger, async (tx) => {
    assert.equal(await count(tx, 'commitments'), 2);
    assert.equal(await count(tx, 'daily_progress'), 1);
  });
});
test('visitors cannot insert commitments', async () => {
  await assert.rejects(
    as('anon', null, (tx) =>
      tx.exec(
        `INSERT INTO commitments(user_id,founder_type,commitment_text,daily_action) VALUES ('${owner}','Founder','Goal','Action')`
      )
    ),
    /permission denied/
  );
});
test('authenticated callers cannot impersonate another owner', async () => {
  await assert.rejects(
    as('authenticated', stranger, (tx) =>
      tx.exec(
        `INSERT INTO commitments(user_id,founder_type,commitment_text,daily_action) VALUES ('${owner}','Founder','Goal','Action')`
      )
    ),
    /row-level security/
  );
});
test('one active commitment is enforced in the database', async () => {
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(
        `INSERT INTO commitments(user_id,founder_type,commitment_text,daily_action) VALUES ('${owner}','Founder','Goal','Action')`
      )
    ),
    /unique constraint/
  );
});
test('empty commitment text is rejected', async () => {
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(
        `UPDATE commitments SET commitment_text = ' ' WHERE id = '${publicId}'`
      )
    ),
    /check constraint/
  );
});
test('overlong daily actions are rejected', async () => {
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(
        `UPDATE commitments SET daily_action = repeat('a',61) WHERE id = '${publicId}'`
      )
    ),
    /too long|check constraint/
  );
});
test('owners cannot rewrite ownership, clock or progress fields', async () => {
  for (const mutation of [
    "user_id = '" + stranger + "'",
    'created_at = now()',
    'deadline = now()',
    'days_completed = 30',
    "check_ins = '[]'",
    'is_public = false',
  ]) {
    await assert.rejects(
      as('authenticated', owner, (tx) =>
        tx.exec(`UPDATE commitments SET ${mutation} WHERE id = '${publicId}'`)
      ),
      /permission denied/
    );
  }
});
test('nonowners cannot modify visible commitments', async () => {
  const result = await as('authenticated', stranger, (tx) =>
    tx.query(
      `UPDATE commitments SET commitment_text = 'Stolen' WHERE id = '${publicId}' RETURNING id`
    )
  );
  assert.equal(result.rows.length, 0);
});
test('check-in RPC verifies ownership', async () => {
  await assert.rejects(
    as('authenticated', stranger, (tx) =>
      tx.query('SELECT record_check_in($1)', [publicId])
    ),
    /not found/
  );
});
test('visitors cannot execute check-in RPC', async () => {
  await assert.rejects(
    as('anon', null, (tx) =>
      tx.query('SELECT record_check_in($1)', [publicId])
    ),
    /permission denied/
  );
});
test('repeat check-ins are idempotent and update both records', async () => {
  await as('authenticated', owner, async (tx) => {
    await tx.query('SELECT record_check_in($1)', [publicId]);
    await tx.query('SELECT record_check_in($1)', [publicId]);
    const row = (
      await tx.query(
        'SELECT days_completed, check_ins FROM commitments WHERE id=$1',
        [publicId]
      )
    ).rows[0];
    assert.equal(row.days_completed, 1);
    assert.equal(row.check_ins.length, 1);
    assert.equal(
      Number(
        (
          await tx.query(
            'SELECT count(*) AS n FROM daily_progress WHERE commitment_id=$1',
            [publicId]
          )
        ).rows[0].n
      ),
      1
    );
  });
});
test('direct progress fabrication is forbidden', async () => {
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(
        `INSERT INTO daily_progress(commitment_id,day_number) VALUES ('${publicId}',30)`
      )
    ),
    /permission denied/
  );
});
test('receipts remain private and cannot reference another owner', async () => {
  await as('authenticated', stranger, async (tx) =>
    assert.equal(await count(tx, 'accountability_receipts'), 0)
  );
  await assert.rejects(
    as('authenticated', stranger, (tx) =>
      tx.exec(
        `INSERT INTO accountability_receipts(user_id,commitment_id,week_number,commitment_text,agent_mode,title,mirror,prompt) VALUES ('${stranger}','${publicId}',1,'Goal','normal','Title','Mirror','Prompt')`
      )
    ),
    /row-level security/
  );
});
test('clients cannot forge email logs or reserve email', async () => {
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(
        `INSERT INTO email_send_log(user_id,recipient,subject) VALUES ('${owner}','fake@example.com','Fake')`
      )
    ),
    /permission denied/
  );
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.query('SELECT reserve_receipt_email($1,$2,$3)', [
        owner,
        receiptId,
        'synthetic@example.com',
      ])
    ),
    /permission denied/
  );
});
test('service email reservation rejects duplicate receipt delivery', async () => {
  await as('service_role', null, async (tx) =>
    assert.ok(
      (
        await tx.query('SELECT reserve_receipt_email($1,$2,$3) AS id', [
          owner,
          receiptId,
          'synthetic@example.com',
        ])
      ).rows[0].id
    )
  );
  await assert.rejects(
    as('service_role', null, (tx) =>
      tx.query('SELECT reserve_receipt_email($1,$2,$3)', [
        owner,
        receiptId,
        'synthetic@example.com',
      ])
    ),
    /already requested/
  );
});
test('service email reservation enforces daily user limit', async () => {
  for (let i = 0; i < 4; i++)
    await as('service_role', null, (tx) =>
      tx.query('SELECT reserve_receipt_email($1,$2,$3)', [
        owner,
        receiptId,
        `synthetic${i}@example.com`,
      ])
    );
  await assert.rejects(
    as('service_role', null, (tx) =>
      tx.query('SELECT reserve_receipt_email($1,$2,$3)', [
        owner,
        receiptId,
        'limit@example.com',
      ])
    ),
    /Daily email limit/
  );
});
test('late edits are blocked and terminal outcomes cannot be reopened', async () => {
  await db.exec(
    `UPDATE commitments SET created_at=now()-interval '2 days' WHERE id='${publicId}'`
  );
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(
        `UPDATE commitments SET commitment_text='Changed late' WHERE id='${publicId}'`
      )
    ),
    /edit window/
  );
  await as('authenticated', owner, (tx) =>
    tx.exec(`UPDATE commitments SET status='completed' WHERE id='${publicId}'`)
  );
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.exec(`UPDATE commitments SET status='active' WHERE id='${publicId}'`)
    ),
    /Invalid commitment status/
  );
  await assert.rejects(
    as('authenticated', owner, (tx) =>
      tx.query('SELECT record_check_in($1)', [publicId])
    ),
    /not active/
  );
});
