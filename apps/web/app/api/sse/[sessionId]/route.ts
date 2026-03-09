import { NextRequest } from "next/server";
import Redis from "ioredis";
import { streamKey } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const key = streamKey(sessionId);

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Dedicated connection for blocking reads
      const reader = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
      });

      const send = (id: string, data: string) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`id: ${id}\ndata: ${data}\n\n`)
        );
      };

      // Send heartbeat immediately so client knows connection is alive
      controller.enqueue(encoder.encode(": heartbeat\n\n"));

      let cursor = "$"; // Start from new messages

      const poll = async () => {
        while (!closed) {
          try {
            const results = (await reader.call(
              "XREAD",
              "BLOCK",
              "2000",
              "COUNT",
              "10",
              "STREAMS",
              key,
              cursor
            )) as [string, [string, string[]][]][] | null;

            if (!results) continue;

            for (const [, messages] of results) {
              for (const [id, fields] of messages as [string, string[]][]) {
                cursor = id;
                // fields is [key, val, key, val, ...]
                const obj: Record<string, string> = {};
                for (let i = 0; i < fields.length; i += 2) {
                  obj[fields[i]] = fields[i + 1];
                }
                const event = {
                  type: obj.type,
                  data: JSON.parse(obj.data),
                };
                send(id, JSON.stringify(event));
              }
            }
          } catch (err) {
            if (!closed) {
              // Brief pause before retrying
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }

        reader.disconnect();
      };

      poll();

      // Heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) {
          clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          closed = true;
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        reader.disconnect();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
