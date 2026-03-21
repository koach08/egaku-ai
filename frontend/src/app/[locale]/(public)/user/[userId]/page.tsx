"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/header";
import { toast } from "sonner";
import {
  HeartIcon,
  Loader2Icon,
  UserPlusIcon,
  UserMinusIcon,
  ImageIcon,
  UsersIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfileData {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  plan: string;
  gallery_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  created_at: string;
}

interface GalleryItem {
  id: string;
  title: string;
  prompt: string;
  image_url: string | null;
  nsfw: boolean;
  likes_count: number;
  liked_by_me: boolean;
  tags: string[];
  author_name: string;
  created_at: string;
}

interface FollowUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  followed_at: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserProfilePage() {
  const params = useParams();
  const { user, session } = useAuth();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryPage, setGalleryPage] = useState(1);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [activeTab, setActiveTab] = useState("gallery");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const isOwnProfile = user?.id === userId;

  // ─── Fetch Profile ───

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getUserProfile(userId);
      setProfile(data);
    } catch {
      toast.error("Failed to load profile");
    }
  }, [userId]);

  // ─── Fetch Gallery ───

  const fetchGallery = useCallback(
    async (page: number) => {
      if (!userId) return;
      setGalleryLoading(true);
      try {
        const data = await api.getUserGallery(userId, page, 24);
        setGalleryItems(data.items || []);
        setGalleryTotal(data.total || 0);
        setGalleryPage(page);
      } catch {
        toast.error("Failed to load gallery");
      } finally {
        setGalleryLoading(false);
      }
    },
    [userId]
  );

  // ─── Fetch Followers/Following ───

  const fetchFollowers = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getFollowers(userId);
      setFollowers(data.items || []);
    } catch {
      // silently fail
    }
  }, [userId]);

  const fetchFollowing = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getFollowing(userId);
      setFollowing(data.items || []);
    } catch {
      // silently fail
    }
  }, [userId]);

  // ─── Initial Load ───

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchGallery(1)]).finally(() =>
      setLoading(false)
    );
  }, [fetchProfile, fetchGallery]);

  useEffect(() => {
    if (activeTab === "followers") fetchFollowers();
    if (activeTab === "following") fetchFollowing();
  }, [activeTab, fetchFollowers, fetchFollowing]);

  // ─── Follow/Unfollow ───

  const handleFollow = async () => {
    if (!session) {
      toast.error("Sign in to follow users");
      return;
    }
    if (!profile || followLoading) return;

    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await api.unfollowUser(session.access_token, userId);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: false,
                followers_count: Math.max(0, prev.followers_count - 1),
              }
            : prev
        );
      } else {
        await api.followUser(session.access_token, userId);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: true,
                followers_count: prev.followers_count + 1,
              }
            : prev
        );
      }
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  // ─── Loading ───

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Button variant="outline" render={<Link href="/gallery" />}>
            Back to Gallery
          </Button>
        </div>
      </>
    );
  }

  // ─── Render ───

  const planBadgeColor: Record<string, string> = {
    free: "bg-gray-500/20 text-gray-400",
    lite: "bg-blue-500/20 text-blue-400",
    basic: "bg-green-500/20 text-green-400",
    pro: "bg-purple-500/20 text-purple-400",
    unlimited: "bg-amber-500/20 text-amber-400",
    studio: "bg-pink-500/20 text-pink-400",
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <Avatar className="h-24 w-24 text-2xl">
            <AvatarFallback>
              {profile.display_name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <Badge
                className={`text-xs ${planBadgeColor[profile.plan] || ""}`}
              >
                {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)}
              </Badge>
            </div>

            {profile.bio && (
              <p className="text-sm text-muted-foreground mb-3 max-w-lg">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center justify-center sm:justify-start gap-6 text-sm mb-4">
              <button
                onClick={() => setActiveTab("gallery")}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <ImageIcon className="size-4" />
                <span className="font-semibold">{profile.gallery_count}</span>
                <span className="text-muted-foreground">works</span>
              </button>
              <button
                onClick={() => setActiveTab("followers")}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <UsersIcon className="size-4" />
                <span className="font-semibold">
                  {profile.followers_count}
                </span>
                <span className="text-muted-foreground">followers</span>
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className="hover:text-foreground transition-colors"
              >
                <span className="font-semibold">
                  {profile.following_count}
                </span>{" "}
                <span className="text-muted-foreground">following</span>
              </button>
            </div>

            {/* Follow button */}
            {!isOwnProfile && (
              <Button
                variant={profile.is_following ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <Loader2Icon className="size-4 animate-spin mr-1" />
                ) : profile.is_following ? (
                  <UserMinusIcon className="size-4 mr-1" />
                ) : (
                  <UserPlusIcon className="size-4 mr-1" />
                )}
                {profile.is_following ? "Unfollow" : "Follow"}
              </Button>
            )}

            {/* Member since */}
            {profile.created_at && (
              <p className="text-xs text-muted-foreground mt-3">
                Member since{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (v) setActiveTab(v);
          }}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="followers">Followers</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <>
            {galleryLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : galleryItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  No published artworks yet
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {galleryItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/gallery/${item.id}`}
                      className="block group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title || item.prompt.slice(0, 50)}
                              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                                item.nsfw ? "blur-[20px]" : ""
                              }`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                              No preview
                            </div>
                          )}
                          {item.nsfw && (
                            <Badge
                              variant="destructive"
                              className="absolute top-2 left-2 text-[10px]"
                            >
                              NSFW
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-3 space-y-1">
                          {item.title && (
                            <p className="text-sm font-medium line-clamp-1">
                              {item.title}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.prompt}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex flex-wrap gap-1">
                              {item.tags?.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            {item.likes_count > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <HeartIcon className="size-3" />
                                {item.likes_count}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {galleryTotal > 24 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={galleryPage <= 1}
                      onClick={() => fetchGallery(galleryPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center text-sm text-muted-foreground px-3">
                      Page {galleryPage} of{" "}
                      {Math.ceil(galleryTotal / 24)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={galleryItems.length < 24}
                      onClick={() => fetchGallery(galleryPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Followers Tab */}
        {activeTab === "followers" && (
          <div className="space-y-2">
            {followers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No followers yet</p>
              </div>
            ) : (
              followers.map((f) => (
                <Link
                  key={f.id}
                  href={`/user/${f.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {f.display_name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {f.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Followed{" "}
                          {new Date(f.followed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Following Tab */}
        {activeTab === "following" && (
          <div className="space-y-2">
            {following.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Not following anyone yet</p>
              </div>
            ) : (
              following.map((f) => (
                <Link
                  key={f.id}
                  href={`/user/${f.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {f.display_name?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {f.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Following since{" "}
                          {new Date(f.followed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
