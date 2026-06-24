const BASE_URL = 'http://127.0.0.1:8000';

export async function submitTransaction(transaction) {
  const response = await fetch(`${BASE_URL}/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to submit transaction');
  }
  return data;
}

export async function fetchUserSummary(userId) {
  const response = await fetch(`${BASE_URL}/summary/${userId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'User not found');
  }
  return data;
}

export async function fetchLeaderboard() {
  const response = await fetch(`${BASE_URL}/ranking`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch leaderboard');
  }
  return data;
}
