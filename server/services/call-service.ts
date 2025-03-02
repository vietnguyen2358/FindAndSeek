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

export async function handleIncomingCall(req: Request, res: Response) {
  try {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say('Welcome to Find & Seek. Please describe who you are looking for.');
    twiml.record({
      maxLength: 60,
      action: '/api/call/transcribe',
      transcribe: true,
      transcribeCallback: '/api/call/process-transcription'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error handling incoming call:', error);
    res.status(500).send('Error handling call');
  }
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
      confidence: 0.95 // Whisper doesn't provide confidence, setting default
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

export async function processTranscription(req: Request, res: Response) {
  try {
    const { transcriptionText } = req.body;

    if (!transcriptionText) {
      throw new Error('No transcription text provided');
    }

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
            content: `You are helping to find missing persons. Extract key details from the voice description to search for matches. 
            Focus on:
            - Clothing description
            - Physical characteristics
            - Last known location
            - Time last seen
            - Any distinctive features

            Format your response in a clear, conversational way, highlighting the most important details for search.`
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

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const groqResponse = await response.json() as { choices: Array<{ message: { content: string } }> };
    const processedDescription = groqResponse.choices[0].message.content;

    // Make an outbound call with the results
    if (req.body.From) {
      await client.calls.create({
        twiml: new twilio.twiml.VoiceResponse()
          .say({
            voice: 'alice',
            language: 'en-US',
            text: 'I have processed your description. Let me search our database.'
          })
          .pause({ length: 2 })
          .say({
            voice: 'alice',
            language: 'en-US',
            text: `Based on your description: ${processedDescription}`
          })
          .toString(),
        to: req.body.From,
        from: process.env.TWILIO_PHONE_NUMBER || '',
      });
    }

    res.json({ success: true, description: processedDescription });
  } catch (error) {
    console.error('Error processing transcription:', error);
    res.status(500).json({ error: 'Failed to process transcription' });
  }
}

export async function initiateCall(phoneNumber: string, message: string) {
  try {
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio phone number not configured');
    }

    // Ensure phone number is in E.164 format
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-US',
      text: `Welcome to Find & Seek. ${message}`
    });

    await client.calls.create({
      twiml: twiml.toString(),
      to: formattedNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error initiating call:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to initiate call' 
    };
  }
}

interface TranscriptionResult {
  text: string;
  confidence: number;
}