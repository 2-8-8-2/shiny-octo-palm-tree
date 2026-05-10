import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// =====================================================
// ENGINE FAMILIES — with compression ratios & specs
// =====================================================
const ENGINE_FAMILIES = {
  ls: {
    id: 'ls',
    name: 'GM LS',
    label: 'LS SERIES',
    subtitle: 'Gen III/IV Small Block',
    accent: '#ff6600',
    valvetrain: 'pushrod',
    fuelType: 'efi',
    defaultBuild: {
      name: 'My LS Build',
      block: 'b_ls3', heads: 'h_ls3', cam: 'c_stage2',
      intake: 'i_ls3', forcedInduction: 'fi_none', fuel: 'f_60lb',
    },
  },
  coyote: {
    id: 'coyote',
    name: 'Ford Coyote',
    label: 'COYOTE 5.0',
    subtitle: 'Gen I/II/III DOHC V8',
    accent: '#0066ff',
    valvetrain: 'dohc',
    fuelType: 'efi',
    defaultBuild: {
      name: 'My Coyote Build',
      block: 'cy_b_stock', heads: 'cy_h_stock', cam: 'cy_c_stock',
      intake: 'cy_i_stock', forcedInduction: 'fi_none', fuel: 'f_stock',
    },
  },
  bbc: {
    id: 'bbc',
    name: 'Chevy Big Block',
    label: 'BIG BLOCK',
    subtitle: 'Gen I Mark IV — 396/402/427/454',
    accent: '#cc2200',
    valvetrain: 'pushrod',
    fuelType: 'carb',
    defaultBuild: {
      name: 'My 396 Build',
      block: 'bbc_396', heads: 'bbc_oval_afr', cam: 'bbc_c_street',
      intake: 'bbc_i_singleplane', forcedInduction: 'fi_none', fuel: 'bbc_holley_650',
    },
  },
  sbc: {
    id: 'sbc',
    name: 'Chevy Small Block',
    label: 'SMALL BLOCK',
    subtitle: 'Gen I — 327/350/383/400',
    accent: '#cc8800',
    valvetrain: 'pushrod',
    fuelType: 'carb',
    defaultBuild: {
      name: 'My 350 Build',
      block: 'sbc_350', heads: 'sbc_afr_195', cam: 'sbc_c_street',
      intake: 'sbc_i_dualplane', forcedInduction: 'fi_none', fuel: 'sbc_holley_600',
    },
  },
};

// =====================================================
// LS CATALOG
// =====================================================
const CATALOG_LS = {
  block: [
    { id: 'b_lq4', name: '6.0L Iron Block (LQ4)', displacement: 364, bore: 4.0, stroke: 3.622, compression: 9.9, maxBoost: 25, cost: 1200, notes: 'Cheap, heavy, bulletproof for boost.' },
    { id: 'b_ls3', name: '6.2L Aluminum Block (LS3)', displacement: 376, bore: 4.065, stroke: 3.622, compression: 10.7, maxBoost: 18, cost: 2800, notes: 'Stock LS3 spec. Light and strong.' },
    { id: 'b_lsx', name: '427ci Aftermarket Iron (LSX)', displacement: 427, bore: 4.125, stroke: 4.0, compression: 9.5, maxBoost: 40, cost: 6500, notes: 'Purpose-built race block. Handles anything.' },
    { id: 'b_dart', name: '441ci Tall-Deck Iron', displacement: 441, bore: 4.185, stroke: 4.0, compression: 9.2, maxBoost: 45, cost: 8500, notes: 'Max LS platform. Borderline insane.' },
  ],
  heads: [
    { id: 'h_317', name: 'Cathedral Port Truck Heads', flow: 240, chamber: 71, compression: 0.5, springRate: 'stock', cost: 400, portStyle: 'cathedral', notes: 'Junkyard find. Decent flow.' },
    { id: 'h_243', name: 'Cathedral Port LS6-spec', flow: 265, chamber: 64, compression: 1.2, springRate: 'mild', cost: 700, portStyle: 'cathedral', notes: 'Better chambers. Real power bump.' },
    { id: 'h_ls3', name: 'Rectangle Port L92/LS3-spec', flow: 315, chamber: 68, compression: 0.8, springRate: 'mild', cost: 1100, portStyle: 'rectangle', notes: 'LS3 spec. Standard baseline.' },
    { id: 'h_btr', name: 'CNC Stage 3 Rectangle Port', flow: 360, chamber: 64, compression: 1.4, springRate: 'aggressive', cost: 2400, portStyle: 'rectangle', notes: 'Ported. Big valves. Needs stiff springs.' },
    { id: 'h_race', name: 'Symmetrical Port Race Heads', flow: 410, chamber: 60, compression: 1.8, springRate: 'race', cost: 4200, portStyle: 'symmetrical', notes: 'Full race. Custom intake required.' },
  ],
  cam: [
    { id: 'c_stock', name: 'Stock Replacement', dur: 196, lift: 0.467, lsa: 116, springReq: 'stock', cost: 250, character: 'docile', notes: 'Daily driver. Smooth and boring.' },
    { id: 'c_stage1', name: 'Stage 1 — Daily Driver', dur: 218, lift: 0.553, lsa: 114, springReq: 'mild', cost: 500, character: 'mild', notes: 'Tiny lope. No drivability loss.' },
    { id: 'c_stage2', name: 'Stage 2 — Streetable Lope', dur: 226, lift: 0.585, lsa: 113, springReq: 'mild', cost: 600, character: 'aggressive', notes: 'Classic LS lope. Street/strip sweet spot.' },
    { id: 'c_stage3', name: 'Stage 3 — Big Lope', dur: 234, lift: 0.617, lsa: 112, springReq: 'aggressive', cost: 750, character: 'aggressive', notes: 'Sounds mean. Sacrifices idle quality.' },
    { id: 'c_stage4', name: 'Stage 4 — Race Cam', dur: 248, lift: 0.660, lsa: 110, springReq: 'race', cost: 950, character: 'race', notes: 'Race only. Powerband 4000+ RPM.' },
    { id: 'c_boost', name: 'Boost-Specific Grind', dur: 224, lift: 0.595, lsa: 118, springReq: 'aggressive', cost: 850, character: 'mild', notes: 'Wide LSA for forced induction.' },
  ],
  intake: [
    { id: 'i_stock_truck', name: 'Truck Intake (Cathedral)', flowMatch: 'cathedral', powerCurve: 'low', cost: 150, notes: 'Low-end torque. Caps out early.' },
    { id: 'i_fast102', name: '102mm Composite (Cathedral)', flowMatch: 'cathedral', powerCurve: 'mid', cost: 900, notes: 'Better top-end than stock.' },
    { id: 'i_ls3', name: 'OEM LS3 (Rectangle)', flowMatch: 'rectangle', powerCurve: 'broad', cost: 350, notes: 'Surprisingly good. Cheap used.' },
    { id: 'i_fast_rect', name: '102mm Composite (Rectangle)', flowMatch: 'rectangle', powerCurve: 'high', cost: 1100, notes: 'Premium top-end focus.' },
    { id: 'i_sheet', name: 'Sheet Metal Race Intake', flowMatch: 'any', powerCurve: 'race', cost: 2800, notes: 'Race only. Hood clearance issues.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'Pure response. No lag.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 64mm', type: 'turbo', boost: 8, efficiency: 0.78, cost: 3500, notes: 'Quick spool. ~600 whp ceiling.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 14, efficiency: 0.76, cost: 4500, notes: 'Sweet spot. 800-1000 whp capable.' },
    { id: 'fi_turbo_big', name: 'Single Turbo — 88mm', type: 'turbo', boost: 22, efficiency: 0.72, cost: 6500, notes: 'Laggy. 1200+ whp potential.' },
    { id: 'fi_twin', name: 'Twin Turbo — 6266 x2', type: 'turbo', boost: 18, efficiency: 0.80, cost: 8500, notes: 'Best of both. Expensive.' },
    { id: 'fi_blower', name: 'Centrifugal Supercharger', type: 'centri', boost: 12, efficiency: 0.74, cost: 6000, notes: 'Linear power delivery.' },
    { id: 'fi_roots', name: 'Roots-Style Blower', type: 'roots', boost: 9, efficiency: 0.70, cost: 5500, notes: 'Instant boost. Heat at high RPM.' },
  ],
  fuel: [
    { id: 'f_stock', name: 'Stock Injectors + Pump', flowRate: 25, e85: false, cost: 0, notes: 'Stock. ~500 hp limit.' },
    { id: 'f_60lb', name: '60lb Injectors + 340lph Pump', flowRate: 60, e85: true, cost: 600, notes: '~750 hp on E85.' },
    { id: 'f_100lb', name: '100lb Injectors + Twin 450lph', flowRate: 100, e85: true, cost: 1400, notes: 'Big power capable.' },
    { id: 'f_160lb', name: '160lb Injectors + Mech Pump', flowRate: 160, e85: true, cost: 2800, notes: 'Race fuel system. 1500+ hp.' },
  ],
};

