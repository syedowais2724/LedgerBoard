import React, { useState, useEffect, useRef } from 'react';
import { submitTransaction } from '../api';

function generateUUID() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Utilities'];

const CATEGORY_EMOJIS = {
  Food: '🍔',
  Travel: '✈️',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Utilities: '💡'
};

export default function TransactionForm({ userId, setUserId, onTransactionSubmitted }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [txId, setTxId] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: '' }
  const [errors, setErrors] = useState({});

  // Generate new UUID on mount
  useEffect(() => {
    setTxId(generateUUID());
  }, []);

  // Handle clicking outside custom dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegenerateUUID = (e) => {
    e.preventDefault();
    setTxId(generateUUID());
  };

  const validate = () => {
    const newErrors = {};
    if (!userId.trim()) {
      newErrors.userId = 'User ID is required';
    }
    
    const amtNum = parseFloat(amount);
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amtNum) || amtNum <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (isCustomCategory && !customCategory.trim()) {
      newErrors.category = 'Custom category name is required';
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!txId) {
      newErrors.txId = 'Transaction ID is required';
    } else if (!uuidRegex.test(txId)) {
      newErrors.txId = 'Must be a valid UUID format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) {
      return;
    }

    setLoading(true);
    const selectedCategory = isCustomCategory ? customCategory.trim() : category;

    const payload = {
      transaction_id: txId,
      user_id: userId.trim(),
      amount: parseFloat(amount),
      category: selectedCategory,
      timestamp: new Date().toISOString()
    };

    try {
      await submitTransaction(payload);
      setToast({
        type: 'success',
        message: 'Transaction successfully processed and indexed!'
      });
      
      if (onTransactionSubmitted) {
        onTransactionSubmitted(payload.user_id);
      }

      // Reset form fields except User ID (synchronized in parent)
      setAmount('');
      setTxId(generateUUID());
      setCustomCategory('');
      setIsCustomCategory(false);
      setErrors({});
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Error processing transaction'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up">
      <h3 className="card-title">💵 Submit Transaction</h3>
      
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label">User ID</label>
          <input
            type="text"
            className={`form-input ${errors.userId ? 'form-input-error' : ''}`}
            placeholder="e.g. owais123"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              if (errors.userId) setErrors(prev => ({ ...prev, userId: null }));
            }}
          />
          {errors.userId && <div className="error-text">{errors.userId}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              className={`form-input ${errors.amount ? 'form-input-error' : ''}`}
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
              }}
            />
            {errors.amount && <div className="error-text">{errors.amount}</div>}
          </div>

          <div className="form-group" ref={dropdownRef}>
            <label className="form-label">Category</label>
            {!isCustomCategory ? (
              <div className="custom-dropdown-container">
                <button
                  type="button"
                  className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <span>{CATEGORY_EMOJIS[category]} {category}</span>
                  <span className="custom-dropdown-caret">▼</span>
                </button>
                {isOpen && (
                  <div className="custom-dropdown-menu">
                    {CATEGORIES.map(cat => (
                      <div
                        key={cat}
                        className={`custom-dropdown-item ${category === cat ? 'selected' : ''}`}
                        onClick={() => {
                          setCategory(cat);
                          setIsOpen(false);
                          if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                        }}
                      >
                        {CATEGORY_EMOJIS[cat]} {cat}
                      </div>
                    ))}
                    <div
                      className="custom-dropdown-item"
                      onClick={() => {
                        setIsCustomCategory(true);
                        setIsOpen(false);
                      }}
                      style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-accent)', fontWeight: 700 }}
                    >
                      ➕ Custom Category
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.25rem', flexDirection: 'column' }}>
                <input
                  type="text"
                  className={`form-input ${errors.category ? 'form-input-error' : ''}`}
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                  }}
                />
                <button
                  type="button"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '0.25rem 0'
                  }}
                  onClick={() => setIsCustomCategory(false)}
                >
                  Back to selection
                </button>
              </div>
            )}
            {errors.category && <div className="error-text">{errors.category}</div>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Transaction ID (UUID)</span>
            <button
              onClick={handleRegenerateUUID}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-accent)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🔄 Generate New
            </button>
          </label>
          <input
            type="text"
            className={`form-input ${errors.txId ? 'form-input-error' : ''}`}
            value={txId}
            onChange={(e) => {
              setTxId(e.target.value);
              if (errors.txId) setErrors(prev => ({ ...prev, txId: null }));
            }}
          />
          {errors.txId && <div className="error-text">{errors.txId}</div>}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Submit Transaction'}
        </button>
      </form>
    </div>
  );
}
