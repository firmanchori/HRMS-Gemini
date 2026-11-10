import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { gaAssets, procurementOrders } from "../db/schema.ts";

/**
 * Procurement -> Asset link (audit findings §3, "persis contoh pemilik
 * produk": marking goods received never created the asset, so GA retyped
 * it without vendor/PO/warranty). Receiving a physical-goods order now
 * generates one ga_asset per unit, carrying vendor, PO number, unit price
 * and a structured warranty expiry, in status "Tersedia". Idempotent via
 * procurement_orders.assets_generated_at; service/contract orders produce
 * no physical asset.
 */
const RECEIVED_STATUSES = new Set(["Barang Diterima", "Barang Diterima / Project Selesai"]);
const SERVICE_TYPES = new Set(["Project / Jasa", "Proyek / Jasa Kontrak"]);

export function isReceivedStatus(status: string | undefined | null): boolean {
  return !!status && RECEIVED_STATUSES.has(status);
}

export function inferAssetCategory(itemName: string): "Laptop & Komputer" | "Kendaraan Operasional" | "Fasilitas Gedung" | "Furniture" | "Perangkat Jaringan" {
  const n = itemName.toLowerCase();
  if (/(laptop|notebook|komputer|pc|monitor|printer|server)/.test(n)) return "Laptop & Komputer";
  if (/(mobil|motor|kendaraan|truk|van)/.test(n)) return "Kendaraan Operasional";
  if (/(router|switch|firewall|access point|jaringan|kabel)/.test(n)) return "Perangkat Jaringan";
  if (/(ac |genset|lift|pompa|cctv|gedung)/.test(n)) return "Fasilitas Gedung";
  return "Furniture";
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export async function generateAssetsFromReceivedOrder(params: {
  tenantId: string;
  orderId: string;
  vendorWarrantyProvider?: string | null;
  category?: ReturnType<typeof inferAssetCategory>;
  building?: string;
  room?: string;
}) {
  const [order] = await db.select().from(procurementOrders).where(and(eq(procurementOrders.id, params.orderId), eq(procurementOrders.tenantId, params.tenantId))).limit(1);
  if (!order || order.assetsGeneratedAt || !isReceivedStatus(order.status)) return [];
  if (order.type && SERVICE_TYPES.has(order.type)) return [];

  const receivedDate = order.receivedDate || new Date().toISOString().slice(0, 10);
  const unitPrice = order.quantity > 0 ? Math.round(order.estimatedCost / order.quantity) : order.estimatedCost;
  const category = params.category ?? inferAssetCategory(order.itemName);
  const rows = Array.from({ length: order.quantity }, (_, i) => {
    const code = `AST-${(order.poNumber || order.prNumber).replace(/[^A-Za-z0-9]+/g, "-")}-${String(i + 1).padStart(3, "0")}`;
    return {
      tenantId: params.tenantId,
      assetCode: code,
      name: order.quantity > 1 ? `${order.itemName} #${i + 1}` : order.itemName,
      category,
      building: params.building ?? "Gudang GA",
      room: params.room ?? "Area Penerimaan",
      purchaseDate: receivedDate,
      purchasePrice: unitPrice,
      condition: "Baik",
      usageStatus: "Tersedia",
      lastStockOpname: receivedDate,
      qrPayload: code,
      warrantyExpiryDate: order.warrantyMonths ? addMonths(receivedDate, order.warrantyMonths) : null,
      warrantyProvider: params.vendorWarrantyProvider ?? order.vendorName,
      procurementOrderId: order.id,
      vendorId: order.vendorId,
      poNumber: order.poNumber,
    };
  });
  const created = await db.insert(gaAssets).values(rows).returning();
  await db.update(procurementOrders).set({ assetsGeneratedAt: new Date(), receivedDate }).where(eq(procurementOrders.id, order.id));
  return created;
}

/** Single source of truth for an asset's usage status (was a dead column recomputed ad hoc in JSX). */
export function deriveUsageStatus(a: { assignedToEmployeeId: string | null; condition: string }): "Tersedia" | "Digunakan" | "Dalam Perbaikan" {
  if (a.condition === "Perlu Perbaikan" || a.condition === "Rusak") return "Dalam Perbaikan";
  return a.assignedToEmployeeId ? "Digunakan" : "Tersedia";
}
