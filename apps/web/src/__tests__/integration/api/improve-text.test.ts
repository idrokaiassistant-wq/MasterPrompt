import { POST } from '@/app/api/improve-text/route';
import { NextRequest } from 'next/server';

// Mock external dependencies
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Improved text content',
          },
        }),
      }),
    })),
  };
});

jest.mock('@openrouter/sdk', () => {
  return {
    OpenRouter: jest.fn().mockImplementation(() => ({
      chat: {
        send: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Improved text content from OpenRouter',
              },
            },
          ],
        }),
      },
    })),
  };
});

jest.mock('@/lib/credentials', () => ({
  readCredentials: jest.fn().mockReturnValue({
    googleGeminiKey: 'AIza-fake-gemini-key',
    openRouterKey: 'fake-openrouter-key',
  }),
}));

jest.mock('@/lib/rateLimit', () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('Integration: API /improve-text', () => {
  it('should return improved text using Google Gemini', async () => {
    const req = new NextRequest('http://localhost:3000/api/improve-text', {
      method: 'POST',
      body: JSON.stringify({
        text: 'test prompt',
        language: 'uz',
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.output).toBe('Improved text content');
  });

  it('should handle missing input', async () => {
    const req = new NextRequest('http://localhost:3000/api/improve-text', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
