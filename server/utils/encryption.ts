import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY || "default-secret-key";

export function encryptMessages(messages: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(messages), SECRET_KEY).toString();
}

export function decryptMessages(encryptedMessages: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedMessages, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
