// BACKEND/controllers/itemController.js
import { db } from "../config/firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

export async function reportItem(inputOne, inputTwo) {
  try {
    // Photos are optional for lost-item posts.
    const img_url = inputTwo
      ? `data:${inputTwo.mimetype};base64,${inputTwo.buffer.toString("base64")}`
      : "";

    const docRef = await db.collection("items").add({
      ...inputOne,
      img_url,
      createdAt: FieldValue.serverTimestamp(),
      // Lost-item posts start as "Searching"; found items as "unclaimed".
      status: inputOne.status || "unclaimed",
    });

    return docRef.id;
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
}

export async function getAllItems() {
  try {
    const snapshot = await db.collection("items").get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return items;
  } catch (error) {
    console.error("Cannot Get:", error.message);
    throw error;
  }
}

export async function getElementByID(id) {
  try {
    const docSnap = await db.collection("items").doc(id).get();

    if (!docSnap.exists) {
      throw new Error("Item not found.");
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error("Cannot Get by ID:", error.message);
    throw error;
  }
}

export async function updateItem(id, newData, file) {
  try {
    const updateData = {
      ...newData,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (file) {
      const fileToString = file.buffer.toString("base64");
      const prefix = `data:${file.mimetype};base64,`;
      updateData.img_url = prefix + fileToString;
    }

    await db.collection("items").doc(id).update(updateData);
    return updateData;
  } catch (error) {
    console.error("Cannot Update:", error.message);
    throw error;
  }
}

export async function deleteItem(id, requesterEmail, requesterUid) {
  try {
    const itemSnap = await db.collection("items").doc(id).get();
    if (!itemSnap.exists) throw new Error("Item not found.");
    const item = itemSnap.data();

    // Admin check (hardcoded via .env)
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes((requesterEmail || "").toLowerCase());

    // Owner check
    const isOwner = requesterEmail && item.reporterEmail === requesterEmail;

    if (!isOwner && !isAdmin) {
      const err = new Error("Forbidden");
      err.status = 403;
      throw err;
    }

    await db.collection("items").doc(id).delete();
  } catch (error) {
    console.error("Cannot Delete:", error.message);
    throw error;
  }
}

export async function claimItem(id) {
  try {
    await db.collection("items").doc(id).update({
      status: "claimed",
      claimedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Cannot Claim:", error.message);
    throw error;
  }
}

export async function getHistoryItems(userEmail) {
  try {
    const snapshot = await db.collection("items").get();
    const filteredRes = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!userEmail || data.reporterEmail === userEmail) {
        filteredRes.push({ id: doc.id, ...data });
      }
    }

    return filteredRes;
  } catch (error) {
    console.error("Cannot Get History:", error.message);
    throw error;
  }
}

export async function sendClaimRequest(postId, { claimantName, claimantEmail, claimantContact, secretDetail }) {
  try {
    const docSnap = await db.collection("items").doc(postId).get();
    if (!docSnap.exists) throw new Error("Item not found.");

    const item          = docSnap.data();
    const reporterEmail = item.reporterEmail;
    const reporterUid   = item.reporterUid;   // saved at post creation time
    const itemName      = item.itemName || "an item";

    // 1. Send email to reporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"CEASFind" <${process.env.SMTP_USER}>`,
      to:      reporterEmail,
      subject: `Someone wants to claim: ${itemName}`,
      html: `
        <h2>Claim Request for "${itemName}"</h2>
        <p><strong>Claimant Name:</strong> ${claimantName}</p>
        <p><strong>Claimant Email:</strong> ${claimantEmail}</p>
        <p><strong>Contact:</strong> ${claimantContact || "Not provided"}</p>
        <hr />
        <p><strong>Secret Detail they provided:</strong></p>
        <blockquote>${secretDetail}</blockquote>
        <p>If this detail matches what you know about the item, please contact the claimant to arrange retrieval.</p>
      `,
    });

    // 2. Save notification to Firestore for the reporter
    if (reporterUid) {
      await db.collection("users").doc(reporterUid).collection("notifications").add({
        type:            "claim_request",
        postId,
        itemName,
        claimantName,
        claimantEmail,
        claimantContact: claimantContact || null,
        secretDetail,
        read:            false,
        createdAt:       FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("sendClaimRequest error:", error.message);
    throw error;
  }
}

// ── Get notifications for a user ─────────────────────────────────────────────
export async function getNotifications(uid) {
  try {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Cannot Get Notifications:", error.message);
    throw error;
  }
}

export async function submitClaim(postId, { claimantName, claimantEmail, claimantContact, secretDetail }) {
  try {
    const docSnap = await db.collection("items").doc(postId).get();
    if (!docSnap.exists) throw new Error("Item not found.");

    const item = docSnap.data();

    // 1. Write to claims collection
    await db.collection("claims").add({
      itemID:          postId,
      itemName:        item.itemName || "",
      claimantName:    claimantName || "",
      claimantEmail:   claimantEmail || "",
      claimantContact: claimantContact || null,
      proofDescription: secretDetail,
      status:          "pending",
      timestamp:       FieldValue.serverTimestamp(),
    });

    // 2. Update item status to pending
    await db.collection("items").doc(postId).update({
      status: "pending",
    });

    // 3. Send email to reporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"CEASFind" <${process.env.SMTP_USER}>`,
      to:      item.reporterEmail,
      subject: `Claim Request: ${item.itemName}`,
      html: `
        <h2>Someone wants to claim "${item.itemName}"</h2>
        <p><strong>Name:</strong> ${claimantName}</p>
        <p><strong>Email:</strong> ${claimantEmail}</p>
        <p><strong>Contact:</strong> ${claimantContact || "Not provided"}</p>
        <hr/>
        <p><strong>Proof/Secret Detail:</strong></p>
        <blockquote>${secretDetail}</blockquote>
        <p>Go to your <strong>Review</strong> page on CEASFind to approve or ignore this claim.</p>
      `,
    });

    // 4. Save notification to reporter
    if (item.reporterUid) {
      await db.collection("users").doc(item.reporterUid).collection("notifications").add({
        type:            "claim_request",
        postId,
        itemName:        item.itemName || "",
        claimantName,
        claimantEmail,
        claimantContact: claimantContact || null,
        secretDetail,
        read:            false,
        createdAt:       FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("submitClaim error:", error.message);
    throw error;
  }
}

export async function sendReturnOffer(postId, { finderName, finderEmail, finderContact, whereFound, additionalDetails }) {
  try {
    // 1. Fetch the lost item — must be postType "lost" and status "searching"
    const docSnap = await db.collection("items").doc(postId).get();
    if (!docSnap.exists) throw new Error("Item not found.");

    const item = docSnap.data();

    if (item.postType !== "lost") {
      throw new Error("This item is not a lost-item post.");
    }

    const ownerEmail = item.reporterEmail;
    const ownerName  = item.reporterName || "the owner";
    const itemName   = item.itemName     || "your lost item";

    if (!ownerEmail) {
      throw new Error("This post has no contact email on record.");
    }

    // 2. Send email to the original owner (the person who lost the item)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"CEASFind" <${process.env.SMTP_USER}>`,
      to:      ownerEmail,
      subject: `[CEASFind] Someone found your item: "${itemName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <div style="background: #c0392b; padding: 24px 32px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">CEASFind — Return Offer</h2>
          </div>
          <div style="background: #f5f7fa; padding: 28px 32px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">

            <p style="margin-bottom: 16px;">Hello <strong>${ownerName}</strong>,</p>
            <p>Good news — someone on CEASFind says they have found your lost item and wants to return it.</p>

            <table style="width:100%; border-collapse:collapse; margin: 20px 0; font-size: 14px;">
              <tr style="background:#f8e8e8;">
                <td style="padding:10px 14px; font-weight:bold; width:40%;">Your Lost Item</td>
                <td style="padding:10px 14px;">${itemName}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px; font-weight:bold;">Category</td>
                <td style="padding:10px 14px;">${item.category || "—"}</td>
              </tr>
              <tr style="background:#f8e8e8;">
                <td style="padding:10px 14px; font-weight:bold;">Finder's Name</td>
                <td style="padding:10px 14px;">${finderName}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px; font-weight:bold;">Finder's Email</td>
                <td style="padding:10px 14px;">${finderEmail}</td>
              </tr>
              <tr style="background:#f8e8e8;">
                <td style="padding:10px 14px; font-weight:bold;">Finder's Contact</td>
                <td style="padding:10px 14px;">${finderContact || "Not provided"}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px; font-weight:bold;">Where They Found It</td>
                <td style="padding:10px 14px; color:#c0392b; font-weight:bold;">${whereFound}</td>
              </tr>
              ${additionalDetails ? `
              <tr style="background:#f8e8e8;">
                <td style="padding:10px 14px; font-weight:bold; vertical-align:top;">Additional Details</td>
                <td style="padding:10px 14px;">${additionalDetails}</td>
              </tr>` : ""}
            </table>

            <p style="font-size:13px; color:#666;">
              Please reach out to the finder directly using the contact details above to arrange retrieval.
              If this message seems mistaken, you may safely ignore it.
            </p>

            <hr style="margin: 24px 0; border:none; border-top:1px solid #ddd;" />
            <p style="font-size:12px; color:#999; text-align:center;">
              CEASFind — Lost & Found System | Gordon College CEAS<br/>
              This is an automated message. Do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    // 3. Save notification to the owner's Firestore subcollection
    if (item.reporterUid) {
      await db.collection("users").doc(item.reporterUid).collection("notifications").add({
        type:              "return_offer",
        postId,
        itemName,
        finderName,
        finderEmail,
        finderContact:     finderContact || null,
        whereFound,
        additionalDetails: additionalDetails || null,
        read:              false,
        createdAt:         FieldValue.serverTimestamp(),
      });
    }

    // 4. Log the return offer in its own collection for the Review page
    await db.collection("returnOffers").add({
      itemId:            postId,
      itemName,
      ownerEmail,
      finderName,
      finderEmail,
      finderContact:     finderContact || null,
      whereFound,
      additionalDetails: additionalDetails || null,
      status:            "pending",
      submittedAt:       FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error("sendReturnOffer error:", error.message);
    throw error;
  }
}