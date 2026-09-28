import { validateAmount, normalizePhoneNumber } from "./validators.js";

const config = {
    env: process.env.DARAJA_ENV || "sandbox",
    consumerKey: process.env.DARAJA_CONSUMER_KEY,
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET,
    shortcode: process.env.DARAJA_SHORTCODE,
    passkey: process.env.DARAJA_PASSKEY,
    callbackUrl: process.env.DARAJA_CALLBACK_URL
};

function getBaseUrl() {
    return config.env === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
}

function getTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}${second}`;
}

function generatePassword(timestamp) {
    const raw = `${config.shortcode}${config.passkey}${timestamp}`;
    return Buffer.from(raw).toString("base64");
}

export async function getAccessToken() {
    if (!config.consumerKey || !config.consumerSecret) {
        throw new Error("Missing Daraja consumer key or consumer secret");
    }

    const credentials = Buffer.from(
        `${config.consumerKey}:${config.consumerSecret}`
    ).toString("base64");

    const response = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
        method: "GET",
        headers: {
            Authorization: `Basic ${credentials}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.errorMessage || data.error_description || "Failed to get Daraja access token");
    }

    return data.access_token;
}

export async function stkPush({ phone, amount, accountReference = "Test", transactionDesc = "Payment" }) {
    if (!config.shortcode || !config.passkey || !config.callbackUrl) {
        throw new Error("Missing Daraja shortcode, passkey, or callback URL");
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const normalizedPhone = normalizePhoneNumber(phone);
    const validAmount = validateAmount(amount);

    const payload = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: validAmount,
        PartyA: normalizedPhone,
        PartyB: config.shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: config.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
    };

    const response = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.errorMessage || "STK push request failed");
    }

    return data;
}

export async function stkQuery({ checkoutRequestId }) {
    if (!checkoutRequestId) {
        throw new Error("checkoutRequestId is required");
    }

    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const payload = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        checkoutRequestId: checkoutRequestId
    };

    const response = await fetch(`${getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.errorMessage || "STK query failed");
    }

    return data;
}