export type Claim = "new" | "duplicate" | "dismissed";

export class FieldBook<T extends object> {
  private readonly active = new Set<T>();
  private readonly dismissed = new Set<T>();

  claim(item: T): Claim {
    if (this.dismissed.has(item)) return "dismissed";
    if (this.active.has(item)) return "duplicate";
    this.active.add(item);
    return "new";
  }

  dismiss(item: T): void {
    this.active.delete(item);
    this.dismissed.add(item);
  }

  release(item: T): void {
    this.active.delete(item);
  }

  hasActive(item: T): boolean {
    return this.active.has(item);
  }

  activeItems(): T[] {
    return [...this.active];
  }

  clearActive(): void {
    this.active.clear();
  }
}
