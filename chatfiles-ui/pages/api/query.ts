import type { NextApiRequest, NextApiResponse } from 'next';
// import fetch from 'node-fetch';
import url from 'url';
import { CHAT_FILES_SERVER_HOST } from '@/utils/app/const';
import { resToStream } from '@/utils/server';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request, res: Response) => {
  console.log('beginning handler');
  const { query } = url.parse(req.url, true);
  const message: string = query.message as string;
  const indexName: string = query.indexName as string;
  const indexType: string = query.indexType as string;

  console.log('handler chatfile query: ', message, indexName);

  if (message && indexName) {
    const response = await fetch(
      `${CHAT_FILES_SERVER_HOST}/query?message=${message}&indexName=${indexName}&indexType=${indexType}`,
      {
        method: 'Get',
      },
    );

    // const result = await response.text();
    const stream = await resToStream(response);
    // res.status(200).json(response);
    return new Response(stream);
  } else {
    return new Response('Error', { status: 500 });
  }
};

export default handler;
