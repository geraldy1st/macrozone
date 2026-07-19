import { useAuth } from "@/contexts/AuthContext";
import { fetchFeed } from "@/services/community";
import type { FeedPost } from "@/types/community";
import { useCallback, useState } from "react";

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "refresh" | "more" = "refresh") => {
      if (mode === "more") {
        if (!nextCursor || isLoadingMore) {
          return;
        }
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const page = await fetchFeed({
          before: mode === "more" ? nextCursor : null,
          currentUserId: user?.id ?? null,
        });

        setPosts((current) =>
          mode === "more" ? [...current, ...page.posts] : page.posts,
        );
        setNextCursor(page.nextCursor);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "FEED_LOAD_FAILED";
        setError(message);
        if (mode === "refresh") {
          setPosts([]);
          setNextCursor(null);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isLoadingMore, nextCursor, user?.id],
  );

  const refresh = useCallback(() => load("refresh"), [load]);
  const loadMore = useCallback(() => load("more"), [load]);

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
