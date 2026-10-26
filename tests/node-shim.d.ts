declare module "node:assert/strict" {
  function equal(actual: unknown, expected: unknown, message?: string): void;
  function deepEqual(actual: unknown, expected: unknown, message?: string): void;
  function match(actual: string, expected: RegExp, message?: string): void;
  function fail(message?: string): never;
  const assert: { equal: typeof equal; deepEqual: typeof deepEqual; match: typeof match; fail: typeof fail };
  export default assert;
}

declare module "node:test" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function readdirSync(path: string): string[];
  export function statSync(path: string): { isDirectory(): boolean; isFile(): boolean };
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function dirname(path: string): string;
  export function relative(from: string, to: string): string;
  export function resolve(...parts: string[]): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
  export function domainToUnicode(domain: string): string;
}
