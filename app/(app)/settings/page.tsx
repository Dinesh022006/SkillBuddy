"use client";

import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  User,
  Bell,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<
    "account" | "security" | "notifications"
  >("account");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Navigation */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${activeTab === "account"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50"
              }`}
          >
            <User className="h-4 w-4" />
            Account
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${activeTab === "security"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50"
              }`}
          >
            <Shield className="h-4 w-4" />
            Security
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${activeTab === "notifications"
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/50"
              }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          {/* Account */}
          {activeTab === "account" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>
                    Your account information managed via your sign-in provider.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    {isLoaded ? (
                      <Input
                        value={user?.fullName || user?.firstName || "—"}
                        disabled
                      />
                    ) : (
                      <Skeleton className="h-10 w-full" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    {isLoaded ? (
                      <Input
                        value={
                          user?.primaryEmailAddress?.emailAddress || "—"
                        }
                        disabled
                      />
                    ) : (
                      <Skeleton className="h-10 w-full" />
                    )}

                    <p className="text-[0.8rem] text-muted-foreground">
                      Your email is managed by your sign-in provider and cannot
                      be changed here.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Status</Label>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        Active
                      </Badge>

                      {isLoaded && user?.publicMetadata?.role ? (
                        <Badge variant="outline">
                          {String(user.publicMetadata.role)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your password and connected accounts via Clerk.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Link href="/profile">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Profile Settings
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground mt-3">
                  Update your skills, bio, college, and social links via your
                  profile page.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your skills, bio, college, and social links.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Link href="/profile">
                <Button variant="default" className="gap-2">
                  <User className="h-4 w-4" />
                  Go to Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Notifications */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how you receive updates and alerts.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notification preferences are currently managed globally.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}