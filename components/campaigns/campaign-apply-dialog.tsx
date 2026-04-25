"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface CampaignApplyPayload {
  contentLink: string;
  network: string;
}

interface CampaignApplyDialogProps {
  campaignCompany?: string;
  campaignTitle: string;
  networkOptions: string[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CampaignApplyPayload) => Promise<void> | void;
  open: boolean;
  submitting?: boolean;
}

function isValidLink(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function CampaignApplyDialog({
  campaignCompany,
  campaignTitle,
  networkOptions,
  onOpenChange,
  onSubmit,
  open,
  submitting = false,
}: CampaignApplyDialogProps) {
  const [network, setNetwork] = useState(networkOptions[0] ?? "");
  const [contentLink, setContentLink] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const effectiveNetwork = networkOptions.includes(network)
    ? network
    : (networkOptions[0] ?? "");

  const canSubmit =
    !submitting &&
    effectiveNetwork.trim() !== "" &&
    contentLink.trim() !== "" &&
    agree &&
    isValidLink(contentLink.trim());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const link = contentLink.trim();

    if (!effectiveNetwork) {
      setError("Choisissez un reseau social.");
      return;
    }
    if (!isValidLink(link)) {
      setError("Ajoutez un lien video valide (http:// ou https://).");
      return;
    }
    if (!agree) {
      setError("Vous devez confirmer la conformite du contenu.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        contentLink: link,
        network: effectiveNetwork,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'envoyer la candidature.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <div className="p-6 bg-[#F8FAFC] border-b border-[#E4EAF3]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#98A0B3] font-semibold">
            Campagne
          </p>
          {campaignCompany ? (
            <p className="text-sm font-semibold text-[#4A4A5A] mt-2">{campaignCompany}</p>
          ) : null}
          <DialogTitle className="text-[26px] leading-tight text-[#0F0F14] mt-1">
            {campaignTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280] mt-2">
            Choisissez le reseau social et ajoutez le lien de la video que vous allez soumettre.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0F0F14] mb-2">
              Reseau social
            </label>
            <select
              value={effectiveNetwork}
              onChange={(event) => setNetwork(event.target.value)}
              className="w-full h-11 rounded-xl border border-[#D8DFEC] bg-white px-3 text-sm text-[#0F0F14] outline-none focus:border-[#0047FF]"
              disabled={submitting}
            >
              {networkOptions.length > 0 ? (
                networkOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))
              ) : (
                <option value="">Aucun reseau disponible</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F0F14] mb-2">
              Lien de la video
            </label>
            <Input
              type="url"
              value={contentLink}
              onChange={(event) => setContentLink(event.target.value)}
              placeholder="https://"
              disabled={submitting}
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-[#4A4A5A]">
            <input
              type="checkbox"
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#C7D3EA] text-[#0047FF] focus:ring-[#0047FF]"
              disabled={submitting}
            />
            <span>
              Je confirme que mon contenu respecte les exigences de la campagne et les regles
              de la plateforme.
            </span>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold"
            disabled={!canSubmit}
          >
            {submitting ? "Envoi..." : "Postuler"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
