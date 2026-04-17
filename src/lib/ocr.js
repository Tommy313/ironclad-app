// Ironclad Fleet Intelligence — Invoice Ingestion Pipeline
// Phase 3: PDF text extraction + rule-based field parsing
// No AI inference. Pattern matching only. Blank > wrong.

export async function extractTextFromPDF(file) {
  const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(" ");
    pages.push(text);
  }

  return { pageCount: pdf.numPages, fullText: pages.join("\n"), pages };
}

// Field extraction — pattern matching against raw text
// Every field returns: { value, confidence: "HIGH"|"MEDIUM"|"LOW"|null, source: "raw snippet" }
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

  // Invoice number — patterns: "Invoice #", "Invoice No", "Work Order", "Order #"
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

  // Dates — look for date patterns
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

  // Equipment — match against known library
  const eqMatch = (knownEquipment || []).find(e => {
    const search = (e.make + " " + e.model).toLowerCase();
    return t.toLowerCase().includes(search);
  });
  if (eqMatch) {
    fields.equipment = { value: eqMatch.make + " " + eqMatch.model, confidence: "HIGH", source: `Matched: "${eqMatch.make} ${eqMatch.model}"` };
    fields.equipmentId = { value: eqMatch.id, confidence: "HIGH", source: "Library match" };
  } else {
    fields.equipment = { value: "", confidence: null, source: "No known equipment matched. Manual entry required." };
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

  // Dollar amounts — find all currency values
  const dollarPattern = /\$\s?([\d,]+\.?\d{0,2})/g;
  const amounts = [];
  let am;
  while ((am = dollarPattern.exec(t)) !== null) {
    amounts.push(parseFloat(am[1].replace(/,/g, "")));
  }
  amounts.sort((a, b) => b - a); // largest first

  // Total — usually the largest amount
  if (amounts.length > 0) {
    fields.total = { value: amounts[0], confidence: amounts.length >= 3 ? "MEDIUM" : "LOW", source: `Largest of ${amounts.length} amounts found: $${amounts[0].toLocaleString()}` };
  } else {
    fields.total = { value: 0, confidence: null, source: "No dollar amounts found." };
  }

  // Labor — look for "labor" near a dollar amount
  const laborPattern = /labor[:\s]*\$?\s?([\d,]+\.?\d{0,2})/i;
  const laborMatch = t.match(laborPattern);
  if (laborMatch) {
    fields.labor = { value: parseFloat(laborMatch[1].replace(/,/g, "")), confidence: "HIGH", source: `Labeled: "${laborMatch[0].trim().substring(0, 40)}"` };
  } else {
    fields.labor = { value: 0, confidence: null, source: "No labeled labor amount found." };
  }

  // Parts — look for "parts" near a dollar amount
  const partsPattern = /parts?[:\s]*\$?\s?([\d,]+\.?\d{0,2})/i;
  const partsMatch = t.match(partsPattern);
  if (partsMatch) {
    fields.parts = { value: parseFloat(partsMatch[1].replace(/,/g, "")), confidence: "HIGH", source: `Labeled: "${partsMatch[0].trim().substring(0, 40)}"` };
  } else {
    fields.parts = { value: 0, confidence: null, source: "No labeled parts amount found." };
  }

  // Hours
  const hrsPatterns = [
    /(\d+\.?\d*)\s*(?:hrs?|hours)/i,
    /(?:hours?|hrs?)[:\s]*(\d+\.?\d*)/i
  ];
  for (const pat of hrsPatterns) {
    const m = t.match(pat);
    if (m) {
      fields.hours = { value: parseFloat(m[1]), confidence: "MEDIUM", source: `Pattern: "${m[0].trim()}"` };
      break;
    }
  }
  if (!fields.hours) fields.hours = { value: 0, confidence: null, source: "No hours pattern found." };

  // Rate
  const ratePatterns = [
    /\$\s?(\d+\.?\d{0,2})\s*(?:\/\s*hr|per\s*hour|\/\s*hour)/i,
    /(?:rate|hourly)[:\s]*\$?\s?(\d+\.?\d{0,2})/i
  ];
  for (const pat of ratePatterns) {
    const m = t.match(pat);
    if (m) {
      fields.rate = { value: parseFloat(m[1]), confidence: "MEDIUM", source: `Pattern: "${m[0].trim()}"` };
      break;
    }
  }
  if (!fields.rate) fields.rate = { value: 0, confidence: null, source: "No rate pattern found." };

  // Meter reading
  const meterPattern = /(?:meter|hour\s*meter|odometer)[:\s]*(\d[\d,]*\.?\d*)/i;
  const meterMatch = t.match(meterPattern);
  if (meterMatch) {
    fields.meter = { value: parseFloat(meterMatch[1].replace(/,/g, "")), confidence: "MEDIUM", source: `Pattern: "${meterMatch[0].trim()}"` };
  } else {
    fields.meter = { value: 0, confidence: null, source: "No meter reading found." };
  }

  return fields;
}

// Validation checks on extracted fields (Stage 3 from architecture)
export function validateExtraction(fields) {
  const checks = [];

  // Math check: if labor + parts stated, do they approach total?
  const labor = fields.labor?.value || 0;
  const parts = fields.parts?.value || 0;
  const total = fields.total?.value || 0;
  if (total > 0 && (labor > 0 || parts > 0)) {
    const sum = labor + parts;
    const diff = Math.abs(total - sum);
    checks.push({
      check: "Math Validation",
      result: diff < total * 0.15 ? "PASS" : "FLAG",
      detail: diff < total * 0.15
        ? `Labor ($${labor}) + Parts ($${parts}) = $${sum}. Total: $${total}. Difference ($${diff.toFixed(0)}) likely misc/fees.`
        : `Labor ($${labor}) + Parts ($${parts}) = $${sum} vs Total $${total}. Gap of $${diff.toFixed(0)} — verify misc charges.`
    });
  }

  // Rate x Hours = Labor check
  const rate = fields.rate?.value || 0;
  const hours = fields.hours?.value || 0;
  if (rate > 0 && hours > 0 && labor > 0) {
    const implied = rate * hours;
    const diff = Math.abs(implied - labor);
    checks.push({
      check: "Rate × Hours Validation",
      result: diff < 5 ? "PASS" : "FLAG",
      detail: `$${rate}/hr × ${hours}h = $${implied.toFixed(2)} vs stated labor $${labor}. ${diff < 5 ? "Match." : `Delta: $${diff.toFixed(2)}.`}`
    });
  }

  // Completeness
  const required = ["vendor", "invoiceNumber", "date", "total"];
  const missing = required.filter(f => !fields[f]?.value);
  checks.push({
    check: "Completeness",
    result: missing.length === 0 ? "PASS" : "FLAG",
    detail: missing.length === 0
      ? `All required fields extracted: ${required.join(", ")}.`
      : `Missing: ${missing.join(", ")}. Manual entry required.`
  });

  // Overall confidence
  const allConf = Object.values(fields).map(f => f.confidence).filter(Boolean);
  const highPct = allConf.filter(c => c === "HIGH").length / Math.max(allConf.length, 1) * 100;
  checks.push({
    check: "Overall Confidence",
    result: highPct >= 60 ? "PASS" : highPct >= 30 ? "NOTE" : "FLAG",
    detail: `${highPct.toFixed(0)}% of extracted fields at HIGH confidence. ${allConf.length} fields with data.`
  });

  return checks;
}
