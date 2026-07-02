/**
 * POST /api/shortlist  — save a named shortlist of car IDs.
 * GET  /api/shortlist  — list all saved shortlists.
 *
 * Guarded: database errors never break the response — they return
 * a 500 with a friendly message so the recommend flow is unaffected.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/* ── POST — save shortlist ──────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    let body: { name?: string; carIds?: string[] };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const name = body.name?.trim();
    const carIds = body.carIds;

    if (!name) {
      return NextResponse.json(
        { error: "\"name\" (string) is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(carIds) || carIds.length === 0) {
      return NextResponse.json(
        { error: "\"carIds\" (non-empty string[]) is required" },
        { status: 400 },
      );
    }

    const shortlist = await prisma.shortlist.create({
      data: {
        name,
        carIds: JSON.stringify(carIds),
      },
    });

    return NextResponse.json({
      id: shortlist.id,
      name: shortlist.name,
      carIds: JSON.parse(shortlist.carIds) as string[],
      createdAt: shortlist.createdAt,
    });
  } catch (err) {
    console.error("Shortlist save error:", err);
    return NextResponse.json(
      { error: "Could not save shortlist. Database may be unavailable." },
      { status: 500 },
    );
  }
}

/* ── GET — list all shortlists ──────────────────────────────────── */

export async function GET() {
  try {
    const shortlists = await prisma.shortlist.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      shortlists.map((s) => ({
        id: s.id,
        name: s.name,
        carIds: JSON.parse(s.carIds) as string[],
        createdAt: s.createdAt,
      })),
    );
  } catch (err) {
    console.error("Shortlist list error:", err);
    return NextResponse.json(
      { error: "Could not load shortlists." },
      { status: 500 },
    );
  }
}
