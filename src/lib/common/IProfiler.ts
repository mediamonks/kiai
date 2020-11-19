export default interface IProfiler {
  start(label: string): void;
  end(label: string): void;
}

