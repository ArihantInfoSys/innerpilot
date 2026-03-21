"use client";

import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { EngagementRule } from "@/lib/types";
import { Sparkles } from "lucide-react";

interface NudgePopupProps {
  open: boolean;
  rule: EngagementRule;
  onDismiss: () => void;
}

export default function NudgePopup({ open, rule, onDismiss }: NudgePopupProps) {
  const router = useRouter();

  const handleCta = () => {
    onDismiss();
    router.push(rule.ctaLink);
  };

  return (
    <Modal open={open} onClose={onDismiss}>
      <div className="text-center pt-2">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{rule.title}</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">{rule.body}</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onDismiss} className="flex-1">
            Later
          </Button>
          <Button onClick={handleCta} className="flex-1">
            {rule.cta}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
