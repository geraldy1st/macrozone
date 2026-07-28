import { useAuth } from "@/contexts/AuthContext";
import { fetchFeed } from "@/services/community";
import type { FeedPost } from "@/types/community";
import { useCallback, useRef, useState } from "react";

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(null);
  const isLoadingMoreRef = useRef(false);
  const userIdRef = useRef(user?.id ?? null);
  userIdRef.current = user?.id ?? null;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await fetchFeed({
        before: null,
        currentUserId: userIdRef.current,
      });

      setPosts(page.posts);
      nextCursorRef.current = page.nextCursor;
      setNextCursor(page.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : "FEED_LOAD_FAILED";
      setError(message);
      setPosts([]);
      nextCursorRef.current = null;
      setNextCursor(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursorRef.current || isLoadingMoreRef.current) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const page = await fetchFeed({
        before: nextCursorRef.current,
        currentUserId: userIdRef.current,
      });

      setPosts((current) => [...current, ...page.posts]);
      nextCursorRef.current = page.nextCursor;
      setNextCursor(page.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : "FEED_LOAD_FAILED";
      setError(message);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  const removePostLocally = useCallback((postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }, []);

  const patchPostLocally = useCallback(
    (postId: string, patch: Partial<FeedPost>) => {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, ...patch } : post,
        ),
      );
    },
    [],
  );

  return {
    posts,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadMore,
    removePostLocally,
    patchPostLocally,
  };
}
