import express from "express";
import dotenv from "dotenv";
import { stkPush, stkQuery } from "./daraja.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        service: "daraja-backend"
    });
});

app.post("/api/mpesa/stk-push", async (req, res) => {
    try {
        const { phone, amount, accountReference, transactionDesc } = req.body;

        const result = await stkPush({
            phone,
            amount,
            accountReference,
            transactionDesc
        });

        res.status(200).json({
            success: true,
            message: "STK push initiated",
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.post("/api/mpesa/stk-query", async (req, res) => {
    try {
        const { checkoutRequestId } = req.body;

        const result = await stkQuery({ checkoutRequestId });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

app.post("/api/mpesa/stk-callback", (req, res) => {
    const callback = req.body;

    console.log("M-Pesa STK Callback:");
    console.dir(callback, { depth: null });

    res.status(200).json({
        success: true,
        message: "Callback received"
    });
});

app.listen(port, () => {
    console.log(`Daraja backend running on port ${port}`);
});