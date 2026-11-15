/** Maps wall-clock click timestamps onto recorded time, excluding acknowledged pauses. */
export class RecordingClock {
  private pauses: { start: number; end?: number }[] = [];
  constructor(private start: number) {}
  pause(now: number) {
    if (this.pauses.at(-1)?.end === undefined && this.pauses.length) return;
    this.pauses.push({ start: now });
  }
  resume(now: number) {
    const last = this.pauses.at(-1);
    if (last && last.end === undefined) last.end = now;
  }
  time(now: number): number | undefined {
    if (now < this.start) return undefined;
    let excluded = 0;
    for (const pause of this.pauses) {
      if (now < pause.start) break;
      if (pause.end === undefined || now < pause.end) return undefined;
      excluded += pause.end - pause.start;
    }
    return (now - this.start - excluded) / 1000;
  }
  duration(now: number) {
    const last = this.pauses.at(-1);
    if (last && last.end === undefined) now = last.start;
    return (
      (now - this.start - this.pauses.reduce((total, p) => total + ((p.end ?? now) - p.start), 0)) /
      1000
    );
  }
}
