import React, { useState } from 'react';
import Navbar from './components/Navbar';
import TransactionForm from './components/TransactionForm';
import UserSummary from './components/UserSummary';
import Leaderboard from './components/Leaderboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userId, setUserId] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionSubmitted = (submittedUserId) => {
    setUserId(submittedUserId);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSelectUserFromLeaderboard = (selectedUserId) => {
    setUserId(selectedUserId);
    setActiveTab('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container" style={{ flexGrow: 1 }}>
        {activeTab === 'dashboard' ? (
          <div className="main-grid">
            <TransactionForm 
              userId={userId} 
              setUserId={setUserId} 
              onTransactionSubmitted={handleTransactionSubmitted} 
            />
            <UserSummary 
              userId={userId} 
              setUserId={setUserId} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        ) : (
          <div className="main-grid-full">
            <Leaderboard
              searchedUserId={userId}
              onSelectUser={handleSelectUserFromLeaderboard}
            />
          </div>
        )}
      </main>
      
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        marginTop: 'auto',
        fontSize: '0.85rem',
        color: 'var(--color-text-light)',
        borderTop: '2px solid var(--color-border)',
        backgroundColor: 'var(--color-card)'
      }}>
        © 2026 Transaction Leaderboard System • Designed for Premium Performance & Fair Competition.
      </footer>
    </div>
  );
}
