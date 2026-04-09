import Groq from 'groq-sdk';

let _groq: Groq | null = null;

/**
 * Returns a singleton Groq client.
 */
export function getGroqClient(): Groq {
  if (_groq) return _groq;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY environment variable.');
  _groq = new Groq({ apiKey });
  return _groq;
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
