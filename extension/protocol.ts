export type CaptureSession = {
  id: string;
  tabId: number;
  origin: string;
  title: string;
  state: 'starting' | 'recording' | 'pausing' | 'paused' | 'resuming' | 'stopping';
};

export type CaptureControl = {
  to: 'worker';
  type: 'start-capture' | 'stop-capture' | 'pause-capture' | 'resume-capture';
};
