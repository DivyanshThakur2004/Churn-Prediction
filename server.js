require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const IBM_API_KEY = process.env.IBM_API_KEY;
const SCORING_URL = "https://us-south.ml.cloud.ibm.com/ml/v4/deployments/019f08f4-1449-70fb-90b5-27b37d85252f/predictions?version=2021-05-01";
const IAM_URL     = "https://iam.cloud.ibm.com/identity/token";

// ─── TOKEN CACHE ───────────────────────────────────────────────────────────────
let cachedToken    = null;
let tokenExpiresAt = 0;

async function getIAMToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) return cachedToken;
  const res = await axios.post(
    IAM_URL,
    `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${encodeURIComponent(IBM_API_KEY)}`,
    { headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" } }
  );
  cachedToken    = res.data.access_token;
  tokenExpiresAt = now + res.data.expires_in * 1000;
  return cachedToken;
}

// ─── PREDICT ROUTE ─────────────────────────────────────────────────────────────
app.post("/api/predict", async (req, res) => {
  try {
    const { AccountWeeks, ContractRenewal, DataPlan, DataUsage,
            CustServCalls, DayMins, DayCalls, MonthlyCharge, OverageFee, RoamMins } = req.body;

    const inputs = { AccountWeeks, ContractRenewal, DataPlan, DataUsage,
                     CustServCalls, DayMins, DayCalls, MonthlyCharge, OverageFee, RoamMins };

    for (const [key, val] of Object.entries(inputs)) {
      if (val === undefined || val === null || isNaN(Number(val))) {
        return res.status(400).json({ error: `Missing or invalid field: ${key}` });
      }
    }

    const token = await getIAMToken();

    const payload = {
      input_data: [{
        fields: ["AccountWeeks","ContractRenewal","DataPlan","DataUsage",
                 "CustServCalls","DayMins","DayCalls","MonthlyCharge","OverageFee","RoamMins"],
        values: [[
          Number(AccountWeeks), Number(ContractRenewal), Number(DataPlan), Number(DataUsage),
          Number(CustServCalls), Number(DayMins), Number(DayCalls),
          Number(MonthlyCharge), Number(OverageFee), Number(RoamMins)
        ]]
      }]
    };

    const watson = await axios.post(SCORING_URL, payload, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const raw = watson.data?.predictions?.[0]?.values?.[0]?.[0];
    if (raw === undefined || raw === null) {
      return res.status(500).json({ error: "Unexpected response from Watson ML." });
    }

    return res.json({ churn: Number(raw) });

  } catch (err) {
    const msg = err?.response?.data?.errors?.[0]?.message || err.message || "Internal server error";
    console.error("Prediction error:", msg);
    return res.status(500).json({ error: msg });
  }
});

app.get("/api/health", (_, res) => res.json({ status: "ok" }));
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅  ChurnAI running at http://localhost:${PORT}`));
