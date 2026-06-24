import threading
from typing import Dict, List, Set, Optional
from models import Transaction

class TransactionStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._transactions: Dict[str, Transaction] = {}
        self._user_transactions: Dict[str, List[Transaction]] = {}
        self._processed_transaction_ids: Set[str] = set()

    def add_transaction(self, transaction: Transaction) -> bool:
        """
        Adds a transaction thread-safely.
        Returns True if successfully added, False if duplicate transaction_id.
        """
        with self._lock:
            if transaction.transaction_id in self._processed_transaction_ids:
                return False
            self._processed_transaction_ids.add(transaction.transaction_id)
            self._transactions[transaction.transaction_id] = transaction
            if transaction.user_id not in self._user_transactions:
                self._user_transactions[transaction.user_id] = []
            self._user_transactions[transaction.user_id].append(transaction)
            return True

    def get_user_transactions(self, user_id: str) -> Optional[List[Transaction]]:
        with self._lock:
            transactions = self._user_transactions.get(user_id)
            if transactions is None:
                return None
            return list(transactions)  # Return copy to prevent external mutation

    def get_all_user_transactions(self) -> Dict[str, List[Transaction]]:
        with self._lock:
            return {user_id: list(txs) for user_id, txs in self._user_transactions.items()}
            
    def get_all_unique_categories(self) -> Set[str]:
        with self._lock:
            categories = set()
            for txs in self._user_transactions.values():
                for tx in txs:
                    categories.add(tx.category.strip().lower())
            return categories

# Global store instance
store = TransactionStore()
