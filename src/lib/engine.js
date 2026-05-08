// ===== STANDARD CATEGORY TAXONOMY =====
export const CATEGORIES = [
  "Engine — Mechanical","Engine — Emission","Hydraulic","Electrical",
  "Cab / Structure","Undercarriage / Tires","Drive / Gearbox",
  "Attachment","Preventive Maintenance","Brake / Steering"
];

export const REGIONS = {
  "SE-MI":"Southeast Michigan","IL":"Illinois / Chicagoland",
  "IN":"Indiana","OH":"Ohio","other":"Other / Unknown"
};

export const AGREEMENTS = {
  alta: {
    vendor:"Alta Equipment",customer:"Ferrous Process & Trading",bp:"BP0015900",status:"ACTIVE",
    term:{start:"2025-07-01",end:"2028-06-30",months:36},
    techCert:"OE324",union:"Operating Engineers Local 324",guarantee:40,
    partsDiscount:{fy26:0.05},pmRate:{fy25:165,escalation:0.035},
    scheduleHours:"7AM–5PM Mon–Fri",otRules:"After 8hrs/day or Sat. Double-time Sun/holidays.",
    travelNote:"1-hr min daily at labor rate, counts toward 40-hr guarantee.",
    truckNote:"Blended into hourly rate. NO separate truck charge.",
    invoiceNote:"Weekly bulk with tech logs attached.",
    nonSolicitation:"36 months post-termination",payTerms:"Net 60",
    signers:{customer:"Sarah Hoogterp, Purchasing Mgr",vendor:"Cody Kabch, Regional Service Mgr"},
    rates:{
      fy25:{period:"7/1/25–6/30/26",standard:140,overtime:232,travel:140,pm:165},
      fy26:{period:"7/1/26–6/30/27",standard:154,overtime:240,travel:154,pm:170.78},
      fy27:{period:"7/1/27–6/30/28",standard:169.5,overtime:249,travel:169.5,pm:176.75}
    }
  },
  micat: {
    vendor:"Michigan CAT (MacAllister Machinery)",customer:"Ferrous Processing & Trading",status:"EXPIRED",
    term:{start:"2022-03-01",end:"2025-12-31",months:46},
    techCert:"CAT Certified",guarantee:40,
    tuc:"15% on all travel + field labor hours",
    otRules:"$195/hr, 4-hour minimum. Holidays & emergency only.",
    travelNote:"Travel at same hourly rate as labor ($100–$130/hr).",
    truckNote:"15% TUC on all billed hours (separate charge).",
    invoiceNote:"No more than weekly. Originally Net 15, amended to Net 60.",
    nonSolicitation:"12 months post-termination",payTerms:"Net 60 (amended from 15)",
    signers:{customer:"(unsigned on customer side)",vendor:"Conrad Pinsky (Purchasing Mgr)"},
    shopRate:{list:136,negotiated:125},addlFieldRate:{list:159,negotiated:125},
    rates:{
      y2022:{period:"2022",standard:100,overtime:195,travel:100,tuc:15},
      y2023:{period:"2023",standard:110,overtime:195,travel:110,tuc:15},
      y2024:{period:"2024",standard:120,overtime:195,travel:120,tuc:15},
      y2025:{period:"2025",standard:130,overtime:195,travel:130,tuc:15}
    }
  },
  ais: {
    vendor:"AIS Construction Equipment",customer:"Ferrous Processing",status:"QUOTED",
    term:{start:"TBD",end:"TBD",months:36},model:"NVX6030",
    techCert:"AIS Fleet Solutions",guarantee:0,
    flatRate:8.30,totalCost:24893.49,totalHours:3000,
    pmSchedule:"Ini 50hr: $2,191 | 500/1500/2500hr: $2,482 | 1000/3000hr: $4,152 | 2000hr: $6,972",
    travelNote:"All travel, labor, parts, oils, normal top-off fluids included in flat rate.",
    invoiceNote:"Flat rate per hour — predictable accounting.",
    payTerms:"TBD",nonSolicitation:"N/A",validUntil:"2026-02-29",
    contact:"517-449-8612 | Fleetsolutions@aisequip.com",
    notes:"No additional discounts. Customer responsible for daily/weekly maint per mfr guidelines."
  }
};

export const RESIDENT_TECH = "Jeff H";
export const STORAGE_KEY = "ironclad-invoices-v7";
export const TXN_STORAGE_KEY = "ironclad-transactions-v1";

// ========== SEED TRANSACTIONS ==========
export const SEED_TRANSACTIONS = [
  {
    id: "TXN-001",
    date: "2026-02-11",
    type: "sell",
    equipment: "CAT C-15 Engine",
    quantity: 2,
    unitPrice: 3500,
    totalPrice: 7000,
    marketValue: 5000,
    marketTotal: 10000,
    buyer: "Buyer A (honored commitment)",
    seller: "Ironclad / Tommy",
    source: "Direct sale",
    category: "Powertrain",
    notes: "Sold 2x C-15 engines at $3,500/ea. Second buyer offered $5K/ea ($10K total) but honored word to first buyer. Relationship capital > $3K spread.",
    spread: -3000,
    spreadPct: -30,
    tags: ["RELATIONSHIP-FIRST", "BELOW-MARKET"]
  }
];

