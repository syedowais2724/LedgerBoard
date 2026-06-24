const BASE_URL = '/api';

async function handleResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  
  if (!response.ok) {
    let errorMessage = 'A network error occurred';
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {}
    } else {
      try {
        const text = await response.text();
        if (text && text.length < 200) {
          errorMessage = text;
        }
      } catch (e) {}
    }
    throw new Error(errorMessage);
  }
  
  if (isJson) {
    return await response.json();
  }
  return await response.text();
}

export async function submitTransaction(transaction) {
  const response = await fetch(`${BASE_URL}/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  return handleResponse(response);
}

export async function fetchUserSummary(userId) {
  const response = await fetch(`${BASE_URL}/summary/${userId}`);
  return handleResponse(response);
}

export async function fetchLeaderboard() {
  const response = await fetch(`${BASE_URL}/ranking`);
  return handleResponse(response);
}
