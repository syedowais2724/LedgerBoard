import React, { useState, useEffect } from 'react';
import { fetchUserSummary } from '../api';

const CATEGORY_EMOJIS = {
  food: '🍔',
  travel: '✈️',
  shopping: '🛍️',
  entertainment: '🎬',
  utilities: '💡',
  default: '💰'
};

const CATEGORY_COLORS = {
  food: '#3B82F6', // Royal Blue
  travel: '#F97316', // Orange
  shopping: '#10B981', // Emerald Green
  entertainment: '#FCD34D', // Sunny Yellow
  utilities: '#8B5CF6', // Purple
  default: '#EC4899' // Pink
};

function getCategoryEmoji(catName) {
  const norm = catName.trim().toLowerCase();
  return CATEGORY_EMOJIS[norm] || CATEGORY_EMOJIS.default;
}

function getCategoryColor(catName) {
  const norm = catName.trim().toLowerCase();
  return CATEGORY_COLORS[norm] || CATEGORY_COLORS.default;
}

export default function UserSummary({ userId, setUserId, refreshTrigger }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  // Debounced live update of profile summary when userId or refreshTrigger changes
  useEffect(() => {
    const trimmed = userId.trim();
    if (!trimmed) {
      setSummary(null);
      setError(null);
      setIsTyping(false);
      return;
    }

    // Indicate typing to suppress stale error states
    setIsTyping(true);
    
    const timer = setTimeout(() => {
      setIsTyping(false);
      loadSummary(trimmed);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [userId, refreshTrigger]);

  const loadSummary = async (targetId) => {
    if (!targetId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserSummary(targetId.trim());
      setSummary(data);
      setError(null);
    } catch (err) {
      setSummary(null);
      // Only set error if search term is still matching the query
      setError(err.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsTyping(false);
    loadSummary(userId);
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <h3 className="card-title">🔍 Search User Summary</h3>
      
      <form onSubmit={handleSearch} className="search-wrapper">
        <input
          type="text"
          className="form-input"
          placeholder="Enter User ID..."
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button type="submit" className="btn btn-accent" disabled={loading || isTyping}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Show typing loader or loading skeleton */}
      {(loading || isTyping) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-bar" style={{ height: '5rem' }}></div>
          <div className="skeleton skeleton-bar"></div>
          <div className="skeleton skeleton-bar"></div>
        </div>
      )}

      {/* Show error state only if not currently typing or loading */}
      {error && !loading && !isTyping && (
        <div className="empty-state animate-fade-in" style={{ backgroundColor: '#FEF2F2', borderRadius: '12px', padding: '2rem' }}>
          <div className="empty-state-icon">⚠️</div>
          <h4 style={{ color: '#991B1B' }}>User Not Found</h4>
          <p style={{ color: '#7F1D1D', marginTop: '0.25rem' }}>{error}</p>
        </div>
      )}

      {/* Show blank state if no user input */}
      {!userId.trim() && !loading && !isTyping && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h4>No User Selected</h4>
          <p>Start typing a user ID or select one from the leaderboard. The summary will automatically display details in real time.</p>
        </div>
      )}

      {/* Show placeholder when typing a user not loaded yet */}
      {userId.trim() && !summary && !error && !loading && !isTyping && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h4>Analyzing Profile...</h4>
          <p>No processed summary available. Click "Search" or submit a transaction for "{userId}" to register the profile.</p>
        </div>
      )}

      {summary && !loading && !isTyping && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 800 }}>👤 Profile: {summary.user_id}</h4>
            <span style={{ backgroundColor: '#EFF6FF', color: 'var(--color-primary)', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem' }}>
              Active User
            </span>
          </div>

          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Spend</div>
              <div className="stat-val">${summary.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions</div>
              <div className="stat-val accent">{summary.transaction_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Size</div>
              <div className="stat-val">${summary.average_transaction.toFixed(2)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Category breakdown */}
            <div style={{ backgroundColor: '#FAFBFD', padding: '1.25rem', border: '2px solid var(--color-border)', borderRadius: '12px' }}>
              <h5 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>📁 Category Breakdown</span>
                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                  Top: {getCategoryEmoji(summary.top_category)} {summary.top_category}
                </span>
              </h5>
              
              <div className="category-bars-list">
                {Object.entries(summary.category_breakdown).map(([cat, amt]) => {
                  const pct = summary.total_amount > 0 ? (amt / summary.total_amount) * 100 : 0;
                  const color = getCategoryColor(cat);
                  return (
                    <div key={cat} className="category-bar-row">
                      <div className="category-bar-header">
                        <span className="category-bar-label">
                          <span>{getCategoryEmoji(cat)}</span>
                          <span style={{ fontWeight: 700 }}>{cat}</span>
                        </span>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                          ${amt.toFixed(2)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="progress-bar-container" style={{ height: '10px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ backgroundColor: '#FAFBFD', padding: '1.25rem', border: '2px solid var(--color-border)', borderRadius: '12px' }}>
              <h5 style={{ fontSize: '1rem', marginBottom: '1rem' }}>⏱️ Activity Timeline</h5>
              <div className="timeline">
                <div className="timeline-item first">
                  <div className="timeline-title">First Transaction</div>
                  <div className="timeline-time">{formatDateTime(summary.first_transaction)}</div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-title">Last Activity</div>
                  <div className="timeline-time">{formatDateTime(summary.last_transaction)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
