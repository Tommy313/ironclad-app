// Ironclad Fleet Intelligence — Invoice Ingestion Pipeline
// Phase 4: GPT-4o Vision extraction (primary) + regex fallback
//
// Vision handles scanned PDFs, image-based invoices, handwritten notes,
// and complex dealer layouts that defeat naive text extraction.
// Falls back automatically to pattern matching if Vision is unavailable.

const RAG_URL = process.env.NEXT_PUBLIC_RAILWAY_URL;

// ─── Render PDF pages to JPEG base64 images ───────────────────────────────────
// Uses pdfjs canvas rendering. scale=2 gives 2x resolution for clearer text.
async function renderPDFToImages(pdf, scale = 2.0) {
  const images = [];
  const maxPages = Math.min(pdf.numPages, 4); // Vision supports up to 4 pages

  for (let i = 1; i <= maxPages; i++) {
    const page  = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width  = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    // JPEG at 92% quality — smaller payload than PNG, sufficient for Vision
    const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    images.push(base64);

    // Clean up
    canvas.width = 0;
    canvas.height = 0;
  }

  return images;
}


// ─── Main entry point ─────────────────────────────────────────────────────────
// Returns either:
//   { pageCount, fullText, pages, visionFields, lineItems, visionConfidence, model }  ← Vision succeeded
//   { pageCount, fullText, pages }                                                     ← Regex fallback
//
// IngestPanel checks for result.visionFields to know which path was taken.

export async function extractTextFromPDF(file, knownVendors = [], knownEquipment = []) {
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;


  // ── Path 1: GPT-4o Vision (primary) ─────────────────────────────────────────
  if (RAG_URL) {
    try {
      const pages = await renderPDFToImages(pdf);

      const resp = await fetch(`${RAG_URL}/extract/invoice`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pages, knownVendors })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.fields) {
          console.log(`[ocr] Vision extraction: ${data.confidence?.pct ?? '?'}% HIGH confidence`);
          return {
            pageCount:        pdf.numPages,
            fullText:         data.fullText || `GPT-4o Vision extracted ${Object.keys(data.fields).length} fields.`,
            pages:            [],
            visionFields:     data.fields,       // confidence-annotated, IngestPanel-ready
            lineItems:        data.lineItems || [],
            visionConfidence: data.confidence,
            model:            data.model,
          };
        }
      } else {
        const errText = await resp.text().catch(() => '');
        console.warn(`[ocr] Vision endpoint returned ${resp.status}: ${errText.slice(0, 120)}`);
      }
    } catch (err) {
      console.warn('[ocr] Vision extraction failed, falling back to regex:', err.message);
    }
  }


  // ── Path 2: pdfjs text extraction + regex (fallback) ─────────────────────────
  console.log('[ocr] Using regex extraction (Vision unavailable or failed)');
  const textPages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text    = content.items.map(item => item.str).join(" ");
    textPages.push(text);
  }

  return {
    pageCount: pdf.numPages,
    fullText:  textPages.join("\n"),
    pages:     textPages,
  };
}


