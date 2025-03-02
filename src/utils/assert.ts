
export function assertTruthy<T>(
  value: T,
  message: string
): asserts value is NonNullable<T> {
  if (!value) throw new Error(message);
}

export function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function isTruthy<T>(value: T): value is NonNullable<T> {
  return !!value;
}

