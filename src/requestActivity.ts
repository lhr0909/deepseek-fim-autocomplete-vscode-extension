export type RequestActivityListener = (isActive: boolean) => void;

export class RequestActivity {
  private activeRequestCount = 0;
  private readonly listeners = new Set<RequestActivityListener>();

  public get isActive(): boolean {
    return this.activeRequestCount > 0;
  }

  public onDidChange(listener: RequestActivityListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public start(): () => void {
    const wasActive = this.isActive;
    this.activeRequestCount += 1;
    this.notifyIfChanged(wasActive);

    let didFinish = false;
    return () => {
      if (didFinish) {
        return;
      }

      didFinish = true;
      const wasActiveBeforeFinish = this.isActive;
      this.activeRequestCount -= 1;
      this.notifyIfChanged(wasActiveBeforeFinish);
    };
  }

  private notifyIfChanged(wasActive: boolean): void {
    if (wasActive === this.isActive) {
      return;
    }

    for (const listener of this.listeners) {
      listener(this.isActive);
    }
  }
}
