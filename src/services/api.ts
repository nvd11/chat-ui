// This file will contain all the functions for communicating with the backend API.

// Define the shape of the message object for clarity.
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Sends a message to the chat API and streams the response.
 * This function uses an async generator to yield each chunk of data as it arrives.
 * @param message The message from the user.
 * @returns An async iterable that yields the streamed response chunks.
 */
export async function* streamChat(message: string): AsyncIterable<string> {
  // The URL of your backend API.
  const API_URL = 'http://www.jpgcp.cloud/chat-api-svc/api/v1/chat';

  try {
    // Use the fetch API to make a POST request.
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // The body of the request, containing the user's message.
      body: JSON.stringify({
        message: message,
      }),
    });

    // Check if the request was successful.
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get a reader from the response body to process the stream.
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    // Use a TextDecoder to convert the raw Uint8Array chunks into strings.
    const decoder = new TextDecoder();

    let buffer = '';
    // Loop indefinitely to read chunks from the stream.
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Add the new chunk to our buffer.
      buffer += decoder.decode(value, { stream: true });

      // Process all complete lines in the buffer.
      let position;
      while ((position = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, position);
        buffer = buffer.slice(position + 1);

        // Ignore empty lines
        if (line.trim() === '') {
          continue;
        }

        // Check if the line starts with "data: "
        if (line.startsWith('data: ')) {
          // Extract the actual data and yield it.
          const data = line.slice('data: '.length);
          yield data;
        }
      }
    }
    // Process any remaining data in the buffer after the stream ends.
    if (buffer.length > 0 && buffer.startsWith('data: ')) {
      yield buffer.slice('data: '.length);
    }
  } catch (error) {
    console.error('Error streaming chat:', error);
    // In case of an error, yield a user-friendly error message.
    yield 'Sorry, I am having trouble connecting to the server.';
  }
}