// =====================================================
// COYOTE CATALOG
// =====================================================
const CATALOG_COYOTE = {
  block: [
    { id: 'cy_b_stock', name: '5.0L Gen I/II Aluminum', displacement: 302, bore: 3.63, stroke: 3.65, compression: 11.0, maxBoost: 15, cost: 1800, notes: '11:1 stock. Sketchy over 8psi pump gas.' },
    { id: 'cy_b_gen3', name: '5.0L Gen III (2018+)', displacement: 302, bore: 3.63, stroke: 3.65, compression: 11.0, maxBoost: 20, cost: 3200, notes: 'Stronger internals than Gen I/II.' },
    { id: 'cy_b_363', name: '363ci Stroker (3.68" stroke)', displacement: 363, bore: 3.68, stroke: 3.75, compression: 10.8, maxBoost: 18, cost: 5500, notes: 'Popular. More cubes, same revs.' },
    { id: 'cy_b_408', name: '408ci Stroker (4.0" stroke)', displacement: 408, bore: 3.70, stroke: 3.75, compression: 10.5, maxBoost: 16, cost: 8500, notes: 'Max Coyote cubes. Needs clearancing.' },
  ],
  heads: [
    { id: 'cy_h_stock', name: 'OEM DOHC Heads (Gen I/II)', flow: 260, chamber: 54, compression: 0, springRate: 'stock', cost: 600, portStyle: 'dohc', notes: 'Actually decent OEM piece.' },
    { id: 'cy_h_gen3', name: 'OEM DOHC Heads (Gen III)', flow: 285, chamber: 54, compression: 0, springRate: 'mild', cost: 1200, portStyle: 'dohc', notes: 'Better port design.' },
    { id: 'cy_h_ported', name: 'CNC Ported OEM (Gen III)', flow: 335, chamber: 52, compression: 0.6, springRate: 'aggressive', cost: 2800, portStyle: 'dohc', notes: 'Most popular mod.' },
    { id: 'cy_h_af', name: 'Aftermarket DOHC Race', flow: 385, chamber: 50, compression: 1.0, springRate: 'race', cost: 5500, portStyle: 'dohc', notes: 'Titanium valves. Full race.' },
  ],
  cam: [
    { id: 'cy_c_stock', name: 'Stock Cam Set', dur: 197, lift: 0.472, lsa: 126, springReq: 'stock', cost: 0, character: 'docile', notes: 'OEM with VCT. Good low/mid.' },
    { id: 'cy_c_stage1', name: 'Stage 1 VCT Cams', dur: 212, lift: 0.510, lsa: 122, springReq: 'mild', cost: 900, character: 'mild', notes: 'Works with VCT. Biggest easy win.' },
    { id: 'cy_c_stage2', name: 'Stage 2 — Street/Strip', dur: 224, lift: 0.550, lsa: 118, springReq: 'aggressive', cost: 1400, character: 'aggressive', notes: 'VCT compatible. Strong 4500-7000.' },
    { id: 'cy_c_stage3', name: 'Stage 3 — Race Cams', dur: 238, lift: 0.590, lsa: 114, springReq: 'race', cost: 1900, character: 'race', notes: 'Locks out VCT. Screams above 5k.' },
    { id: 'cy_c_boost', name: 'Boost-Spec Cam Set', dur: 218, lift: 0.530, lsa: 128, springReq: 'aggressive', cost: 1600, character: 'mild', notes: 'Wide LSA for boost.' },
  ],
  intake: [
    { id: 'cy_i_stock', name: 'OEM Intake Manifold', flowMatch: 'dohc', powerCurve: 'broad', cost: 200, notes: 'Gen III OEM excellent.' },
    { id: 'cy_i_ported', name: 'Ported OEM Manifold', flowMatch: 'dohc', powerCurve: 'mid', cost: 600, notes: 'DIY or shop ported.' },
    { id: 'cy_i_wms', name: 'Composite High-Rise (92mm)', flowMatch: 'dohc', powerCurve: 'high', cost: 1400, notes: 'High-RPM focused.' },
    { id: 'cy_i_race', name: 'Individual Throttle Bodies', flowMatch: 'dohc', powerCurve: 'race', cost: 3800, notes: 'Sounds like F1. Not streetable.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'Pure Coyote magic.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 64mm', type: 'turbo', boost: 8, efficiency: 0.78, cost: 3500, notes: 'Quick spool.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 14, efficiency: 0.76, cost: 4500, notes: 'Sweet spot.' },
    { id: 'fi_turbo_big', name: 'Single Turbo — 88mm', type: 'turbo', boost: 22, efficiency: 0.72, cost: 6500, notes: 'Laggy monster.' },
    { id: 'fi_twin', name: 'Twin Turbo — 6266 x2', type: 'turbo', boost: 18, efficiency: 0.80, cost: 8500, notes: 'Best both worlds.' },
    { id: 'fi_blower', name: 'Centrifugal Supercharger', type: 'centri', boost: 12, efficiency: 0.74, cost: 6000, notes: 'Linear power.' },
    { id: 'fi_roots', name: 'Roots-Style Blower', type: 'roots', boost: 9, efficiency: 0.70, cost: 5500, notes: 'Instant boost.' },
  ],
  fuel: [
    { id: 'f_stock', name: 'Stock Direct Injection', flowRate: 30, e85: false, cost: 0, notes: 'GDI. ~550 hp limit.' },
    { id: 'cy_f_pi', name: 'Port Injection Add-On Kit', flowRate: 55, e85: true, cost: 1100, notes: 'Adds PI to GDI. Best of both.' },
    { id: 'f_100lb', name: '100lb Injectors + Twin 450lph', flowRate: 100, e85: true, cost: 1400, notes: 'Big power capable.' },
    { id: 'f_160lb', name: '160lb Injectors + Mech Pump', flowRate: 160, e85: true, cost: 2800, notes: 'Race fuel system.' },
  ],
};

