"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, MessageSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";

type Post = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  _count?: {
    comments: number;
    reactions: number;
  };
};

export default function CommunityFeed({ communityId, isMember }: { communityId: string, isMember: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [fetchPosts]);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newPostContent })
      });
      if (res.ok) {
        setNewPostContent("");
        fetchPosts(); // Refresh feed
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {isMember && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <Textarea 
            placeholder="Share something with the community..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={handlePost} disabled={posting || !newPostContent.trim()}>
              {posting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Post
            </Button>
          </div>
        </div>
      )}

      {!isMember && (
        <div className="bg-muted text-muted-foreground p-6 rounded-lg text-center">
          Join the community to post and interact.
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 border rounded-lg bg-card">
            No posts yet. Start the conversation!
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar 
                  userId={post.author.id} 
                  name={post.author.name} 
                  imageUrl={post.author.avatarUrl} 
                  size="md" 
                />
                <div>
                  <p className="font-semibold text-sm">{post.author.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-foreground whitespace-pre-wrap mb-4">
                {post.content}
              </p>
              <div className="flex items-center gap-4 border-t pt-4 text-muted-foreground">
                <button className="flex items-center gap-1 hover:text-primary transition-colors text-sm">
                  <Heart className="h-4 w-4" />
                  {post._count?.reactions || 0}
                </button>
                <button className="flex items-center gap-1 hover:text-primary transition-colors text-sm">
                  <MessageSquare className="h-4 w-4" />
                  {post._count?.comments || 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
