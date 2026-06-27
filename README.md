# ChurnAI — Customer Churn Prediction

An end-to-end web app that predicts whether a telecom customer is likely to churn, powered by **IBM Watson Machine Learning**.

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js + Express
- **AI Model**: IBM Watson ML (deployed on IBM Cloud)

## Project Structure
```
churn-ai/
├── server.js          ← Express backend (proxies IBM API calls)
├── package.json
└── public/
    └── index.html     ← Frontend UI
```

## How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

### 3. Open in browser
```
http://localhost:3001
```

## Input Features

| Field | Type | Description |
|-------|------|-------------|
| AccountWeeks | integer | How long the customer has had the account (weeks) |
| ContractRenewal | integer (0/1) | Whether the contract was recently renewed |
| DataPlan | integer (0/1) | Whether customer has a data plan |
| DataUsage | double | Data used (GB) |
| CustServCalls | integer | Number of customer service calls made |
| DayMins | double | Total daytime call minutes |
| DayCalls | integer | Total daytime call count |
| MonthlyCharge | double | Monthly bill amount (USD) |
| OverageFee | double | Overage charges (USD) |
| RoamMins | double | Roaming minutes used |

## Output
- `1` → Customer likely to **churn**
- `0` → Customer likely to **stay**