// =====================================================
// BBC CATALOG
// =====================================================
const CATALOG_BBC = {
  block: [
    { id: 'bbc_396', name: '396ci (6.5L)', displacement: 396, bore: 4.094, stroke: 3.76, compression: 10.25, maxBoost: 12, cost: 800, notes: 'The classic. Great bottom end torque.' },
    { id: 'bbc_402', name: '402ci — Bored .030"', displacement: 402, bore: 4.125, stroke: 3.76, compression: 10.5, maxBoost: 12, cost: 950, notes: 'Same block, more cubes. Common rebuild.' },
    { id: 'bbc_427', name: '427ci — Stroker Kit', displacement: 427, bore: 4.125, stroke: 4.0, compression: 9.8, maxBoost: 10, cost: 2200, notes: 'Corvette legend. Serious torque.' },
    { id: 'bbc_454', name: '454ci — Factory Big Dog', displacement: 454, bore: 4.25, stroke: 4.0, compression: 9.0, maxBoost: 10, cost: 2800, notes: '450 lb-ft stock. Legendary.' },
    { id: 'bbc_496', name: '496ci — 4.250 Bore Stroker', displacement: 496, bore: 4.25, stroke: 4.375, compression: 8.5, maxBoost: 8, cost: 4500, notes: 'Bracket racing favorite.' },
    { id: 'bbc_dart', name: '540ci Dart Big M Block', displacement: 540, bore: 4.50, stroke: 4.25, compression: 8.2, maxBoost: 18, cost: 7500, notes: 'Aftermarket race block.' },
  ],
  heads: [
    { id: 'bbc_oval_cast', name: 'Oval Port Cast Iron', flow: 270, chamber: 118, compression: 0, springRate: 'stock', cost: 300, portStyle: 'oval', notes: 'Bones of a million muscle cars.' },
    { id: 'bbc_oval_edel', name: 'Edelbrock RPM Oval (Aluminum)', flow: 305, chamber: 110, compression: 1.0, springRate: 'mild', cost: 1100, portStyle: 'oval', notes: '50 lb savings. Good for NA or mild boost.' },
    { id: 'bbc_oval_afr', name: 'AFR 305 Oval Port (Aluminum)', flow: 330, chamber: 107, compression: 1.4, springRate: 'aggressive', cost: 1800, portStyle: 'oval', notes: 'Best oval port available.' },
    { id: 'bbc_rect_cast', name: 'Rectangular Port Cast', flow: 310, chamber: 118, compression: 0.2, springRate: 'mild', cost: 450, portStyle: 'rect', notes: 'Better flow than oval. Needs matching intake.' },
    { id: 'bbc_rect_brodix', name: 'Brodix BB-2 Plus Rect (Aluminum)', flow: 370, chamber: 112, compression: 1.6, springRate: 'aggressive', cost: 2200, portStyle: 'rect', notes: 'Pro-level street/strip weapon.' },
    { id: 'bbc_rect_afr', name: 'AFR 385 Rect Port Race (Aluminum)', flow: 390, chamber: 108, compression: 1.8, springRate: 'race', cost: 3200, portStyle: 'rect', notes: 'CNC race heads.' },
  ],
  cam: [
    { id: 'bbc_c_mild', name: 'Mild Street (214°/218°)', dur: 216, lift: 0.480, lsa: 114, springReq: 'stock', cost: 280, character: 'docile', notes: 'Smooth idle. Tow rig quality.' },
    { id: 'bbc_c_street', name: 'Street/Strip (228°/234°)', dur: 231, lift: 0.520, lsa: 112, springReq: 'mild', cost: 350, character: 'mild', notes: 'Sweet spot. Lopey. Strong mid-range.' },
    { id: 'bbc_c_hot_street', name: 'Hot Street (236°/242°)', dur: 239, lift: 0.560, lsa: 110, springReq: 'mild', cost: 420, character: 'aggressive', notes: 'Gets rowdy. Needs 2500+ stall.' },
    { id: 'bbc_c_strip', name: 'Street/Strip Aggressive (248°/254°)', dur: 251, lift: 0.595, lsa: 108, springReq: 'aggressive', cost: 550, character: 'aggressive', notes: 'Rough idle. 3000+ stall required.' },
    { id: 'bbc_c_race', name: 'Full Race (260°/268°)', dur: 264, lift: 0.640, lsa: 106, springReq: 'race', cost: 750, character: 'race', notes: 'No idle. Track only. Insane sound.' },
    { id: 'bbc_c_boost', name: 'Boost/Nitrous Grind', dur: 227, lift: 0.530, lsa: 116, springReq: 'mild', cost: 480, character: 'mild', notes: 'Wide LSA for forced induction.' },
  ],
  intake: [
    { id: 'bbc_i_dualplane', name: 'Edelbrock Performer (Dual Plane)', flowMatch: 'oval', powerCurve: 'low', cost: 350, notes: 'Best street intake. Strong low/mid torque.' },
    { id: 'bbc_i_rpm', name: 'Edelbrock RPM (Dual Plane)', flowMatch: 'oval', powerCurve: 'mid', cost: 480, notes: 'Extends powerband higher.' },
    { id: 'bbc_i_singleplane', name: 'Edelbrock Air-Gap (Single Plane)', flowMatch: 'oval', powerCurve: 'high', cost: 580, notes: 'Top-end focused. Loses some low-end.' },
    { id: 'bbc_i_rect_rpm', name: 'Edelbrock RPM Air-Gap (Rect Port)', flowMatch: 'rect', powerCurve: 'high', cost: 650, notes: 'Rect port single plane.' },
    { id: 'bbc_i_holley_strip', name: 'Holley Strip Dominator (Rect Port)', flowMatch: 'rect', powerCurve: 'race', cost: 880, notes: 'Race intake. Hood scoop required.' },
    { id: 'bbc_i_tunnel', name: 'Tunnel Ram (Rect Port)', flowMatch: 'rect', powerCurve: 'race', cost: 1400, notes: 'Dual-carb tunnel ram. Pure race.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'Big cubic inches do the work.' },
    { id: 'fi_nitrous_100', name: 'Wet Nitrous — 100 Shot', type: 'nitrous', boost: 4, efficiency: 0.88, cost: 600, notes: '100 hp shot. Safe on stock internals.' },
    { id: 'fi_nitrous_150', name: 'Wet Nitrous — 150 Shot', type: 'nitrous', boost: 5, efficiency: 0.85, cost: 700, notes: 'Getting sketchy. Forged pistons recommended.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 64mm', type: 'turbo', boost: 8, efficiency: 0.78, cost: 3500, notes: 'Bracket car material.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 12, efficiency: 0.76, cost: 4500, notes: 'BBC + turbo = obscene torque.' },
    { id: 'fi_roots', name: 'BDS 8-71 Roots Blower', type: 'roots', boost: 8, efficiency: 0.72, cost: 5800, notes: '1960s dragster vibes. Through the hood.' },
  ],
  fuel: [
    { id: 'bbc_holley_600', name: 'Holley 600 CFM (4160)', flowRate: 600, e85: false, cost: 350, notes: 'Conservative. Mild 396/402 builds.' },
    { id: 'bbc_holley_650', name: 'Holley 650 CFM (Double Pumper)', flowRate: 650, e85: false, cost: 480, notes: 'Classic street/strip carb.' },
    { id: 'bbc_holley_750', name: 'Holley 750 CFM (Double Pumper)', flowRate: 750, e85: false, cost: 560, notes: 'Good for 454+ or hot 396.' },
    { id: 'bbc_holley_850', name: 'Holley 850 CFM (Ultra HP)', flowRate: 850, e85: false, cost: 750, notes: '500 hp+ territory. Needs big cam.' },
    { id: 'bbc_demon_1050', name: 'Barry Grant 1050 CFM Demon', flowRate: 1050, e85: false, cost: 1200, notes: 'Race carb. Too big for street.' },
    { id: 'bbc_e85_750', name: 'Quick Fuel 750 CFM E85-Ready', flowRate: 750, e85: true, cost: 900, notes: 'Modified for E85. Safer on boost.' },
  ],
};

// =====================================================
// SBC CATALOG
// =====================================================
const CATALOG_SBC = {
  block: [
    { id: 'sbc_327', name: '327ci — The High-Revver', displacement: 327, bore: 4.0, stroke: 3.25, compression: 11.0, maxBoost: 14, cost: 600, notes: 'Rev-happy. Loves to spin. 1960s special.' },
    { id: 'sbc_350', name: '350ci — Universal Donor', displacement: 350, bore: 4.0, stroke: 3.48, compression: 9.0, maxBoost: 14, cost: 700, notes: 'Most common V8 ever. Bulletproof.' },
    { id: 'sbc_383', name: '383ci Stroker (3.75" stroke)', displacement: 383, bore: 4.03, stroke: 3.75, compression: 9.5, maxBoost: 12, cost: 1800, notes: 'Best bang-for-buck stroker.' },
    { id: 'sbc_400', name: '400ci — Fat Small Block', displacement: 400, bore: 4.125, stroke: 3.75, compression: 8.5, maxBoost: 10, cost: 900, notes: 'Siamese bores. Torque king. Needs rods.' },
    { id: 'sbc_434', name: '434ci Dart SHP Stroker', displacement: 434, bore: 4.155, stroke: 4.0, compression: 9.0, maxBoost: 14, cost: 5500, notes: 'Maximum small block cubes.' },
  ],
  heads: [
    { id: 'sbc_camel', name: 'Camelback Iron (Stock 350)', flow: 155, chamber: 76, compression: 0, springRate: 'stock', cost: 100, portStyle: 'sbc_std', notes: 'Junkyard find. Gets the job done.' },
    { id: 'sbc_double_hump', name: 'Double Hump / Fuelie Heads', flow: 185, chamber: 64, compression: 1.2, springRate: 'stock', cost: 250, portStyle: 'sbc_std', notes: 'Classic 1960s performance head.' },
    { id: 'sbc_vortec', name: 'GM Vortec Iron Heads (906/062)', flow: 210, chamber: 64, compression: 1.0, springRate: 'mild', cost: 350, portStyle: 'sbc_vortec', notes: 'Best stock head GM made.' },
    { id: 'sbc_edel_e210', name: 'Edelbrock E-210 Performer (Aluminum)', flow: 230, chamber: 64, compression: 1.4, springRate: 'mild', cost: 900, portStyle: 'sbc_std', notes: 'Bolt-on aluminum upgrade.' },
    { id: 'sbc_afr_195', name: 'AFR 195cc Street (Aluminum)', flow: 270, chamber: 65, compression: 1.6, springRate: 'aggressive', cost: 1600, portStyle: 'sbc_std', notes: 'Best street/strip SBC head.' },
    { id: 'sbc_afr_227', name: 'AFR 227cc Race (Aluminum)', flow: 310, chamber: 65, compression: 1.8, springRate: 'race', cost: 2400, portStyle: 'sbc_std', notes: 'Race heads. Needs big cam.' },
  ],
  cam: [
    { id: 'sbc_c_mild', name: 'Mild Street (210°/218°)', dur: 214, lift: 0.450, lsa: 114, springReq: 'stock', cost: 220, character: 'docile', notes: 'Daily driver cam.' },
    { id: 'sbc_c_street', name: 'Street/Strip (224°/232°)', dur: 228, lift: 0.480, lsa: 112, springReq: 'mild', cost: 300, character: 'mild', notes: 'Classic hot rod cam.' },
    { id: 'sbc_c_hot_street', name: 'Hot Street (236°/244°)', dur: 240, lift: 0.530, lsa: 110, springReq: 'mild', cost: 380, character: 'aggressive', notes: 'Gets rowdy. Needs 2200+ stall.' },
    { id: 'sbc_c_strip', name: 'Strip Cam (252°/260°)', dur: 256, lift: 0.570, lsa: 108, springReq: 'aggressive', cost: 500, character: 'aggressive', notes: 'Race cam. Rough idle.' },
    { id: 'sbc_c_race', name: 'Full Race (268°/276°)', dur: 272, lift: 0.620, lsa: 106, springReq: 'race', cost: 700, character: 'race', notes: 'Track only. Will not idle.' },
    { id: 'sbc_c_boost', name: 'Boost/Nitrous Grind', dur: 224, lift: 0.500, lsa: 116, springReq: 'mild', cost: 380, character: 'mild', notes: 'Wide LSA for boost/nitrous.' },
  ],
  intake: [
    { id: 'sbc_i_vortec', name: 'Vortec-Style Intake', flowMatch: 'sbc_vortec', powerCurve: 'mid', cost: 280, notes: 'Vortec bolt pattern only.' },
    { id: 'sbc_i_dualplane', name: 'Edelbrock Performer (Dual Plane)', flowMatch: 'sbc_std', powerCurve: 'low', cost: 300, notes: 'Best street intake.' },
    { id: 'sbc_i_rpm', name: 'Edelbrock Performer RPM (Dual Plane)', flowMatch: 'sbc_std', powerCurve: 'mid', cost: 420, notes: 'Extends powerband higher.' },
    { id: 'sbc_i_airgap', name: 'Edelbrock Air-Gap RPM (Single Plane)', flowMatch: 'sbc_std', powerCurve: 'high', cost: 550, notes: 'Top-end focused. Air gap design.' },
    { id: 'sbc_i_stealth', name: 'Holley Stealth Ram (Single Plane)', flowMatch: 'sbc_std', powerCurve: 'high', cost: 700, notes: 'High-rise single plane.' },
    { id: 'sbc_i_dominator', name: 'Holley Dominator (Single Plane)', flowMatch: 'sbc_std', powerCurve: 'race', cost: 900, notes: 'Race only. Hood scoop required.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: '350 cubic inches of tradition.' },
    { id: 'fi_nitrous_75', name: 'Wet Nitrous — 75 Shot', type: 'nitrous', boost: 3, efficiency: 0.90, cost: 500, notes: 'Safe on stock internals.' },
    { id: 'fi_nitrous_100', name: 'Wet Nitrous — 100 Shot', type: 'nitrous', boost: 4, efficiency: 0.88, cost: 600, notes: 'Forged pistons recommended.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 57mm', type: 'turbo', boost: 8, efficiency: 0.80, cost: 2800, notes: 'Quick spool on small block.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 67mm', type: 'turbo', boost: 12, efficiency: 0.77, cost: 3800, notes: '600+ hp capable.' },
    { id: 'fi_blower', name: 'Weiand 142 Roots Blower', type: 'roots', boost: 6, efficiency: 0.73, cost: 3200, notes: 'Classic hot rod look.' },
  ],
  fuel: [
    { id: 'sbc_holley_500', name: 'Holley 500 CFM (Street Avenger)', flowRate: 500, e85: false, cost: 280, notes: 'Budget street 350 only.' },
    { id: 'sbc_holley_600', name: 'Holley 600 CFM (4160)', flowRate: 600, e85: false, cost: 350, notes: 'Right-sized for street 350.' },
    { id: 'sbc_holley_750', name: 'Holley 750 CFM (Double Pumper)', flowRate: 750, e85: false, cost: 540, notes: 'Good for 383 stroker.' },
    { id: 'sbc_edel_800', name: 'Edelbrock 800 CFM (Thunder Series)', flowRate: 800, e85: false, cost: 620, notes: 'Easy to tune. Self-metering.' },
    { id: 'sbc_holley_850', name: 'Holley 850 CFM (Ultra HP)', flowRate: 850, e85: false, cost: 750, notes: 'Race carb on street car.' },
    { id: 'sbc_e85_650', name: 'Quick Fuel 650 CFM E85-Ready', flowRate: 650, e85: true, cost: 800, notes: 'More power on E85.' },
  ],
};

function getCatalog(family) {
  if (family === 'coyote') return CATALOG_COYOTE;
  if (family === 'bbc') return CATALOG_BBC;
  if (family === 'sbc') return CATALOG_SBC;
  return CATALOG_LS;
}

// =====================================================
// STORAGE ADAPTER
// =====================================================
function getStorageAdapter() {
  if (typeof window === 'undefined') return null;
  if (window.storage?.get && window.storage?.set && window.storage?.delete) {
    return { get: (k) => window.storage.get(k), set: (k, v) => window.storage.set(k, v), delete: (k) => window.storage.delete(k), list: (p) => window.storage.list?.(p) };
  }
  if (window.localStorage) {
    return {
      get: async (k) => { const v = window.localStorage.getItem(k); return v ? { value: v } : null; },
      set: async (k, v) => window.localStorage.setItem(k, v),
      delete: async (k) => window.localStorage.removeItem(k),
      list: async (p) => ({ keys: Object.keys(window.localStorage).filter(k => k.startsWith(p)) }),
    };
  }
  return null;
}

function sanitizeBuild(raw) {
  const fam = ENGINE_FAMILIES[raw?.family]?.id || 'ls';
  const def = ENGINE_FAMILIES[fam].defaultBuild;
  return { family: fam, ...def, ...(raw || {}) };
}

// =====================================================
// COMPRESSION RATIO CALCULATOR
// =====================================================
function calculateCR(blockId, headId, catalog) {
  const block = catalog.block.find(b => b.id === blockId);
  const head = catalog.heads.find(h => h.id === headId);
  if (!block || !head) return 10.0;
  return Math.round((block.compression + head.compression) * 10) / 10;
}

// =====================================================
// CARB CFM CALCULATOR
// =====================================================
function calculateIdealCFM(displacement, camChar) {
  const base = displacement * 0.6;
  const mult = { docile: 0.85, mild: 1.0, aggressive: 1.1, race: 1.25 }[camChar] || 1.0;
  return Math.round(base * mult);
}

// =====================================================
// COMPATIBILITY CHECKER
// =====================================================
function checkCompatibility(build) {
  const CAT = getCatalog(build.family);
  const issues = [];
  const head = CAT.heads.find(h => h.id === build.heads);
  const intake = CAT.intake.find(i => i.id === build.intake);
  const cam = CAT.cam.find(c => c.id === build.cam);
  const fi = CAT.forcedInduction.find(f => f.id === build.forcedInduction);
  const block = CAT.block.find(b => b.id === build.block);

  // Port matching
  if (head && intake && intake.flowMatch !== 'any' && intake.flowMatch !== head.portStyle) {
    issues.push({ severity: 'error', message: `Intake (${intake.flowMatch}) won't bolt to heads (${head.portStyle}).` });
  }

  // SBC Vortec check
  if (build.family === 'sbc' && head?.portStyle === 'sbc_vortec' && intake?.flowMatch !== 'sbc_vortec') {
    issues.push({ severity: 'error', message: `This intake won't fit Vortec bolt pattern.` });
  }

  // Spring requirement
  const springOrder = { stock: 0, mild: 1, aggressive: 2, race: 3 };
  if (cam && head && springOrder[cam.springReq] > springOrder[head.springRate]) {
    issues.push({ severity: 'warn', message: `Cam needs ${cam.springReq} springs but heads have ${head.springRate}. Upgrade springs.` });
  }

  // Coyote high compression + boost
  if (build.family === 'coyote' && block) {
    const cr = calculateCR(block.id, build.heads, CAT);
    if (fi?.boost > 8 && cr > 10.8) {
      issues.push({ severity: 'warn', message: `${cr}:1 CR + ${fi.boost}psi on pump gas = detonation risk. Use E85.` });
    }
  }

  // FIX: Carb sizing check — use the fuel (carb) item's flowRate, not the intake manifold's
  if ((build.family === 'bbc' || build.family === 'sbc') && cam && block) {
    const ideal = calculateIdealCFM(block.displacement, cam.character);
    const fuelItem = CAT.fuel.find(f => f.id === build.fuel);
    if (fuelItem?.flowRate) {
      if (fuelItem.flowRate < ideal * 0.75) {
        issues.push({ severity: 'warn', message: `${fuelItem.flowRate} CFM undersized (ideal ~${ideal}). Leaves power on table.` });
      }
      if (fuelItem.flowRate > ideal * 1.5 && cam.character !== 'race') {
        issues.push({ severity: 'info', message: `${fuelItem.flowRate} CFM oversized (ideal ~${ideal}). Hurts street driveability.` });
      }
    }
  }

  // Boost ceiling
  if (fi?.boost > 0 && block && fi.boost > block.maxBoost) {
    issues.push({ severity: 'error', message: `${fi.boost}psi exceeds block limit (${block.maxBoost}psi).` });
  }

  // Tight LSA for boost
  if (fi?.boost > 0 && fi.type !== 'nitrous' && cam?.lsa < 113) {
    issues.push({ severity: 'warn', message: `LSA ${cam.lsa}° is tight for boost. Consider wide LSA grind.` });
  }

  // Nitrous on cast pistons
  if (fi?.type === 'nitrous' && fi.boost >= 4) {
    issues.push({ severity: 'warn', message: `100+ shot on stock pistons is risky. Forged recommended.` });
  }

  // Race cam on NA
  if (cam?.character === 'race' && fi?.type === 'none' && build._estPower < 500) {
    issues.push({ severity: 'info', message: `Race cam on NA = losing low-end power for top-end you might not use.` });
  }

  return issues;
}

// =====================================================
// REALISTIC DYNO SIMULATOR
// =====================================================
function simulateDyno(build) {
  const CAT = getCatalog(build.family);
  const block = CAT.block.find(b => b.id === build.block);
  const head = CAT.heads.find(h => h.id === build.heads);
  const cam = CAT.cam.find(c => c.id === build.cam);
  const intake = CAT.intake.find(i => i.id === build.intake);
  const fi = CAT.forcedInduction.find(f => f.id === build.forcedInduction);
  const fuel = CAT.fuel.find(f => f.id === build.fuel);

  if (!block || !head || !cam || !intake || !fi || !fuel) return [];

  const disL = block.displacement * 0.0163871;
  const isCoyote = build.family === 'coyote';
  const isGenI = build.family === 'bbc' || build.family === 'sbc';
  const isBBC = build.family === 'bbc';

  const rpm = isCoyote ? [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
    : isGenI ? [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000]
    : [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500];

  const intakePeaks = { low: 3800, mid: 4800, broad: 5200, high: 5800, race: 6500 };
  const camPeaks = {
    docile: isGenI ? 3800 : 5200,
    mild: isGenI ? 4800 : 6000,
    aggressive: isGenI ? 5500 : 6800,
    race: isGenI ? 6200 : 7500,
  };

  const peakRpm = (intakePeaks[intake.powerCurve] + camPeaks[cam.character]) / 2;
  const cr = calculateCR(block.id, head.id, CAT);
  const baseMult = isBBC ? 10.5 : isGenI ? 9.3 : isCoyote ? 7.8 : 8.5;
  const flowBaseline = isGenI ? 290 : isCoyote ? 260 : 280;
  const flowFactor = head.flow / flowBaseline;
  const liftBaseline = isGenI ? 0.520 : isCoyote ? 0.472 : 0.617;
  const liftFactor = 0.78 + (cam.lift / liftBaseline) * 0.28;
  const vctBonus = isCoyote && (cam.character === 'docile' || cam.character === 'mild') ? 1.08 : 1.0;

  let carbFactor = 1.0;
  if (isGenI && fuel.flowRate) {
    const ideal = calculateIdealCFM(block.displacement, cam.character);
    carbFactor = Math.min(1.0, fuel.flowRate / ideal) * 0.35 + 0.65;
    if (fuel.e85) carbFactor *= 1.06;
  }

  const fuelCeilingHp = isGenI
    ? fuel.flowRate * (fuel.e85 ? 0.75 : 0.62)
    : fuel.flowRate * (fuel.e85 ? 7.5 : 9.5);

  const boostMult = fi.type === 'none' ? 1.0 : fi.type === 'nitrous' ? 1 + (fi.boost / 14.7) * fi.efficiency * 0.65 : 1 + (fi.boost / 14.7) * fi.efficiency;

  const curve = rpm.map(r => {
    const dist = Math.abs(r - peakRpm) / peakRpm;
    const veWidth = isGenI ? 0.85 : isCoyote ? 0.95 : 1.1;
    let ve = 0.95 - Math.pow(dist, 2) * veWidth;

    if (cam.character === 'race' && r < (isGenI ? 3500 : 4000)) ve *= 0.65;
    if (cam.character === 'docile' && r > (isGenI ? 5200 : 6500)) ve *= 0.72;

    ve = Math.max(0.4, Math.min(isCoyote ? 1.12 : isGenI ? 1.08 : 1.05, ve)) * vctBonus * carbFactor;

    const crFactor = 0.92 + (cr - 9.0) * 0.015;
    let tq = (disL * 14.7 * ve * flowFactor * liftFactor * boostMult * crFactor) * baseMult;

    if (fi.type === 'turbo' && r < 3500) tq *= 0.50 + (r - 1500) / 4000;
    if (fi.type === 'centri') tq *= 0.68 + (r / 7500) * 0.42;
    if (fi.type === 'nitrous') tq += fi.boost * 22 * (r > 2500 ? 1.0 : r / 2500);

    if (isCoyote && r > 7000 && cam.character !== 'race') tq *= 0.88;
    if (isGenI && r > 6000 && cam.character !== 'race') tq *= Math.max(0.70, 1 - (r - 6000) / 8000);

    let hp = (tq * r) / 5252;
    if (hp > fuelCeilingHp) hp = fuelCeilingHp + (hp - fuelCeilingHp) * 0.08;
    tq = (hp * 5252) / r;

    return { rpm: r, hp: Math.round(Math.max(0, hp)), tq: Math.round(Math.max(0, tq)) };
  });

  return curve;
}

function totalCost(build) {
  const CAT = getCatalog(build.family);
  return ['block', 'heads', 'cam', 'intake', 'forcedInduction', 'fuel']
    .reduce((sum, key) => {
      const part = (CAT[key] || []).find(p => p.id === build[key]);
      return sum + (part?.cost || 0);
    }, 0);
}

function peakStats(dyno) {
  if (!dyno.length) return { hp: 0, tq: 0, hpRpm: 0, tqRpm: 0 };
  const pH = dyno.reduce((m, p) => p.hp > m.hp ? p : m);
  const pT = dyno.reduce((m, p) => p.tq > m.tq ? p : m);
  return { hp: pH.hp, tq: pT.tq, hpRpm: pH.rpm, tqRpm: pT.rpm };
}

// =====================================================
// 3D ENGINE VIEWER
// =====================================================
function Engine3D({ build }) {
  const mountRef = useRef(null);
  const engineGroupRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    scene.fog = new THREE.Fog(0x0a0a0c, 8, 20);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x404048, 0.4);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.2);
    keyLight.position.set(5, 8, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xff6600, 0.4);
    rimLight.position.set(0, 1, -5);
    scene.add(rimLight);

    const floorGeom = new THREE.PlaneGeometry(20, 20);
    const floor = new THREE.Mesh(floorGeom, new THREE.MeshStandardMaterial({ color: 0x151518, roughness: 0.8, metalness: 0.2 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.8;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(20, 20, 0x222228, 0x18181c);
    grid.position.y = -0.79;
    scene.add(grid);

    const engineGroup = new THREE.Group();
    engineGroupRef.current = engineGroup;
    scene.add(engineGroup);

    let isDragging = false, prevMouse = { x: 0, y: 0 }, rotY = Math.PI / 6, rotX = 0.2, camDist = 6.5;

    const onMouseDown = (e) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      rotY += (e.clientX - prevMouse.x) * 0.01;
      rotX = Math.max(-0.5, Math.min(1.2, rotX + (e.clientY - prevMouse.y) * 0.01));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e) => { e.preventDefault(); camDist = Math.max(3, Math.min(12, camDist + e.deltaY * 0.005)); };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // FIX: store frame ID so we can cancel it on unmount
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      camera.position.x = Math.sin(rotY) * Math.cos(rotX) * camDist;
      camera.position.y = Math.sin(rotX) * camDist + 0.5;
      camera.position.z = Math.cos(rotY) * Math.cos(rotX) * camDist;
      camera.lookAt(0, 0.3, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (mount) {
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (mount?.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const group = engineGroupRef.current;
    if (!group) return;
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    const CAT = getCatalog(build.family);
    const block = CAT.block.find(b => b.id === build.block);
    const head = CAT.heads.find(h => h.id === build.heads);
    const intake = CAT.intake.find(i => i.id === build.intake);
    const fi = CAT.forcedInduction.find(f => f.id === build.forcedInduction);

    const isCoyote = build.family === 'coyote';
    const isBBC = build.family === 'bbc';
    const isSBC = build.family === 'sbc';
    const isGenI = isBBC || isSBC;
    const scale = block ? Math.pow(block.displacement / (isBBC ? 396 : isSBC ? 350 : isCoyote ? 302 : 376), 0.33) : 1;

    const blockColor = isGenI ? 0x707478 : 0xa0a4a8;
    const blockMat = new THREE.MeshStandardMaterial({ color: blockColor, metalness: isGenI ? 0.6 : 0.85, roughness: isGenI ? 0.5 : 0.35 });

    const blockW = isBBC ? 2.7 * scale : isSBC ? 2.4 * scale : 2.4 * scale;
    const blockH = isBBC ? 1.5 : isSBC ? 1.35 : 1.4;
    const blockD = isBBC ? 1.8 : isSBC ? 1.6 : 1.6;

    const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(blockW, blockH, blockD), blockMat);
    mainBlock.castShadow = true;
    group.add(mainBlock);

    const oilPan = new THREE.Mesh(
      new THREE.BoxGeometry(blockW * 0.85, 0.45, blockD * 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.7, roughness: 0.4 })
    );
    oilPan.position.y = -(blockH / 2 + 0.22);
    oilPan.castShadow = true;
    group.add(oilPan);

    if (isCoyote) {
      const headMat = new THREE.MeshStandardMaterial({ color: 0xb8bcbf, metalness: 0.92, roughness: 0.28 });
      [-1, 1].forEach(side => {
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(2.1 * scale, 0.45, 0.65), headMat);
        headBox.position.set(side * 0.55, 0.95, 0);
        headBox.rotation.z = side * 0.28;
        headBox.castShadow = true;
        group.add(headBox);

        const cover = new THREE.Mesh(new THREE.BoxGeometry(2.0 * scale, 0.45, 0.60),
          new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.6, roughness: 0.3 }));
        cover.position.set(side * 0.55, 1.37, 0);
        group.add(cover);
      });

      if (intake) {
        const h = intake.powerCurve === 'race' ? 0.55 : intake.powerCurve === 'high' ? 0.45 : 0.35;
        const plenum = new THREE.Mesh(new THREE.BoxGeometry(2.0 * scale, h, 0.7),
          new THREE.MeshStandardMaterial({ color: 0x1a1a20, metalness: 0.5, roughness: 0.45 }));
        plenum.position.y = 1.4 + h / 2;
        group.add(plenum);
      }
    } else if (isGenI) {
      const headMat = new THREE.MeshStandardMaterial({ color: 0xb8bcbf, metalness: 0.9, roughness: 0.3 });
      [-1, 1].forEach(side => {
        const headBox = new THREE.Mesh(new THREE.BoxGeometry(blockW * 0.82, 0.5, 0.75), headMat);
        headBox.position.set(side * 0.65, blockH / 2 + 0.2, 0);
        headBox.rotation.z = side * 0.35;
        headBox.castShadow = true;
        group.add(headBox);

        const vc = new THREE.Mesh(new THREE.BoxGeometry(blockW * 0.8, 0.35, 0.7),
          new THREE.MeshStandardMaterial({ color: isBBC ? 0x2a2a34 : 0x3a3a40, metalness: 0.55, roughness: 0.4 }));
        vc.position.set(side * 0.65, blockH / 2 + 0.55, 0);
        vc.castShadow = true;
        group.add(vc);
      });

      if (intake) {
        const h = intake.powerCurve === 'race' ? 0.8 : intake.powerCurve === 'high' ? 0.65 : 0.45;
        const manifold = new THREE.Mesh(new THREE.BoxGeometry(blockW * 0.75, h, isBBC ? 1.3 : 1.1),
          new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.5, roughness: 0.45 }));
        manifold.position.y = blockH / 2 + h / 2 + 0.05;
        group.add(manifold);

        const carb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.65),
          new THREE.MeshStandardMaterial({ color: 0xc8c8c4, metalness: 0.8, roughness: 0.25 }));
        carb.position.y = blockH / 2 + h + 0.3;
        group.add(carb);

        const cleaner = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 24),
          new THREE.MeshStandardMaterial({ color: 0xd0d0cc, metalness: 0.9, roughness: 0.15 }));
        cleaner.position.y = blockH / 2 + h + 0.65;
        group.add(cleaner);
      }

      const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 12),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.6, roughness: 0.5 }));
      dist.position.set(-blockW / 2 + 0.1, blockH / 2 + 0.1, -blockD / 2 + 0.15);
      group.add(dist);
    }

    if (fi && fi.type === 'turbo') {
      const turbo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.95, roughness: 0.2 }));
      turbo.rotation.z = Math.PI / 2;
      turbo.position.set(-1.8, 0.2, 0.8);
      group.add(turbo);
    } else if (fi && fi.type === 'roots') {
      const blower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.7, roughness: 0.3 }));
      blower.position.y = 1.95;
      group.add(blower);
    }
  }, [build]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}

