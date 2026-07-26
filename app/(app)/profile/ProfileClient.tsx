"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Trash2,
  Loader2,
  Code,
  Briefcase,
  Check,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";


const profileFormSchema = z.object({
  firstName: z.string().min(2, "Name must be at least 2 characters.").optional(),
  lastName: z.string().optional(),
  college: z.string().optional(),
  branch: z.string().optional(),
  year: z.number().optional(),
  bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional(),
  github: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  leetcodeUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  codechefUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  codeforcesUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  hackerrankUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  hackerearthUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  kaggleUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  devfolioUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  behanceUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  careerGoal: z.string().optional(),
  availability: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type SkillItem = { id: string; skill: { id: string; name: string } };
type GoalItem = { id: string; skill: { id: string; name: string } };

type InitialProfileData = {
  id?: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  profile?: {
    id?: string;
    college?: string | null;
    branch?: string | null;
    year?: number | null;
    bio?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    leetcodeUrl?: string | null;
    codechefUrl?: string | null;
    codeforcesUrl?: string | null;
    hackerrankUrl?: string | null;
    hackerearthUrl?: string | null;
    kaggleUrl?: string | null;
    devfolioUrl?: string | null;
    behanceUrl?: string | null;
    careerGoal?: string | null;
    availability?: string | null;
    resumeUrl?: string | null;
    xp?: number | null;
    level?: number | null;
    completion?: number | null;
    skills?: SkillItem[];
    learningGoals?: GoalItem[];
  } | null;
};

const LOOKING_FOR_OPTIONS = [
  "Learning Partner",
  "Mentor",
  "Mentee",
  "Project Collaborator",
  "Hackathon Team",
  "Startup Co-founder",
  "Study Group",
  "Open Source Contributor"
];

export function ProfileClient({ initialData }: { initialData: InitialProfileData | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Skills management
  const [skills, setSkills] = useState<SkillItem[]>(initialData?.profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // Goals management
  const [goals, setGoals] = useState<GoalItem[]>(initialData?.profile?.learningGoals || []);
  const [newGoal, setNewGoal] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  // Looking For (careerGoal) management
  const [lookingFor, setLookingFor] = useState<string[]>(
    initialData?.profile?.careerGoal ? initialData.profile.careerGoal.split(",").map(s => s.trim()).filter(Boolean) : []
  );
  // Dialog state for clearing resume
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const toggleLookingFor = (option: string) => {
    setLookingFor(prev => {
      const newLookingFor = prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option];
      form.setValue("careerGoal", newLookingFor.join(", "), { shouldDirty: true });
      return newLookingFor;
    });
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      college: initialData?.profile?.college || "",
      branch: initialData?.profile?.branch || "",
      year: initialData?.profile?.year || undefined,
      bio: initialData?.profile?.bio || "",
      github: initialData?.profile?.githubUrl || "",
      linkedin: initialData?.profile?.linkedinUrl || "",
      leetcodeUrl: initialData?.profile?.leetcodeUrl || "",
      codechefUrl: initialData?.profile?.codechefUrl || "",
      codeforcesUrl: initialData?.profile?.codeforcesUrl || "",
      hackerrankUrl: initialData?.profile?.hackerrankUrl || "",
      hackerearthUrl: initialData?.profile?.hackerearthUrl || "",
      kaggleUrl: initialData?.profile?.kaggleUrl || "",
      devfolioUrl: initialData?.profile?.devfolioUrl || "",
      behanceUrl: initialData?.profile?.behanceUrl || "",
      careerGoal: initialData?.profile?.careerGoal || "",
      availability: initialData?.profile?.availability || "",
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.add({ title: "Profile updated successfully!", type: "success" });
        router.refresh();
      } else {
        toast.add({ title: "Failed to update profile.", type: "error" });
      }
    } catch {
      toast.add({ title: "Network error. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const addSkill = async () => {
    const name = newSkill.trim();
    if (!name) return;
    setAddingSkill(true);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setSkills((prev) => [...prev, data]);
        setNewSkill("");
        toast.add({ title: `Skill "${name}" added!`, type: "success" });
      } else {
        toast.add({ title: "Failed to add skill.", type: "error" });
      }
    } catch {
      toast.add({ title: "Network error.", type: "error" });
    } finally {
      setAddingSkill(false);
    }
  };

  const removeSkill = async (skillId: string, skillName: string) => {
    try {
      const res = await fetch(`/api/profile/skills/${skillId}`, { method: "DELETE" });
      if (res.ok) {
        setSkills((prev) => prev.filter((s) => s.skill.id !== skillId));
        toast.add({ title: `"${skillName}" removed`, type: "info" });
      } else {
        toast.add({ title: "Failed to remove skill.", type: "error" });
      }
    } catch {
      toast.add({ title: "Network error.", type: "error" });
    }
  };

  const addGoal = async () => {
    const name = newGoal.trim();
    if (!name) return;
    setAddingGoal(true);
    try {
      const res = await fetch("/api/profile/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setGoals((prev) => [...prev, data]);
        setNewGoal("");
        toast.add({ title: `Goal "${name}" added!`, type: "success" });
      } else {
        toast.add({ title: "Failed to add goal.", type: "error" });
      }
    } catch {
      toast.add({ title: "Network error.", type: "error" });
    } finally {
      setAddingGoal(false);
    }
  };

  const removeGoal = async (skillId: string, goalName: string) => {
    try {
      const res = await fetch(`/api/profile/goals/${skillId}`, { method: "DELETE" });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.skill.id !== skillId));
        toast.add({ title: `"${goalName}" removed`, type: "info" });
      } else {
        toast.add({ title: "Failed to remove goal.", type: "error" });
      }
    } catch {
      toast.add({ title: "Network error.", type: "error" });
    }
  };

  // Handle clearing resume
  const handleClearResume = async () => {
    setIsClearing(true);
    try {
      const res = await fetch("/api/profile/resume", { method: "DELETE" });
      if (res.ok) {
        toast.add({ title: "Resume removed successfully.", type: "success" });
        setIsClearDialogOpen(false);
        router.refresh();
      } else {
        const err = await res.text();
        toast.add({ title: "Failed to remove resume.", type: "error", description: err });
      }
    } catch {
      toast.add({ title: "Network error while removing resume.", type: "error" });
    } finally {
      setIsClearing(false);
    }
  };

  // Compute profile completion locally
  const codingFields = [
    initialData?.profile?.leetcodeUrl,
    initialData?.profile?.codechefUrl,
    initialData?.profile?.codeforcesUrl,
    initialData?.profile?.hackerrankUrl,
    initialData?.profile?.hackerearthUrl,
    initialData?.profile?.kaggleUrl,
    initialData?.profile?.devfolioUrl,
    initialData?.profile?.behanceUrl
  ].filter(f => f && String(f).trim() !== "");

  const hasCodingProfiles = codingFields.length > 0;

  const fields = [
    { name: "Avatar", value: initialData?.avatarUrl, weight: 10 },
    { name: "Bio", value: initialData?.profile?.bio, weight: 10 },
    { name: "Skills", value: initialData?.profile?.skills?.length ? "yes" : "", weight: 20 },
    { name: "Learning Goals", value: initialData?.profile?.learningGoals?.length ? "yes" : "", weight: 15 },
    { name: "Looking For", value: initialData?.profile?.careerGoal, weight: 15 },
    { name: "GitHub", value: initialData?.profile?.githubUrl, weight: 10 },
    { name: "LinkedIn", value: initialData?.profile?.linkedinUrl, weight: 5 },
    { name: "Coding Profiles", value: hasCodingProfiles ? "yes" : "", weight: 10 },
    { name: "Resume", value: initialData?.profile?.resumeUrl, weight: 5 },
  ];
  const completionScore = fields.reduce(
    (acc, f) => (f.value && String(f.value).trim() !== "" ? acc + f.weight : acc),
    0
  );

  const isVerified = initialData?.profile?.githubUrl && codingFields.length >= 2;


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your public profile, skills, and social links.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-4">
          {/* Completion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">{completionScore}%</span>
              </div>
              <Progress value={completionScore} className="h-2" />
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium mb-2">Checklist:</p>
                <div className="flex flex-col gap-1.5">
                  {fields.map((f) => {
                    const isComplete = f.value && String(f.value).trim() !== "";
                    return (
                      <div key={f.name} className={`flex items-center gap-2 text-sm ${isComplete ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {isComplete ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {f.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avatar & XP */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="h-28 w-28">
                <AvatarImage src={initialData?.avatarUrl || ""} alt="Avatar" />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {initialData?.firstName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{initialData?.name || "Your Name"}</h3>
                <p className="text-sm text-muted-foreground">
                  {[initialData?.profile?.branch, initialData?.profile?.college].filter(Boolean).join(" • ")}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Level {initialData?.profile?.level || 1}
                  </Badge>
                  <span className="text-sm font-semibold text-primary">{initialData?.profile?.xp || 0} XP</span>
                </div>
                {isVerified && (
                  <Badge variant="default" className="mt-3 bg-green-500 hover:bg-green-600">
                    <Check className="h-3 w-3 mr-1" /> Verified Developer Profile
                  </Badge>
                )}
              </div>

              {/* Avatar upload */}
              <div className="w-full">
                <p className="text-xs text-muted-foreground font-medium mb-2">Change Avatar</p>
                <UploadButton
                  endpoint="avatarUploader"
                  onClientUploadComplete={() => {
                    toast.add({ title: "Avatar updated!", type: "success" });
                    router.refresh();
                  }}
                  onUploadError={(error: Error) => {
                    toast.add({ title: `Upload failed: ${error.message}`, type: "error" });
                  }}
                />
              </div>

              {/* Resume */}
              {initialData?.profile?.resumeUrl && (
                <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
                  <FileText className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Resume.pdf</p>
                    <p className="text-xs text-muted-foreground">PDF Document</p>
                    <p className="text-xs text-success flex items-center"><Check className="h-3 w-3 mr-1" /> Uploaded Successfully</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { const url = initialData?.profile?.resumeUrl; if (url) { window.open(url, "_blank"); } }} className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  {/* Clear Resume Dialog */}
                  <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 text-destructive" disabled={isClearing}>
                        <Trash2 className="h-4 w-4" />
                        {isClearing ? "Removing..." : "Clear"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove Resume</DialogTitle>
                        <DialogDescription>Are you sure you want to remove your resume? This action cannot be undone.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClearDialogOpen(false)} disabled={isClearing}>Cancel</Button>
                        <Button variant="destructive" onClick={handleClearResume} disabled={isClearing}>
                          {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isClearing ? "Removing..." : "Confirm"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="w-full border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">Resume</p>
                <p className="text-[10px] text-muted-foreground mb-3">Upload your resume to verify your skills. No AI analysis will be performed.</p>
                <UploadButton
                  endpoint="resumeUploader"
                  onClientUploadComplete={() => {
                    toast.add({ title: "Resume uploaded!", type: "success" });
                    router.refresh();
                  }}
                  onUploadError={(error: Error) => {
                    toast.add({ title: `Upload failed: ${error.message}`, type: "error" });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-4">
          {/* Personal Info Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your details. This information is visible to other students.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...form.register("firstName")} />
                    {form.formState.errors.firstName && (
                      <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...form.register("lastName")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="college">College</Label>
                    <Input id="college" {...form.register("college")} placeholder="e.g. IIT Bombay" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch / Major</Label>
                    <Input id="branch" {...form.register("branch")} placeholder="e.g. Computer Science" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year of Study</Label>
                    <Input
                      id="year"
                      type="number"
                      min={1}
                      max={6}
                      {...form.register("year", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Input id="availability" {...form.register("availability")} placeholder="e.g. 15 hrs/week" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell collaborators about yourself..."
                    className="resize-none"
                    rows={3}
                    {...form.register("bio")}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.watch("bio")?.length || 0} / 300
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Looking For</Label>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR_OPTIONS.map((option) => (
                      <Badge
                        key={option}
                        variant={lookingFor.includes(option) ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:-translate-y-0.5 font-normal"
                        onClick={() => toggleLookingFor(option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Select what you are looking for to improve AI matchmaking.</p>
                </div>

                {/* Social Links & Coding Profiles */}
                <div className="pt-2 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Coding Profiles & Links</p>
                  <p className="text-[10px] text-muted-foreground mb-4">Adding these increases your profile trust and verifies your skills.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="github" className="flex items-center gap-2">
                        <Code className="h-4 w-4" /> GitHub
                      </Label>
                      <Input id="github" type="url" {...form.register("github")} placeholder="https://github.com/username" />
                      {form.formState.errors.github && <p className="text-xs text-destructive">{form.formState.errors.github.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> LinkedIn
                      </Label>
                      <Input id="linkedin" type="url" {...form.register("linkedin")} placeholder="https://linkedin.com/in/username" />
                      {form.formState.errors.linkedin && <p className="text-xs text-destructive">{form.formState.errors.linkedin.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leetcodeUrl" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-orange-500" /> LeetCode
                      </Label>
                      <Input id="leetcodeUrl" type="url" {...form.register("leetcodeUrl")} placeholder="https://leetcode.com/u/username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codechefUrl" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-amber-600" /> CodeChef
                      </Label>
                      <Input id="codechefUrl" type="url" {...form.register("codechefUrl")} placeholder="https://www.codechef.com/users/username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codeforcesUrl" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-red-500" /> Codeforces
                      </Label>
                      <Input id="codeforcesUrl" type="url" {...form.register("codeforcesUrl")} placeholder="https://codeforces.com/profile/username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hackerrankUrl" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-green-500" /> HackerRank
                      </Label>
                      <Input id="hackerrankUrl" type="url" {...form.register("hackerrankUrl")} placeholder="https://www.hackerrank.com/username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hackerearthUrl" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-blue-500" /> HackerEarth
                      </Label>
                      <Input id="hackerearthUrl" type="url" {...form.register("hackerearthUrl")} placeholder="https://www.hackerearth.com/@username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="devfolioUrl" className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-cyan-500" /> Devfolio
                      </Label>
                      <Input id="devfolioUrl" type="url" {...form.register("devfolioUrl")} placeholder="https://devfolio.co/@username" />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Add technologies and skills you know. Used for AI matching.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                ) : (
                  skills.map((s) => (
                    <Badge
                      key={s.skill.id}
                      variant="secondary"
                      className="gap-1 pr-1 pl-3 py-1.5 text-sm"
                    >
                      {s.skill.name}
                      <button
                        onClick={() => removeSkill(s.skill.id, s.skill.name)}
                        className="ml-1 rounded hover:bg-destructive/20 p-0.5 transition-colors"
                        aria-label={`Remove ${s.skill.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g. React, Python)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                />
                <Button onClick={addSkill} disabled={addingSkill || !newSkill.trim()} size="sm">
                  {addingSkill ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>What skills are you looking to learn? Helps find mentors and partners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No learning goals added yet.</p>
                ) : (
                  goals.map((g) => (
                    <Badge
                      key={g.skill.id}
                      variant="outline"
                      className="gap-1 pr-1 pl-3 py-1.5 text-sm border-primary/30 text-primary"
                    >
                      {g.skill.name}
                      <button
                        onClick={() => removeGoal(g.skill.id, g.skill.name)}
                        className="ml-1 rounded hover:bg-destructive/20 p-0.5 transition-colors"
                        aria-label={`Remove ${g.skill.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a goal (e.g. Machine Learning, Rust)"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
                />
                <Button onClick={addGoal} disabled={addingGoal || !newGoal.trim()} size="sm">
                  {addingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
