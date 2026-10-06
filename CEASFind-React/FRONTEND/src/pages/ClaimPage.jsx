import OfferForm from "../components/OfferForm.jsx";
import { submitClaim } from "../lib/api.js";

const CLAIM = {
  variant: "claim",
  bannerLabel: "You are claiming",
  title: "Submit Your Claim",
  subtitle:
    "Fill in your details and provide a secret identifying feature of the item. This will be emailed to the original reporter for verification.",
  successTitle: "Claim Request Sent!",
  successText:
    "Your proof has been forwarded to the item's original reporter. They will contact you via the email you provided if your claim is verified.",
  submitLabel: "Send Claim",
  validateItem: (item, user) => {
    if (item.postType === "lost") return "This is a lost-item post. Use “I Found This!” to offer to return it instead.";
    if (user && item.reporterEmail === user.email) return "You can't claim your own post.";
    if ((item.status || "unclaimed").toLowerCase() !== "unclaimed")
      return "This item is no longer available to claim. It may already have a pending or approved claim.";
    return null;
  },
  initialValues: (user) => ({
    claimantName: user?.displayName || "",
    claimantEmail: user?.email || "",
    claimantContact: "",
    secretDetail: "",
  }),
  fields: [
    { name: "claimantName", label: "Your Full Name", placeholder: "e.g. Juan Dela Cruz" },
    { name: "claimantEmail", label: "Your Email Address", type: "email", placeholder: "e.g. juan@gordoncollege.edu.ph" },
    { name: "claimantContact", label: "Your Contact Number (optional)", placeholder: "e.g. 09XX-XXX-XXXX" },
    {
      name: "secretDetail",
      label: "Secret Detail / Proof of Ownership",
      multiline: true,
      placeholder: "e.g. There's a small red sticker on the back, the ID has 'JUAN' written in marker...",
      hint: (
        <>
          <strong>Secret Detail</strong> — Describe something about the item that only the true owner would know (e.g.
          a scratch, a sticker, what's inside, a name written on it). This is your proof of ownership.
        </>
      ),
    },
  ],
  required: [
    ["claimantName", "Please enter your full name."],
    ["claimantEmail", "Please enter your email address."],
    ["secretDetail", "Please enter a secret detail as proof of ownership."],
  ],
  submit: (item, values) => submitClaim(item.id, values),
};

export default function ClaimPage() {
  return <OfferForm config={CLAIM} />;
}
