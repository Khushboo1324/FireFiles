"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import { clampPlaybackTime } from "@/lib/meeting-playback";

const DEFAULT_PLAYBACK_RATE = 1;

interface MeetingPlaybackOptions {
  durationSeconds: number;
  mediaElementRef: RefObject<HTMLAudioElement | null>;
  mediaUrl: string | null;
}

export interface MeetingPlaybackController {
  currentTimeSeconds: number;
  durationSeconds: number;
  hasMediaError: boolean;
  isPlaying: boolean;
  isRealMedia: boolean;
  mediaUrl: string | null;
  playbackRate: number;
  seekRequestId: number;
  pause: () => void;
  play: () => void;
  seek: (seconds: number) => void;
  seekToMs: (milliseconds: number) => void;
  setPlaybackRate: (rate: number) => void;
  skip: (seconds: number) => void;
  togglePlayback: () => void;
}

function normalizeDuration(seconds: number) {
  return Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
}

export function useMeetingPlayback({
  durationSeconds: meetingDurationSeconds,
  mediaElementRef,
  mediaUrl,
}: MeetingPlaybackOptions): MeetingPlaybackController {
  const fallbackDuration = normalizeDuration(meetingDurationSeconds);
  const normalizedMediaUrl = useMemo(() => mediaUrl?.trim() || null, [mediaUrl]);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(fallbackDuration);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(DEFAULT_PLAYBACK_RATE);
  const [hasMediaError, setHasMediaError] = useState(false);
  const [seekRequestId, setSeekRequestId] = useState(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(fallbackDuration);
  const playbackRateRef = useRef(DEFAULT_PLAYBACK_RATE);
  const isRealMedia = normalizedMediaUrl !== null && !hasMediaError;

  const updateCurrentTime = useCallback((seconds: number) => {
    const nextTime = clampPlaybackTime(seconds, durationRef.current);
    currentTimeRef.current = nextTime;
    setCurrentTimeSeconds(nextTime);
    return nextTime;
  }, []);

  const updateDuration = useCallback(
    (seconds: number) => {
      const nextDuration = normalizeDuration(seconds);
      durationRef.current = nextDuration;
      setDurationSeconds(nextDuration);
      updateCurrentTime(currentTimeRef.current);
    },
    [updateCurrentTime],
  );

  useEffect(() => {
    const mediaElement = mediaElementRef.current;
    if (!mediaElement || !isRealMedia) {
      return;
    }
    const activeMediaElement = mediaElement;

    function syncMetadata() {
      if (
        Number.isFinite(activeMediaElement.duration) &&
        activeMediaElement.duration > 0
      ) {
        updateDuration(activeMediaElement.duration);
      }
    }

    function syncCurrentTime() {
      updateCurrentTime(activeMediaElement.currentTime);
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause() {
      setIsPlaying(false);
    }

    function handleEnded() {
      updateCurrentTime(durationRef.current);
      setIsPlaying(false);
    }

    function syncPlaybackRate() {
      playbackRateRef.current = activeMediaElement.playbackRate;
      setPlaybackRateState(activeMediaElement.playbackRate);
    }

    function handleError() {
      // A failed media source falls back to the metadata-backed silent clock.
      activeMediaElement.pause();
      updateDuration(fallbackDuration);
      setIsPlaying(false);
      setHasMediaError(true);
    }

    activeMediaElement.addEventListener("loadedmetadata", syncMetadata);
    activeMediaElement.addEventListener("durationchange", syncMetadata);
    activeMediaElement.addEventListener("timeupdate", syncCurrentTime);
    activeMediaElement.addEventListener("play", handlePlay);
    activeMediaElement.addEventListener("pause", handlePause);
    activeMediaElement.addEventListener("ended", handleEnded);
    activeMediaElement.addEventListener("ratechange", syncPlaybackRate);
    activeMediaElement.addEventListener("error", handleError);

    activeMediaElement.playbackRate = playbackRateRef.current;
    syncMetadata();
    syncCurrentTime();

    return () => {
      activeMediaElement.removeEventListener("loadedmetadata", syncMetadata);
      activeMediaElement.removeEventListener("durationchange", syncMetadata);
      activeMediaElement.removeEventListener("timeupdate", syncCurrentTime);
      activeMediaElement.removeEventListener("play", handlePlay);
      activeMediaElement.removeEventListener("pause", handlePause);
      activeMediaElement.removeEventListener("ended", handleEnded);
      activeMediaElement.removeEventListener("ratechange", syncPlaybackRate);
      activeMediaElement.removeEventListener("error", handleError);
      activeMediaElement.pause();
    };
  }, [
    fallbackDuration,
    isRealMedia,
    mediaElementRef,
    updateCurrentTime,
    updateDuration,
  ]);

  useEffect(() => {
    if (!isPlaying || isRealMedia || durationSeconds <= 0) {
      return;
    }

    let animationFrameId = 0;
    let previousFrameTime = performance.now();

    function advanceTimeline(frameTime: number) {
      const elapsedSeconds = Math.max(0, frameTime - previousFrameTime) / 1000;
      previousFrameTime = frameTime;
      const nextTime = updateCurrentTime(
        currentTimeRef.current + elapsedSeconds * playbackRateRef.current,
      );

      if (nextTime >= durationRef.current) {
        setIsPlaying(false);
        return;
      }

      animationFrameId = window.requestAnimationFrame(advanceTimeline);
    }

    animationFrameId = window.requestAnimationFrame(advanceTimeline);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [durationSeconds, isPlaying, isRealMedia, updateCurrentTime]);

  const seek = useCallback(
    (seconds: number) => {
      const nextTime = updateCurrentTime(seconds);
      const mediaElement = mediaElementRef.current;
      if (isRealMedia && mediaElement) {
        mediaElement.currentTime = nextTime;
      }
      setSeekRequestId((requestId) => requestId + 1);
    },
    [isRealMedia, mediaElementRef, updateCurrentTime],
  );

  const pause = useCallback(() => {
    const mediaElement = mediaElementRef.current;
    if (isRealMedia && mediaElement) {
      mediaElement.pause();
      return;
    }
    setIsPlaying(false);
  }, [isRealMedia, mediaElementRef]);

  const play = useCallback(() => {
    if (durationRef.current <= 0) {
      return;
    }

    if (currentTimeRef.current >= durationRef.current) {
      seek(0);
    }

    const mediaElement = mediaElementRef.current;
    if (isRealMedia && mediaElement) {
      void mediaElement.play().catch(() => setIsPlaying(false));
      return;
    }
    setIsPlaying(true);
  }, [isRealMedia, mediaElementRef, seek]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const skip = useCallback(
    (seconds: number) => seek(currentTimeRef.current + seconds),
    [seek],
  );

  const seekToMs = useCallback(
    (milliseconds: number) => seek(milliseconds / 1000),
    [seek],
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      if (!Number.isFinite(rate) || rate <= 0) {
        return;
      }
      playbackRateRef.current = rate;
      setPlaybackRateState(rate);
      const mediaElement = mediaElementRef.current;
      if (isRealMedia && mediaElement) {
        mediaElement.playbackRate = rate;
      }
    },
    [isRealMedia, mediaElementRef],
  );

  return {
    currentTimeSeconds,
    durationSeconds,
    hasMediaError,
    isPlaying,
    isRealMedia,
    mediaUrl: normalizedMediaUrl,
    playbackRate,
    seekRequestId,
    pause,
    play,
    seek,
    seekToMs,
    setPlaybackRate,
    skip,
    togglePlayback,
  };
}
