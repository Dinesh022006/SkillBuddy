import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Users, Code, Zap, ArrowRight } from "lucide-react";
import * as motion from "framer-motion/client";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Compass className="h-6 w-6" />
            <span>SkillBuddy AI</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#testimonials" className="hover:text-primary transition-colors">Testimonials</Link>
          </nav>
          <div className="flex items-center gap-4">
            {!userId ? (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <UserButton />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Connecting the <span className="text-primary">Right Students</span> at the Right Time
              </h1>
              <p className="text-xl text-muted-foreground md:text-2xl">
                SkillBuddy AI is a Student Collaboration & Opportunity Network powered by Collaboration Intelligence Engine.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                {!userId ? (
                  <Link href="/sign-up">
                    <Button size="lg" className="h-12 px-8 text-base group">
                      Start Collaborating
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button size="lg" className="h-12 px-8 text-base group">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
                <Link href="/discover">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                    Explore Communities
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why SkillBuddy AI?</h2>
              <p className="mt-4 text-lg text-muted-foreground">Everything you need to find your perfect team.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: 'AI Recommendations', desc: 'Our Collaboration Intelligence Engine matches you based on skills, goals, and availability.' },
                { icon: Users, title: 'Communities', desc: 'Join vibrant tech communities tailored to your interests like AI, Web Dev, and Cybersecurity.' },
                { icon: Code, title: 'Team Builder', desc: 'Easily form hackathon teams or find project partners with the exact skills you need.' },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-primary text-primary-foreground text-center">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to find your next project partner?</h2>
            <p className="text-xl mb-10 text-primary-foreground/80 max-w-2xl mx-auto">
              Join thousands of students building the future together. It takes less than a minute to sign up.
            </p>
            {!userId ? (
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base text-primary">
                  Create Free Account
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base text-primary">
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-muted-foreground bg-card">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4">
          <p>© 2026 SkillBuddy AI. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-primary">Terms</Link>
            <Link href="#" className="hover:text-primary">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
