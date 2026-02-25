import React from "react";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMPLIANCE_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  let facility: { id: string; name: string; category: string } | null = null;

  if (role === "ADMIN") {
    facility = await prisma.facility.findFirst({
      where: { adminId: session.user.id },
      select: { id: true, name: true, category: true },
    });
  } else if (role === "MSDS_FOCAL" && session.user.facilityId) {
    facility = await prisma.facility.findFirst({
      where: { id: session.user.facilityId },
      select: { id: true, name: true, category: true },
    });
  }

  if (!facility) {
    return NextResponse.json({ error: "No facility found" }, { status: 404 });
  }

  const indicators = await prisma.facilityIndicator.findMany({
    where: { facilityId: facility.id },
    include: {
      indicator: { include: { standard: true } },
    },
    orderBy: { indicator: { code: "asc" } },
  });

  const byStatus = indicators.reduce(
    (acc, fi) => {
      acc[fi.status] = (acc[fi.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const total = indicators.length;
  const compliant = byStatus.COMPLIANT ?? 0;
  const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

  try {
    const ReactPDF = await import("@react-pdf/renderer");
    const { Document, Page, Text, View, StyleSheet, renderToBuffer } = ReactPDF;

    const styles = StyleSheet.create({
      page: { padding: 40, fontFamily: "Helvetica" },
      title: { fontSize: 18, marginBottom: 8 },
      subtitle: { fontSize: 10, color: "#666", marginBottom: 20 },
      section: { marginBottom: 16 },
      sectionTitle: { fontSize: 12, marginBottom: 6 },
      row: { flexDirection: "row", marginBottom: 4, fontSize: 9 },
      label: { width: 120 },
      value: { flex: 1 },
      tableRow: { flexDirection: "row", paddingVertical: 2, fontSize: 8, borderBottomWidth: 0.5 },
      statBox: { flexDirection: "row", marginBottom: 12, gap: 16 },
      stat: { padding: 8, backgroundColor: "#f0f0f0", flex: 1 },
      statValue: { fontSize: 16 },
      statLabel: { fontSize: 8, color: "#666" },
    });

    const ComplianceReport = () => (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>PHC MSDS Compliance Report</Text>
          <Text style={styles.subtitle}>
            {facility.name} · Generated {new Date().toLocaleDateString()}
          </Text>

          <View style={styles.statBox}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Total Indicators</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{score}%</Text>
              <Text style={styles.statLabel}>Compliance Score</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{compliant}</Text>
              <Text style={styles.statLabel}>Compliant</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{byStatus.NON_COMPLIANT ?? 0}</Text>
              <Text style={styles.statLabel}>Non-Compliant</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status breakdown</Text>
            {(Object.entries(COMPLIANCE_STATUS_LABELS) as [keyof typeof COMPLIANCE_STATUS_LABELS, string][]).map(
              ([status, label]) => (
                <View key={status} style={styles.row}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>{byStatus[status] ?? 0}</Text>
                </View>
              )
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Indicators by standard</Text>
            {indicators.slice(0, 80).map((fi) => (
              <View key={fi.id} style={styles.tableRow}>
                <Text style={[styles.value, { flex: 2 }]}>{fi.indicator.code}</Text>
                <Text style={[styles.value, { flex: 3 }]}>{fi.indicator.title}</Text>
                <Text style={styles.value}>{COMPLIANCE_STATUS_LABELS[fi.status]}</Text>
              </View>
            ))}
            {indicators.length > 80 && (
              <Text style={styles.subtitle}>... and {indicators.length - 80} more indicators</Text>
            )}
          </View>
        </Page>
      </Document>
    );

    const pdfBuffer = await renderToBuffer(React.createElement(ComplianceReport));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="phc-compliance-report-${facility.name.replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json(
      { error: "Report generation failed. Ensure @react-pdf/renderer is configured." },
      { status: 500 }
    );
  }
}
