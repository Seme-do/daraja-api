export function normalizePhoneNumber(phone) {
    const cleaned = String(phone).replace(/\s+/g, "");

    if (cleaned.startsWith("254") && cleaned.length === 12) {
        return cleaned;
    }

    if (cleaned.startsWith("07") && cleaned.length === 10) {
        return `254${cleaned.slice(1)}`;
    }

    if (cleaned.startsWith("+254") && cleaned.length === 13) {
        return cleaned.slice(1);
    }

    throw new Error("Phone number must be in format 2547XXXXXXXX, 07XXXXXXXX, or +2547XXXXXXXX")
}
export function validateAmount(amount) {
    const value = Number(amount);

    if (!Number.isInteger(value) || value < 1) {throw new Error("Amount must be a whole number greater than 0");
    }

    return value;
}