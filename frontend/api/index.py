from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from typing import List
import logging

from models import Transaction, TransactionResponse, UserSummary, RankingItem
from store import store
from ranking import calculate_rankings, get_user_summary
from exceptions import (
    CustomHTTPException,
    custom_http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    logger
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="Transaction Leaderboard API",
    description="Backend API for tracking transactions and managing user rankings."
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handlers
app.add_exception_handler(CustomHTTPException, custom_http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

@app.post("/api/transaction", response_model=TransactionResponse)
def create_transaction(transaction: Transaction):
    logger.info(f"Received transaction: ID={transaction.transaction_id}, User={transaction.user_id}, Amount={transaction.amount}")
    
    # Store transaction
    success = store.add_transaction(transaction)
    if not success:
        logger.warning(f"Duplicate transaction rejected: ID={transaction.transaction_id}")
        raise CustomHTTPException(
            status_code=400,
            detail="Duplicate transaction_id: This transaction has already been processed."
        )
        
    return TransactionResponse(
        transaction_id=transaction.transaction_id,
        user_id=transaction.user_id,
        amount=transaction.amount,
        category=transaction.category,
        timestamp=transaction.timestamp
    )

@app.get("/api/summary/{user_id}", response_model=UserSummary)
def get_summary(user_id: str):
    logger.info(f"Fetching summary for user: {user_id}")
    summary = get_user_summary(user_id)
    if not summary:
        logger.warning(f"User summary not found: {user_id}")
        raise CustomHTTPException(
            status_code=404,
            detail=f"User '{user_id}' not found."
        )
    return summary

@app.get("/api/ranking", response_model=List[RankingItem])
def get_ranking():
    logger.info("Fetching ranking leaderboard")
    return calculate_rankings()
