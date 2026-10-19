const assert = require('node:assert/strict');
const { localOrigin, extractOtp } = require('./test-account-deletion-supabase-api');
const { configuration } = require('./test-account-deletion-postgres-concurrency');

// Pure checks: importing either opt-in harness must NOT start Auth, SMTP, SQL,
// WSL or a network connection. All credentials below are synthetic strings.
let passed = 0;
const test = (fn) => { fn(); passed++; };
for (const value of ['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321'])
  test(() => assert.equal(localOrigin(value, 'test'), value));
for (const value of ['', 'https://production.supabase.co', 'http://127.0.0.1.evil.invalid:42',
  'http://user:password@127.0.0.1:42', 'http://127.0.0.1:42/path', 'http://127.0.0.1:42?remote=true',
  'http://127.0.0.1:42#remote', 'file:///tmp/mailbox'])
  test(() => assert.throws(() => localOrigin(value, 'test')));

test(() => assert.equal(extractOtp({ Text: 'Code: 123456', HTML: '<b>123456</b>' }), '123456'));
test(() => assert.equal(extractOtp({ HTML: '<style>body{color:#071617}</style><script>987654</script><b>123456</b>' }), '123456'));
test(() => assert.equal(extractOtp({ HTML: '<b>&#49;&#50;&#51;&#52;&#53;&#54;</b>' }), '123456'));
for (const message of [{ Text: 'Link without code' }, { Text: '123456 654321' }, { HTML: '<style>#071617</style>' }])
  test(() => assert.throws(() => extractOtp(message)));

const env = {
  S3D_LOCAL_DB_URL: 'postgresql://synthetic:synthetic-password@127.0.0.1:21308/s3d_deletion_guard',
  S3D_LOCAL_DISPOSABLE_DB: 's3d_deletion_guard',
  S3D_LOCAL_WSL_PSQL: '/home/test/cache/bin/psql',
  S3D_LOCAL_WSL_DISTRO: 'Ubuntu-24.04', S3D_LOCAL_WSL_USER: 'synthetic'
};
test(() => {
  const config = configuration(env);
  assert.equal(config.database, 's3d_deletion_guard');
  assert.equal(config.pg.PGHOST, '127.0.0.1');
  assert.equal(config.pg.PGUSER, 'synthetic');
  assert.equal(config.env.PGPASSWORD, 'synthetic-password');
  assert(config.env.WSLENV.split(':').includes('PGPASSWORD'));
});
for (const changes of [
  { S3D_LOCAL_DB_URL: '' },
  { S3D_LOCAL_DB_URL: 'postgresql://a:b@production.supabase.co:5432/s3d_deletion_guard' },
  { S3D_LOCAL_DB_URL: 'postgresql://a:b@127.0.0.1.evil.invalid:5432/s3d_deletion_guard' },
  { S3D_LOCAL_DB_URL: 'postgresql://a:b@127.0.0.1:5432/postgres', S3D_LOCAL_DISPOSABLE_DB: 'postgres' },
  { S3D_LOCAL_DISPOSABLE_DB: '' }, { S3D_LOCAL_DISPOSABLE_DB: 's3d_deletion_other' },
  { S3D_LOCAL_DB_URL: env.S3D_LOCAL_DB_URL + '?service=production' },
  { S3D_LOCAL_DB_URL: env.S3D_LOCAL_DB_URL + '#remote' },
  { S3D_LOCAL_DB_URL: 'postgresql://a:b@127.0.0.1:5432/s3d_deletion_guard%2fother' },
  { S3D_LOCAL_DB_URL: 'postgresql://a@127.0.0.1:5432/s3d_deletion_guard' },
  { S3D_LOCAL_WSL_PSQL: 'C:/psql.exe' }, { S3D_LOCAL_WSL_PSQL: '/bin/sh;echo-secret/bin/psql' },
  { S3D_LOCAL_WSL_DISTRO: '' }, { S3D_LOCAL_WSL_USER: '' }
]) test(() => assert.throws(() => configuration({ ...env, ...changes })));

console.log(`PASS account deletion homologation guardrails: ${passed} pure checks; no I/O or credentials loaded.`);
