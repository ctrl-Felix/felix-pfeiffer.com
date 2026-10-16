import { clientIp, overMinuteLimit } from "./rateLimit";

type LookupRoute<T> = {
  bucket: string;
  perIp: number;
  global?: number;
  param: string;
  normalize: (value: string) => T | null;
  invalid: string;
  lookup: (input: T) => Promise<unknown>;
  failure?: (error: unknown) => Response | undefined;
};

export const lookupFailed = (error: string, status: number) => Response.json({ error }, { status });

export function lookupRoute<T>({ bucket, perIp, global, param, normalize, invalid, lookup, failure }: LookupRoute<T>) {
  return async function GET(request: Request) {
    if (overMinuteLimit(bucket, clientIp(request), perIp, global)) return lookupFailed("Too many lookups. Try again in a minute.", 429);
    const input = normalize(new URL(request.url).searchParams.get(param) ?? "");
    if (!input) return lookupFailed(invalid, 400);
    try {
      return Response.json(await lookup(input), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      return failure?.(error) ?? lookupFailed("The lookup failed. Please try again later.", 502);
    }
  };
}
