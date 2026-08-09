declare module 'cloudflare:sockets' {
  export function connect(opts: {
    hostname: string
    port: number
    secureTransport?: 'on' | 'off' | 'starttls'
  }): {
    readable: ReadableStream<Uint8Array>
    writable: WritableStream<Uint8Array>
    closed: Promise<unknown>
    close(): void
    startTls?: () => {
      readable: ReadableStream<Uint8Array>
      writable: WritableStream<Uint8Array>
      closed: Promise<unknown>
      close(): void
    }
  }
}
