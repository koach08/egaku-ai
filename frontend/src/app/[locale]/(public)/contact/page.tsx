"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ContactPage() {
  const { session } = useAuth();
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      await api.submitFeedback(session?.access_token || null, {
        feature: "contact_form",
        category: category as "bug" | "feature_request" | "praise" | "general",
        message: `${email ? `[From: ${email}] ` : ""}${message}`,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });
      setSent(true);
      toast.success("Message sent! We'll get back to you if needed.");
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Contact Us</CardTitle>
            <p className="text-sm text-muted-foreground">
              Bug reports, feature requests, questions — we read everything.
            </p>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-3xl">✅</p>
                <p className="font-medium">Message sent</p>
                <p className="text-sm text-muted-foreground">Thank you for reaching out.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Question</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="praise">Feedback / Praise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!session && (
                  <div>
                    <Label className="text-xs">Your Email (optional)</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Only if you want a reply</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Message</Label>
                  <Textarea
                    placeholder="Describe your question, issue, or feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={sending || !message.trim()}
                  className="w-full"
                  size="lg"
                >
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
