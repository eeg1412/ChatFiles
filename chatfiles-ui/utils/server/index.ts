import { Message, OpenAIModel } from '@/types';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import { OPENAI_API_HOST } from '../app/const';

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  key: string,
  messages: Message[],
) => {
  const res = await fetch(`${OPENAI_API_HOST}/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 1,
      stream: true,
    }),
  });

  return resToStream(res);
};
export const resToStream = async (res: Response) => {
  if (res.status !== 200) {
    const statusText = res.statusText;
    throw new Error(`OpenAI API returned an error: ${statusText}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        const decodeRes = decoder.decode(chunk);
        const demoData = 'data:{"id":"chatcmpl-7HWMw7mbwh9amCxrYi5c6Xq8LbWKb","object":"chat.completion.chunk","created":1684410358,"model":"gpt-3.5-turbo-0301","choices":[{"delta":{"content":"答"},"index":0,"finish_reason":null}]}\n\n'
        parser.feed(decodeRes);
        console.log(decodeRes);
      }
    },
  });

  return stream;
};
