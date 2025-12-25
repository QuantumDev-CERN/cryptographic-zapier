"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon, GitMergeIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approvePullRequest, rejectPullRequest, mergePullRequest } from "@/app/actions/pull-request";
import { toast } from "sonner";

interface PRActionsProps {
  prId: string;
  slug: string;
  workspaceId: string;
  showMerge?: boolean;
}

export function PRActions({ prId, slug, workspaceId, showMerge }: PRActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  async function handleApprove() {
    setIsApproving(true);
    try {
      const result = await approvePullRequest(prId);
      if (result.success) {
        toast.success("Pull request approved");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to approve pull request");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectPullRequest(prId, rejectReason);
      if (result.success) {
        toast.success("Pull request rejected");
        setRejectDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to reject pull request");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsRejecting(false);
    }
  }

  async function handleMerge() {
    setIsMerging(true);
    try {
      const result = await mergePullRequest(prId);
      if (result.success) {
        toast.success("Pull request merged successfully!");
        setMergeDialogOpen(false);
        router.push(`/orgs/${slug}/workspaces/${workspaceId}`);
      } else {
        toast.error(result.error || "Failed to merge pull request");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsMerging(false);
    }
  }

  if (showMerge) {
    return (
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <GitMergeIcon className="size-4" />
            Merge
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Pull Request</DialogTitle>
            <DialogDescription>
              This will merge the changes into the target workspace and create a
              new version. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMergeDialogOpen(false)}
              disabled={isMerging}
            >
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={isMerging}>
              {isMerging && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Confirm Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="gap-2"
        onClick={handleApprove}
        disabled={isApproving}
      >
        {isApproving ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <CheckIcon className="size-4" />
        )}
        Approve
      </Button>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 text-destructive">
            <XIcon className="size-4" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Pull Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this pull request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this pull request is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
