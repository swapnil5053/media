import { useState } from "react";
import { toast } from "sonner";
import { PLANS, type PlanId } from "@shared/types";
import { formatBytes, formatDate } from "@/lib/format";
import { useAccount, useUpdateProfile } from "@/hooks/use-account";
import { DeveloperPanel } from "@/components/developer-panel";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/feedback";

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const fraction = Math.min(1, used / limit);

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-raised">
        <div
          className={`h-full rounded-full ${fraction > 0.9 ? "bg-critical" : "bg-invert"}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <p className="mt-1.5 text-[13px] text-muted">
        {formatBytes(used)} of {formatBytes(limit)} used
      </p>
    </div>
  );
}

export function Settings() {
  const { data: account } = useAccount();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(account?.name ?? "");

  if (!account) return null;

  const plan = PLANS[account.plan];

  function changePlan(planId: PlanId) {
    updateProfile.mutate(
      { plan: planId },
      {
        onSuccess: () =>
          toast.success(`Switched to ${PLANS[planId].name}`, {
            description: "Billing is not wired up in this deployment, so the change is immediate.",
          }),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Member since {formatDate(account.createdAt)}.</p>
      </div>

      <Card>
        <CardHeader title="Profile" />
        <div className="space-y-4 px-5 py-4">
          <Field label="Display name">
            {(id) => <Input id={id} value={name} onChange={(event) => setName(event.target.value)} />}
          </Field>

          <Field label="Email">{(id) => <Input id={id} value={account.email} disabled />}</Field>

          <Button
            disabled={updateProfile.isPending || name.trim() === account.name || !name.trim()}
            onClick={() =>
              updateProfile.mutate({ name: name.trim() }, { onSuccess: () => toast.success("Profile updated") })
            }
          >
            Save changes
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Plan and usage"
          action={<Badge tone="positive">{plan.name}</Badge>}
        />
        <div className="space-y-5 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 block text-[13px] text-muted">Storage</p>
              <UsageBar used={account.usage.storageBytes} limit={plan.maxStorageBytes} />
            </div>
            <div>
              <p className="mb-2 block text-[13px] text-muted">Videos</p>
              <UsageBar used={account.usage.videos} limit={plan.maxVideos} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(PLANS).map((option) => (
              <div
                key={option.id}
                className={`rounded-lg border p-4 ${
                  option.id === account.plan ? "border-line-strong bg-raised" : "border-line"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-ink">{option.name}</p>
                  <p className="text-sm text-muted">
                    {option.priceMonthly === 0 ? "Free" : `$${option.priceMonthly}/mo`}
                  </p>
                </div>
                <ul className="mt-2 space-y-1 text-[13px] text-muted">
                  {option.features.slice(0, 3).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {option.id !== account.plan ? (
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => changePlan(option.id)}>
                    Switch to {option.name}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <DeveloperPanel />
    </div>
  );
}
