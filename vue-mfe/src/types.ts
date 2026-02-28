export type RemoteInput = {
  type: string;
  payload: Record<string, unknown>;
};

export type RemoteOutput = {
  type: string;
  payload: unknown;
};

export type MountOptions = {
  input?: RemoteInput;
  onOutput?: (event: RemoteOutput) => void;
};

export type MountedRemote = {
  update: (next: MountOptions) => void;
  unmount: () => void;
};
