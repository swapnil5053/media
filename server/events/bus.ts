import { EventEmitter } from "node:events";
import type { MediaStatus } from "@shared/types.js";

export interface MediaEvent {
  userId: string;
  mediaId: string;
  status: MediaStatus;
  progress: number;
  title: string;
  message: string;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export const mediaEvents = {
  publish(event: MediaEvent) {
    emitter.emit("media", event);
  },
  subscribe(userId: string, listener: (event: MediaEvent) => void) {
    const handler = (event: MediaEvent) => {
      if (event.userId === userId) listener(event);
    };
    emitter.on("media", handler);
    return () => emitter.off("media", handler);
  },
};
