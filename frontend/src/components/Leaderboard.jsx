import React, { useState, useEffect } from 'react';
import { fetchLeaderboard } from '../api';

export default function Leaderboard({ searchedUserId, onSelectUser }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLeaderboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await fetchLeaderboard();
      setRankings(data);
      setError(null);
    } catch (err) {
      setError('Could not fetch leaderboard records.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Poll every 10 seconds
  useEffect(() => {
    loadLeaderboard();
    
    const interval = setInterval(() => {
      loadLeaderboard(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getRankIndicator = (rank) => {
    if (rank === 1) return <span className="rank-badge top-3">🥇</span>;
    if (rank === 2) return <span className="rank-badge top-3">🥈</span>;
    if (rank === 3) return <span className="rank-badge top-3">🥉</span>;
    return <span className="rank-badge">{rank}</span>;
  };

  // Compute maximums for relative visual bar display
  const maxTotal = rankings.length > 0 ? Math.max(...rankings.map(r => r.total_amount), 1) : 1;
  const maxCount = rankings.length > 0 ? Math.max(...rankings.map(r => r.transaction_count), 1) : 1;

  return (
    <div className="card animate-slide-up" style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Multi-Factor Leaderboard
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }}></span>
          Auto-refreshing (10s)
        </span>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="skeleton skeleton-bar" style={{ height: '3.5rem' }}></div>
          <div className="skeleton skeleton-bar" style={{ height: '3.5rem' }}></div>
          <div className="skeleton skeleton-bar" style={{ height: '3.5rem' }}></div>
        </div>
      )}

      {error && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h4>Connection Error</h4>
          <p>{error}</p>
          <button onClick={() => loadLeaderboard()} className="btn btn-accent" style={{ marginTop: '1rem' }}>
            Retry Now
          </button>
        </div>
      )}

      {!loading && !error && rankings.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🛡️</div>
          <h4>Leaderboard is Empty</h4>
          <p>No users qualify for the rankings yet. A user needs at least <strong>3 processed transactions</strong> to appear here.</p>
        </div>
      )}

      {!loading && !error && rankings.length > 0 && (
        <div className="leaderboard-grid-wrapper">
          <div className="leaderboard-header">
            <span>Rank</span>
            <span>User ID</span>
            <span>Final Score</span>
            <span>Capped Volume (40%)</span>
            <span>Tx Count (25%)</span>
            <span>Consistency (20%)</span>
            <span>Diversity (15%)</span>
          </div>
          
          {rankings.map((item) => {
            const isHighlighted = searchedUserId && item.user_id.toLowerCase() === searchedUserId.toLowerCase();
            
            // Sub-scores representation
            const volumePct = (item.total_amount / maxTotal) * 100;
            const countPct = (item.transaction_count / maxCount) * 100;
            const consistencyPct = item.consistency_score * 100;
            const diversityPct = item.diversity_score * 100;

            return (
              <div
                key={item.user_id}
                className={`leaderboard-row ${isHighlighted ? 'highlighted' : ''}`}
              >
                <div>{getRankIndicator(item.rank)}</div>
                
                <div
                  className="user-cell"
                  style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }}
                  onClick={() => onSelectUser(item.user_id)}
                  title="Click to view full summary"
                >
                  {item.user_id} {isHighlighted && '⭐'}
                </div>
                
                <div className="score-cell">{item.score.toFixed(4)}</div>
                
                {/* 40% Volume */}
                <div className="metric-bar-wrapper">
                  <div className="metric-label-val">
                    <span>Amount</span>
                    <span>${item.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${volumePct}%`, backgroundColor: '#2563EB' }}
                    ></div>
                  </div>
                </div>

                {/* 25% Count */}
                <div className="metric-bar-wrapper">
                  <div className="metric-label-val">
                    <span>Count</span>
                    <span>{item.transaction_count}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${countPct}%`, backgroundColor: '#8B5CF6' }}
                    ></div>
                  </div>
                </div>

                {/* 20% Consistency */}
                <div className="metric-bar-wrapper">
                  <div className="metric-label-val">
                    <span>Consistency</span>
                    <span>{item.consistency_score.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${consistencyPct}%`, backgroundColor: '#F97316' }}
                    ></div>
                  </div>
                </div>

                {/* 15% Diversity */}
                <div className="metric-bar-wrapper">
                  <div className="metric-label-val">
                    <span>Diversity</span>
                    <span>{item.diversity_score.toFixed(2)}</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${diversityPct}%`, backgroundColor: '#10B981' }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
