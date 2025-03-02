import twilio from 'twilio';
import type { Request, Response } from 'express';
import fetch from 'node-fetch';
import { storage } from '../storage';
import OpenAI from 'openai';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface TranscriptionResult {
  text: string;
  confidence: number;
}

export async function handleIncomingCall(req: Request, res: Response) {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say('Welcome to the Person Search system. Please describe who you are looking for.');
  twiml.record({
    maxLength: 60,
    action: '/api/call/transcribe',
    transcribe: true,
    transcribeCallback: '/api/call/process-transcription'
  });

  res.type('text/xml');
  res.send(twiml.toString());
}

export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
  try {
    const response = await fetch(audioUrl);
    const audioBuffer = await response.buffer();

    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer as any,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      confidence: transcription.confidence || 0
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

export async function processTranscription(req: Request, res: Response) {
  try {
    const { transcriptionText } = req.body;
    
    // Process with Groq AI
    const response = await fetch('https://api.groq.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are helping to find missing persons. Extract key details from the voice description to search for matches."
          },
          {
            role: "user",
            content: transcriptionText
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const groqResponse = await response.json();
    const processedDescription = groqResponse.choices[0].message.content;

    // Make an outbound call with the results
    await client.calls.create({
      twiml: new twilio.twiml.VoiceResponse()
        .say('I have processed your description. Let me search our database.')
        .pause({ length: 2 })
        .say(`Based on your description: ${processedDescription}`)
        .toString(),
      to: req.body.From,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing transcription:', error);
    res.status(500).json({ error: 'Failed to process transcription' });
  }
}

export async function initiateCall(phoneNumber: string, message: string) {
  try {
    await client.calls.create({
      twiml: new twilio.twiml.VoiceResponse()
        .say(message)
        .toString(),
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    return { success: true };
  } catch (error) {
    console.error('Error initiating call:', error);
    throw error;
  }
}