// =====================================================
// MAIN APP
// =====================================================
export default function EngineBuilder() {
  const [family, setFamily] = useState('ls');
  const [build, setBuild] = useState({ family: 'ls', ...ENGINE_FAMILIES.ls.defaultBuild });
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [compareWith, setCompareWith] = useState(null);
  const [activeTab, setActiveTab] = useState('block');

  const familyConfig = ENGINE_FAMILIES[family];
  const accent = familyConfig.accent;
  const CAT = getCatalog(family);

  const switchFamily = (fam) => {
    setFamily(fam);
    setBuild({ family: fam, ...ENGINE_FAMILIES[fam].defaultBuild });
    setActiveTab('block');
    setCompareWith(null);
  };

  useEffect(() => {
    (async () => {
      const adapter = getStorageAdapter();
      if (!adapter) return;
      try {
        const result = await adapter.list('build:');
        if (result?.keys?.length) {
          const builds = await Promise.all(result.keys.map(async k => {
            try { const r = await adapter.get(k); return r ? sanitizeBuild(JSON.parse(r.value)) : null; } catch { return null; }
          }));
          setSavedBuilds(builds.filter(Boolean));
        }
      } catch {}
    })();
  }, []);

  const dyno = useMemo(() => simulateDyno(build), [build]);
  const peak = useMemo(() => peakStats(dyno), [dyno]);
  const cost = useMemo(() => totalCost(build), [build]);
  const issues = useMemo(() => checkCompatibility({ ...build, _estPower: peak.hp }), [build, peak.hp]);

  const compareDyno = useMemo(() => compareWith ? simulateDyno(compareWith) : [], [compareWith]);
  const comparePeak = useMemo(() => peakStats(compareDyno), [compareDyno]);

  // FIX: memoize chartData to avoid recalculation on every render
  const chartData = useMemo(() => dyno.map((d, i) => ({
    rpm: d.rpm, hp: d.hp, tq: d.tq,
    ...(compareDyno[i] ? { hp_b: compareDyno[i].hp, tq_b: compareDyno[i].tq } : {}),
  })), [dyno, compareDyno]);

  const saveBuild = async () => {
    const id = `build:${Date.now()}`;
    const toSave = { ...build, id, peakHp: peak.hp, peakTq: peak.tq, cost };
    const adapter = getStorageAdapter();
    if (!adapter) { alert('Storage unavailable'); return; }
    try {
      await adapter.set(id, JSON.stringify(toSave));
      setSavedBuilds([...savedBuilds, toSave]);
    } catch { alert('Storage failed'); }
  };

  const deleteBuild = async (id) => {
    const adapter = getStorageAdapter();
    try { await adapter?.delete(id); } catch {}
    setSavedBuilds(savedBuilds.filter(b => b.id !== id));
    if (compareWith?.id === id) setCompareWith(null);
  };

  const tabs = [
    { id: 'block', label: 'BLOCK' },
    { id: 'heads', label: 'HEADS' },
    { id: 'cam', label: 'CAM' },
    { id: 'intake', label: 'INTAKE' },
    { id: 'forcedInduction', label: 'POWER ADDER' },
    { id: 'fuel', label: 'FUEL SYS' },
  ];

  // FIX: styles.card had a template literal opened with ` but closed with ' (syntax error).
  // Also added position:'relative' so the absolutely-positioned cost badge stays inside the card.
  const styles = {
    app: { fontFamily: '"JetBrains Mono","SF Mono","Roboto Mono",monospace', background: '#0a0a0c', color: '#e8e8ea', minHeight: '100vh' },
    header: { borderBottom: '1px solid #1a1a1e', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg,#111114 0%,#0a0a0c 100%)' },
    logo: { fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: '24px', letterSpacing: '0.08em', color: accent },
    familySwitcher: { display: 'flex', gap: '6px' },
    familyBtn: (active, fam) => ({ padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', border: `1px solid ${active ? ENGINE_FAMILIES[fam].accent : '#2a2a2e'}`, background: active ? ENGINE_FAMILIES[fam].accent + '22' : 'transparent', color: active ? ENGINE_FAMILIES[fam].accent : '#666', transition: 'all 0.15s' }),
    main: { display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: 0, height: 'calc(100vh - 60px)' },
    panel: { background: '#0c0c0f', borderRight: '1px solid #1a1a1e', overflowY: 'auto', padding: '16px' },
    rightPanel: { background: '#0c0c0f', borderLeft: '1px solid #1a1a1e', overflowY: 'auto', padding: '16px' },
    canvas: { position: 'relative', background: '#0a0a0c', overflow: 'hidden' },
    section: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: '#888', marginBottom: '8px', borderBottom: '1px solid #1a1a1e', paddingBottom: '6px' },
    tab: (active) => ({ flex: '1', padding: '8px 10px', background: active ? accent : '#15151a', color: active ? '#0a0a0c' : '#888', border: `1px solid ${active ? accent : '#1a1a1e'}`, cursor: 'pointer', fontSize: '10px', fontWeight: 700 }),
    card: (sel) => ({ position: 'relative', padding: '12px', marginBottom: '6px', background: sel ? '#1a1410' : '#15151a', border: `1px solid ${sel ? accent : '#1a1a1e'}`, cursor: 'pointer' }),
    button: { width: '100%', padding: '10px', background: accent, color: '#0a0a0c', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px', marginBottom: '6px' },
    issue: (sev) => ({ padding: '8px', marginBottom: '6px', fontSize: '11px', borderLeft: `3px solid ${sev === 'error' ? '#ff3344' : sev === 'warn' ? '#ffaa00' : '#3388ff'}`, background: sev === 'error' ? '#2a1518' : sev === 'warn' ? '#2a2515' : '#15202a', color: sev === 'error' ? '#ff8888' : sev === 'warn' ? '#ffcc66' : '#88bbff' }),
  };

  const currentParts = CAT[activeTab] || [];

  return (
    <div style={styles.app}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />

      <div style={styles.header}>
        <div style={styles.logo}>⛽ DYNO//FORGE</div>
        <div style={styles.familySwitcher}>
          {Object.values(ENGINE_FAMILIES).map(f => (
            <button key={f.id} style={styles.familyBtn(family === f.id, f.id)} onClick={() => switchFamily(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#444', textAlign: 'right' }}>
          <div style={{ color: accent, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}>{familyConfig.name}</div>
          <div>{familyConfig.subtitle}</div>
        </div>
      </div>

      <div style={styles.main}>
        {/* LEFT PANEL */}
        <div style={styles.panel}>
          <div style={styles.section}>Component</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
            {tabs.map(t => (
              <button key={t.id} style={styles.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={styles.section}>Parts</div>
          {currentParts.map(part => (
            <div key={part.id} style={styles.card(build[activeTab] === part.id)} onClick={() => setBuild({ ...build, [activeTab]: part.id })}>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{part.name}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {activeTab === 'block' && `${part.displacement}ci · ${part.bore}" × ${part.stroke}"`}
                {activeTab === 'heads' && `${part.flow} cfm · ${part.chamber}cc`}
                {activeTab === 'cam' && `${part.dur}° · ${part.lift.toFixed(3)}" · ${part.lsa}° LSA`}
                {activeTab === 'intake' && part.powerCurve}
                {activeTab === 'forcedInduction' && (part.boost > 0 ? `${part.boost} psi` : 'NA')}
                {activeTab === 'fuel' && `${part.flowRate} ${part.e85 ? '(E85)' : ''}`}
              </div>
              <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', color: accent, fontWeight: 700 }}>
                ${part.cost}
              </div>
            </div>
          ))}
        </div>

        {/* CENTER */}
        <div style={styles.canvas}>
          <div style={{ height: '55%', position: 'relative' }}>
            <Engine3D build={build} />
            <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '10px', color: '#666', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '4px' }}>
              DRAG TO ROTATE · SCROLL TO ZOOM
            </div>
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)', padding: '12px', borderTop: `2px solid ${accent}` }}>
                <div style={{ fontSize: '10px', color: '#666' }}>PEAK HP</div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: accent }}>{peak.hp}</div>
                <div style={{ fontSize: '10px', color: '#666' }}>@ {peak.hpRpm} RPM</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)', padding: '12px', borderTop: `2px solid ${accent}` }}>
                <div style={{ fontSize: '10px', color: '#666' }}>PEAK TQ</div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: accent }}>{peak.tq}</div>
                <div style={{ fontSize: '10px', color: '#666' }}>@ {peak.tqRpm} RPM</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)', padding: '12px', borderTop: `2px solid ${accent}` }}>
                <div style={{ fontSize: '10px', color: '#666' }}>COST</div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: accent }}>${(cost / 1000).toFixed(1)}k</div>
                <div style={{ fontSize: '10px', color: '#666' }}>parts only</div>
              </div>
            </div>
          </div>

          <div style={{ height: '45%', padding: '16px', background: '#0c0c0f', borderTop: '1px solid #1a1a1e' }}>
            <div style={styles.section}>Dyno {compareWith && `· vs "${compareWith.name}" (${comparePeak.hp} hp)`}</div>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1e" />
                <XAxis dataKey="rpm" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip contentStyle={{ background: '#15151a', border: '1px solid #1a1a1e', color: '#e8e8ea' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="hp" stroke={accent} strokeWidth={2} dot={false} name="HP" />
                <Line type="monotone" dataKey="tq" stroke={accent} strokeWidth={2} dot={false} strokeDasharray="4 2" name="TQ" />
                {compareWith && <Line type="monotone" dataKey="hp_b" stroke="#3388ff" strokeWidth={1.5} dot={false} name="HP vs" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <div style={styles.section}>Compatibility</div>
          {issues.length === 0 ? (
            <div style={{ ...styles.issue('info'), borderLeftColor: '#33cc66', background: '#152a1a', color: '#88dd88' }}>
              ✓ No issues. This combo is valid.
            </div>
          ) : (
            issues.map((i, idx) => (
              <div key={idx} style={styles.issue(i.severity)}>
                <strong>{i.severity.toUpperCase()}</strong>: {i.message}
              </div>
            ))
          )}

          <div style={{ ...styles.section, marginTop: '20px' }}>Save / Compare</div>
          <input
            type="text" value={build.name} onChange={e => setBuild({ ...build, name: e.target.value })}
            placeholder="Build name"
            style={{ width: '100%', padding: '8px', background: '#15151a', border: '1px solid #1a1a1e', color: '#e8e8ea', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <button style={styles.button} onClick={saveBuild}>+ SAVE BUILD</button>
          {compareWith && <button style={{ ...styles.button, background: '#444' }} onClick={() => setCompareWith(null)}>✕ EXIT COMPARE</button>}

          <div style={{ ...styles.section, marginTop: '20px' }}>Saved ({savedBuilds.length})</div>
          {savedBuilds.map(sb => (
            <div key={sb.id} style={{ ...styles.card(false), padding: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{sb.name}</div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>
                {sb.peakHp} hp · {sb.peakTq} tq · ${(sb.cost / 1000).toFixed(1)}k
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ ...styles.button, flex: 1, padding: '5px', marginBottom: 0, fontSize: '10px' }} onClick={() => { switchFamily(sb.family); setBuild(sb); }}>
                  LOAD
                </button>
                <button style={{ ...styles.button, flex: 1, padding: '5px', marginBottom: 0, fontSize: '10px' }} onClick={() => setCompareWith(sb)}>
                  VS
                </button>
                <button style={{ ...styles.button, flex: 1, padding: '5px', marginBottom: 0, fontSize: '10px', background: '#cc2200' }} onClick={() => deleteBuild(sb.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
