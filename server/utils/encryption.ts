import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY;
if (!SECRET_KEY) throw new Error("ENCRYPTION_SECRET_KEY environment variable is required");
const KEY = SECRET_KEY;

export function encryptMessages(messages: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(messages), KEY).toString();
}

export function decryptMessages(encryptedMessages: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedMessages, KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
