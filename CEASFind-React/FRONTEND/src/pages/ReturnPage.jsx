import OfferForm from "../components/OfferForm.jsx";
import { submitReturnOffer } from "../lib/api.js";

const RETURN_OFFER = {
  variant: "return",
  bannerLabel: "You found someone's lost item",
  title: "Offer to Return This Item",
  subtitle:
    "Fill in your contact details and where you found the item. This will be sent directly to the person who lost it so they can reach you.",
  successTitle: "Return Offer Sent!",
  successText:
    "The owner has been notified via email with your contact details. They will reach out to arrange retrieval if your information matches.",
  submitLabel: "Send Return Offer",
  validateItem: (item, user) => {
    if (item.postType !== "lost")
      return "This page is only for lost items. If you want to claim a found item, use the Claim button instead.";
    if (user && item.reporterEmail === user.email) return "This is your own lost-item post.";
    return null;
  },
  initialValues: (user) => ({
    finderName: user?.displayName || "",
    finderEmail: user?.email || "",
    finderContact: "",
    whereFound: "",
    additionalDetails: "",
  }),
  fields: [
    { name: "finderName", label: "Your Full Name", placeholder: "e.g. Maria Santos" },
    { name: "finderEmail", label: "Your Email Address", type: "email", placeholder: "e.g. maria@gordoncollege.edu.ph" },
    { name: "finderContact", label: "Your Contact Number (optional)", placeholder: "e.g. 09XX-XXX-XXXX" },
    {
      name: "whereFound",
      label: "Where You Found It",
      placeholder: "e.g. Near RM105 hallway, on the bench by the window",
      hint: (
        <>
          <strong>Where did you find it?</strong> — Be specific so the owner can verify this is really their item (e.g.
          "Near RM105 hallway, left on the bench").
        </>
      ),
    },
    {
      name: "additionalDetails",
      label: "Additional Details (optional)",
      multiline: true,
      placeholder: "Any other details that help the owner confirm it's theirs…",
    },
  ],
  required: [
    ["finderName", "Please enter your full name."],
    ["finderEmail", "Please enter your email address."],
    ["whereFound", "Please describe where you found the item."],
  ],
  submit: (item, values) => submitReturnOffer(item.id, values),
};

export default function ReturnPage() {
  return <OfferForm config={RETURN_OFFER} />;
}
