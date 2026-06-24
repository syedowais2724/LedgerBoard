# Transaction Leaderboard System

A complete full-stack web application featuring a **Python (FastAPI) Backend** and a **React (Vite) Frontend** styled with premium custom CSS. Users can submit transactions, query user spending summaries with visualization, and view a real-time, manipulation-resistant leaderboard that ranks users based on their spending volume, frequency, activity consistency, and category diversity.

---

## 🎨 Design System & Color Palette
The UI follows a warm, high-contrast, clean light-mode aesthetic (no dark mode, no greys):
- **Background**: Warm White (`#FAFAF8`)
- **Card Background**: Pure White (`#FFFFFF`)
- **Primary Elements**: Bright Royal Blue (`#2563EB`)
- **Accents**: Vibrant Orange (`#F97316`)
- **Success/Valid States**: Emerald Green (`#10B981`)
- **Typography & Text**: Deep Navy (`#1E3A5F`)
- **Highlights**: Sunny Yellow (`#FCD34D`)
- **Borders & Micro-details**: Soft Indigo/Lavender tint (`#E0E7FF` / `#5A738E`)

---

## ⚙️ Core Backend Architecture & Features

### 1. Concurrency Handling
Since the backend uses an in-memory store, it employs a `threading.Lock` within `TransactionStore` (in [store.py](file:///f:/OneDrive/Desktop/IODR/backend/store.py)) to ensure concurrency safety.
- Python FastAPI handles requests concurrently using a thread pool for synchronous route defs.
- By wrapping read/write operations inside a `with self._lock:` block, we prevent race conditions, dirty reads, or write-conflicts when multiple clients submit transactions or fetch rankings concurrently.

### 2. Idempotency & Duplicate Prevention
Each transaction is submitted with a client-side generated UUID (`transaction_id`).
- The `TransactionStore` maintains a set of `_processed_transaction_ids` protected by the threading lock.
- Before committing a new transaction, it checks if `transaction_id` is already in the set.
- If it is, the server rejects it immediately with a `400 Bad Request` and a clear error message: `"Duplicate transaction_id: This transaction has already been processed."`

### 3. Fair, Multi-Factor Ranking Formula
To discourage leaderboard manipulation (e.g. single large transactions or high-frequency bursts), the ranking score uses a weighted formula with anti-manipulation rules:

$$\text{Score} = (S_{\text{norm}} \times 0.40) + (C_{\text{norm}} \times 0.25) + (\text{Consistency} \times 0.20) + (\text{Diversity} \times 0.15)$$

Where:
- **Transaction Influence Cap**: We calculate the user's total transaction sum. Any single transaction's amount is capped at **30% of their own total** ($0.30 \times S_{\text{total}}$). The sum of these capped amounts ($S_{\text{capped}}$) is used for the leaderboard calculations rather than the raw sum.
- **Total Amount Score ($S_{\text{norm}}$)**: $S_{\text{capped}}$ is Min-Max normalized between 0 and 1 across all eligible leaderboard users.
- **Transaction Count Score ($C_{\text{norm}}$)**: The number of transactions is Min-Max normalized between 0 and 1 across all eligible leaderboard users.
- **Consistency Score**: Rewards steady, regular transaction amounts instead of sudden bursts or spikes. Calculated using the coefficient of variation (CV) of the user's capped transaction amounts:
  $$\text{Consistency} = \frac{\mu}{\mu + \sigma}$$
  (Where $\mu$ is the mean amount and $\sigma$ is the standard deviation. A user with identical transaction amounts achieves a score of `1.0`. Massive spikes drag this closer to `0`).
- **Category Diversity Score**: Rewards spreading transactions across different categories:
  $$\text{Diversity} = \frac{\text{unique user categories}}{\max(5, \text{total categories in system})}$$
- **Eligibility Threshold**: A user **must have at least 3 transactions** to be eligible for the leaderboard.

---

## 🚀 API Documentation

### 1. POST `/transaction`
Submits a new financial transaction.

* **URL**: `/transaction`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`
* **Request Body Example**:
  ```json
  {
    "transaction_id": "8e36bb94-9160-4966-9b16-6461a291f0a2",
    "user_id": "owais123",
    "amount": 250.50,
    "category": "Food",
    "timestamp": "2026-06-23T20:30:00Z"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "transaction_id": "8e36bb94-9160-4966-9b16-6461a291f0a2",
    "user_id": "owais123",
    "amount": 250.50,
    "category": "Food",
    "timestamp": "2026-06-23T20:30:00Z",
    "status": "success"
  }
  ```
* **Error Response (400 Bad Request - Duplicate ID)**:
  ```json
  {
    "detail": "Duplicate transaction_id: This transaction has already been processed.",
    "status": "error"
  }
  ```
* **Error Response (400 Bad Request - Invalid Payload)**:
  ```json
  {
    "detail": "body -> amount: Input should be greater than 0; body -> transaction_id: transaction_id must be a valid UUID",
    "status": "error"
  }
  ```

### 2. GET `/summary/{user_id}`
Returns a detailed transaction summary for a specific user.

* **URL**: `/summary/owais123`
* **Method**: `GET`
* **Success Response (200 OK)**:
  ```json
  {
    "user_id": "owais123",
    "total_amount": 550.00,
    "transaction_count": 3,
    "average_transaction": 183.33,
    "top_category": "Food",
    "category_breakdown": {
      "Food": 400.00,
      "Shopping": 150.00
    },
    "first_transaction": "2026-06-23T15:00:00Z",
    "last_transaction": "2026-06-23T20:30:00Z"
  }
  ```
* **Error Response (404 Not Found)**:
  ```json
  {
    "detail": "User 'owais123' not found.",
    "status": "error"
  }
  ```

### 3. GET `/ranking`
Returns the list of eligible users ranked according to the multi-factor formula.

* **URL**: `/ranking`
* **Method**: `GET`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "rank": 1,
      "user_id": "owais123",
      "score": 0.8750,
      "total_amount": 550.00,
      "transaction_count": 3,
      "consistency_score": 0.8521,
      "diversity_score": 0.4000
    }
  ]
  ```

---

## 🛠️ Installation & Setup Instructions

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher

### Running the Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the uvicorn development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   *The backend will be available at [http://localhost:8000](http://localhost:8000).*

### Running the Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at [http://localhost:5173](http://localhost:5173).*

---

## 📋 Assumptions & Limitations
1. **In-Memory Storage Reset**: Data will reset if the backend server restarts. For persistent storage in production, a SQLite database could be connected to `store.py`.
2. **Category Set**: The dynamic unique category list expands as users input custom categories. We fallback to a minimum set of 5 default categories for diversity scoring to avoid skewing diversity scores with very few users.
3. **Capping Logic**: If a user submits only 3 identical transactions, the cap of 30% means their score contribution behaves proportionally. Capping is computed using the actual sum of the user's transaction records to compute the limit, then clamping each transaction.
