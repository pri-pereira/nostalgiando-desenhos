/**
 * Módulo TOTP (Time-based One-Time Password - RFC 6238)
 * Implementação nativa compatível com Google Authenticator, Microsoft Authenticator e Authy
 * Utiliza a Web Crypto API (crypto.subtle) nativa dos navegadores modernos.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Converte string Base32 em Uint8Array
 */
export function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean.charAt(i);
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Gera uma chave secreta Base32 aleatória de alta entropia (20 bytes = 160 bits)
 */
export function generateTotpSecret(numBytes = 20): string {
  const randomBytes = new Uint8Array(numBytes);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < numBytes; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let base32 = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < randomBytes.length; i++) {
    value = (value << 8) | (randomBytes[i] ?? 0);
    bits += 8;

    while (bits >= 5) {
      base32 += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    base32 += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return base32;
}

/**
 * Gera a URL no padrão otpauth:// para escaneamento por apps autenticadores
 */
export function generateOtpAuthUri(
  email: string,
  secret: string,
  issuer = "Nostalgiando"
): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    email
  )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Gera a URL do QR Code para ser exibido em imagem <img>
 */
export function getQrCodeImageUrl(otpAuthUri: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    otpAuthUri
  )}&margin=10&format=png`;
}

/**
 * Gera o código TOTP de 6 dígitos para um determinado time step (intervalo de 30s)
 */
async function generateTotpCodeForStep(secret: string, step: number): Promise<string> {
  const keyBytes = base32ToBytes(secret);
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );

  // Time step como buffer de 8 bytes em big-endian
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(step));

  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, buffer);
  const sigBytes = new Uint8Array(signature);

  // Truncamento dinâmico (RFC 4226)
  const lastByte = sigBytes[sigBytes.length - 1] ?? 0;
  const offset = lastByte & 0x0f;
  const binary =
    (((sigBytes[offset] ?? 0) & 0x7f) << 24) |
    (((sigBytes[offset + 1] ?? 0) & 0xff) << 16) |
    (((sigBytes[offset + 2] ?? 0) & 0xff) << 8) |
    ((sigBytes[offset + 3] ?? 0) & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Valida o código informado pelo usuário contra a chave secreta.
 * Suporta tolerância de relógio de +/- 1 intervalo (30s antes ou depois).
 */
export async function verifyTotpCode(
  inputCode: string,
  secret: string,
  windowSteps = 1
): Promise<boolean> {
  const cleanCode = inputCode.trim().replace(/\s/g, "");
  if (cleanCode.length !== 6 || isNaN(Number(cleanCode))) {
    return false;
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let i = -windowSteps; i <= windowSteps; i++) {
    try {
      const expectedCode = await generateTotpCodeForStep(secret, currentStep + i);
      if (cleanCode === expectedCode) {
        return true;
      }
    } catch (err) {
      console.error("Erro ao validar HMAC TOTP:", err);
    }
  }

  return false;
}