export const SEED_INVOICES = [
  { id:"SWA877183",date:"2025-11-18",workDates:"6/18, 6/27/25",equipment:"Sennebogen 840 M E",sn:"840.0.2362",unitId:"EQ0273588",meter:5569,site:"500 Collier Rd, Pontiac",region:"SE-MI",category:"Electrical",description:"Wiper inop & broken door handle. Visit 1: Jeff H diagnosed as bad wiper motor (WRONG). Visit 2: Jereme Chie found blown fuse + bad relay.",techs:["Jeff H","Jereme Chie"],visits:2,parts:319.08,labor:2156.25,misc:40.75,partsDetail:[{desc:"Rope Winch",qty:1,price:233.14},{desc:"Switch",qty:1,price:42.60},{desc:"Timer Relay",qty:1,price:43.34},{desc:"Shipping",qty:1,price:40.75}],flags:["MISDIAGNOSIS","MULTI-RATE"],flagNotes:"Misdiagnosis Visit 1. Work dates 6/18-27 predate 7/1 contract — may be prior rates.",expectedHoursLow:4,expectedHoursHigh:7,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA988153",date:"2025-11-18",workDates:"11/10/25",equipment:"Sennebogen 875 E",sn:"875.7.1119",unitId:"EQ0341106",meter:5490.8,site:"6464 Strong St, Detroit",region:"SE-MI",category:"Drive / Gearbox",description:"Drive gear oil leak. Missing gearbox fill cap. Parts run to Detroit base.",techs:["Jeff H"],visits:1,parts:58.29,labor:1840.00,misc:0,partsDetail:[{desc:"Vent Filter",qty:1,price:58.29}],flags:["LABOR-HEAVY"],flagNotes:"13.1 hrs at $140 for a cap install. 1hr travel = 12.1hr wrench. Excessive.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA986658",date:"2025-11-18",workDates:"10/7/25",equipment:"Sennebogen 840 M",sn:"840.0.2242",unitId:"EQ0138502",meter:10890.95,site:"3100 Lonyo St, Detroit",region:"SE-MI",category:"Hydraulic",description:"Hyd leak from crossover hose at valve block. Parts run to Ritter.",techs:["Jeff H"],visits:1,parts:204.22,labor:1002.00,misc:0,partsDetail:[{desc:"Crimp Hose Assy",qty:1,price:204.22}],flags:[],flagNotes:"Reasonable — 7.2 hrs incl travel + parts run.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA962556",date:"2025-11-18",workDates:"10/7, 10/9/25",equipment:"Volvo L260H",sn:"VCEL260HH00001370",unitId:"EQ0302293",meter:4228,site:"9100 John Kronk, Detroit",region:"SE-MI",category:"Electrical",description:"Tilt pressure sensor code. 2-visit diagnostic + replacement.",techs:["Jeff H"],visits:2,parts:340.72,labor:2100.00,misc:0,partsDetail:[{desc:"Pressure Sensor",qty:1,price:340.72}],flags:["REPEAT-MACHINE"],flagNotes:"15.0 hrs across 2 visits. Same machine as SWA932625 — $9,524 combined.",expectedHoursLow:6,expectedHoursHigh:10,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA982538",date:"2025-11-18",workDates:"11/3/25",equipment:"Sennebogen 840 M HD",sn:"840.0.2236",unitId:"EQ0128560",meter:11867,site:"6464 Strong St, Detroit",region:"SE-MI",category:"Electrical",description:"Wiper inop. Blown fuse. Replaced from truck stock.",techs:["Jeff H"],visits:1,parts:0,labor:488.00,misc:0,partsDetail:[],flags:["EXCESSIVE-LABOR"],flagNotes:"3.5 hrs for a fuse. 1hr travel = 2.5hr wrench for a fuse swap.",expectedHoursLow:1,expectedHoursHigh:2,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA972099",date:"2025-11-18",workDates:"10/20, 10/22/25",equipment:"Sennebogen 840 M",sn:"840.0.2244",unitId:"EQ0138506",meter:10745,site:"3651 Wyoming Ave, Dearborn",region:"SE-MI",category:"Electrical",description:"Limit switch override. Visit 1: Jereme cleaned sensor, temp wire repair. Visit 2: Jeff installed new sensor.",techs:["Jereme Chie","Jeff H"],visits:2,parts:240.62,labor:2540.00,misc:0,partsDetail:[{desc:"Sensor",qty:1,price:240.62}],flags:["HIGH-LABOR","MULTI-RATE"],flagNotes:"Mixed techs — cannot split. $2,540 high for sensor work.",expectedHoursLow:5,expectedHoursHigh:8,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA984255",date:"2025-11-18",workDates:"11/5/25",equipment:"Sennebogen 840 M E",sn:"840.0.2369",unitId:"EQ0273581",meter:8094,site:"500 Collier Rd, Pontiac",region:"SE-MI",category:"Hydraulic",description:"Hyd leak. Cross-threaded plug. O'Reilly's run to retap hole.",techs:["Jeff H"],visits:1,parts:87.30,labor:582.00,misc:101.23,partsDetail:[{desc:"5W-30 Synthetic",qty:2,price:43.65},{desc:"SUBLET PART (no desc)",qty:1,price:101.23}],flags:["UNDOCUMENTED-CHARGE","WRONG-FLUID"],flagNotes:"Sublet $101.23 no description. 5W-30 motor oil on hydraulic job.",expectedHoursLow:2,expectedHoursHigh:3.5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA932625",date:"2025-11-18",workDates:"8/28, 9/2, 9/3, 9/4/25",equipment:"Volvo L260H",sn:"VCEL260HH00001370",unitId:"EQ0302293",meter:4228,site:"9100 John Kronk, Detroit",region:"SE-MI",category:"Hydraulic",description:"MCV hyd leak. 4 visits/8 days. Root cause: LOOSE PLUG. Sealant applied. 4th visit verification.",techs:["Jeff H"],visits:4,parts:631.18,labor:6452.00,misc:0,partsDetail:[{desc:"Check Valve",qty:1,price:631.18}],flags:["HIGHEST-COST","EXCESSIVE-VISITS","PHANTOM-PART","REPEAT-MACHINE"],flagNotes:"46.1 hrs at $140. 4 travel days = $560. ~42 hrs wrench for a loose plug. Check valve listed but notes say plug+sealant.",expectedHoursLow:10,expectedHoursHigh:18,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWA957051",date:"2025-11-18",workDates:"9/30/25",equipment:"Sennebogen 835 M",sn:"835.0.2090",unitId:"EQ0051182",meter:18766,site:"G5107 N Dort Hwy, Flint",region:"SE-MI",category:"Engine — Mechanical",description:"Coolant leak — hose caught in hood. O'Reilly's parts. Fabricated hood hole.",techs:["Evan W"],visits:1,parts:45.68,labor:420.00,misc:48.90,partsDetail:[{desc:"Heater Hoses",qty:16,price:2.86},{desc:"Svc Supplies",qty:1,price:40.95},{desc:"Fuel Surcharge",qty:1,price:7.95}],flags:["MISC-FEE-CREEP","END-OF-LIFE","NON-AGREEMENT"],flagNotes:"Evan W — NOT agreement tech. Rate unknown. $48.90 misc fees. 18,766 hrs.",expectedHoursLow:2,expectedHoursHigh:3,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"SWA977127",date:"2025-11-18",workDates:"11/3/25",equipment:"Sennebogen 840 M E",sn:"840.0.2345",unitId:"EQ0261924",meter:5156,site:"3100 Lonyo St, Detroit",region:"SE-MI",category:"Fuel System",description:"Missing fuel cap. Parts courier run to Detroit.",techs:["Jeff H"],visits:1,parts:23.17,labor:652.00,misc:45.44,partsDetail:[{desc:"Filler Cap",qty:1,price:23.17},{desc:"Shipping",qty:1,price:45.44}],flags:["COURIER-AT-MECH-RATE"],flagNotes:"4.66 hrs at $140 to deliver $23 fuel cap. Mechanic-rate courier run.",expectedHoursLow:1,expectedHoursHigh:2,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWB028980",date:"2026-02-10",workDates:"1/13/26",equipment:"Sennebogen 850 M E",sn:"850.0.3178",unitId:"EQ0341145",meter:6240,site:"500 Collier Rd, Pontiac",region:"SE-MI",category:"Engine — Emission",description:"DEF tank collapsed. Drained DEF, disconnected coolant + DEF lines, removed damaged tank. Installed 840 tank (better vent design, less problematic) on 850 forward. Reconnected all lines, refilled DEF, verified on SenCon.",techs:["Jeff H"],visits:1,parts:5949.60,labor:1260.00,misc:208.79,partsDetail:[{desc:"DEF Container",qty:1,price:5949.60},{desc:"Shipping/Handling",qty:1,price:208.79}],flags:["EMISSION-PATTERN"],flagNotes:"9.0 hrs @ $140 — reasonable for DEF tank swap. Same machine as SWB043219 (DPF regen) — EQ0341145 has 2 emission system failures at 6,240 hrs. 840 tank retrofit = smart cross-model fix.",expectedHoursLow:6,expectedHoursHigh:10,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"RECO-42811",date:"2026-02-04",workDates:"2/3/26",equipment:"Hitachi ZW370",sn:"NHJ70J97J25221",unitId:"92205",meter:0,site:"3100 Lonyo St, Detroit",region:"SE-MI",category:"Engine — Emission",description:"DEF unit (urea) replacement. Separated field/travel/mileage.",techs:["Unknown"],visits:1,parts:8659.54,labor:396.80,misc:809.60,partsDetail:[{desc:"UNIT;UREA (YA00086512)",qty:1,price:8659.54}],flags:["GOOD-TRANSPARENCY"],flagNotes:"RECO separates field ($396.80), travel ($396.80), mileage (86mi×$4.80=$412.80). Model transparency.",expectedHoursLow:2,expectedHoursHigh:4,vendorType:"dealer",vendor:"RECO Equipment",agreement:"none",travelLabor:396.80,mileage:412.80,mileageRate:4.80,mileageMiles:86 },
  { id:"ALT-52603",date:"2024-11-22",workDates:"11/22/24",equipment:"CAT 330BL",sn:"06DR03742",unitId:"",meter:0,site:"3100 Lonyo St, Detroit",region:"IL",category:"Engine — Mechanical",description:"Install 1250W 110V block heater in oil cooler bonnet (replaces 7X7731 plug). Ref TICK:8970. Altorfer CAT field service from Chicago Heights IL. 3hr field labor + 1hr travel + 30mi mileage.",techs:["Unknown"],visits:1,parts:523.17,labor:956.00,misc:173.60,partsDetail:[{desc:"CAT ELC 5G (2388649)",qty:4,price:85.73},{desc:"CAP A (6N1604)",qty:1,price:5.74},{desc:"ELEMENT A (9G6657)",qty:1,price:124.17},{desc:"CORD A (9N5253)",qty:1,price:50.34},{desc:"HD6 Misc Charge",qty:1,price:23.90}],flags:["GOOD-TRANSPARENCY"],flagNotes:"Altorfer separates field labor ($717), travel labor ($239), mileage (30mi×$4.99=$149.70). $239/hr CAT dealer rate — 71% above Alta $140. CAT 330BL at Lonyo/Detroit.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Altorfer CAT",agreement:"none",travelLabor:239.00,mileage:149.70,mileageRate:4.99,mileageMiles:30,techRate:239 },
  { id:"SWB043219",date:"2026-02-10",workDates:"2/2, 2/3/26",equipment:"Sennebogen 850 M E",sn:"850.0.3178",unitId:"EQ0341145",meter:6240,site:"500 Collier Rd, Pontiac",region:"SE-MI",category:"Engine — Emission",description:"DPF regen too frequent (code 3375). Visit 1: diagnosed via SenCon + Cummins InSite, removed DPF+DOC with crane, sent to Cummins for cleaning. Visit 2: reinstalled cleaned filter with new clamps, seals, DPF pressure sensor, gasket, crossover tube. Regen passed.",techs:["Jeff H"],visits:2,parts:388.52,labor:1606.00,misc:45.36,partsDetail:[{desc:"Seal",qty:2,price:65.76},{desc:"Seal",qty:1,price:22.21},{desc:"Sensor DPF Pressure",qty:1,price:234.79},{desc:"Shipping/Handling",qty:1,price:45.36}],flags:["EMISSION-PATTERN","REPEAT-MACHINE"],flagNotes:"11.5 hrs across 2 visits — reasonable given crane setup x2 + Cummins sublet. SAME MACHINE as SWB028980 (DEF tank collapse) — EQ0341145 now has 2 emission system failures. 4th emission-related invoice in dataset.",expectedHoursLow:8,expectedHoursHigh:12,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWB037908",date:"2026-02-03",workDates:"1/28/26",equipment:"Sennebogen 840 M E",sn:"840.0.2369",unitId:"EQ0273581",meter:8094,site:"500 Collier Rd, Pontiac",region:"SE-MI",category:"Engine — Mechanical",description:"Coolant leak from radiator area. Found 4 loose clamps on radiator. Tightened all clamps, topped off coolant, operated machine to verify, reinstalled panels.",techs:["Jeff H"],visits:1,parts:0,labor:1024.00,misc:0,partsDetail:[],flags:["EXCESSIVE-LABOR","REPEAT-MACHINE"],flagNotes:"7.3 hrs at $140 to tighten 4 loose radiator clamps. Zero parts. 2nd invoice on EQ0273581 (SWA984255 $770). Combined: $1,794.",expectedHoursLow:2,expectedHoursHigh:4,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SWB043732",date:"2026-02-16",workDates:"1/26, 2/11/26",equipment:"Sennebogen 840 M E",sn:"840.0.2369",unitId:"EQ0273581",meter:9006,site:"500 Collier Rd, Pontiac",region:"SE-MI",category:"Engine — Mechanical",description:"Block heater install. Visit 1 (1/26): parts lookup/order — machine had full emissions failure, deferred. Visit 2 (2/11): removed anti-freeze plug, installed block heater + cord, routed cord for operator, checked coolant.",techs:["Jeff H"],visits:2,parts:249.91,labor:1048.00,misc:29.16,partsDetail:[{desc:"Cable",qty:1,price:143.47},{desc:"Heater Engine",qty:1,price:56.12},{desc:"ES Comp Coolant 5 Gal",qty:1,price:50.32},{desc:"Shipping/Handling",qty:1,price:29.16}],flags:["EXCESSIVE-LABOR","REPEAT-MACHINE"],flagNotes:"7.5 hrs across 2 visits for block heater. Visit 1 was just ordering parts. 3rd invoice on EQ0273581 — $3,121 combined (SWA984255 + SWB037908 + this). Sennebogen 840 at Collier Rd/Pontiac.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"SQT206663",date:"2026-02-16",workDates:"Estimate",equipment:"Volvo EW180B",sn:"8751597",unitId:"EQ0250493",meter:0,site:"Alta Burton, G3283 S Dort Hwy",region:"SE-MI",category:"Preventive Maintenance",description:"500-hour PM service estimate. Oil change, filters (oil/water/fuel/air/cab), lubricant, fuel surcharge. Fine print: 18% environmental charge on labor (up to $350 max) NOT included in estimate = potential $133.65 hidden cost.",techs:["Shop"],visits:0,parts:515.50,labor:742.50,misc:7.95,partsDetail:[{desc:"Multigrade SYN BLE",qty:7,price:18.03},{desc:"Oil Filter",qty:1,price:26.91},{desc:"Filter Water Separator",qty:1,price:81.38},{desc:"Fuel Filter",qty:1,price:29.04},{desc:"Air Filter (primary)",qty:1,price:47.27},{desc:"Air Filter (secondary)",qty:1,price:50.03},{desc:"Filter Cab Ventilation",qty:1,price:59.79},{desc:"Filter Cab",qty:1,price:73.01},{desc:"Single Lubricant A",qty:1,price:21.85},{desc:"Fuel Surcharge",qty:1,price:7.95}],flags:["ESTIMATE","PM-SERVICE","HIDDEN-FEE"],flagNotes:"ESTIMATE only — not yet invoiced. Burton MI location (BP0014791). 18% environmental charge on labor in fine print = up to $133.65 extra. True estimate: $1,297 + $134 = ~$1,430.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"SAR-QS02195",date:"2025-01-06",workDates:"Quote",equipment:"Link-Belt 360X2",sn:"",unitId:"",meter:0,site:"2710 State St, Chicago Heights IL",region:"IL",category:"Cab / Structure",description:"Replace blower motor on link belt in Chicago Heights. Quote only — will bill accordingly if under. Doesn't include freight on parts. Didn't diagnose, may be additional charges.",techs:["Unknown"],visits:0,parts:409.65,labor:650.00,misc:32.50,partsDetail:[{desc:"Blower Motor",qty:1,price:409.65}],flags:["ESTIMATE","CROSS-VENDOR-COMP"],flagNotes:"Sargents Equipment (Gilberts/Chicago Heights IL) — NEW vendor #4. $650 labor, no hourly rate visible. Shop supplies $32.50. Quote disclaims: may not be the problem, additional charges possible.",expectedHoursLow:2,expectedHoursHigh:4,vendorType:"independent",vendor:"Sargents Equipment",agreement:"none" },
  { id:"RECO-42944",date:"2026-02-17",workDates:"Estimate",equipment:"Liebherr LH60M",sn:"1204-95194",unitId:"90190",meter:15560,site:"1950 Medbury Ave, Detroit",region:"SE-MI",category:"Preventive Maintenance",description:"PM estimate. 8hr field labor + 2hr travel. 84mi mileage @ $4.80. Filters: oil (x2), fuel fine (x2), main air insert, filter elements (x4), filter cassette, crankcase breather, fibre filters (x2), o-rings (x5). Misc supplies $198.40 + $50 environmental charge.",techs:["Unknown"],visits:0,parts:2337.76,labor:1984.00,misc:651.60,partsDetail:[{desc:"Oil Filter (10297295)",qty:2,price:86.77},{desc:"Fuel Fine Filter (12820742)",qty:2,price:81.98},{desc:"Main Air Filter Insert (571651908)",qty:1,price:239.22},{desc:"Filter Element (11081663)",qty:1,price:70.41},{desc:"Filter Element (11081571)",qty:1,price:158.93},{desc:"Filter Element (10220705)",qty:1,price:134.92},{desc:"Filter Element (12282868)",qty:1,price:45.68},{desc:"Filter Cassette (10816500)",qty:1,price:121.27},{desc:"Crankcase Breather (12886226)",qty:1,price:263.07},{desc:"Fibre Filter (12267987)",qty:2,price:378.44},{desc:"O-Ring (10218953)",qty:2,price:30.55},{desc:"O-Ring (10220707)",qty:1,price:44.65},{desc:"O-Ring (7264028)",qty:1,price:19.31},{desc:"O-Ring (7381593)",qty:2,price:42.41}],flags:["ESTIMATE","PM-SERVICE","GOOD-TRANSPARENCY"],flagNotes:"RECO estimate for Liebherr LH60M — excellent transparency. Field labor ($1,587.20 / 8hr = $198.40/hr), travel ($396.80 / 2hr), mileage (84mi × $4.80 = $403.20), environmental ($50), supplies ($198.40). 15,560 hrs — high-hour machine. Parts $2,338 is 47% of total — heavy filter load.",expectedHoursLow:8,expectedHoursHigh:10,vendorType:"dealer",vendor:"RECO Equipment",agreement:"none",travelLabor:396.80,mileage:403.20,mileageRate:4.80,mileageMiles:84,techRate:198.40 },
  { id:"CHR-000142",date:"2024-12-06",workDates:"Estimate",equipment:"Link-Belt 360X2",sn:"LBX350Q5NCMHR1273",unitId:"E000357",meter:0,site:"1333 Brewery Park Blvd, Detroit",region:"IL",category:"Engine — Mechanical",description:"Segment 1: Travel to/from job site — 56mi mileage @ $4.00 + labor $345. Segment 2: Block heater install (canister style, tapped into oil lines at convenient location). Heater $287.60 + sublet hose fabrication $100 + shop supplies $44.85.",techs:["Unknown"],visits:0,parts:511.60,labor:1840.00,misc:210.50,partsDetail:[{desc:"Mileage (56mi @ $4.00)",qty:56,price:4.00},{desc:"Heater (3305060)",qty:1,price:287.60},{desc:"Sublet - Hose Parts",qty:1,price:100.00},{desc:"Shop Supplies",qty:1,price:44.85}],flags:["ESTIMATE"],flagNotes:"Christofano Equipment (Chicago Ridge IL). Link-Belt 360X2 block heater estimate. $1,840 labor with no hourly rate visible. Mileage classified under parts on invoice (56mi × $4.00 = $224). Includes sublet hose fabrication ($100) and tax ($65.65).",expectedHoursLow:4,expectedHoursHigh:6,vendorType:"independent",vendor:"Christofano Equipment",agreement:"none",mileage:224.00,mileageRate:4.00,mileageMiles:56 },
  { id:"SWB030324",date:"2026-01-30",workDates:"1/15/26",equipment:"Volvo L180H",sn:"VCEL180HC00005914",unitId:"EQ0357071",meter:3550,site:"2665 State St, Chicago Heights IL",region:"IL",category:"Electrical",description:"WARRANTY: Back-up alarm not working. Failed internally (part 17468188). Tech Anthony G drove to jobsite, swapped alarm, returned old unit for possible warranty. Volvo MHK warranty complaint 7-166036-472947-1.",techs:["Anthony G"],visits:1,parts:131.08,labor:492.00,misc:0,partsDetail:[{desc:"Back-Up Warning Unit (17468188)",qty:1,price:131.08}],flags:["WARRANTY"],flagNotes:"Non-chargeable warranty repair. Alta Gary IN location (480 Blaine St). $0 customer cost — invoiced to Volvo. 3.5hr labor @ $140/hr implied. Chicago Heights IL site = Ferrous satellite operation.",expectedHoursLow:1,expectedHoursHigh:2,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"SQT206641",date:"2026-02-16",workDates:"Estimate",equipment:"Volvo L260H",sn:"VCEL260HH00001370",unitId:"EQ0302293",meter:0,site:"Alta Burton, G3283 S Dort Hwy",region:"SE-MI",category:"Preventive Maintenance",description:"1000-hour PM service estimate. Oil change (14qt SYN BLE), 8 oil filters, eng oil bypass, fuel filter primary, fuel filter 500hr, primary + safety filters, cab + second cab filters, filter kit auto L, lubricant, fuel surcharge. 18% environmental charge on labor NOT included.",techs:["Shop"],visits:0,parts:1089.19,labor:907.50,misc:7.95,partsDetail:[{desc:"Multigrade SYN BLE",qty:14,price:17.98},{desc:"Oil Filter (8)",qty:2,price:35.23},{desc:"Eng Oil Bypass Fil",qty:1,price:35.23},{desc:"Fuel Filter Prima",qty:1,price:100.47},{desc:"Fuel Filter 500hr",qty:1,price:79.07},{desc:"Primary Filter",qty:1,price:159.72},{desc:"Safety Filter",qty:1,price:104.15},{desc:"Cab Filter",qty:1,price:68.36},{desc:"Cab Filter Second",qty:1,price:126.22},{desc:"Filter Kit Auto L",qty:1,price:70.91},{desc:"Single Lubricant A",qty:1,price:22.84},{desc:"Fuel Surcharge",qty:1,price:7.95}],flags:["ESTIMATE","PM-SERVICE","HIDDEN-FEE"],flagNotes:"1000hr PM estimate — larger interval. $907.50 labor = 6.5hr @ $140. Hidden 18% environmental charge = ~$163 extra. True cost: ~$2,168. Burton MI shop.",expectedHoursLow:5,expectedHoursHigh:7,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"SQT206648",date:"2026-02-16",workDates:"Estimate",equipment:"Sennebogen 840 M E",sn:"840.0.2362",unitId:"EQ0273588",meter:0,site:"Alta Burton, G3283 S Dort Hwy",region:"SE-MI",category:"Preventive Maintenance",description:"500-hour PM service estimate. Multigrade SYN BLE (8qt), heating filters (x2), coolant filter WF, fuel filter FF630, filter element, filter element US, filter element AF, engine oil filter, lubricant, fuel surcharge. 18% environmental NOT included.",techs:["Shop"],visits:0,parts:704.22,labor:742.50,misc:7.95,partsDetail:[{desc:"Multigrade SYN BLE",qty:8,price:17.08},{desc:"Heating Filter",qty:1,price:11.41},{desc:"Heating Filter",qty:1,price:32.10},{desc:"Coolant Filter WF",qty:1,price:30.37},{desc:"Fuel Filter FF630",qty:1,price:50.86},{desc:"Filter Element",qty:1,price:136.30},{desc:"Filter Element US",qty:1,price:79.10},{desc:"Filter Element AF",qty:1,price:128.10},{desc:"Engine Oil Filter",qty:1,price:69.27},{desc:"Single Lubricant A",qty:1,price:22.84},{desc:"Fuel Surcharge",qty:1,price:7.95}],flags:["ESTIMATE","PM-SERVICE","HIDDEN-FEE"],flagNotes:"500hr PM for 840 M E (S/N 840.0.2362) — different machine from EQ0273581 problem unit. 18% env charge = ~$134 extra. True cost: ~$1,589.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"SQT206660",date:"2026-02-16",workDates:"Estimate",equipment:"Volvo L180G",sn:"19434",unitId:"EQ0055355",meter:0,site:"Alta Burton, G3283 S Dort Hwy",region:"SE-MI",category:"Preventive Maintenance",description:"500-hour PM service estimate. Multigrade SYN BLE (14qt), 8 oil filters, eng oil bypass, fuel filter prima, fuel filter 500hr, air filter outer + inner, cab + second cab, lubricant, fuel surcharge. 18% environmental NOT included.",techs:["Shop"],visits:0,parts:1007.10,labor:742.50,misc:7.95,partsDetail:[{desc:"Multigrade SYN BLE",qty:14,price:17.98},{desc:"Oil Filter (8)",qty:2,price:35.23},{desc:"Eng Oil Bypass Fil",qty:1,price:35.23},{desc:"Fuel Filter Prima",qty:1,price:100.47},{desc:"Fuel Filter 500hr",qty:1,price:79.07},{desc:"Air Filter Outer",qty:1,price:153.25},{desc:"Air Filter Inner",qty:1,price:99.44},{desc:"Cab Filter",qty:1,price:68.36},{desc:"Cab Filter Second",qty:1,price:126.22},{desc:"Single Lubricant A",qty:1,price:22.84},{desc:"Fuel Surcharge",qty:1,price:7.95}],flags:["ESTIMATE","PM-SERVICE","HIDDEN-FEE"],flagNotes:"500hr PM for L180G — $1,758 estimate. Inner+outer air filters at 500hr suggest dusty environment. 18% env = ~$134. True cost: ~$1,891.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"SQT206635",date:"2026-02-16",workDates:"Estimate",equipment:"Sennebogen 830ME",sn:"830.0.2567",unitId:"EQ0287891",meter:0,site:"Alta Burton, G3283 S Dort Hwy",region:"SE-MI",category:"Preventive Maintenance",description:"500-hour PM estimate for FPT Toledo unit. Engine oil filter, fuel filter FF630, filter element, heating filters, air filters AF5S30+AF550T, multigrade SYN BLE (5qt), lubricant, fuel surcharge. 18% environmental NOT included. Sales tax $35.60 (Ohio unit?).",techs:["Shop"],visits:0,parts:593.40,labor:742.50,misc:43.55,partsDetail:[{desc:"Engine Oil Filter",qty:1,price:17.51},{desc:"Fuel Filter FF630",qty:1,price:56.36},{desc:"Filter Element",qty:1,price:151.02},{desc:"Heating Filter",qty:1,price:35.57},{desc:"Heating Filter",qty:1,price:12.64},{desc:"Air Filter AF5S30",qty:1,price:58.32},{desc:"Air Filter AF550T",qty:1,price:137.03},{desc:"Multigrade SYN BLE",qty:5,price:19.93},{desc:"Single Lubricant A",qty:1,price:25.30},{desc:"Fuel Surcharge",qty:1,price:7.95}],flags:["ESTIMATE","PM-SERVICE","HIDDEN-FEE"],flagNotes:"FPT Toledo (BP0120643) — different customer number. 830ME smaller than 840/850. $35.60 sales tax charged (OH unit). 18% env = ~$134. True cost: ~$1,513.",expectedHoursLow:3,expectedHoursHigh:5,vendorType:"dealer",vendor:"Alta Equipment",agreement:"none" },
  { id:"MCAT-18297589",date:"2026-02-16",workDates:"2/9-2/15/26",equipment:"CAT 345C MH",sn:"M2R00311",unitId:"90146",meter:29213,site:"Shleafer Location, 3100 Lonyo Detroit",region:"SE-MI",category:"Hydraulic/Electrical",description:"Magnetic switch not working. Inspected mag line for pinches/breaks, checked fuses, verified buttons. Hydraulic motor for generator inspected — coupler assembly failed. Ordered parts, removed failed motor, replaced coupler assembly, installed hydraulic motor assembly, verified repair. Ordered 2 extra fuses (machine doesn't have spares). Tech: Tyler A Morris. 11hr field @ $138.70.",techs:["Tyler A Morris"],visits:1,parts:1173.37,labor:1525.70,misc:287.53,partsDetail:[{desc:"Insert (9U5872)",qty:1,price:74.60},{desc:"Fuse (1735434)",qty:2,price:220.53},{desc:"Coupling (1807101)",qty:1,price:505.67},{desc:"Coupling (1807121)",qty:1,price:152.04}],flags:["CROSS-VENDOR-COMP"],flagNotes:"Michigan CAT (MacAllister) — $138.70/hr field rate. Agreement expired end of 2025 ($130/hr was final year). Post-agreement rate is 6.7% above old contract. TUC $228.86 (15% on $1,525.70) still being applied. 29,213 hrs — very high-hour machine. Coupler assembly failure = $657.71 in parts.",expectedHoursLow:8,expectedHoursHigh:12,vendorType:"dealer",vendor:"Michigan CAT (MacAllister Machinery)",agreement:"expired",techRate:138.70 },
  { id:"SUM-2245",date:"2026-02-18",workDates:"1/27/26",equipment:"CAT 3040",sn:"50011",unitId:"50011",meter:0,site:"Schlafer, 3100 Lonyo Detroit",region:"SE-MI",category:"Electrical",description:"Hooked multi meter to hot line and discovered a short between wires. Removed previous repair harness and located shorted out section. Replaced bad section of wire and installed quick connects. Tested to confirm proper operation.",techs:["Summit"],visits:1,parts:0,labor:455.00,misc:130.00,partsDetail:[{desc:"Travel (1hr @ $80)",qty:1,price:80.00},{desc:"Shop Supplies",qty:1,price:50.00}],flags:["GOOD-TRANSPARENCY"],flagNotes:"Summit separates labor ($130/hr) and travel ($80/hr). Clean electrical troubleshooting — found previous repair harness was the problem. 3.5hr wrench time reasonable.",expectedHoursLow:2,expectedHoursHigh:4,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",travelLabor:80.00,techRate:130 },
  { id:"SUM-2214",date:"2026-01-06",workDates:"11/26, 12/1, 12/11/25",equipment:"Liebherr LH60",sn:"120495194",unitId:"90190",meter:0,site:"Schlafer, 3100 Lonyo Detroit",region:"SE-MI",category:"Drive / Gearbox",description:"Visit 1 (11/26, 2 mechs): Serviced axles, changed swing reducer gear oil. Removed/installed new hot line and connectors on magnet. Removed/installed new mag chains. 18hr labor + 4hr travel. Visit 2 (12/1, 2 mechs): Changed all fluids and filters. Extracted stabilizer pin keeper bolts, cleaned pin, installed new bolts and hardware. 16hr labor + 2hr travel. Visit 3 (12/11): Checked mag system — working properly, 95-91 amps at 230V. Reinspected hotline, checked magnet plate for cracks. Suspects moisture causing minor short in magnet box connections. 2hr labor + 2hr travel.",techs:["Summit"],visits:3,parts:40.00,labor:4680.00,misc:755.00,partsDetail:[{desc:"Hot Line Connectors",qty:1,price:40.00},{desc:"Travel (8hr @ $80)",qty:8,price:80.00},{desc:"Shop Supplies",qty:1,price:115.00}],flags:["CROSS-VENDOR-COMP","REPEAT-MACHINE"],flagNotes:"SAME MACHINE as RECO-42944 (PM estimate) and SUM-2166 (swivel). Summit $130/hr vs RECO $198.40/hr = 34% savings on labor rate. 36hr labor across 3 visits with 2-mechanic crews on first two. Heavy service scope (axles + fluids + mag system) but high hour count.",expectedHoursLow:25,expectedHoursHigh:38,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",travelLabor:640.00,techRate:130 },
  { id:"SUM-2166",date:"2025-10-28",workDates:"10/7, 10/20/25",equipment:"Liebherr LH60",sn:"120495194",unitId:"90190",meter:0,site:"Schlafer, 3100 Lonyo Detroit",region:"SE-MI",category:"Hydraulic",description:"Visit 1 (10/7): Inspected machine for oil leak, found pilot swivel leaking. Customer ordering parts. Visit 2 (10/20): Dead batteries — hooked to jump pack. Marked all lines, disassembled electric swivel plug. Removed swivel, swapped all fittings and electric swivel. Cleaned oil off machine. Clocked swivel and set in machine. Re-assembled harness, reconnected all lines, zip tied. Started machine, let idle to charge. Tested — no codes or leaks.",techs:["Summit"],visits:2,parts:0,labor:1365.00,misc:400.00,partsDetail:[{desc:"Travel (2.5hr @ $80)",qty:1,price:200.00},{desc:"Shop Supplies",qty:1,price:200.00}],flags:["REPEAT-MACHINE"],flagNotes:"SAME MACHINE as RECO-42944 and SUM-2214. Pilot swivel replacement. 10.5hr labor reasonable for swivel swap. $200 shop supplies is high for this job — 14% of labor.",expectedHoursLow:8,expectedHoursHigh:12,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",travelLabor:200.00,techRate:130 },
  { id:"SUM-2158",date:"2025-10-23",workDates:"9/8/25",equipment:"Genesis GXP660R",sn:"600417",unitId:"600417",meter:0,site:"Toledo",region:"OH",category:"Attachment",description:"Removed blades from shear. Cleaned blades and blade pockets. Performed welding on bottom wear plate. Flipped and reinstalled blades shimming to spec, and torqued all bolts to spec. 9hr labor + 1hr travel.",techs:["Summit"],visits:1,parts:0,labor:1170.00,misc:280.00,partsDetail:[{desc:"Travel (1hr @ $80)",qty:1,price:80.00},{desc:"Shop Supplies",qty:1,price:200.00}],flags:[],flagNotes:"Shear blade flip/service. 9hr reasonable for blade work with welding. $200 shop supplies recurring pattern — Summit charges flat $200 on most jobs.",expectedHoursLow:6,expectedHoursHigh:10,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",travelLabor:80.00,techRate:130 },
  { id:"SUM-2160",date:"2025-10-23",workDates:"10/7/25",equipment:"CAT 3040",sn:"0239",unitId:"0239",meter:0,site:"Schlafer, 3100 Lonyo Detroit",region:"SE-MI",category:"Electrical",description:"Removed worn mag chains and installed new chains. 1hr labor + 1hr travel.",techs:["Summit"],visits:1,parts:0,labor:130.00,misc:80.00,partsDetail:[{desc:"Travel (1hr @ $80)",qty:1,price:80.00}],flags:[],flagNotes:"Quick mag chain swap. 1hr wrench time is efficient. Different CAT 3040 than SUM-2245 (S/N 0239 vs 50011).",expectedHoursLow:1,expectedHoursHigh:2,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",travelLabor:80.00,techRate:130 },
  { id:"SUM-2161",date:"2025-10-23",workDates:"9/4-10/14/25",equipment:"Link-Belt 380X4 MH",sn:"1119",unitId:"1119",meter:0,site:"Schlafer, 3100 Lonyo Detroit",region:"SE-MI",category:"Hydraulic",description:"6-week hydraulic pump noise chase + cylinder replacement. V1 (9/4, 2 mechs): Checked pump noise, inspected filters/flywheel/coupling — nothing found. Drained oil, removed PTO drive and generator pump. Noise still present with PTO removed. 12hr+2.75hr trav. V2 (9/5, 2 mechs): Removed main hyd pump, ran engine 2hr with pump removed — no noise. Traveled to Ypsilanti for used pump. 13hr+5hr trav. V3 (9/10): Loaded pump, delivered to shop for rebuild. 1.5hr+2hr trav. V4 (9/17): Reinstalled original pump — noise returned. Suspects rear gear train resonance through pump. 7hr+2hr trav. V5 (9/22): Replaced pump case drain hose (leaking), repaired wiring to pressure sensors. Returned to service. 5.5hr+1hr trav. V6 (10/14): Drove to Inkster yard, picked up used cylinder, installed at Schlafer. 3.75hr+2hr trav.",techs:["Summit"],visits:6,parts:1875.00,labor:5557.50,misc:1280.00,partsDetail:[{desc:"Hydraulic Pump Rebuild",qty:1,price:1875.00},{desc:"Travel (14.75hr @ $80)",qty:1,price:1180.00},{desc:"Shop Supplies",qty:1,price:100.00}],flags:["EXCESSIVE-VISITS","HIGH-LABOR"],flagNotes:"$8,713 across 6 visits over 6 weeks chasing hydraulic pump noise. Pump was rebuilt ($1,875) but noise returned — suspected rear gear train resonance, not pump. Pump rebuild may have been unnecessary. 42.75hr labor + 14.75hr travel = 57.5hr total billed. Cylinder replacement tacked on at visit 6 (separate issue). Summit's transparency on the diagnostic dead-ends is honest, but the cost adds up.",expectedHoursLow:20,expectedHoursHigh:35,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",travelLabor:1180.00,techRate:130 },
  { id:"SUM-EST-2313",date:"2026-02-04",workDates:"Estimate",equipment:"Volvo Shear",sn:"",unitId:"",meter:0,site:"6464 Strong St, Detroit",region:"SE-MI",category:"Attachment",description:"Inspect and flip shear blades, repair as needed. Volvo shear @ Strong location. Flat estimate — no hourly breakdown provided.",techs:["Summit"],visits:0,parts:0,labor:4000.00,misc:0,partsDetail:[],flags:["ESTIMATE"],flagNotes:"$4,000 flat estimate for shear blade service. Compare to SUM-2158 (Genesis shear blade flip at $1,450). 176% higher — different shear size/scope likely but worth verifying. Summit T&C: 15 day payment, 1% late charge per 30 days.",expectedHoursLow:15,expectedHoursHigh:25,vendorType:"independent",vendor:"Summit Industrial Services",agreement:"none",techRate:130 },
  // ===== UNIT 90181 — SENNEBOGEN 835M LIFECYCLE RECORDS (Source: ERP export, 271 line items, $295K total) =====
  { id:"90181-2023-03A",date:"2023-03-20",workDates:"3/20/23",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Emission",description:"Regen issue & inlet module repair. 5 line items: replace inlet module parts ($11,025), regen issue/module repair ($1,409), credit ($-162), labor, misc. First major emission system failure on this unit — begins Tier 4 cascade.",techs:["Alta"],visits:1,parts:11024.85,labor:1408.75,misc:2185.19,partsDetail:[{desc:"Inlet Module Parts",qty:1,price:11024.85},{desc:"Regen/Module Labor",qty:1,price:1408.75}],flags:["EMISSION-PATTERN","EMISSION-CASCADE","HIGH-DOLLAR"],flagNotes:"$14,619 total. FIRST emission event on 90181. Inlet module failure + regen issue. This is the opening event of a Tier 4 Final cascade that escalates through 2025. Pattern: inlet module → DPF/DOC → EGR valve → EGR cooler → derated machine.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2023-01A",date:"2023-01-31",workDates:"1/31/23",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Mechanical",description:"Replace starter and fuel pump. $6,980 fuel pump + $1,661 second starter install. Two critical engine components in same event.",techs:["Alta"],visits:1,parts:6979.73,labor:1661.02,misc:0,partsDetail:[{desc:"Fuel Pump",qty:1,price:6979.73},{desc:"Starter Install",qty:1,price:1661.02}],flags:["HIGH-DOLLAR","ENGINE-DEGRADATION"],flagNotes:"$8,641 combined. Starter + fuel pump simultaneous failure = age-related engine wear. This machine was already accumulating engine spend.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2025-04A",date:"2025-04-17",workDates:"4/17/25",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Emission",description:"Replace DOC & DPF filters. $13,531 single event — highest emission system repair on this unit. Part of ongoing Tier 4 cascade that began with 2023 inlet module failure.",techs:["Alta"],visits:1,parts:13531.19,labor:0,misc:0,partsDetail:[{desc:"DOC & DPF Filters",qty:1,price:13531.19}],flags:["EMISSION-PATTERN","EMISSION-CASCADE","HIGH-DOLLAR"],flagNotes:"$13,531 for DPF/DOC replacement. Second major emission event. Cascade: inlet module (2023) → DPF/DOC (now) → EGR valve (3/25) → EGR cooler (9/25). Total emission spend on this unit now exceeds $30K.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2025-03A",date:"2025-03-31",workDates:"3/31/25",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Emission",description:"Replace EGR valve & DPF sensor. Continuing emission cascade — EGR system now failing alongside DPF.",techs:["Alta"],visits:1,parts:2852.58,labor:0,misc:0,partsDetail:[{desc:"EGR Valve & DPF Sensor",qty:1,price:2852.58}],flags:["EMISSION-PATTERN","EMISSION-CASCADE"],flagNotes:"$2,853. Third emission event in cascade. EGR valve failure is predictable after inlet module and DPF events — shared exhaust gas pathway.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2025-09A",date:"2025-09-16",workDates:"9/16/25",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Emission",description:"Replace EGR cooler. Fourth emission component failure. Exhaust gas recirculation system fully compromised.",techs:["Alta"],visits:1,parts:2193.00,labor:0,misc:0,partsDetail:[{desc:"EGR Cooler",qty:1,price:2193.00}],flags:["EMISSION-PATTERN","EMISSION-CASCADE"],flagNotes:"$2,193. Fourth emission event. EGR cooler fails after EGR valve — thermal cycling damage. Total emission cascade: $33K+ across 4 events over 30 months.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2025-07A",date:"2025-07-28",workDates:"7/28/25",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Mechanical",description:"Replace turbocharger + actuator kit. 5 line items: turbo ($7,674), actuator kit ($1,313), nuts/studs, shipping. Machine was derated prior to this repair.",techs:["Alta"],visits:1,parts:7674.34,labor:1313.18,misc:314.28,partsDetail:[{desc:"Turbocharger",qty:1,price:7674.34},{desc:"Turbo Actuator Kit",qty:1,price:1313.18}],flags:["HIGH-DOLLAR","ENGINE-DEGRADATION"],flagNotes:"$9,302 turbocharger replacement. Machine was running derated ($900 derate repair in 7/25). Turbo failure on a machine with active emission cascade = compounding engine stress. This is not a standalone failure — it's systemic.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2025-12A",date:"2025-12-16",workDates:"12/16/25",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Mechanical",description:"Replace rear main seal ($5,437) + crank sensor ($712) + multiple repairs ($1,704). Three separate segments billed same date. Rear main seal = major engine structural repair.",techs:["Alta"],visits:1,parts:5437.11,labor:712.07,misc:1704.02,partsDetail:[{desc:"Rear Main Seal (Seg 40)",qty:1,price:5437.11},{desc:"Crank Sensor (Seg 30)",qty:1,price:712.07},{desc:"Multiple Repairs",qty:1,price:1704.02}],flags:["HIGH-DOLLAR","ENGINE-DEGRADATION","END-OF-LIFE"],flagNotes:"$7,853 combined. Rear main seal is a deep-engine repair — requires significant disassembly. Crank sensor failure alongside = internal wear. Combined with turbo, EGR cascade, and oil pressure sensor failures in same year, this machine is showing systemic engine end-of-life indicators.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2025-06A",date:"2025-06-16",workDates:"6/16/25",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Mechanical",description:"Replace oil pressure sensor. $4,910 single repair — high cost for sensor suggests additional diagnostic/teardown labor bundled.",techs:["Alta"],visits:1,parts:4909.79,labor:0,misc:0,partsDetail:[{desc:"Oil Pressure Sensor + Labor",qty:1,price:4909.79}],flags:["ENGINE-DEGRADATION"],flagNotes:"$4,910 for oil pressure sensor. Price suggests significant diagnostic work or access teardown, not just a sensor swap. Oil pressure issues on a machine with turbo/emission failures = lubrication system stress.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" },
  { id:"90181-2024-08A",date:"2024-08-31",workDates:"8/31/24",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Attachment",description:"New 1.5 CU YD 4-tine Young grapple ($49,150) + crosshead ($5,594) + freight ($3,045). Capital attachment replacement, not machine health indicator.",techs:["National Assoc Supply"],visits:1,parts:49149.87,labor:0,misc:8639.19,partsDetail:[{desc:"1.5 CU YD 4-Tine Young Grapple",qty:1,price:49149.87},{desc:"Crosshead",qty:1,price:5594.19},{desc:"Freight",qty:1,price:3045.00}],flags:["HIGH-DOLLAR","CAPITAL-ATTACHMENT"],flagNotes:"$57,789 grapple replacement. This is CAPITAL equipment spend, not machine health. Inflates 2024 total to $99K — corrected machine health spend is ~$41K. Vendor: National Association Supply, not Alta.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"other",vendor:"National Association Supply",agreement:"none" },
  { id:"90181-2020-11A",date:"2020-11-30",workDates:"11/30/20",equipment:"Sennebogen 835 M",sn:"475049",unitId:"O-90181",meter:0,site:"Ferrous fleet",region:"SE-MI",category:"Engine — Mechanical",description:"Fuel injector leak + replacement. 3 line items across Nov 2020. Injectors are a recurring theme — Cummins prepaid entries suggest ongoing injector issues through mid-2020.",techs:["Alta"],visits:1,parts:4437.52,labor:0,misc:0,partsDetail:[{desc:"Fuel Injectors + Install",qty:1,price:4437.52}],flags:["ENGINE-DEGRADATION"],flagNotes:"$4,438 fuel injector work. Note: multiple Cummins prepaid entries ($1,266/mo for 6 months in 2020) suggest a Cummins service contract covering ongoing injector issues. Total injector-related spend in 2020 likely higher.",expectedHoursLow:0,expectedHoursHigh:0,vendorType:"dealer",vendor:"Alta Equipment",agreement:"resident" }
];

// ===== UNIT 90181 LIFECYCLE DATA (Annual Spend by Category) =====
export const LIFECYCLE_DATA = {
  "O-90181": {
    asset:"475049",make:"Sennebogen",model:"835 M",unitId:"O-90181",
    totalSpend:295426.11,lineItems:271,vendors:["Alta Equipment","Cummins Bridgeway","Pirtek","RECO Equipment","National Association Supply","Ultimate Trailer Repair","Exotic Automation","Outdoor Enterprises"],
    annual:[
      {year:2018,total:15866.86,engine:1329.56,hydraulic:698.07,electrical:2102.32,attachment:810.76,frame:425.00,pm:10501.15,brake:0,steering:0,tires:0},
      {year:2019,total:23141.69,engine:10048.14,hydraulic:6601.04,electrical:680.00,attachment:557.97,frame:0,pm:4767.15,brake:211.36,steering:276.03,tires:0},
      {year:2020,total:37147.63,engine:18363.03,hydraulic:7587.76,electrical:1060.57,attachment:5.95,frame:4138.97,pm:5991.35,brake:0,steering:0,tires:0},
      {year:2021,total:18696.04,engine:4561.40,hydraulic:3714.57,electrical:1654.28,attachment:754.26,frame:652.29,pm:7359.24,brake:0,steering:0,tires:0},
      {year:2022,total:12547.24,engine:4011.86,hydraulic:4309.62,electrical:0,attachment:0,frame:0,pm:4225.76,brake:0,steering:0,tires:0},
      {year:2023,total:37102.29,engine:24532.97,hydraulic:0,electrical:0,attachment:6457.53,frame:0,pm:6111.79,brake:0,steering:0,tires:0},
      {year:2024,total:99004.67,engine:0,hydraulic:489.32,electrical:0,attachment:78607.74,frame:3239.31,pm:16262.92,brake:0,steering:0,tires:405.38,note:"$58K is grapple replacement (capital). Corrected machine health: ~$41K"},
      {year:2025,total:48976.48,engine:22572.93,hydraulic:715.03,electrical:0,attachment:0,frame:5876.23,pm:19812.29,brake:0,steering:0,tires:0,note:"Emission cascade: DPF/DOC, EGR valve, EGR cooler. Turbo replacement. Rear main seal. END-OF-LIFE indicators."},
      {year:2026,total:2943.21,engine:905.80,hydraulic:2037.41,electrical:0,attachment:0,frame:0,pm:0,brake:0,steering:0,tires:0,note:"Partial year (through Feb)"}
    ],
    emissionCascade:[
      {date:"2023-03-20",event:"Inlet module failure + regen issue",cost:14618.79},
      {date:"2025-04-17",event:"DOC & DPF filter replacement",cost:13531.19},
      {date:"2025-03-31",event:"EGR valve & DPF sensor replacement",cost:2852.58},
      {date:"2025-07-21",event:"Machine derated — repair",cost:899.67},
      {date:"2025-09-16",event:"EGR cooler replacement",cost:2193.00}
    ],
    emissionTotalCost:34095.23,
    keyInsight:"Emission cascade totals $34K over 30 months. Combined with turbo ($9.3K), rear main seal ($5.4K), crank sensor ($712), oil pressure sensor ($4.9K) — engine system spend in 2025 alone is $49K. Classic Tier 4 Final end-of-life pattern. Machine should be evaluated for replacement."
  },
  "90193": {
    asset:"502211",make:"Liebherr",model:"LH60-M",unitId:"90193",
    totalSpend:198140.63,lineItems:339,vendors:["RECO Equipment","Summit Industrial Services","Pirtek","DNC Hydraulics","National Association Supply","Crystal Clean","Vesco Oil","Ritter Technology"],
    annualSpend:{
      2019:{total:1939.80,"Hydraulic":1694.62,"Attachment":245.18},
      2020:{total:14445.81,"Engine — Mechanical":7764.90,"Preventive Maintenance":5781.84,"Electrical":595.93,"Hydraulic":275.88},
      2021:{total:31940.77,"Engine — Mechanical":10974.06,"Preventive Maintenance":10281.17,"Attachment":6521.63,"Hydraulic":2179.59,"Electrical":1882.04},
      2022:{total:43706.47,"Preventive Maintenance":16820.01,"Electrical":9724.48,"Hydraulic":8117.83,"Attachment":6254.44,"Engine — Mechanical":2694.95},
      2023:{total:14204.35,"Preventive Maintenance":6977.14,"Cab / Structure":6137.29,"Attachment":1531.10,"Engine — Mechanical":1054.98},
      2024:{total:42861.55,"Preventive Maintenance":18242.70,"Engine — Mechanical":14214.79,"Hydraulic":7916.95,"Cab / Structure":2312.14},
      2025:{total:35675.59,"Attachment":12121.72,"Preventive Maintenance":11357.86,"Engine — Mechanical":7256.91,"Cab / Structure":2269.10,"Hydraulic":1820.00,"Electrical":850.00},
      2026:{total:13366.29,"Electrical":6532.43,"Engine — Mechanical":6092.19,"Attachment":635.40}
    },
    keyInsight:"8-year history. $198K total. Engine spend escalated from $2.7K (2022) to $14.2K (2024) to $7.3K (2025) — watch for continued engine-mechanical pattern. Electrical spike in 2022 ($9.7K) and 2026 ($6.5K). Hydraulic spike in 2022 ($8.1K) + 2024 ($7.9K). PM cost steady $10K–$18K/yr."
  },
  "90202": {
    asset:"532461",make:"Sennebogen",model:"840M",unitId:"90202",
    totalSpend:204720.14,lineItems:72,vendors:["Alta Equipment","Cummins","National Association Supply","Al & Sons Hydraulic","B & H Machine Sales","Core Electric","Magnetic Lifting Technologies"],
    annualSpend:{
      2021:{total:4352.10,"Preventive Maintenance":4352.10},
      2022:{total:16537.92,"Preventive Maintenance":16537.92},
      2023:{total:31608.63,"Attachment":15455.68,"Preventive Maintenance":10045.60,"Cab / Structure":2646.53,"Hydraulic":1581.25,"Electrical":988.32,"Engine — Mechanical":891.25},
      2024:{total:15349.56,"Hydraulic":10133.41,"Cab / Structure":2239.54,"Electrical":1396.45,"Engine — Mechanical":1380.00},
      2025:{total:79432.07,"Attachment":52864.06,"Electrical":10103.83,"Engine — Mechanical":6223.77,"Cab / Structure":4858.24,"Hydraulic":3167.11,"Preventive Maintenance":2215.06},
      2026:{total:57439.86,"Attachment":24900.00,"Engine — Mechanical":22600.22,"Hydraulic":8420.69,"Preventive Maintenance":1518.95}
    },
    keyInsight:"6-year history. $205K total. Attachment spend dominates ($93K = 46%) — grapple/magnet replacements. Engine spend escalating: $891 (2023) → $1.4K (2024) → $6.2K (2025) → $22.6K (2026 partial). Engine-mechanical escalation pattern forming. Hydraulic spend spiking in 2024 ($10.1K) and 2026 ($8.4K). Watch closely."
  },
  "90226": {
    asset:"562290",make:"Sennebogen",model:"840M",unitId:"90226",
    totalSpend:99487.60,lineItems:46,vendors:["Alta Equipment","Cummins","National Association Supply","Al & Sons Hydraulic","B & H Machine Sales","Magnetic Lifting Technologies"],
    annualSpend:{
      2023:{total:9698.89,"Attachment":7220.92,"Electrical":2087.66,"Preventive Maintenance":390.31},
      2024:{total:10084.22,"Cab / Structure":8940.26,"Attachment":1143.96},
      2025:{total:51539.40,"Engine — Mechanical":16599.13,"Attachment":13192.34,"Electrical":11279.07,"Hydraulic":3826.95,"Cab / Structure":3773.76,"Brake / Steering":2660.15},
      2026:{total:28165.09,"Engine — Mechanical":25314.50,"Electrical":2593.33,"Preventive Maintenance":257.26}
    },
    keyInsight:"4-year history. $99K total. Steep cost acceleration: $10K (2023-2024) → $52K (2025) → $28K (2026 partial). Engine spend exploded from $0 (2023-2024) to $16.6K (2025) to $25.3K (2026 partial). Electrical spike $11.3K in 2025. This machine is in early-stage cost escalation — same pattern as O-90181 two years earlier."
  },
  "92199": {
    asset:"490206",make:"Kawasaki",model:"95Z7B",unitId:"92199",
    totalSpend:367289.33,lineItems:466,vendors:["Michigan CAT","Cummins Bridgeway","RECO Equipment","Tredroc Tire","Dependable Wholesale","Vesco Oil","Co-Op Industries","Kool Radiator","CMA Heavy Hauling","Parts Express"],
    annualSpend:{
      2018:{total:6009.12,"Preventive Maintenance":2485.06,"Cab / Structure":1857.94,"Electrical":934.80,"Engine — Mechanical":731.32},
      2019:{total:75662.37,"Undercarriage / Tires":39598.99,"Preventive Maintenance":17019.24,"Engine — Mechanical":9847.74,"Attachment":2847.12,"Hydraulic":2752.20,"Electrical":1768.91,"Cab / Structure":1630.79,"Drive / Gearbox":197.38},
      2020:{total:60851.56,"Engine — Mechanical":23639.61,"Undercarriage / Tires":18454.35,"Preventive Maintenance":10866.53,"Electrical":3191.20,"Attachment":3168.98,"Hydraulic":941.37},
      2021:{total:47212.82,"Preventive Maintenance":21290.97,"Cab / Structure":8253.51,"Engine — Mechanical":8022.31,"Hydraulic":4276.65,"Attachment":2811.94,"Electrical":1507.44,"Undercarriage / Tires":1050.00},
      2022:{total:33402.59,"Electrical":10705.71,"Preventive Maintenance":6165.34,"Engine — Mechanical":6143.57,"Undercarriage / Tires":5683.00,"Cab / Structure":3141.37,"Hydraulic":1563.60},
      2023:{total:24356.54,"Preventive Maintenance":11995.01,"Engine — Mechanical":6934.34,"Cab / Structure":4431.42,"Attachment":995.77},
      2024:{total:69702.77,"Undercarriage / Tires":54750.00,"Hydraulic":9163.07,"Preventive Maintenance":3999.30,"Cab / Structure":1790.40},
      2025:{total:39280.37,"Engine — Mechanical":21594.05,"Preventive Maintenance":12926.42,"Cab / Structure":4492.82,"Undercarriage / Tires":267.08},
      2026:{total:10811.19,"Engine — Mechanical":6662.65,"Preventive Maintenance":4148.54}
    },
    keyInsight:"9-year history. $367K total — highest spend unit in database. Tire costs dominate spikes: $40K (2019), $18K (2020), $55K (2024). Engine-mechanical is steady $6K–$10K/yr but jumped to $24K (2020) and $22K (2025) — two major engine events. PM cost elevated $10K–$21K/yr. This is a high-utilization wheel loader eating tires and engines. Evaluate tire program and engine condition."
  }
};

export const FLAG_META = {
  // ── Manually assigned flags (human judgment) ────────────────────────────────
  "MISDIAGNOSIS":{c:"#dc2626",l:"Misdiagnosis"},"HIGHEST-COST":{c:"#dc2626",l:"Highest Cost"},"PHANTOM-PART":{c:"#dc2626",l:"Phantom Part?"},
  "EXCESSIVE-LABOR":{c:"#ea580c",l:"Excessive Labor"},"HIGH-LABOR":{c:"#ea580c",l:"High Labor"},"LABOR-HEAVY":{c:"#ea580c",l:"Labor Heavy"},
  "COURIER-AT-MECH-RATE":{c:"#ea580c",l:"Courier @ Mech Rate"},"EXCESSIVE-VISITS":{c:"#ea580c",l:"Excess Visits"},
  "UNDOCUMENTED-CHARGE":{c:"#d97706",l:"Undoc. Charge"},"WRONG-FLUID":{c:"#d97706",l:"Wrong Fluid"},"MISC-FEE-CREEP":{c:"#d97706",l:"Misc Fee Creep"},
  "MULTI-RATE":{c:"#2563eb",l:"Multi-Rate"},"REPEAT-MACHINE":{c:"#7c3aed",l:"Repeat Machine"},"END-OF-LIFE":{c:"#6b7280",l:"End of Life"},
  "WARRANTY-CHECK":{c:"#0891b2",l:"Warranty?"},"CROSS-MODEL-PART":{c:"#0891b2",l:"Cross-Model"},
  "GOOD-TRANSPARENCY":{c:"#16a34a",l:"Good Transparency"},"NON-AGREEMENT":{c:"#f59e0b",l:"Non-Agreement Tech"},
  "EMISSION-PATTERN":{c:"#dc2626",l:"Emission Pattern"},"CROSS-VENDOR-COMP":{c:"#0891b2",l:"Cross-Vendor Comp"},
  "ESTIMATE":{c:"#6b7280",l:"Estimate"},"PM-SERVICE":{c:"#16a34a",l:"PM Service"},"HIDDEN-FEE":{c:"#d97706",l:"Hidden Fee"},
  "CUMMINS-SUBLET":{c:"#2563eb",l:"Cummins Sublet"},"WARRANTY":{c:"#16a34a",l:"Warranty"},
  "EMISSION-CASCADE":{c:"#dc2626",l:"Emission Cascade"},"ENGINE-DEGRADATION":{c:"#ea580c",l:"Engine Degradation"},
  "HIGH-DOLLAR":{c:"#d97706",l:"High Dollar"},"CAPITAL-ATTACHMENT":{c:"#2563eb",l:"Capital Attachment"},
  "LIFECYCLE-DATA":{c:"#7c3aed",l:"Lifecycle Data"},
  // ── Engine-generated flags (set automatically by runAuditFlags, prefix ENG-) ─
  // These are replaced on every re-audit. Manual flags above are never touched.
  "ENG-HIGH-HOURS":       {c:"#dc2626",l:"⚡ High Hours"},
  "ENG-HIGH-COST":        {c:"#ea580c",l:"⚡ High Cost"},
  "ENG-RATE-VIOLATION":   {c:"#dc2626",l:"⚡ Rate Violation"},
  "ENG-TRAVEL-BILLED":    {c:"#d97706",l:"⚡ Travel Billed"},
  "ENG-REPEAT-REPAIR":    {c:"#7c3aed",l:"⚡ Repeat Repair"},
  "ENG-MATH-ERROR":       {c:"#dc2626",l:"⚡ Math Error"},
  "ENG-FEE-VIOLATION":    {c:"#d97706",l:"⚡ Fee Violation"},
  "ENG-RATE-OUTLIER":     {c:"#ea580c",l:"⚡ Rate Outlier"},
  "ENG-INCOMPLETE":       {c:"#6b7280",l:"⚡ Incomplete"},
  "ENG-UNKNOWN-VENDOR":   {c:"#dc2626",l:"⚡ Unknown Vendor"},
};

export const TXN_TAG_META = {
  "RELATIONSHIP-FIRST":{c:"#16a34a",l:"Relationship First"},
  "BELOW-MARKET":{c:"#d97706",l:"Below Market"},
  "ABOVE-MARKET":{c:"#16a34a",l:"Above Market"},
  "QUICK-TURN":{c:"#2563eb",l:"Quick Turn"},
  "BROKERED":{c:"#7c3aed",l:"Brokered"},
  "DIRECT-SALE":{c:"#0891b2",l:"Direct Sale"},
  "COMP-DATA":{c:"#ea580c",l:"Comp Data"}
};

// Vendor rate table — used to derive implied hours for ANY invoice from a known vendor
// even when agreement type or tech names weren't captured on import.
// confidence: "contract" = verified agreement rate | "published" = known published rate | "estimated" = industry estimate
const VENDOR_RATES = {
  "Alta Equipment":                    { rate: 140, confidence: "contract",  note: "Resident contract FY25 $140/hr (BP0015900)" },
  "Michigan CAT":                      { rate: 125, confidence: "contract",  note: "MacAllister negotiated field rate (expired 12/31/25)" },
  "Michigan CAT (MacAllister Machinery)": { rate: 125, confidence: "contract", note: "MacAllister negotiated field rate" },
  "RECO Equipment":                    { rate: 115, confidence: "published", note: "RECO published field labor rate" },
  "RECO Equipment, Inc.":              { rate: 115, confidence: "published", note: "RECO published field labor rate" },
  "Summit Industrial Services":        { rate: 120, confidence: "published", note: "Summit labor rate (travel separate $80/hr)" },
  "Ohio CAT":                          { rate: 130, confidence: "published", note: "Ohio CAT standard field rate" },
  "Towlift":                           { rate: 105, confidence: "estimated", note: "Estimated — Towlift material handling rate" },
  "CO-OP Industries, Inc.":            { rate: 110, confidence: "estimated", note: "Estimated — Co-Op industrial rate" },
  "Altorfer CAT":                      { rate: 130, confidence: "published", note: "Altorfer standard field rate" },
  "RubberEdge":                        { rate:  95, confidence: "estimated", note: "Estimated — RubberEdge attachment specialist" },
  "Apex Shear Blades":                 { rate:  95, confidence: "estimated", note: "Estimated — Apex attachment specialist" },
};

// vendorRegistry is the live Supabase vendors array (passed in from page state).
// When provided, it takes precedence over the hardcoded VENDOR_RATES table.
// Guard: Array.map calls callbacks as (item, index, array) — index would break .find()
export function calc(inv, vendorRegistry = []) {
  const registry = Array.isArray(vendorRegistry) ? vendorRegistry : [];
  const total = inv.parts + inv.labor + inv.misc;
  const allRes = inv.techs.length > 0 && inv.techs.every(t => t === RESIDENT_TECH);
  const allNon = inv.techs.length > 0 && inv.techs.every(t => t !== RESIDENT_TECH);
  const fy = AGREEMENTS.alta.rates.fy25;
  let rate = null, impliedHrs = null, rateNote = "", rateConfidence = null;

  // ── Tier 1: Exact agreement + tech match (highest confidence) ─────────────
  if (inv.vendor === "Alta Equipment" && inv.agreement === "resident" && allRes) {
    rate = fy.standard; impliedHrs = inv.labor / rate; rateConfidence = "contract";
    const trH = inv.visits, wrH = impliedHrs - trH;
    rateNote = `${RESIDENT_TECH} @ $${rate}/hr (contract) | ${impliedHrs.toFixed(1)}h total, ${trH}h travel, ${wrH.toFixed(1)}h wrench`;
  }

  // ── Tier 2: Live vendor registry (Supabase) → hardcoded VENDOR_RATES fallback ──
  // Fires when Tier 1 didn't match AND labor > 0 (skip parts-only invoices)
  if (rate === null && inv.labor > 0) {
    // 2a: Check live registry first
    const regEntry = registry.find(v => v.name === inv.vendor);
    if (regEntry && regEntry.labor_rate) {
      rate = parseFloat(regEntry.labor_rate);
      impliedHrs = inv.labor / rate;
      rateConfidence = regEntry.rate_confidence || "estimated";
      rateNote = `${regEntry.rate_note || regEntry.name} | ${impliedHrs.toFixed(1)}h implied`;
    } else {
      // 2b: Hardcoded VENDOR_RATES table fallback
      const vr = VENDOR_RATES[inv.vendor];
      if (vr) {
        rate = vr.rate;
        impliedHrs = inv.labor / rate;
        rateConfidence = vr.confidence;
        rateNote = `${vr.note} | ${impliedHrs.toFixed(1)}h implied`;
      } else if (inv.vendor) {
        rateNote = `${inv.vendor} — rate not in registry`;
      }
    }
  } else if (rate === null) {
    // Explain why rate is null for Alta-specific edge cases
    if (inv.vendor === "Alta Equipment" && !allRes && !allNon && inv.techs.length > 0) {
      rateNote = "Mixed techs — $" + fy.standard + " agreement + non-agreement — cannot split";
    } else if (inv.vendor === "Alta Equipment" && allNon) {
      rateNote = "Non-agreement tech — rate unknown (outside Ferrous/Alta contract)";
    } else if (inv.labor === 0) {
      rateNote = inv.vendor ? `${inv.vendor} — parts-only invoice` : "Parts-only invoice";
    }
  }

  // ── Exposure calculation ───────────────────────────────────────────────────
  // Use expectedHours if explicitly set; fall back to null (statistical baseline
  // in audit() will still flag outliers via buildBaselines)
  const hasExpected = inv.expectedHoursLow > 0 || inv.expectedHoursHigh > 0;
  const midHrs = hasExpected ? (inv.expectedHoursLow + inv.expectedHoursHigh) / 2 : null;
  const variance = impliedHrs != null && midHrs != null ? impliedHrs - midHrs : null;
  const varDollars = variance != null && rate ? variance * rate : null;

  return {
    ...inv, total, rate, impliedHrs, rateNote, rateConfidence, midHrs,
    variance, varDollars, allFlags: [...inv.flags],
    laborPct: total > 0 ? inv.labor / total * 100 : 0,
    client: inv.client || "Ferrous",
    region: inv.region || "SE-MI"
  };
}

export function audit(c, bl) {
  const ch = [];
  // Validation: math
  const recomp = c.parts + c.labor + c.misc;
  ch.push({ ck: "Math", r: Math.abs(c.total - recomp) < 1 ? "PASS" : "FLAG", cf: "HIGH", d: Math.abs(c.total - recomp) < 1 ? `Labor + Parts + Misc = ${f$(c.total)}. Verified.` : `Computed ${f$(recomp)} vs stated ${f$(c.total)}. Delta: ${f$(Math.abs(c.total - recomp))}.` });
  // Validation: completeness
  const miss = ["vendor", "equipment", "category", "sn", "unitId"].filter(f => !c[f] || c[f] === "");
  ch.push({ ck: "Completeness", r: miss.length === 0 ? "PASS" : miss.length <= 1 ? "NOTE" : "FLAG", cf: "HIGH", d: miss.length === 0 ? "All key fields present." : `Missing: ${miss.join(", ")}.` });
  // Alta agreement compliance
  if (c.vendor === "Alta Equipment" && c.agreement === "resident") {
    const a = AGREEMENTS.alta, fy = a.rates.fy25;
    if (c.rate != null) {
      const delta = c.rate - fy.standard;
      ch.push({ ck: "Rate vs Contract", r: Math.abs(delta) <= 1 ? "PASS" : "FLAG", cf: "HIGH", d: `Effective $${c.rate.toFixed(2)}/hr vs contract $${fy.standard}/hr (${a.bp}). Delta: ${delta > 0 ? "+" : ""}$${delta.toFixed(2)}.` });
    } else { ch.push({ ck: "Rate vs Contract", r: "UNABLE", cf: "LOW", d: "Cannot determine effective rate (mixed techs or missing data)." }); }
    const dt = new Date(c.date), ts = new Date(a.term.start);
    ch.push({ ck: "Contract Period", r: dt >= ts ? "PASS" : "FLAG", cf: "HIGH", d: dt >= ts ? `Invoice within agreement term (post ${a.term.start}).` : `Work may predate contract start ${a.term.start}. Prior rates may apply.` });
    const hasTrvl = c.partsDetail?.some(p => /travel|truck|mileage/i.test(p.desc || ""));
    ch.push({ ck: "Travel Billing", r: !hasTrvl ? "PASS" : "FLAG", cf: hasTrvl ? "HIGH" : "MEDIUM", d: !hasTrvl ? "No separate travel charge. Consistent with blended rate per contract." : "Separate travel/truck line detected. Agreement states travel blended into hourly — no separate charge." });
    const feeHits = [];
    if (c.partsDetail?.some(p => /environ/i.test(p.desc || ""))) feeHits.push("environmental surcharge");
    if (c.partsDetail?.some(p => /shop suppl/i.test(p.desc || ""))) feeHits.push("shop supplies");
    if (c.partsDetail?.some(p => /fuel sur/i.test(p.desc || ""))) feeHits.push("fuel surcharge");
    ch.push({ ck: "Fee Policy", r: feeHits.length === 0 ? "PASS" : "FLAG", cf: "HIGH", d: feeHits.length === 0 ? "No unauthorized fees detected." : `Found: ${feeHits.join(", ")}. Agreement silent on these charges.` });
    const known = [RESIDENT_TECH, "Jereme Chie"];
    const unk = c.techs.filter(t => !known.includes(t));
    ch.push({ ck: "Tech Certification", r: unk.length === 0 ? "PASS" : "NOTE", cf: unk.length === 0 ? "HIGH" : "MEDIUM", d: unk.length === 0 ? `${c.techs.join(", ")} — known ${a.techCert} certified.` : `Unverified tech(s): ${unk.join(", ")}. Confirm ${a.techCert} certification.` });
  }
  else if (c.vendor === "Summit Industrial Services") {
    if (c.techRate) ch.push({ ck: "Rate Transparency", r: "PASS", cf: "HIGH", d: `Labor $${c.techRate}/hr + travel $80/hr separated. Independently verifiable.` });
    const shopAmt = (c.partsDetail || []).filter(p => /shop suppl/i.test(p.desc || "")).reduce((s, p) => s + p.qty * p.price, 0);
    if (shopAmt > 0) ch.push({ ck: "Shop Supplies", r: shopAmt >= 200 ? "FLAG" : "NOTE", cf: "MEDIUM", d: `$${shopAmt.toFixed(0)} shop supplies. ${shopAmt >= 200 ? "Flat $200 pattern — verify scope justification." : "Within typical range."}` });
  }
  else if (c.vendor === "Michigan CAT (MacAllister Machinery)" && c.techRate) {
    const m = AGREEMENTS.micat, yr = new Date(c.date).getFullYear(), yrKey = "y" + yr;
    const agrRate = m.rates[yrKey]?.standard;
    if (agrRate) {
      const delta = c.techRate - agrRate;
      ch.push({ ck: "Rate vs Contract", r: Math.abs(delta) <= 1 ? "PASS" : "FLAG", cf: "HIGH", d: `Billed $${c.techRate}/hr vs ${yr} contract $${agrRate}/hr. Delta: ${delta > 0 ? "+" : ""}$${delta.toFixed(2)}.` });
      ch.push({ ck: "TUC (15%)", r: "NOTE", cf: "MEDIUM", d: `15% TUC applies. Effective rate: $${(c.techRate * 1.15).toFixed(2)}/hr all-in. Verify TUC line present on original invoice.` });
    }
  }
  else if (!c.agreement || c.agreement === "none") {
    ch.push({ ck: "Agreement Status", r: "NOTE", cf: "HIGH", d: "No vendor agreement loaded. Compliance checks not available — rate benchmarking only." });
  }
  // Phase 2: Baseline checks (statistical, from accumulated data)
  if (bl) {
    const vb = bl.vr[c.vendor];
    if (vb && c.rate) {
      const dev = vb.sd > 0 ? (c.rate - vb.m) / vb.sd : 0;
      ch.push({ ck: "Rate vs Baseline", r: Math.abs(dev) <= 1.5 ? "PASS" : "FLAG", cf: vb.n >= 10 ? "HIGH" : vb.n >= 5 ? "MEDIUM" : "LOW",
        d: `$${c.rate.toFixed(2)}/hr vs ${c.vendor} baseline avg $${vb.m.toFixed(2)} (\u00b1$${vb.sd.toFixed(2)}, n=${vb.n}). ${Math.abs(dev) > 1.5 ? dev.toFixed(1) + " std dev from mean." : "Within range."}` });
    } else if (c.rate && !vb) {
      ch.push({ ck: "Rate vs Baseline", r: "UNABLE", cf: "LOW", d: `Insufficient data for ${c.vendor} rate baseline (need 3+ invoices with known rate).` });
    }
    const cb = bl.cc[c.category];
    if (cb?.cost && c.total > cb.cost.m * 2) {
      ch.push({ ck: "Cost vs Category", r: "FLAG", cf: cb.cost.n >= 5 ? "HIGH" : "MEDIUM",
        d: `${f$(c.total)} is ${(c.total / cb.cost.m).toFixed(1)}x the ${c.category} avg of ${f$(cb.cost.m)} (n=${cb.cost.n}).` });
    }
    if (cb?.hrs && c.impliedHrs && c.impliedHrs > cb.hrs.m * 1.5) {
      ch.push({ ck: "Hours vs Category", r: "FLAG", cf: cb.hrs.n >= 5 ? "HIGH" : "MEDIUM",
        d: `${c.impliedHrs.toFixed(1)}h is ${(c.impliedHrs / cb.hrs.m).toFixed(1)}x the ${c.category} avg of ${cb.hrs.m.toFixed(1)}h (n=${cb.hrs.n}).` });
    }
    // Repeat repair detection: same machine, same category, within 90 days
    if (bl.all) {
      const dupes = bl.all.filter(o => o.id !== c.id && o.unitId === c.unitId && o.category === c.category && Math.abs(new Date(o.date) - new Date(c.date)) < 90 * 86400000);
      if (dupes.length > 0) {
        ch.push({ ck: "Repeat Repair", r: "FLAG", cf: "HIGH",
          d: `${dupes.length} other ${c.category} invoice(s) on ${c.unitId} within 90 days: ${dupes.map(d => d.id).join(", ")}. May indicate incomplete prior repair or chronic issue.` });
      }
    }
  }
  return ch;
}

// ── Audit check → ENG- flag code mapping ─────────────────────────────────────
const AUDIT_FLAG_MAP = {
  "Hours vs Category":  "ENG-HIGH-HOURS",
  "Cost vs Category":   "ENG-HIGH-COST",
  "Rate vs Contract":   "ENG-RATE-VIOLATION",
  "Travel Billing":     "ENG-TRAVEL-BILLED",
  "Repeat Repair":      "ENG-REPEAT-REPAIR",
  "Math":               "ENG-MATH-ERROR",
  "Fee Policy":         "ENG-FEE-VIOLATION",
  "Rate vs Baseline":   "ENG-RATE-OUTLIER",
  "Completeness":       "ENG-INCOMPLETE",
};

// ── Levenshtein distance (fuzzy vendor name matching) ─────────────────────────
// Used to catch GPT-4o extractions like "Alta Equipment Co." vs "Alta Equipment"
// Threshold: 15% of the longer string's length → catches typos and minor variations
function _levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

/**
 * runAuditFlags — the permanent auto-flagging function.
 *
 * Runs the full engine pipeline on a single invoice against all known invoices,
 * generates ENG- flags for every failing check, and returns the invoice ready
 * to save. Call this before every Supabase write.
 *
 * - Manual flags (no ENG- prefix) are NEVER touched — human judgment persists.
 * - ENG- flags are always replaced with the latest engine findings.
 * - flagNotes is populated with a summary of all engine findings.
 *
 * Performance: pass precomputedBaselines when auditing many invoices in a loop.
 * buildBaselines is O(n) — without precomputation, a batch of n invoices is O(n²).
 * Use buildBaselines(invoices, undefined, vendors) once, then pass to every call.
 */
export function runAuditFlags(invoice, allInvoices = [], vendorRegistry = [], precomputedBaselines = null) {
  const registry = Array.isArray(vendorRegistry) ? vendorRegistry : [];

  // ── Vendor lookup: exact first, then fuzzy fallback ──────────────────────────
  // Catches GPT-4o extractions like "Alta Equipment Co." vs registry "Alta Equipment"
  let vendorEntry = null;
  if (registry.length > 0 && invoice.vendor) {
    // 1. Exact match
    vendorEntry = registry.find(v => v.name === invoice.vendor);
    // 2. Case-insensitive match
    if (!vendorEntry) {
      const lower = invoice.vendor.toLowerCase();
      vendorEntry = registry.find(v => v.name.toLowerCase() === lower);
    }
    // 3. Fuzzy: registry name is contained in invoice vendor string or vice versa
    if (!vendorEntry) {
      const lower = invoice.vendor.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      vendorEntry = registry.find(v => {
        const vl = v.name.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        return lower.includes(vl) || vl.includes(lower) ||
               _levenshtein(lower, vl) <= Math.floor(Math.max(lower.length, vl.length) * 0.15);
      });
    }
  }

  // Guard: unknown vendor — block processing when registry is populated
  if (registry.length > 0 && invoice.vendor && !vendorEntry) {
    const manualFlags = (invoice.flags || []).filter(f => !f.startsWith("ENG-"));
    const existingNotes = (invoice.flagNotes || "").replace(/\s*\[ENG\].*$/s, "").trim();
    return {
      ...invoice,
      flags: [...new Set([...manualFlags, "ENG-UNKNOWN-VENDOR"])],
      flagNotes: [existingNotes, `[ENG] [Unknown Vendor] "${invoice.vendor}" is not in the vendor registry — add this vendor before auditing.`].filter(Boolean).join(" ")
    };
  }

  // Agreement auto-detection: apply registry agreement_type to invoices that arrived with none
  const enrichedInvoice =
    (vendorEntry &&
     vendorEntry.agreement_type &&
     vendorEntry.agreement_type !== "none" &&
     (!invoice.agreement || invoice.agreement === "none"))
      ? { ...invoice, agreement: vendorEntry.agreement_type }
      : invoice;

  const calcResult = calc(enrichedInvoice, registry);
  // Use precomputed baselines when available (batch audits) — avoids O(n²) recomputation
  const bl = precomputedBaselines || buildBaselines(allInvoices, undefined, registry);
  const checks      = audit(calcResult, bl);

  // Map FLAG-level findings to ENG- codes
  const engFlags = checks
    .filter(c => c.r === "FLAG" && AUDIT_FLAG_MAP[c.ck])
    .map(c => AUDIT_FLAG_MAP[c.ck]);

  // Keep manual flags, replace all ENG- flags with fresh engine output
  const manualFlags = (enrichedInvoice.flags || []).filter(f => !f.startsWith("ENG-"));
  const flags       = [...new Set([...manualFlags, ...engFlags])];

  // Build concise engine notes from all FLAG findings (not just mapped ones)
  const allFlagChecks = checks.filter(c => c.r === "FLAG");
  const engNotes = allFlagChecks.map(c => `[${c.ck}] ${c.d}`).join(" | ");

  // Preserve any human-written flagNotes; append engine notes after a separator
  const existingNotes = (enrichedInvoice.flagNotes || "").replace(/\s*\[ENG\].*$/s, "").trim();
  const flagNotes = [existingNotes, engNotes ? `[ENG] ${engNotes}` : ""]
    .filter(Boolean).join(" ");

  return { ...enrichedInvoice, flags, flagNotes };
}

export function buildBaselines(invoices, region, vendorRegistry = []) {
  const c = invoices.map(inv => calc(inv, vendorRegistry));
  const rc = region ? c.filter(i => (i.region || "SE-MI") === region) : c;
  const st = arr => { if (arr.length < 3) return null; const m = arr.reduce((s, v) => s + v, 0) / arr.length; const sd = Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); return { m, sd, min: Math.min(...arr), max: Math.max(...arr), n: arr.length }; };
  const vr = {}, cc = {};
  rc.forEach(i => {
    if (i.rate) (vr[i.vendor] = vr[i.vendor] || []).push(i.rate);
    const cat = cc[i.category] = cc[i.category] || { cost: [], hrs: [] };
    cat.cost.push(i.total); if (i.impliedHrs) cat.hrs.push(i.impliedHrs);
  });
  return { vr: Object.fromEntries(Object.entries(vr).map(([k, v]) => [k, st(v)])), cc: Object.fromEntries(Object.entries(cc).map(([k, v]) => [k, { cost: st(v.cost), hrs: st(v.hrs) }])), all: c, region: region || "all" };
}

// ===== LIFECYCLE RISK ALGORITHM (Heuristic — Rule-Based, Evidence-Cited) =====
// Returns score 0–10 with evidence for each component. Not predictive. Pattern-matching only.
export function lifecycleRisk(ld) {
  if (!ld) return null;
  // Normalize annual data to common format: [{year, total, engine, ...}]
  let years = [];
  if (ld.annual && Array.isArray(ld.annual)) {
    years = ld.annual.map(y => ({ year: y.year, total: y.total, engine: (y.engine || 0), attachment: (y.attachment || 0) }));
  } else if (ld.annualSpend) {
    years = Object.entries(ld.annualSpend).map(([yr, d]) => ({
      year: parseInt(yr), total: d.total || 0,
      engine: (d["Engine — Mechanical"] || 0) + (d["Engine — Emission"] || 0),
      attachment: (d["Attachment"] || 0)
    }));
  }
  if (years.length < 2) return { score: 0, level: "INSUFFICIENT DATA", components: [], evidence: "Need 2+ years of spend history." };
  years.sort((a, b) => a.year - b.year);

  const components = [];
  let totalScore = 0;

  // 1. SPEND ACCELERATION — YoY growth rate on health spend (total minus attachment)
  const health = years.map(y => ({ year: y.year, spend: y.total - y.attachment }));
  const growthRates = [];
  for (let i = 1; i < health.length; i++) {
    if (health[i - 1].spend > 500) {
      const rate = (health[i].spend - health[i - 1].spend) / health[i - 1].spend * 100;
      growthRates.push({ from: health[i - 1].year, to: health[i].year, rate, fromAmt: health[i - 1].spend, toAmt: health[i].spend });
    }
  }
  const highGrowth = growthRates.filter(g => g.rate > 40);
  const accelScore = highGrowth.length >= 3 ? 2 : highGrowth.length >= 2 ? 1.5 : highGrowth.length === 1 ? 1 : 0;
  const accelEvidence = highGrowth.length > 0
    ? highGrowth.map(g => `${g.from}→${g.to}: +${g.rate.toFixed(0)}% ($${Math.round(g.fromAmt/1000)}K→$${Math.round(g.toAmt/1000)}K)`).join("; ")
    : "No years with >40% health spend growth.";
  components.push({ name: "Spend Acceleration", score: accelScore, max: 2, evidence: accelEvidence });
  totalScore += accelScore;

  // 2. ENGINE CONCENTRATION — engine as % of non-attachment spend in most recent 2 years
  const recent = years.slice(-2);
  const recentHealth = recent.reduce((s, y) => s + y.total - y.attachment, 0);
  const recentEngine = recent.reduce((s, y) => s + y.engine, 0);
  const enginePct = recentHealth > 0 ? recentEngine / recentHealth * 100 : 0;
  const engineScore = enginePct >= 50 ? 2 : enginePct >= 35 ? 1.5 : enginePct >= 20 ? 1 : 0;
  const engineEvidence = `Engine spend: $${Math.round(recentEngine/1000)}K of $${Math.round(recentHealth/1000)}K health spend (${enginePct.toFixed(0)}%) in ${recent.map(y=>y.year).join("–")}.`;
  components.push({ name: "Engine Concentration", score: engineScore, max: 2, evidence: engineEvidence });
  totalScore += engineScore;

  // 3. CASCADE DETECTION — 3+ engine-heavy years in last 4 years
  const last4 = years.slice(-4);
  const engineYears = last4.filter(y => y.engine > 5000);
  const cascadeScore = engineYears.length >= 3 ? 2 : engineYears.length === 2 ? 1 : 0;
  const cascadeEvidence = engineYears.length > 0
    ? `${engineYears.length} year(s) with >$5K engine spend in last 4: ${engineYears.map(y => `${y.year} ($${Math.round(y.engine/1000)}K)`).join(", ")}.`
    : "No years with >$5K engine spend in recent window.";
  if (ld.emissionCascade) {
    components.push({ name: "Cascade Detection", score: 2, max: 2, evidence: `Confirmed emission cascade: ${ld.emissionCascade.length} events, $${Math.round(ld.emissionTotalCost/1000)}K total. ${cascadeEvidence}` });
    totalScore += 2;
  } else {
    components.push({ name: "Cascade Detection", score: cascadeScore, max: 2, evidence: cascadeEvidence });
    totalScore += cascadeScore;
  }

  // 4. COST TRAJECTORY — is the spend curve rising, flat, or falling?
  const firstHalf = health.slice(0, Math.ceil(health.length / 2));
  const secondHalf = health.slice(Math.ceil(health.length / 2));
  const avgFirst = firstHalf.reduce((s, y) => s + y.spend, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, y) => s + y.spend, 0) / secondHalf.length;
  const trajRatio = avgFirst > 0 ? avgSecond / avgFirst : 1;
  const trajScore = trajRatio >= 2.5 ? 2 : trajRatio >= 1.8 ? 1.5 : trajRatio >= 1.3 ? 1 : 0;
  const trajEvidence = `Avg health spend: $${Math.round(avgFirst/1000)}K/yr (first half) → $${Math.round(avgSecond/1000)}K/yr (second half). Ratio: ${trajRatio.toFixed(1)}x.`;
  components.push({ name: "Cost Trajectory", score: trajScore, max: 2, evidence: trajEvidence });
  totalScore += trajScore;

  // 5. PEAK YEAR SEVERITY — highest single-year health spend relative to history
  const peakHealth = Math.max(...health.map(y => y.spend));
  const medianHealth = [...health.map(y => y.spend)].sort((a, b) => a - b)[Math.floor(health.length / 2)];
  const peakRatio = medianHealth > 0 ? peakHealth / medianHealth : 1;
  const peakYear = health.find(y => y.spend === peakHealth)?.year;
  const peakScore = peakRatio >= 3 ? 2 : peakRatio >= 2 ? 1 : 0;
  const peakEvidence = `Peak: $${Math.round(peakHealth/1000)}K (${peakYear}). Median: $${Math.round(medianHealth/1000)}K/yr. Peak is ${peakRatio.toFixed(1)}x median.`;
  components.push({ name: "Peak Year Severity", score: peakScore, max: 2, evidence: peakEvidence });
  totalScore += peakScore;

  const level = totalScore >= 8 ? "CRITICAL" : totalScore >= 6 ? "HIGH" : totalScore >= 4 ? "ELEVATED" : totalScore >= 2 ? "MODERATE" : "LOW";
  return { score: totalScore, max: 10, level, unit: ld.unitId, make: ld.make, model: ld.model, totalSpend: ld.totalSpend, years: years.length, components };
}

export const f$ = n => n == null ? "—" : "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
export const f$2 = n => n == null ? "—" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fH = n => n == null ? "—" : n.toFixed(1) + "h";
export const fP = n => n == null ? "—" : n.toFixed(1) + "%";
export const CLIENT_KEY = "ironclad-clients-v1";
