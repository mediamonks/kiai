const { performance } = require('perf_hooks');

export default class Profiler {
  private labels: {[key: string]: number} = {};

  start(label: string): void {
    if (label in this.labels) console.warn('Profiler: starting label which was already started!'); // eslint-disable-line no-console
    this.labels[label] = performance.now();
  }

  end(label: string): void {
    const result = performance.now() - this.labels[label];
    delete this.labels[label];
    setImmediate(() =>
      // eslint-disable-next-line no-console
      console.debug('[PROFILING]', label, result),
    );
  }
}
