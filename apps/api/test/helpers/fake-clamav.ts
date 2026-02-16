import { AddressInfo, createServer } from 'node:net';

export type FakeClamAvServer = {
  port: number;
  close: () => Promise<void>;
};

export async function startFakeClamAv(response: string): Promise<FakeClamAvServer> {
  const server = createServer((socket) => {
    let responded = false;
    let stream = Buffer.alloc(0);

    socket.on('error', () => undefined);
    socket.on('data', (chunk) => {
      if (responded) {
        return;
      }

      stream = Buffer.concat([stream, chunk]);
      if (stream.includes(Buffer.from([0, 0, 0, 0]))) {
        responded = true;
        socket.write(response);
        socket.end();
      }
    });
    socket.on('end', () => {
      if (socket.destroyed || responded) {
        return;
      }
      responded = true;
      socket.write(response);
      socket.end();
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to allocate a TCP port for fake ClamAV');
  }

  return {
    port: (address as AddressInfo).port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}
