import math
from typing import List, Dict, Optional
from datetime import datetime
from models import RankingItem, Transaction, UserSummary
from store import store as global_store

def calculate_rankings() -> List[RankingItem]:
    all_user_txs = global_store.get_all_user_transactions()
    system_categories = global_store.get_all_unique_categories()
    
    # 1. Filter users with at least 3 transactions
    eligible_users = {}
    for user_id, txs in all_user_txs.items():
        if len(txs) >= 3:
            eligible_users[user_id] = txs

    if not eligible_users:
        return []

    user_metrics = {}
    
    # 2. Compute individual metrics (incorporating anti-manipulation rules)
    for user_id, txs in eligible_users.items():
        amounts = [tx.amount for tx in txs]
        actual_total = sum(amounts)
        tx_count = len(txs)
        
        # Rule: Cap single transaction influence (no one transaction > 30% of user total)
        cap_limit = 0.30 * actual_total
        capped_amounts = [min(amt, cap_limit) for amt in amounts]
        capped_total = sum(capped_amounts)
        
        # Consistency score: rewards regular activity, penalizes spikes
        mean_amt = capped_total / tx_count
        if tx_count > 1:
            variance = sum((x - mean_amt) ** 2 for x in capped_amounts) / (tx_count - 1)
            std_dev = math.sqrt(variance)
        else:
            std_dev = 0.0
            
        if std_dev == 0:
            consistency_score = 1.0
        else:
            consistency_score = mean_amt / (mean_amt + std_dev)

        # Category diversity score: rewards diverse spending categories
        user_categories = {tx.category.strip().lower() for tx in txs}
        denom = max(5, len(system_categories))
        category_diversity_score = len(user_categories) / denom
        if category_diversity_score > 1.0:
            category_diversity_score = 1.0
            
        user_metrics[user_id] = {
            "actual_total": actual_total,
            "capped_total": capped_total,
            "transaction_count": tx_count,
            "consistency_score": consistency_score,
            "diversity_score": category_diversity_score
        }

    # 3. Normalize total_amount and transaction_count across all eligible users
    capped_totals = [m["capped_total"] for m in user_metrics.values()]
    tx_counts = [m["transaction_count"] for m in user_metrics.values()]
    
    max_total = max(capped_totals)
    min_total = min(capped_totals)
    max_count = max(tx_counts)
    min_count = min(tx_counts)
    
    rankings: List[RankingItem] = []
    
    for user_id, metrics in user_metrics.items():
        if max_total == min_total:
            normalized_total_amount = 1.0
        else:
            normalized_total_amount = (metrics["capped_total"] - min_total) / (max_total - min_total)
            
        if max_count == min_count:
            normalized_transaction_count = 1.0
        else:
            normalized_transaction_count = (metrics["transaction_count"] - min_count) / (max_count - min_count)
            
        # Formula: score = (total_amount * 0.40) + (transaction_count * 0.25) + (consistency_score * 0.20) + (diversity_score * 0.15)
        score = (
            (normalized_total_amount * 0.40) +
            (normalized_transaction_count * 0.25) +
            (metrics["consistency_score"] * 0.20) +
            (metrics["diversity_score"] * 0.15)
        )
        
        rankings.append(RankingItem(
            rank=0,
            user_id=user_id,
            score=round(score, 4),
            total_amount=round(metrics["actual_total"], 2),
            transaction_count=metrics["transaction_count"],
            consistency_score=round(metrics["consistency_score"], 4),
            diversity_score=round(metrics["diversity_score"], 4)
        ))
        
    # Sort: score DESC, actual_total DESC, transaction_count DESC
    rankings.sort(key=lambda x: (-x.score, -x.total_amount, -x.transaction_count))
    
    for idx, item in enumerate(rankings):
        item.rank = idx + 1
        
    return rankings

def get_user_summary(user_id: str) -> Optional[UserSummary]:
    txs = global_store.get_user_transactions(user_id)
    if not txs:
        return None
        
    total_amount = sum(tx.amount for tx in txs)
    transaction_count = len(txs)
    average_transaction = total_amount / transaction_count
    
    category_breakdown = {}
    for tx in txs:
        category = tx.category.strip()
        category_breakdown[category] = category_breakdown.get(category, 0.0) + tx.amount
        
    top_category = max(category_breakdown, key=category_breakdown.get)
    
    def parse_dt(ts_str: str) -> datetime:
        return datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        
    sorted_txs = sorted(txs, key=lambda x: parse_dt(x.timestamp))
    first_transaction = sorted_txs[0].timestamp
    last_transaction = sorted_txs[-1].timestamp
    
    return UserSummary(
        user_id=user_id,
        total_amount=round(total_amount, 2),
        transaction_count=transaction_count,
        average_transaction=round(average_transaction, 2),
        top_category=top_category,
        category_breakdown={cat: round(amt, 2) for cat, amt in category_breakdown.items()},
        first_transaction=first_transaction,
        last_transaction=last_transaction
    )
