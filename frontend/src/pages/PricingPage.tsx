"use client";

import { Pricing } from "@/components/blocks/pricing";

const demoPlans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Up to 5 extractions/day",
      "Basic JSON export only",
      "Community support",
      "Standard LLM models",
    ],
    description: "Perfect for testing our extraction capabilities",
    buttonText: "Get Started Free",
    href: "/login",
    isPopular: false,
  },
  {
    name: "STARTER",
    price: "15",
    yearlyPrice: "12",
    period: "per month",
    features: [
      "Up to 10 extractions/day",
      "Basic JSON, CSV export",
      "48-hour support response time",
      "Standard LLM models",
      "Community support",
    ],
    description: "Perfect for individuals testing data extraction",
    buttonText: "Start Free Trial",
    href: "/login",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    price: "49",
    yearlyPrice: "39",
    period: "per month",
    features: [
      "Unlimited extractions",
      "Advanced Webhook integrations",
      "24-hour support response time",
      "Premium LLM models (GPT-4o)",
      "Dedicated API Keys",
      "Team collaboration (Upcoming)",
      "Priority extraction queues",
    ],
    description: "Ideal for growing teams and automated pipelines",
    buttonText: "Upgrade Now",
    href: "/login",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "249",
    yearlyPrice: "199",
    period: "per month",
    features: [
      "Everything in Professional",
      "Local deployment support",
      "Dedicated account manager",
      "1-hour SLA response time",
      "Custom Fine-tuned LLMs",
      "Advanced security & Privacy Guard",
      "Custom extraction targets",
    ],
    description: "For large orgs needing highly secure, custom pipelines",
    buttonText: "Contact Sales",
    href: "mailto:sales@anyforge.ai",
    isPopular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 rounded-lg">
      <Pricing 
        plans={demoPlans}
        title="Predictable, Transparent Pricing"
        description="Choose the plan that fits your data extraction pipeline.&#10;All plans include access to our AI extraction engine, basic webhooks, and core support."
      />
    </div>
  );
}