// ─── Regex field extraction (fallback path) ───────────────────────────────────
// Every field returns: { value, confidence: "HIGH"|"MEDIUM"|"LOW"|null, source }
export function extractFields(text, knownVendors, knownEquipment) {
  const fields = {};
  const t = text.replace(/\s+/g, " ");

  // Vendor
  const vendorMatch = (knownVendors || []).find(v => t.toLowerCase().includes(v.toLowerCase()));
  if (vendorMatch) {
    fields.vendor = { value: vendorMatch, confidence: "HIGH", source: `Matched known vendor: "${vendorMatch}"` };
  } else {
    fields.vendor = { value: "", confidence: null, source: "No known vendor matched. Manual entry required." };
  }

  // Invoice number
  const invPatterns = [
    /(?:invoice|inv|work\s*order|order|wo)\s*[#:no.]*\s*([A-Z0-9][-A-Z0-9]{3,20})/i,
    /(?:invoice|inv)\s*[#:]\s*(\d{4,15})/i,
    /([A-Z]{2,4}[-]?\d{4,10})/
  ];
  for (const pat of invPatterns) {
    const m = t.match(pat);
    if (m) {
      fields.invoiceNumber = { value: m[1].trim(), confidence: "HIGH", source: `Pattern: "${m[0].trim().substring(0, 50)}"` };
      break;
    }
  }
  if (!fields.invoiceNumber) {
    fields.invoiceNumber = { value: "", confidence: null, source: "No invoice number pattern found." };
  }

  // Dates
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
  const dates = [];
  let dm;
  while ((dm = datePattern.exec(t)) !== null) dates.push(dm[1]);
  fields.date = dates.length > 0
    ? { value: dates[0], confidence: "MEDIUM", source: `Found ${dates.length} date(s): ${dates.slice(0, 3).join(", ")}` }
    : { value: "", confidence: null, source: "No date pattern found." };
  fields.workDates = dates.length > 1
    ? { value: dates.slice(0, 5).join(", "), confidence: "MEDIUM", source: `${dates.length} dates extracted` }
    : { value: dates[0] || "", confidence: "LOW", source: "Single date or none found" };

  // Equipment
  const eqMatch = (knownEquipment || []).find(e => {
    const search = (e.make + " " + e.model).toLowerCase();
    return t.toLowerCase().includes(search);
  });
  if (eqMatch) {
    fields.equipment  = { value: eqMatch.make + " " + eqMatch.model, confidence: "HIGH", source: `Matched: "${eqMatch.make} ${eqMatch.model}"` };
    fields.equipmentId = { value: eqMatch.id, confidence: "HIGH", source: "Library match" };
  } else {
    fields.equipment  = { value: "", confidence: null, source: "No known equipment matched. Manual entry required." };
    fields.equipmentId = { value: "", confidence: null, source: "" };
  }

  // Serial number
  const snPatterns = [
    /(?:s\/?n|serial)\s*[#:]*\s*([A-Z0-9][-A-Z0-9]{4,25})/i,
    /(?:unit)\s*[#:]*\s*([A-Z0-9][-A-Z0-9]{3,15})/i
  ];
  for (const pat of snPatterns) {
    const m = t.match(pat);
    if (m) {
      fields.sn = { value: m[1].trim(), confidence: "MEDIUM", source: `Pattern: "${m[0].trim().substring(0, 40)}"` };
      break;
    }
  }
  if (!fields.sn) fields.sn = { value: "", confidence: null, source: "No S/N pattern found." };

  // Dollar amounts
  const dollarPattern = /\$\s?([\d,]+\.?\d{0,2})/g;
  const amounts = [];
  let am;
  while ((am = dollarPattern.exec(t)) !== null) {
    amounts.push(parseFloat(am[1].replace(/,/g, "")));
  }
  amounts.sort((a, b) => b - a);

  fields.total = amounts.length > 0
    ? { value: amounts[0], confidence: amounts.length >= 3 ? "MEDIUM" : "LOW", source: `Largest of ${amounts.length} amounts: $${amounts[0].toLocaleString()}` }
    : { value: 0, confidence: null, source: "No dollar amounts found." };

  const laborMatch = t.match(/labor[:\s]*\$?\s?([\d,]+\.?\d{0,2})/i);
  fields.labor = laborMatch
    ? { value: parseFloat(laborMatch[1].replace(/,/g, "")), confidence: "HIGH", source: `Labeled: "${laborMatch[0].trim().substring(0, 40)}"` }
    : { value: 0, confidence: null, source: "No labeled labor amount found." };

  const partsMatch = t.match(/parts?[:\s]*\$?\s?([\d,]+\.?\d{0,2})/i);
  fields.parts = partsMatch
    ? { value: parseFloat(partsMatch[1].replace(/,/g, "")), confidence: "HIGH", source: `Labeled: "${partsMatch[0].trim().substring(0, 40)}"` }
    : { value: 0, confidence: null, source: "No labeled parts amount found." };

  // Meter
  const meterMatch = t.match(/(?:meter|hour\s*meter|odometer)[:\s]*(\d[\d,]*\.?\d*)/i);
  fields.meter = meterMatch
    ? { value: parseFloat(meterMatch[1].replace(/,/g, "")), confidence: "MEDIUM", source: `Pattern: "${meterMatch[0].trim()}"` }
    : { value: 0, confidence: null, source: "No meter reading found." };

  // Hours & rate (for math validation)
  const hrsPatterns = [/(\d+\.?\d*)\s*(?:hrs?|hours)/i, /(?:hours?|hrs?)[:\s]*(\d+\.?\d*)/i];
  for (const pat of hrsPatterns) {
    const m = t.match(pat);
    if (m) { fields.hours = { value: parseFloat(m[1]), confidence: "MEDIUM", source: `Pattern: "${m[0].trim()}"` }; break; }
  }
  if (!fields.hours) fields.hours = { value: 0, confidence: null, source: "No hours pattern found." };

  const ratePatterns = [/\$\s?(\d+\.?\d{0,2})\s*(?:\/\s*hr|per\s*hour|\/\s*hour)/i, /(?:rate|hourly)[:\s]*\$?\s?(\d+\.?\d{0,2})/i];
  for (const pat of ratePatterns) {
    const m = t.match(pat);
    if (m) { fields.rate = { value: parseFloat(m[1]), confidence: "MEDIUM", source: `Pattern: "${m[0].trim()}"` }; break; }
  }
  if (!fields.rate) fields.rate = { value: 0, confidence: null, source: "No rate pattern found." };

  return fields;
}


// ─── Validation checks ────────────────────────────────────────────────────────
export function validateExtraction(fields) {
  const checks = [];

  const labor = fields.labor?.value || 0;
  const parts = fields.parts?.value || 0;
  const total = fields.total?.value || 0;
  if (total > 0 && (labor > 0 || parts > 0)) {
    const sum  = labor + parts;
    const diff = Math.abs(total - sum);
    checks.push({
      check:  "Math Validation",
      result: diff < total * 0.15 ? "PASS" : "FLAG",
      detail: diff < total * 0.15
        ? `Labor ($${labor}) + Parts ($${parts}) = $${sum}. Total: $${total}. Difference ($${diff.toFixed(0)}) likely misc/fees.`
        : `Labor ($${labor}) + Parts ($${parts}) = $${sum} vs Total $${total}. Gap of $${diff.toFixed(0)} — verify misc charges.`
    });
  }

  const rate  = fields.rate?.value  || 0;
  const hours = fields.hours?.value || 0;
  if (rate > 0 && hours > 0 && labor > 0) {
    const implied = rate * hours;
    const diff    = Math.abs(implied - labor);
    checks.push({
      check:  "Rate × Hours Validation",
      result: diff < 5 ? "PASS" : "FLAG",
      detail: `$${rate}/hr × ${hours}h = $${implied.toFixed(2)} vs stated labor $${labor}. ${diff < 5 ? "Match." : `Delta: $${diff.toFixed(2)}.`}`
    });
  }

  const required = ["vendor", "invoiceNumber", "date", "total"];
  const missing  = required.filter(f => !fields[f]?.value);
  checks.push({
    check:  "Completeness",
    result: missing.length === 0 ? "PASS" : "FLAG",
    detail: missing.length === 0
      ? `All required fields extracted: ${required.join(", ")}.`
      : `Missing: ${missing.join(", ")}. Manual entry required.`
  });

  const allConf = Object.values(fields).map(f => f.confidence).filter(Boolean);
  const highPct = allConf.filter(c => c === "HIGH").length / Math.max(allConf.length, 1) * 100;
  checks.push({
    check:  "Overall Confidence",
    result: highPct >= 60 ? "PASS" : highPct >= 30 ? "NOTE" : "FLAG",
    detail: `${highPct.toFixed(0)}% of extracted fields at HIGH confidence. ${allConf.length} fields with data.`
  });

  return checks;
}
