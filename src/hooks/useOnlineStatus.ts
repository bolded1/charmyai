import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return isOnline;
}

// Queues uploads when offline and flushes when back online
interface QueuedUpload {
  id: string;
  file: File;
  userId: string;
  timestamp: number;
}

let uploadQueue: QueuedUpload[] = [];

export function useOfflineUploadQueue() {
  const isOnline = useOnlineStatus();
  const [queueLength, setQueueLength] = useState(0);

  const enqueue = useCallback((file: File, userId: string) => {
    const entry: QueuedUpload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      userId,
      timestamp: Date.now(),
    };
    uploadQueue.push(entry);
    setQueueLength(uploadQueue.length);
    return entry.id;
  }, []);

  const getQueue = useCallback(() => [...uploadQueue], []);

  const clearEntry = useCallback((id: string) => {
    uploadQueue = uploadQueue.filter((e) => e.id !== id);
    setQueueLength(uploadQueue.length);
  }, []);

  return { isOnline, queueLength, enqueue, getQueue, clearEntry };
}
