"use client";

import React, { useState } from "react";
import PageHeader from "@/components/shell/PageHeader";
import EmptyStateCard from "@/components/shell/EmptyStateCard";
import { Smartphone, Check, Users, ThumbsUp, QrCode } from "lucide-react";

export default function StudentPortalPage() {
  const [hasRsvpd, setHasRsvpd] = useState(false);

  return (
    <div>
      <PageHeader
        title="Student Dining Portal"
        subtitle="Live mess crowd meter, digital meal RSVP, recipe feedback, and student zero-waste leaderboard."
        badge="Diner Experience"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHasRsvpd(!hasRsvpd)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-forest-950 shadow-sm transition-all focus-ring flex items-center gap-1.5 cursor-pointer"
            >
              {hasRsvpd ? <Check className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
              <span>{hasRsvpd ? "RSVP Confirmed (Dining)" : "Simulate Student RSVP"}</span>
            </button>
          </div>
        }
      />

      <EmptyStateCard
        icon={Smartphone}
        title="Student Mess Engagement Engine Ready"
        description="Empowers college students to check live serving line queue wait times, verify upcoming meals, and RSVP when dining away from campus—directly adjusting prep batches to avoid cooking for empty plates."
        highlightText="Live Sensor: Hostel 1 Dining Hall is currently at 14% queue density. Average serving line wait time: 1.5 minutes."
        metrics={[
          { label: "Confirmed Diners", value: hasRsvpd ? "843 Diners" : "842 Diners" },
          { label: "Queue Wait Time", value: "1.5 Mins (Low)" },
          { label: "Student Rating", value: "4.4 ★ Average" },
        ]}
        actions={[
          {
            label: hasRsvpd ? "Cancel Dinner RSVP" : "RSVP For Tonight's Dinner",
            onClick: () => setHasRsvpd(!hasRsvpd),
            primary: true,
          },
          { label: "View Weekly Hostel Menu" },
          { label: "Campus Clean Plate Leaderboard" },
        ]}
      />
    </div>
  );
}
