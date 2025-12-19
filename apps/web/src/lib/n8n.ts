export async function sendToAutomation(action: string, payload: any) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('N8N_WEBHOOK_URL is not set. Automation step skipped.');
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Automation error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send to automation:', error);
    return null;
  }
}
