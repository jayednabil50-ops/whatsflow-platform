import { NextRequest, NextResponse } from "next/server";
import {
  listPublicApiContacts,
  PublicApiRequestError,
  requirePublicApiSession,
  resolvePublicApiTargetJid
} from "@/lib/whatsapp/public-api";
import { rememberSessionContactProfile } from "@/lib/whatsapp/contact-profiles";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const contacts = await listPublicApiContacts(session.id);

    return NextResponse.json({
      sessionId: session.id,
      total: contacts.length,
      contacts: contacts.map((contact) => ({
        remoteJid: contact.remoteJid,
        displayName: contact.displayName || null,
        phoneNumber: contact.resolvedPhoneNumber || contact.phoneNumber,
        lastMessageAt: contact.lastMessageAt || null,
        updatedAt: contact.updatedAt
      }))
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Failed to fetch contacts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePublicApiSession(req);
    const body = await req.json();
    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim()
        : typeof body.jid === "string"
          ? body.jid.trim()
          : "";
    const remoteJid =
      typeof body.remoteJid === "string" && body.remoteJid.trim().length > 0
        ? body.remoteJid.trim()
        : typeof body.jid === "string" && body.jid.trim().length > 0
          ? body.jid.trim()
          : await resolvePublicApiTargetJid(session.id, phoneNumber);
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : typeof body.fullName === "string"
          ? body.fullName.trim()
          : "";

    if (!displayName) {
      return NextResponse.json(
        { error: "displayName or fullName is required." },
        { status: 400 }
      );
    }

    const contact = await rememberSessionContactProfile({
      sessionId: session.id,
      remoteJid,
      displayName,
      phoneNumber
    });

    return NextResponse.json({
      success: true,
      contact: {
        remoteJid: contact.remoteJid,
        displayName: contact.displayName || null,
        fullName: contact.displayName || null,
        phoneNumber: contact.phoneNumber,
        updatedAt: contact.updatedAt
      }
    });
  } catch (error) {
    if (error instanceof PublicApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to create or update contact.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
