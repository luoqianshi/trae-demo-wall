const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
fs.writeFileSync(path.join(certsDir, 'key.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }));

const pubSpki = publicKey.export({ type: 'spki', format: 'der' });

function wrap(tag, content) {
  return Buffer.concat([Buffer.from([tag]), encodeLength(content.length), content]);
}
function encodeLength(len) {
  if (len < 0x80) return Buffer.from([len]);
  const hexStr = len.toString(16);
  const padded = hexStr.length % 2 ? '0' + hexStr : hexStr;
  return Buffer.concat([Buffer.from([0x80 | (padded.length / 2)]), Buffer.from(padded, 'hex')]);
}
function seq(...parts) { return wrap(0x30, Buffer.concat(parts)); }
function setOf(...parts) { return wrap(0x31, Buffer.concat(parts)); }
function integer(val) {
  let hex = BigInt(val).toString(16);
  if (hex.length % 2) hex = '0' + hex;
  return wrap(0x02, Buffer.from(hex, 'hex'));
}
function bitstring(buf) { return wrap(0x03, Buffer.concat([Buffer.from([0x00]), buf])); }
function oid(str) {
  const parts = str.split('.').map(Number);
  let encoded = '';
  encoded += encodeVarInt(parts[0] * 40 + parts[1]);
  for (let i = 2; i < parts.length; i++) encoded += encodeVarInt(parts[i]);
  return wrap(0x06, Buffer.from(encoded, 'hex'));
}
function encodeVarInt(val) {
  if (val < 0x80) return val.toString(16).padStart(2, '0');
  let result = '';
  while (val > 0) {
    let byte = val & 0x7f;
    val >>>= 7;
    if (val > 0) byte |= 0x80;
    result = byte.toString(16).padStart(2, '0') + result;
  }
  return result;
}
function utf8str(s) { return wrap(0x0c, Buffer.from(s, 'utf8')); }
function utcTime(str) { return wrap(0x17, Buffer.from(str)); }
function null_() { return Buffer.from([0x05, 0x00]); }
function boolean_(val) { return wrap(0x01, Buffer.from([val ? 0xFF : 0x00])); }
function octetString(buf) { return wrap(0x04, buf); }

const sigAlg = seq(oid('1.2.840.113549.1.1.11'), null_());
const cnRdn = seq(setOf(seq(oid('2.5.4.3'), utf8str('localhost'))));

const now = Math.floor(Date.now() / 1000);
const nb = new Date(now * 1000).toISOString().slice(2, 16).replace(/-/g, '') + 'Z';
const na = new Date((now + 365 * 86400) * 1000).toISOString().slice(2, 16).replace(/-/g, '') + 'Z';

// BasicConstraints extension: critical=TRUE, CA=FALSE (empty sequence)
const bcValue = seq(); // empty SEQUENCE = CA:FALSE
const bcExt = seq(oid('2.5.29.19'), boolean_(true), octetString(bcValue));
const extensions = seq(setOf(bcExt));

const tbs = seq(
  wrap(0xa0, Buffer.from([0x02, 0x01, 0x02])), // version v3
  integer(1),                                    // serial
  sigAlg,                                        // signature algorithm
  cnRdn,                                         // issuer
  seq(utcTime(nb), utcTime(na)),                 // validity
  cnRdn,                                         // subject
  pubSpki,                                       // subject public key info
  wrap(0xa3, extensions),                        // extensions
);

const signature = crypto.createSign('RSA-SHA256').update(tbs).sign(privateKey);
const certDer = seq(tbs, sigAlg, bitstring(signature));

const b64 = certDer.toString('base64').match(/.{1,64}/g).join('\n');
const certPem = `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`;
fs.writeFileSync(path.join(certsDir, 'cert.pem'), certPem);

// Verify
try {
  const x = new crypto.X509Certificate(certPem);
  console.log(`[certs] OK - CN=${x.subject.CN}, validFrom=${x.validFrom}, validTo=${x.validTo}`);
  console.log(`[certs] CA=${x.ca}, extensions:`, x.extensions?.map(e => e.name).join(', '));
} catch (e) {
  console.log(`[certs] X509 parse failed: ${e.message}`);
}

// TLS test
const tls = require('tls');
const srv = tls.createServer({
  key: fs.readFileSync(path.join(certsDir, 'key.pem')),
  cert: fs.readFileSync(path.join(certsDir, 'cert.pem')),
}, s => { s.write('OK'); s.end(); });
srv.listen(19999, '127.0.0.1', () => {
  console.log('[certs] TLS server started');
  const c = tls.connect({ port: 19999, host: '127.0.0.1', rejectUnauthorized: false }, () => {
    let d = '';
    c.on('data', ch => d += ch);
    c.on('end', () => { console.log('[certs] TLS test: SUCCESS -', d); c.destroy(); srv.close(); process.exit(0); });
  });
  c.on('error', e => { console.log('[certs] TLS test FAILED:', e.code, e.message); srv.close(); process.exit(1); });
});
