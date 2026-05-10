import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  hemi: {
    id: 'hemi',
    name: 'Dodge Hemi',
    label: 'HEMI V8',
    subtitle: 'Gen III — 5.7 / 6.1 / 6.4 / 6.2SC',
    accent: '#9900cc',
    valvetrain: 'pushrod',
    fuelType: 'efi',
    defaultBuild: {
      name: 'My 6.4 Build',
      block: 'hemi_392', heads: 'hemi_h_64', cam: 'hemi_c_stage1',
      intake: 'hemi_i_stock', forcedInduction: 'fi_none', fuel: 'hemi_f_72lb',
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
    { id: 'b_lq4', name: '6.0L Iron Block (LQ4)', displacement: 364, bore: 4.0, stroke: 3.622, compression: 9.9, maxBoost: 25, cost: 1200, brand: 'GM OEM', shopSearch: 'LQ4 6.0L LS iron engine block', notes: 'Cheap, heavy, bulletproof for boost.' },
    { id: 'b_ls3', name: '6.2L Aluminum Block (LS3)', displacement: 376, bore: 4.065, stroke: 3.622, compression: 10.7, maxBoost: 18, cost: 2800, brand: 'GM Performance', shopSearch: 'GM Performance LS3 6.2L aluminum engine block', notes: 'Stock LS3 spec. Light and strong.' },
    { id: 'b_lsx', name: '427ci Aftermarket Iron (LSX)', displacement: 427, bore: 4.125, stroke: 4.0, compression: 9.5, maxBoost: 40, cost: 6500, brand: 'GM Performance', shopSearch: 'GM Performance LSX454R race iron engine block', notes: 'Purpose-built race block. Handles anything.' },
    { id: 'b_dart', name: '441ci Tall-Deck Iron', displacement: 441, bore: 4.185, stroke: 4.0, compression: 9.2, maxBoost: 45, cost: 8500, brand: 'Dart', shopSearch: 'Dart LS Next iron tall deck engine block', notes: 'Max LS platform. Borderline insane.' },
  ],
  heads: [
    { id: 'h_317', name: 'Cathedral Port Truck Heads', flow: 240, chamber: 71, compression: 0.5, springRate: 'stock', cost: 400, brand: 'GM OEM', shopSearch: '317 cathedral port LS truck cylinder heads', portStyle: 'cathedral', notes: 'Junkyard find. Decent flow.' },
    { id: 'h_243', name: 'Cathedral Port LS6-spec', flow: 265, chamber: 64, compression: 1.2, springRate: 'mild', cost: 700, brand: 'GM OEM', shopSearch: '243 LS6 cathedral port cylinder heads', portStyle: 'cathedral', notes: 'Better chambers. Real power bump.' },
    { id: 'h_ls3', name: 'Rectangle Port L92/LS3-spec', flow: 315, chamber: 68, compression: 0.8, springRate: 'mild', cost: 1100, brand: 'GM OEM', shopSearch: 'L92 LS3 rectangle port cylinder heads', portStyle: 'rectangle', notes: 'LS3 spec. Standard baseline.' },
    { id: 'h_btr', name: 'CNC Stage 3 Rectangle Port', flow: 360, chamber: 64, compression: 1.4, springRate: 'aggressive', cost: 2400, brand: 'Brian Tooley Racing', shopSearch: 'BTR CNC Stage 3 LS rectangle port cylinder heads', portStyle: 'rectangle', notes: 'Ported. Big valves. Needs stiff springs.' },
    { id: 'h_race', name: 'Symmetrical Port Race Heads', flow: 410, chamber: 60, compression: 1.8, springRate: 'race', cost: 4200, brand: 'Trick Flow', shopSearch: 'Trick Flow LS symmetrical port race cylinder heads', portStyle: 'symmetrical', notes: 'Full race. Custom intake required.' },
  ],
  cam: [
    { id: 'c_stock', name: 'Stock Replacement', dur: 196, lift: 0.467, lsa: 116, springReq: 'stock', cost: 250, brand: 'GM OEM', shopSearch: 'LS stock replacement camshaft', character: 'docile', notes: 'Daily driver. Smooth and boring.' },
    { id: 'c_stage1', name: 'Stage 1 — Daily Driver', dur: 218, lift: 0.553, lsa: 114, springReq: 'mild', cost: 500, brand: 'Brian Tooley Racing', shopSearch: 'BTR Stage 1 LS camshaft daily driver', character: 'mild', notes: 'Tiny lope. No drivability loss.' },
    { id: 'c_stage2', name: 'Stage 2 — Streetable Lope', dur: 226, lift: 0.585, lsa: 113, springReq: 'mild', cost: 600, brand: 'Brian Tooley Racing', shopSearch: 'BTR Stage 2 LS camshaft street strip', character: 'aggressive', notes: 'Classic LS lope. Street/strip sweet spot.' },
    { id: 'c_stage3', name: 'Stage 3 — Big Lope', dur: 234, lift: 0.617, lsa: 112, springReq: 'aggressive', cost: 750, brand: 'COMP Cams', shopSearch: 'COMP Cams LS Stage 3 camshaft big lope', character: 'aggressive', notes: 'Sounds mean. Sacrifices idle quality.' },
    { id: 'c_stage4', name: 'Stage 4 — Race Cam', dur: 248, lift: 0.660, lsa: 110, springReq: 'race', cost: 950, brand: 'COMP Cams', shopSearch: 'COMP Cams LS race camshaft Stage 4', character: 'race', notes: 'Race only. Powerband 4000+ RPM.' },
    { id: 'c_boost', name: 'Boost-Specific Grind', dur: 224, lift: 0.595, lsa: 118, springReq: 'aggressive', cost: 850, brand: 'Brian Tooley Racing', shopSearch: 'BTR boost turbo LS camshaft wide LSA', character: 'mild', notes: 'Wide LSA for forced induction.' },
  ],
  intake: [
    { id: 'i_stock_truck', name: 'Truck Intake (Cathedral)', flowMatch: 'cathedral', powerCurve: 'low', cost: 150, brand: 'GM OEM', shopSearch: 'LS truck cathedral port intake manifold', notes: 'Low-end torque. Caps out early.' },
    { id: 'i_fast102', name: '102mm Composite (Cathedral)', flowMatch: 'cathedral', powerCurve: 'mid', cost: 900, brand: 'FAST', shopSearch: 'FAST LSX 102mm cathedral port intake manifold', notes: 'Better top-end than stock.' },
    { id: 'i_ls3', name: 'OEM LS3 (Rectangle)', flowMatch: 'rectangle', powerCurve: 'broad', cost: 350, brand: 'GM OEM', shopSearch: 'LS3 OEM rectangle port intake manifold', notes: 'Surprisingly good. Cheap used.' },
    { id: 'i_fast_rect', name: '102mm Composite (Rectangle)', flowMatch: 'rectangle', powerCurve: 'high', cost: 1100, brand: 'FAST', shopSearch: 'FAST LSX 102mm rectangle port intake manifold', notes: 'Premium top-end focus.' },
    { id: 'i_sheet', name: 'Sheet Metal Race Intake', flowMatch: 'any', powerCurve: 'race', cost: 2800, brand: 'Mast Motorsports', shopSearch: 'Mast Motorsports sheet metal LS race intake manifold', notes: 'Race only. Hood clearance issues.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'Pure response. No lag.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 64mm', type: 'turbo', boost: 8, efficiency: 0.78, cost: 3500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6266 64mm single turbocharger', notes: 'Quick spool. ~600 whp ceiling.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 14, efficiency: 0.76, cost: 4500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 7675 76mm single turbocharger', notes: 'Sweet spot. 800-1000 whp capable.' },
    { id: 'fi_turbo_big', name: 'Single Turbo — 88mm', type: 'turbo', boost: 22, efficiency: 0.72, cost: 6500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 8891 88mm single turbocharger', notes: 'Laggy. 1200+ whp potential.' },
    { id: 'fi_twin', name: 'Twin Turbo — 6266 x2', type: 'turbo', boost: 18, efficiency: 0.80, cost: 8500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6266 twin turbocharger kit LS', notes: 'Best of both. Expensive.' },
    { id: 'fi_blower', name: 'Centrifugal Supercharger', type: 'centri', boost: 12, efficiency: 0.74, cost: 6000, brand: 'ProCharger', shopSearch: 'ProCharger D1SC centrifugal supercharger kit LS', notes: 'Linear power delivery.' },
    { id: 'fi_roots', name: 'Roots-Style Blower', type: 'roots', boost: 9, efficiency: 0.70, cost: 5500, brand: 'Magnuson', shopSearch: 'Magnuson TVS2300 roots supercharger kit LS', notes: 'Instant boost. Heat at high RPM.' },
  ],
  fuel: [
    { id: 'f_stock', name: 'Stock Injectors + Pump', flowRate: 25, e85: false, cost: 0, brand: 'GM OEM', shopSearch: 'LS stock fuel injectors pump', notes: 'Stock. ~500 hp limit.' },
    { id: 'f_60lb', name: '60lb Injectors + 340lph Pump', flowRate: 60, e85: true, cost: 600, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID750 LS fuel injectors 340lph pump', notes: '~750 hp on E85.' },
    { id: 'f_100lb', name: '100lb Injectors + Twin 450lph', flowRate: 100, e85: true, cost: 1400, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID1050X LS fuel injectors twin pump', notes: 'Big power capable.' },
    { id: 'f_160lb', name: '160lb Injectors + Mech Pump', flowRate: 160, e85: true, cost: 2800, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID1700X LS fuel injectors mechanical pump', notes: 'Race fuel system. 1500+ hp.' },
  ],
};

// =====================================================
// COYOTE CATALOG
// =====================================================
const CATALOG_COYOTE = {
  block: [
    { id: 'cy_b_stock', name: '5.0L Gen I/II Aluminum', displacement: 302, bore: 3.63, stroke: 3.65, compression: 11.0, maxBoost: 15, cost: 1800, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0L Gen I II aluminum engine block', notes: '11:1 stock. Sketchy over 8psi pump gas.' },
    { id: 'cy_b_gen3', name: '5.0L Gen III (2018+)', displacement: 302, bore: 3.63, stroke: 3.65, compression: 11.0, maxBoost: 20, cost: 3200, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0L Gen III 2018 engine block', notes: 'Stronger internals than Gen I/II.' },
    { id: 'cy_b_363', name: '363ci Stroker (3.68" stroke)', displacement: 363, bore: 3.68, stroke: 3.75, compression: 10.8, maxBoost: 18, cost: 5500, brand: 'Modular Motorsports', shopSearch: 'Coyote 5.0 363ci stroker rotating assembly kit', notes: 'Popular. More cubes, same revs.' },
    { id: 'cy_b_408', name: '408ci Stroker (4.0" stroke)', displacement: 408, bore: 3.70, stroke: 3.75, compression: 10.5, maxBoost: 16, cost: 8500, brand: 'Modular Motorsports', shopSearch: 'Coyote 5.0 408ci stroker rotating assembly kit', notes: 'Max Coyote cubes. Needs clearancing.' },
  ],
  heads: [
    { id: 'cy_h_stock', name: 'OEM DOHC Heads (Gen I/II)', flow: 260, chamber: 54, compression: 0, springRate: 'stock', cost: 600, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0 Gen I II DOHC cylinder heads', portStyle: 'dohc', notes: 'Actually decent OEM piece.' },
    { id: 'cy_h_gen3', name: 'OEM DOHC Heads (Gen III)', flow: 285, chamber: 54, compression: 0, springRate: 'mild', cost: 1200, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0 Gen III DOHC cylinder heads', portStyle: 'dohc', notes: 'Better port design.' },
    { id: 'cy_h_ported', name: 'CNC Ported OEM (Gen III)', flow: 335, chamber: 52, compression: 0.6, springRate: 'aggressive', cost: 2800, brand: 'Livernois', shopSearch: 'Livernois Coyote 5.0 CNC ported DOHC cylinder heads', portStyle: 'dohc', notes: 'Most popular mod.' },
    { id: 'cy_h_af', name: 'Aftermarket DOHC Race', flow: 385, chamber: 50, compression: 1.0, springRate: 'race', cost: 5500, brand: 'Trick Flow', shopSearch: 'Trick Flow Coyote 5.0 race DOHC cylinder heads titanium', portStyle: 'dohc', notes: 'Titanium valves. Full race.' },
  ],
  cam: [
    { id: 'cy_c_stock', name: 'Stock Cam Set', dur: 197, lift: 0.472, lsa: 126, springReq: 'stock', cost: 0, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0 stock VCT camshaft set', character: 'docile', notes: 'OEM with VCT. Good low/mid.' },
    { id: 'cy_c_stage1', name: 'Stage 1 VCT Cams', dur: 212, lift: 0.510, lsa: 122, springReq: 'mild', cost: 900, brand: 'COMP Cams', shopSearch: 'COMP Cams Coyote 5.0 Stage 1 VCT camshaft set', character: 'mild', notes: 'Works with VCT. Biggest easy win.' },
    { id: 'cy_c_stage2', name: 'Stage 2 — Street/Strip', dur: 224, lift: 0.550, lsa: 118, springReq: 'aggressive', cost: 1400, brand: 'COMP Cams', shopSearch: 'COMP Cams Coyote 5.0 Stage 2 street strip camshaft', character: 'aggressive', notes: 'VCT compatible. Strong 4500-7000.' },
    { id: 'cy_c_stage3', name: 'Stage 3 — Race Cams', dur: 238, lift: 0.590, lsa: 114, springReq: 'race', cost: 1900, brand: 'COMP Cams', shopSearch: 'COMP Cams Coyote 5.0 Stage 3 race camshaft set', character: 'race', notes: 'Locks out VCT. Screams above 5k.' },
    { id: 'cy_c_boost', name: 'Boost-Spec Cam Set', dur: 218, lift: 0.530, lsa: 128, springReq: 'aggressive', cost: 1600, brand: 'COMP Cams', shopSearch: 'COMP Cams Coyote 5.0 boost spec camshaft wide LSA', character: 'mild', notes: 'Wide LSA for boost.' },
  ],
  intake: [
    { id: 'cy_i_stock', name: 'OEM Intake Manifold', flowMatch: 'dohc', powerCurve: 'broad', cost: 200, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0 OEM intake manifold', notes: 'Gen III OEM excellent.' },
    { id: 'cy_i_ported', name: 'Ported OEM Manifold', flowMatch: 'dohc', powerCurve: 'mid', cost: 600, brand: 'Livernois', shopSearch: 'Coyote 5.0 ported intake manifold CNC', notes: 'DIY or shop ported.' },
    { id: 'cy_i_wms', name: 'Composite High-Rise (92mm)', flowMatch: 'dohc', powerCurve: 'high', cost: 1400, brand: 'Trick Flow', shopSearch: 'Coyote 5.0 composite high rise 92mm intake manifold', notes: 'High-RPM focused.' },
    { id: 'cy_i_race', name: 'Individual Throttle Bodies', flowMatch: 'dohc', powerCurve: 'race', cost: 3800, brand: 'Jenvey', shopSearch: 'Coyote 5.0 individual throttle bodies ITB kit', notes: 'Sounds like F1. Not streetable.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'Pure Coyote magic.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 64mm', type: 'turbo', boost: 8, efficiency: 0.78, cost: 3500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6266 64mm single turbocharger', notes: 'Quick spool.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 14, efficiency: 0.76, cost: 4500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 7675 76mm single turbocharger', notes: 'Sweet spot.' },
    { id: 'fi_turbo_big', name: 'Single Turbo — 88mm', type: 'turbo', boost: 22, efficiency: 0.72, cost: 6500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 8891 88mm single turbocharger', notes: 'Laggy monster.' },
    { id: 'fi_twin', name: 'Twin Turbo — 6266 x2', type: 'turbo', boost: 18, efficiency: 0.80, cost: 8500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6266 twin turbocharger kit Coyote', notes: 'Best both worlds.' },
    { id: 'fi_blower', name: 'Centrifugal Supercharger', type: 'centri', boost: 12, efficiency: 0.74, cost: 6000, brand: 'ProCharger', shopSearch: 'ProCharger D1SC centrifugal supercharger kit Coyote 5.0', notes: 'Linear power.' },
    { id: 'fi_roots', name: 'Roots-Style Blower', type: 'roots', boost: 9, efficiency: 0.70, cost: 5500, brand: 'Whipple', shopSearch: 'Whipple supercharger roots blower kit Coyote 5.0', notes: 'Instant boost.' },
  ],
  fuel: [
    { id: 'f_stock', name: 'Stock Direct Injection', flowRate: 30, e85: false, cost: 0, brand: 'Ford OEM', shopSearch: 'Ford Coyote 5.0 stock GDI fuel injectors', notes: 'GDI. ~550 hp limit.' },
    { id: 'cy_f_pi', name: 'Port Injection Add-On Kit', flowRate: 55, e85: true, cost: 1100, brand: 'Injector Dynamics', shopSearch: 'Coyote 5.0 port injection add on kit PI GDI', notes: 'Adds PI to GDI. Best of both.' },
    { id: 'f_100lb', name: '100lb Injectors + Twin 450lph', flowRate: 100, e85: true, cost: 1400, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID1050X Coyote fuel injectors twin pump', notes: 'Big power capable.' },
    { id: 'f_160lb', name: '160lb Injectors + Mech Pump', flowRate: 160, e85: true, cost: 2800, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID1700X Coyote fuel injectors mechanical pump', notes: 'Race fuel system.' },
  ],
};

// =====================================================
// BBC CATALOG
// =====================================================
const CATALOG_BBC = {
  block: [
    { id: 'bbc_396', name: '396ci (6.5L)', displacement: 396, bore: 4.094, stroke: 3.76, compression: 10.25, maxBoost: 12, cost: 800, brand: 'GM OEM', shopSearch: '396 big block Chevy engine block core', notes: 'The classic. Great bottom end torque.' },
    { id: 'bbc_402', name: '402ci — Bored .030"', displacement: 402, bore: 4.125, stroke: 3.76, compression: 10.5, maxBoost: 12, cost: 950, brand: 'GM OEM', shopSearch: '402 big block Chevy engine block bore kit', notes: 'Same block, more cubes. Common rebuild.' },
    { id: 'bbc_427', name: '427ci — Stroker Kit', displacement: 427, bore: 4.125, stroke: 4.0, compression: 9.8, maxBoost: 10, cost: 2200, brand: 'Scat', shopSearch: 'Scat 427ci big block Chevy stroker rotating assembly kit', notes: 'Corvette legend. Serious torque.' },
    { id: 'bbc_454', name: '454ci — Factory Big Dog', displacement: 454, bore: 4.25, stroke: 4.0, compression: 9.0, maxBoost: 10, cost: 2800, brand: 'GM OEM', shopSearch: '454 big block Chevy engine block', notes: '450 lb-ft stock. Legendary.' },
    { id: 'bbc_496', name: '496ci — 4.250 Bore Stroker', displacement: 496, bore: 4.25, stroke: 4.375, compression: 8.5, maxBoost: 8, cost: 4500, brand: 'Scat', shopSearch: 'Scat 496ci big block Chevy stroker rotating assembly', notes: 'Bracket racing favorite.' },
    { id: 'bbc_dart', name: '540ci Dart Big M Block', displacement: 540, bore: 4.50, stroke: 4.25, compression: 8.2, maxBoost: 18, cost: 7500, brand: 'Dart', shopSearch: 'Dart Big M big block Chevy 540ci race engine block', notes: 'Aftermarket race block.' },
  ],
  heads: [
    { id: 'bbc_oval_cast', name: 'Oval Port Cast Iron', flow: 270, chamber: 118, compression: 0, springRate: 'stock', cost: 300, brand: 'GM OEM', shopSearch: 'big block Chevy oval port cast iron cylinder heads', portStyle: 'oval', notes: 'Bones of a million muscle cars.' },
    { id: 'bbc_oval_edel', name: 'Edelbrock RPM Oval (Aluminum)', flow: 305, chamber: 110, compression: 1.0, springRate: 'mild', cost: 1100, brand: 'Edelbrock', shopSearch: 'Edelbrock RPM big block Chevy oval port aluminum cylinder heads', portStyle: 'oval', notes: '50 lb savings. Good for NA or mild boost.' },
    { id: 'bbc_oval_afr', name: 'AFR 305 Oval Port (Aluminum)', flow: 330, chamber: 107, compression: 1.4, springRate: 'aggressive', cost: 1800, brand: 'AFR', shopSearch: 'AFR 305 big block Chevy oval port aluminum cylinder heads', portStyle: 'oval', notes: 'Best oval port available.' },
    { id: 'bbc_rect_cast', name: 'Rectangular Port Cast', flow: 310, chamber: 118, compression: 0.2, springRate: 'mild', cost: 450, brand: 'GM OEM', shopSearch: 'big block Chevy rectangular port cast iron cylinder heads', portStyle: 'rect', notes: 'Better flow than oval. Needs matching intake.' },
    { id: 'bbc_rect_brodix', name: 'Brodix BB-2 Plus Rect (Aluminum)', flow: 370, chamber: 112, compression: 1.6, springRate: 'aggressive', cost: 2200, brand: 'Brodix', shopSearch: 'Brodix BB-2 Plus big block Chevy rectangular port aluminum cylinder heads', portStyle: 'rect', notes: 'Pro-level street/strip weapon.' },
    { id: 'bbc_rect_afr', name: 'AFR 385 Rect Port Race (Aluminum)', flow: 390, chamber: 108, compression: 1.8, springRate: 'race', cost: 3200, brand: 'AFR', shopSearch: 'AFR 385 big block Chevy rectangular port race aluminum heads CNC', portStyle: 'rect', notes: 'CNC race heads.' },
  ],
  cam: [
    { id: 'bbc_c_mild', name: 'Mild Street (214°/218°)', dur: 216, lift: 0.480, lsa: 114, springReq: 'stock', cost: 280, brand: 'COMP Cams', shopSearch: 'COMP Cams big block Chevy mild street camshaft 214 218', character: 'docile', notes: 'Smooth idle. Tow rig quality.' },
    { id: 'bbc_c_street', name: 'Street/Strip (228°/234°)', dur: 231, lift: 0.520, lsa: 112, springReq: 'mild', cost: 350, brand: 'COMP Cams', shopSearch: 'COMP Cams big block Chevy street strip camshaft 228 234', character: 'mild', notes: 'Sweet spot. Lopey. Strong mid-range.' },
    { id: 'bbc_c_hot_street', name: 'Hot Street (236°/242°)', dur: 239, lift: 0.560, lsa: 110, springReq: 'mild', cost: 420, brand: 'COMP Cams', shopSearch: 'COMP Cams big block Chevy hot street camshaft 236 242', character: 'aggressive', notes: 'Gets rowdy. Needs 2500+ stall.' },
    { id: 'bbc_c_strip', name: 'Street/Strip Aggressive (248°/254°)', dur: 251, lift: 0.595, lsa: 108, springReq: 'aggressive', cost: 550, brand: 'COMP Cams', shopSearch: 'COMP Cams big block Chevy aggressive strip camshaft 248 254', character: 'aggressive', notes: 'Rough idle. 3000+ stall required.' },
    { id: 'bbc_c_race', name: 'Full Race (260°/268°)', dur: 264, lift: 0.640, lsa: 106, springReq: 'race', cost: 750, brand: 'COMP Cams', shopSearch: 'COMP Cams big block Chevy full race camshaft 260 268', character: 'race', notes: 'No idle. Track only. Insane sound.' },
    { id: 'bbc_c_boost', name: 'Boost/Nitrous Grind', dur: 227, lift: 0.530, lsa: 116, springReq: 'mild', cost: 480, brand: 'COMP Cams', shopSearch: 'COMP Cams big block Chevy boost nitrous camshaft wide LSA', character: 'mild', notes: 'Wide LSA for forced induction.' },
  ],
  intake: [
    { id: 'bbc_i_dualplane', name: 'Edelbrock Performer (Dual Plane)', flowMatch: 'oval', powerCurve: 'low', cost: 350, brand: 'Edelbrock', shopSearch: 'Edelbrock Performer BBC oval port dual plane intake manifold', notes: 'Best street intake. Strong low/mid torque.' },
    { id: 'bbc_i_rpm', name: 'Edelbrock RPM (Dual Plane)', flowMatch: 'oval', powerCurve: 'mid', cost: 480, brand: 'Edelbrock', shopSearch: 'Edelbrock RPM BBC oval port dual plane intake manifold', notes: 'Extends powerband higher.' },
    { id: 'bbc_i_singleplane', name: 'Edelbrock Air-Gap (Single Plane)', flowMatch: 'oval', powerCurve: 'high', cost: 580, brand: 'Edelbrock', shopSearch: 'Edelbrock Air-Gap BBC oval port single plane intake manifold', notes: 'Top-end focused. Loses some low-end.' },
    { id: 'bbc_i_rect_rpm', name: 'Edelbrock RPM Air-Gap (Rect Port)', flowMatch: 'rect', powerCurve: 'high', cost: 650, brand: 'Edelbrock', shopSearch: 'Edelbrock RPM Air-Gap BBC rectangular port intake manifold', notes: 'Rect port single plane.' },
    { id: 'bbc_i_holley_strip', name: 'Holley Strip Dominator (Rect Port)', flowMatch: 'rect', powerCurve: 'race', cost: 880, brand: 'Holley', shopSearch: 'Holley Strip Dominator BBC rectangular port intake manifold', notes: 'Race intake. Hood scoop required.' },
    { id: 'bbc_i_tunnel', name: 'Tunnel Ram (Rect Port)', flowMatch: 'rect', powerCurve: 'race', cost: 1400, brand: 'Holley', shopSearch: 'Holley BBC tunnel ram dual carb intake manifold', notes: 'Dual-carb tunnel ram. Pure race.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'Big cubic inches do the work.' },
    { id: 'fi_nitrous_100', name: 'Wet Nitrous — 100 Shot', type: 'nitrous', boost: 4, efficiency: 0.88, cost: 600, brand: 'NOS', shopSearch: 'NOS wet nitrous oxide 100hp shot kit', notes: '100 hp shot. Safe on stock internals.' },
    { id: 'fi_nitrous_150', name: 'Wet Nitrous — 150 Shot', type: 'nitrous', boost: 5, efficiency: 0.85, cost: 700, brand: 'NOS', shopSearch: 'NOS wet nitrous oxide 150hp shot kit forged', notes: 'Getting sketchy. Forged pistons recommended.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 64mm', type: 'turbo', boost: 8, efficiency: 0.78, cost: 3500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6266 64mm single turbocharger', notes: 'Bracket car material.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 12, efficiency: 0.76, cost: 4500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 7675 76mm single turbocharger BBC', notes: 'BBC + turbo = obscene torque.' },
    { id: 'fi_roots', name: 'BDS 8-71 Roots Blower', type: 'roots', boost: 8, efficiency: 0.72, cost: 5800, brand: 'BDS', shopSearch: 'BDS 8-71 roots supercharger blower big block Chevy', notes: '1960s dragster vibes. Through the hood.' },
  ],
  fuel: [
    { id: 'bbc_holley_600', name: 'Holley 600 CFM (4160)', flowRate: 600, e85: false, cost: 350, brand: 'Holley', shopSearch: 'Holley 600 CFM 4160 carburetor', notes: 'Conservative. Mild 396/402 builds.' },
    { id: 'bbc_holley_650', name: 'Holley 650 CFM (Double Pumper)', flowRate: 650, e85: false, cost: 480, brand: 'Holley', shopSearch: 'Holley 650 CFM double pumper carburetor', notes: 'Classic street/strip carb.' },
    { id: 'bbc_holley_750', name: 'Holley 750 CFM (Double Pumper)', flowRate: 750, e85: false, cost: 560, brand: 'Holley', shopSearch: 'Holley 750 CFM double pumper carburetor', notes: 'Good for 454+ or hot 396.' },
    { id: 'bbc_holley_850', name: 'Holley 850 CFM (Ultra HP)', flowRate: 850, e85: false, cost: 750, brand: 'Holley', shopSearch: 'Holley 850 CFM Ultra HP carburetor', notes: '500 hp+ territory. Needs big cam.' },
    { id: 'bbc_demon_1050', name: 'Barry Grant 1050 CFM Demon', flowRate: 1050, e85: false, cost: 1200, brand: 'Barry Grant', shopSearch: 'Barry Grant Demon 1050 CFM race carburetor', notes: 'Race carb. Too big for street.' },
    { id: 'bbc_e85_750', name: 'Quick Fuel 750 CFM E85-Ready', flowRate: 750, e85: true, cost: 900, brand: 'Quick Fuel', shopSearch: 'Quick Fuel Technology 750 CFM E85 carburetor', notes: 'Modified for E85. Safer on boost.' },
  ],
};

// =====================================================
// HEMI CATALOG
// =====================================================
const CATALOG_HEMI = {
  block: [
    { id: 'hemi_345', name: '5.7L Gen III (345ci)', displacement: 345, bore: 3.917, stroke: 3.578, compression: 9.6, maxBoost: 14, cost: 800, brand: 'Mopar OEM', shopSearch: 'Mopar 5.7L Gen III Hemi engine block 345ci', notes: 'Cheapest entry point. Charger/300 donor. Solid platform.' },
    { id: 'hemi_370', name: '6.1L SRT8 (370ci)', displacement: 370, bore: 4.055, stroke: 3.578, compression: 10.3, maxBoost: 12, cost: 1800, brand: 'Mopar OEM', shopSearch: 'Mopar 6.1L SRT8 Hemi engine block 370ci', notes: 'SRT8 spec. Better castings than 5.7. Harder to find.' },
    { id: 'hemi_392', name: '6.4L Apache (392ci)', displacement: 392, bore: 4.090, stroke: 3.720, compression: 10.9, maxBoost: 10, cost: 2800, brand: 'Mopar OEM', shopSearch: 'Mopar 6.4L Apache Hemi engine block 392ci', notes: 'Best NA foundation. High CR — respect boost limits.' },
    { id: 'hemi_hellcat_block', name: '6.2L Hellcat Forged (376ci)', displacement: 376, bore: 4.090, stroke: 3.578, compression: 9.5, maxBoost: 30, cost: 5500, brand: 'Mopar Performance', shopSearch: 'Mopar Hellcat 6.2L forged engine block 376ci', notes: 'Factory forged internals. Purpose-built for blower abuse.' },
    { id: 'hemi_408', name: '408ci Stroker (4.050" stroke)', displacement: 408, bore: 4.090, stroke: 3.900, compression: 9.2, maxBoost: 20, cost: 6500, brand: 'Scat', shopSearch: 'Scat 408ci Hemi stroker rotating assembly kit', notes: 'Max naturally aspirated or moderate boost cubes.' },
  ],
  heads: [
    { id: 'hemi_h_57', name: 'Stock 5.7L Hemi Heads', flow: 220, chamber: 69, compression: 0, springRate: 'stock', cost: 400, brand: 'Mopar OEM', shopSearch: 'Mopar 5.7L Hemi cylinder heads stock', portStyle: 'hemi', notes: 'Smaller ports. Fine for mild 5.7/345 builds.' },
    { id: 'hemi_h_64', name: '6.1L / 6.4L SRT Heads', flow: 255, chamber: 66, compression: 0, springRate: 'mild', cost: 900, brand: 'Mopar OEM', shopSearch: 'Mopar 6.4L SRT Hemi cylinder heads Apache', portStyle: 'hemi', notes: 'Bigger ports. Direct bolt-on to any Gen III block.' },
    { id: 'hemi_h_ported', name: 'CNC Ported 6.4L Heads', flow: 305, chamber: 64, compression: 0.3, springRate: 'aggressive', cost: 2400, brand: 'Livernois', shopSearch: 'Livernois CNC ported 6.4L Hemi cylinder heads', portStyle: 'hemi', notes: 'Most popular mod. Big top-end gains.' },
    { id: 'hemi_h_indy', name: 'Indy IRSS Race Heads', flow: 350, chamber: 62, compression: 0.8, springRate: 'race', cost: 4800, brand: 'Indy Cylinder Head', shopSearch: 'Indy IRSS Hemi race cylinder heads titanium valves', portStyle: 'hemi', notes: 'Full race castings. Titanium valves optional.' },
  ],
  cam: [
    { id: 'hemi_c_stock', name: 'Stock Cam (w/ MDS)', dur: 196, lift: 0.442, lsa: 116, springReq: 'stock', cost: 0, brand: 'Mopar OEM', shopSearch: 'Mopar Hemi stock camshaft MDS cylinder deactivation', character: 'docile', notes: 'Cylinder deactivation cam. Smooth and quiet.' },
    { id: 'hemi_c_stage1', name: 'Stage 1 — MDS Delete', dur: 214, lift: 0.510, lsa: 114, springReq: 'mild', cost: 550, brand: 'COMP Cams', shopSearch: 'COMP Cams Hemi Stage 1 camshaft MDS delete 214', character: 'mild', notes: 'Deletes cylinder deactivation. Real first-mod cam.' },
    { id: 'hemi_c_stage2', name: 'Stage 2 — Street/Strip', dur: 224, lift: 0.565, lsa: 112, springReq: 'mild', cost: 700, brand: 'COMP Cams', shopSearch: 'COMP Cams Hemi Stage 2 street strip camshaft 224', character: 'aggressive', notes: 'Lopey idle. Strong 3500–6000 RPM band.' },
    { id: 'hemi_c_stage3', name: 'Stage 3 — Aggressive', dur: 236, lift: 0.605, lsa: 110, springReq: 'aggressive', cost: 900, brand: 'COMP Cams', shopSearch: 'COMP Cams Hemi Stage 3 aggressive camshaft 236', character: 'aggressive', notes: 'Rowdy. Needs 2800+ stall or manual trans.' },
    { id: 'hemi_c_race', name: 'Stage 4 — Full Race', dur: 250, lift: 0.650, lsa: 108, springReq: 'race', cost: 1100, brand: 'COMP Cams', shopSearch: 'COMP Cams Hemi Stage 4 full race camshaft 250', character: 'race', notes: 'Track only. No idle to speak of.' },
    { id: 'hemi_c_boost', name: 'Boost-Spec Grind', dur: 220, lift: 0.540, lsa: 118, springReq: 'aggressive', cost: 750, brand: 'COMP Cams', shopSearch: 'COMP Cams Hemi boost spec camshaft wide LSA blower turbo', character: 'mild', notes: 'Wide LSA built for blower or turbo.' },
  ],
  intake: [
    { id: 'hemi_i_stock', name: 'Stock EFI Manifold', flowMatch: 'hemi', powerCurve: 'broad', cost: 200, brand: 'Mopar OEM', shopSearch: 'Mopar 6.4L Hemi stock EFI intake manifold', notes: '6.4L OEM is surprisingly good. Strong mid-range.' },
    { id: 'hemi_i_mopar', name: 'Mopar Performance Cold Air', flowMatch: 'hemi', powerCurve: 'mid', cost: 500, brand: 'Mopar Performance', shopSearch: 'Mopar Performance Hemi cold air intake kit', notes: 'Bolt-on. Extends powerband vs stock.' },
    { id: 'hemi_i_edel', name: 'Edelbrock Victor Jr. EFI', flowMatch: 'hemi', powerCurve: 'high', cost: 900, brand: 'Edelbrock', shopSearch: 'Edelbrock Victor Jr EFI Hemi intake manifold', notes: 'Single plane. Top-end focused.' },
    { id: 'hemi_i_wilson', name: 'Wilson Sheet Metal Race', flowMatch: 'hemi', powerCurve: 'race', cost: 2800, brand: 'Wilson Manifolds', shopSearch: 'Wilson Manifolds Hemi sheet metal race intake manifold', notes: 'Race-only. Hood clearance issues.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: 'The 6.4 is already a monster NA.' },
    { id: 'hemi_fi_procharger', name: 'ProCharger D-1SC (Centrifugal)', type: 'centri', boost: 10, efficiency: 0.76, cost: 5500, brand: 'ProCharger', shopSearch: 'ProCharger D1SC centrifugal supercharger kit Hemi', notes: 'Linear power delivery. Street friendly.' },
    { id: 'hemi_fi_kenne', name: 'Kenne Bell 2.8L TVS', type: 'roots', boost: 9, efficiency: 0.74, cost: 6000, brand: 'Kenne Bell', shopSearch: 'Kenne Bell 2.8L TVS supercharger kit Hemi', notes: 'Roots-style. Instant boost. Compact.' },
    { id: 'hemi_fi_whipple', name: 'Whipple 2.9L TVS (Hellcat-style)', type: 'roots', boost: 14, efficiency: 0.78, cost: 7500, brand: 'Whipple', shopSearch: 'Whipple 2.9L TVS supercharger kit Hemi Hellcat style', notes: 'The blower the Hellcat wears. Big power.' },
    { id: 'hemi_fi_turbo_mid', name: 'Single Turbo — 76mm', type: 'turbo', boost: 14, efficiency: 0.76, cost: 4500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 7675 76mm single turbocharger Hemi', notes: 'Torque monster. Slight spool lag.' },
    { id: 'hemi_fi_twin', name: 'Twin Turbo — 6266 x2', type: 'turbo', boost: 20, efficiency: 0.80, cost: 8500, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6266 twin turbocharger kit Hemi', notes: 'Best spool + massive ceiling.' },
  ],
  fuel: [
    { id: 'hemi_f_stock', name: 'Stock 54lb Injectors', flowRate: 54, e85: false, cost: 0, brand: 'Mopar OEM', shopSearch: 'Mopar Hemi 54lb stock fuel injectors', notes: 'Stock GEN III fuel system. ~510 hp limit.' },
    { id: 'hemi_f_72lb', name: '72lb Injectors + 340lph Pump', flowRate: 72, e85: true, cost: 700, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID850 Hemi 72lb fuel injectors 340lph pump', notes: 'Right-sized for most builds under 700 hp.' },
    { id: 'hemi_f_120lb', name: '120lb Injectors + Twin 450lph', flowRate: 120, e85: true, cost: 1600, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID1300X Hemi 120lb fuel injectors twin pump', notes: 'Big blower / turbo capable.' },
    { id: 'hemi_f_160lb', name: '160lb Injectors + Mech Pump', flowRate: 160, e85: true, cost: 2800, brand: 'Injector Dynamics', shopSearch: 'Injector Dynamics ID1700X Hemi 160lb fuel injectors mechanical pump', notes: 'Race fuel system. 1500+ hp territory.' },
  ],
};

// =====================================================
// SBC CATALOG
// =====================================================
const CATALOG_SBC = {
  block: [
    { id: 'sbc_327', name: '327ci — The High-Revver', displacement: 327, bore: 4.0, stroke: 3.25, compression: 11.0, maxBoost: 14, cost: 600, brand: 'GM OEM', shopSearch: '327 small block Chevy engine block high rev', notes: 'Rev-happy. Loves to spin. 1960s special.' },
    { id: 'sbc_350', name: '350ci — Universal Donor', displacement: 350, bore: 4.0, stroke: 3.48, compression: 9.0, maxBoost: 14, cost: 700, brand: 'GM OEM', shopSearch: '350 small block Chevy engine block', notes: 'Most common V8 ever. Bulletproof.' },
    { id: 'sbc_383', name: '383ci Stroker (3.75" stroke)', displacement: 383, bore: 4.03, stroke: 3.75, compression: 9.5, maxBoost: 12, cost: 1800, brand: 'Scat', shopSearch: 'Scat 383ci small block Chevy stroker rotating assembly kit', notes: 'Best bang-for-buck stroker.' },
    { id: 'sbc_400', name: '400ci — Fat Small Block', displacement: 400, bore: 4.125, stroke: 3.75, compression: 8.5, maxBoost: 10, cost: 900, brand: 'GM OEM', shopSearch: '400 small block Chevy engine block siamese bore', notes: 'Siamese bores. Torque king. Needs rods.' },
    { id: 'sbc_434', name: '434ci Dart SHP Stroker', displacement: 434, bore: 4.155, stroke: 4.0, compression: 9.0, maxBoost: 14, cost: 5500, brand: 'Dart', shopSearch: 'Dart SHP 434ci small block Chevy stroker block', notes: 'Maximum small block cubes.' },
  ],
  heads: [
    { id: 'sbc_camel', name: 'Camelback Iron (Stock 350)', flow: 155, chamber: 76, compression: 0, springRate: 'stock', cost: 100, brand: 'GM OEM', shopSearch: 'small block Chevy camelback iron cylinder heads 350', portStyle: 'sbc_std', notes: 'Junkyard find. Gets the job done.' },
    { id: 'sbc_double_hump', name: 'Double Hump / Fuelie Heads', flow: 185, chamber: 64, compression: 1.2, springRate: 'stock', cost: 250, brand: 'GM OEM', shopSearch: 'small block Chevy double hump fuelie cylinder heads 302 327', portStyle: 'sbc_std', notes: 'Classic 1960s performance head.' },
    { id: 'sbc_vortec', name: 'GM Vortec Iron Heads (906/062)', flow: 210, chamber: 64, compression: 1.0, springRate: 'mild', cost: 350, brand: 'GM OEM', shopSearch: 'GM Vortec iron cylinder heads 906 062 small block Chevy', portStyle: 'sbc_vortec', notes: 'Best stock head GM made.' },
    { id: 'sbc_edel_e210', name: 'Edelbrock E-210 Performer (Aluminum)', flow: 230, chamber: 64, compression: 1.4, springRate: 'mild', cost: 900, brand: 'Edelbrock', shopSearch: 'Edelbrock E-210 Performer aluminum cylinder heads small block Chevy', portStyle: 'sbc_std', notes: 'Bolt-on aluminum upgrade.' },
    { id: 'sbc_afr_195', name: 'AFR 195cc Street (Aluminum)', flow: 270, chamber: 65, compression: 1.6, springRate: 'aggressive', cost: 1600, brand: 'AFR', shopSearch: 'AFR 195cc Eliminator small block Chevy aluminum cylinder heads', portStyle: 'sbc_std', notes: 'Best street/strip SBC head.' },
    { id: 'sbc_afr_227', name: 'AFR 227cc Race (Aluminum)', flow: 310, chamber: 65, compression: 1.8, springRate: 'race', cost: 2400, brand: 'AFR', shopSearch: 'AFR 227cc small block Chevy race aluminum cylinder heads CNC', portStyle: 'sbc_std', notes: 'Race heads. Needs big cam.' },
  ],
  cam: [
    { id: 'sbc_c_mild', name: 'Mild Street (210°/218°)', dur: 214, lift: 0.450, lsa: 114, springReq: 'stock', cost: 220, brand: 'COMP Cams', shopSearch: 'COMP Cams small block Chevy mild street camshaft 210 218', character: 'docile', notes: 'Daily driver cam.' },
    { id: 'sbc_c_street', name: 'Street/Strip (224°/232°)', dur: 228, lift: 0.480, lsa: 112, springReq: 'mild', cost: 300, brand: 'COMP Cams', shopSearch: 'COMP Cams small block Chevy street strip camshaft 224 232', character: 'mild', notes: 'Classic hot rod cam.' },
    { id: 'sbc_c_hot_street', name: 'Hot Street (236°/244°)', dur: 240, lift: 0.530, lsa: 110, springReq: 'mild', cost: 380, brand: 'COMP Cams', shopSearch: 'COMP Cams small block Chevy hot street camshaft 236 244', character: 'aggressive', notes: 'Gets rowdy. Needs 2200+ stall.' },
    { id: 'sbc_c_strip', name: 'Strip Cam (252°/260°)', dur: 256, lift: 0.570, lsa: 108, springReq: 'aggressive', cost: 500, brand: 'COMP Cams', shopSearch: 'COMP Cams small block Chevy strip camshaft 252 260', character: 'aggressive', notes: 'Race cam. Rough idle.' },
    { id: 'sbc_c_race', name: 'Full Race (268°/276°)', dur: 272, lift: 0.620, lsa: 106, springReq: 'race', cost: 700, brand: 'COMP Cams', shopSearch: 'COMP Cams small block Chevy full race camshaft 268 276', character: 'race', notes: 'Track only. Will not idle.' },
    { id: 'sbc_c_boost', name: 'Boost/Nitrous Grind', dur: 224, lift: 0.500, lsa: 116, springReq: 'mild', cost: 380, brand: 'COMP Cams', shopSearch: 'COMP Cams small block Chevy boost nitrous camshaft wide LSA', character: 'mild', notes: 'Wide LSA for boost/nitrous.' },
  ],
  intake: [
    { id: 'sbc_i_vortec', name: 'Vortec-Style Intake', flowMatch: 'sbc_vortec', powerCurve: 'mid', cost: 280, brand: 'Edelbrock', shopSearch: 'Edelbrock Vortec small block Chevy intake manifold', notes: 'Vortec bolt pattern only.' },
    { id: 'sbc_i_dualplane', name: 'Edelbrock Performer (Dual Plane)', flowMatch: 'sbc_std', powerCurve: 'low', cost: 300, brand: 'Edelbrock', shopSearch: 'Edelbrock Performer small block Chevy dual plane intake manifold', notes: 'Best street intake.' },
    { id: 'sbc_i_rpm', name: 'Edelbrock Performer RPM (Dual Plane)', flowMatch: 'sbc_std', powerCurve: 'mid', cost: 420, brand: 'Edelbrock', shopSearch: 'Edelbrock Performer RPM small block Chevy dual plane intake manifold', notes: 'Extends powerband higher.' },
    { id: 'sbc_i_airgap', name: 'Edelbrock Air-Gap RPM (Single Plane)', flowMatch: 'sbc_std', powerCurve: 'high', cost: 550, brand: 'Edelbrock', shopSearch: 'Edelbrock Air-Gap RPM small block Chevy single plane intake manifold', notes: 'Top-end focused. Air gap design.' },
    { id: 'sbc_i_stealth', name: 'Holley Stealth Ram (Single Plane)', flowMatch: 'sbc_std', powerCurve: 'high', cost: 700, brand: 'Holley', shopSearch: 'Holley Stealth Ram small block Chevy single plane intake manifold', notes: 'High-rise single plane.' },
    { id: 'sbc_i_dominator', name: 'Holley Dominator (Single Plane)', flowMatch: 'sbc_std', powerCurve: 'race', cost: 900, brand: 'Holley', shopSearch: 'Holley Dominator small block Chevy single plane race intake manifold', notes: 'Race only. Hood scoop required.' },
  ],
  forcedInduction: [
    { id: 'fi_none', name: 'Naturally Aspirated', type: 'none', boost: 0, efficiency: 1.0, cost: 0, notes: '350 cubic inches of tradition.' },
    { id: 'fi_nitrous_75', name: 'Wet Nitrous — 75 Shot', type: 'nitrous', boost: 3, efficiency: 0.90, cost: 500, brand: 'NOS', shopSearch: 'NOS wet nitrous oxide 75hp shot kit', notes: 'Safe on stock internals.' },
    { id: 'fi_nitrous_100', name: 'Wet Nitrous — 100 Shot', type: 'nitrous', boost: 4, efficiency: 0.88, cost: 600, brand: 'NOS', shopSearch: 'NOS wet nitrous oxide 100hp shot kit', notes: 'Forged pistons recommended.' },
    { id: 'fi_turbo_small', name: 'Single Turbo — 57mm', type: 'turbo', boost: 8, efficiency: 0.80, cost: 2800, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 5858 57mm single turbocharger small block', notes: 'Quick spool on small block.' },
    { id: 'fi_turbo_mid', name: 'Single Turbo — 67mm', type: 'turbo', boost: 12, efficiency: 0.77, cost: 3800, brand: 'Precision Turbo', shopSearch: 'Precision Turbo 6766 67mm single turbocharger small block Chevy', notes: '600+ hp capable.' },
    { id: 'fi_blower', name: 'Weiand 142 Roots Blower', type: 'roots', boost: 6, efficiency: 0.73, cost: 3200, brand: 'Weiand', shopSearch: 'Weiand 142 roots supercharger blower kit small block Chevy', notes: 'Classic hot rod look.' },
  ],
  fuel: [
    { id: 'sbc_holley_500', name: 'Holley 500 CFM (Street Avenger)', flowRate: 500, e85: false, cost: 280, brand: 'Holley', shopSearch: 'Holley Street Avenger 500 CFM carburetor', notes: 'Budget street 350 only.' },
    { id: 'sbc_holley_600', name: 'Holley 600 CFM (4160)', flowRate: 600, e85: false, cost: 350, brand: 'Holley', shopSearch: 'Holley 600 CFM 4160 carburetor small block Chevy', notes: 'Right-sized for street 350.' },
    { id: 'sbc_holley_750', name: 'Holley 750 CFM (Double Pumper)', flowRate: 750, e85: false, cost: 540, brand: 'Holley', shopSearch: 'Holley 750 CFM double pumper carburetor', notes: 'Good for 383 stroker.' },
    { id: 'sbc_edel_800', name: 'Edelbrock 800 CFM (Thunder Series)', flowRate: 800, e85: false, cost: 620, brand: 'Edelbrock', shopSearch: 'Edelbrock Thunder Series 800 CFM carburetor AVS2', notes: 'Easy to tune. Self-metering.' },
    { id: 'sbc_holley_850', name: 'Holley 850 CFM (Ultra HP)', flowRate: 850, e85: false, cost: 750, brand: 'Holley', shopSearch: 'Holley 850 CFM Ultra HP carburetor', notes: 'Race carb on street car.' },
    { id: 'sbc_e85_650', name: 'Quick Fuel 650 CFM E85-Ready', flowRate: 650, e85: true, cost: 800, brand: 'Quick Fuel', shopSearch: 'Quick Fuel Technology 650 CFM E85 carburetor', notes: 'More power on E85.' },
  ],
};

function getCatalog(family) {
  if (family === 'coyote') return CATALOG_COYOTE;
  if (family === 'bbc') return CATALOG_BBC;
  if (family === 'sbc') return CATALOG_SBC;
  if (family === 'hemi') return CATALOG_HEMI;
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

  // Hemi-specific checks
  if (build.family === 'hemi' && block) {
    const cr = calculateCR(block.id, build.heads, CAT);
    if (fi?.boost > 5 && cr > 10.5) {
      issues.push({ severity: 'warn', message: `${cr}:1 CR + ${fi.boost}psi is risky on pump gas. Run E85 or drop boost.` });
    }
    if (fi?.boost > 15 && cr > 10.5) {
      issues.push({ severity: 'error', message: `${cr}:1 CR + ${fi.boost}psi will detonate. Use the Hellcat block (9.5:1) for big boost.` });
    }
    if (build.cam === 'hemi_c_stock' && (build.intake !== 'hemi_i_stock' && build.intake !== 'hemi_i_mopar')) {
      issues.push({ severity: 'info', message: `MDS cam limits top-end gains. Delete MDS with Stage 1+ cam to unlock performance intake benefit.` });
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
  const isHemi = build.family === 'hemi';

  const rpm = isCoyote ? [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
    : isGenI ? [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000]
    : [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500];

  const intakePeaks = { low: 3800, mid: 4800, broad: 5200, high: 5800, race: 6500 };
  const camPeaks = {
    docile: isGenI ? 3800 : isHemi ? 4200 : 5200,
    mild: isGenI ? 4800 : isHemi ? 5400 : 6000,
    aggressive: isGenI ? 5500 : isHemi ? 6200 : 6800,
    race: isGenI ? 6200 : isHemi ? 6800 : 7500,
  };

  const peakRpm = (intakePeaks[intake.powerCurve] + camPeaks[cam.character]) / 2;
  const cr = calculateCR(block.id, head.id, CAT);
  const baseMult = isBBC ? 4.6 : isGenI ? 4.8 : isCoyote ? 3.9 : isHemi ? 4.5 : 4.25;
  const flowBaseline = isGenI ? 290 : isCoyote ? 260 : isHemi ? 250 : 280;
  const flowFactor = head.flow / flowBaseline;
  const liftBaseline = isGenI ? 0.520 : isCoyote ? 0.472 : isHemi ? 0.510 : 0.617;
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
    const veWidth = isGenI ? 0.85 : isCoyote ? 0.95 : isHemi ? 1.0 : 1.1;
    let ve = 0.95 - Math.pow(dist, 2) * veWidth;

    if (cam.character === 'race' && r < (isGenI ? 3500 : 4000)) ve *= 0.65;
    if (cam.character === 'docile' && r > (isGenI ? 5200 : isHemi ? 5800 : 6500)) ve *= 0.72;

    ve = Math.max(0.4, Math.min(isCoyote ? 1.12 : isGenI ? 1.08 : isHemi ? 1.06 : 1.05, ve)) * vctBonus * carbFactor;

    const crFactor = 0.92 + (cr - 9.0) * 0.015;
    let tq = (disL * 14.7 * ve * flowFactor * liftFactor * boostMult * crFactor) * baseMult;

    if (fi.type === 'turbo' && r < 3500) tq *= 0.50 + (r - 1500) / 4000;
    if (fi.type === 'centri') tq *= 0.68 + (r / 7500) * 0.42;
    if (fi.type === 'nitrous') tq += fi.boost * 22 * (r > 2500 ? 1.0 : r / 2500);

    if (isCoyote && r > 7000 && cam.character !== 'race') tq *= 0.88;
    if (isGenI && r > 6000 && cam.character !== 'race') tq *= Math.max(0.70, 1 - (r - 6000) / 8000);
    if (isHemi && r > 6000 && cam.character !== 'race') tq *= Math.max(0.72, 1 - (r - 6000) / 6500);

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

function getShopUrl(retailer, query) {
  const q = encodeURIComponent(query);
  return retailer === 'jegs'
    ? `https://www.jegs.com/SearchResult/1/N-1z13yq0?Ntt=${q}`
    : `https://www.summitracing.com/search?keyword=${q}`;
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x606070, 0.65);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.9);
    keyLight.position.set(5, 10, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x5580ff, 0.55);
    fillLight.position.set(-5, 3, -2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(-1, 2, -6);
    scene.add(rimLight);
    const shopLight = new THREE.PointLight(0xfff0e8, 1.5, 12);
    shopLight.position.set(0, 5, 0);
    scene.add(shopLight);

    const floorGeom = new THREE.PlaneGeometry(20, 20);
    const floor = new THREE.Mesh(floorGeom, new THREE.MeshStandardMaterial({ color: 0x0e0e10, roughness: 0.88, metalness: 0.28 }));
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
    let lastDragTime = 0;

    const onMouseDown = (e) => { isDragging = true; lastDragTime = Date.now(); prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging = false; lastDragTime = Date.now(); };
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
      // Auto-rotate slowly when user hasn't interacted for 1.5s
      if (!isDragging && Date.now() - lastDragTime > 1500) {
        rotY += 0.004;
      }
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
    const isHemi = build.family === 'hemi';
    const isGenI = isBBC || isSBC;
    const scale = block ? Math.pow(block.displacement / (isBBC ? 396 : isSBC ? 350 : isCoyote ? 302 : isHemi ? 392 : 376), 0.33) : 1;

    const accent = ENGINE_FAMILIES[build.family]?.accent || '#ff6600';
    const accentHex = parseInt(accent.replace('#', ''), 16);

    // helper: create mesh, position, rotate, cast shadow, add to group
    const mk = (geom, mat, px=0, py=0, pz=0, rx=0, ry=0, rz=0) => {
      const m = new THREE.Mesh(geom, mat);
      m.position.set(px, py, pz);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      return m;
    };

    // ── Materials ─────────────────────────────────────
    const mIron   = new THREE.MeshStandardMaterial({ color: 0x72787e, metalness: 0.58, roughness: 0.52 });
    const mAl     = new THREE.MeshStandardMaterial({ color: 0xaab0b8, metalness: 0.86, roughness: 0.30 });
    const mAccent = new THREE.MeshStandardMaterial({ color: accentHex, metalness: 0.72, roughness: 0.28 });
    const mChrome = new THREE.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.98, roughness: 0.05 });
    const mBlack  = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.65, roughness: 0.48 });
    const mExh    = new THREE.MeshStandardMaterial({ color: isGenI ? 0x787870 : 0xc8ccd0, metalness: 0.82, roughness: 0.36 });
    const mRubber = new THREE.MeshStandardMaterial({ color: 0x111114, metalness: 0.06, roughness: 0.95 });
    const mHeadAl = new THREE.MeshStandardMaterial({ color: 0xb8bcbf, metalness: 0.90, roughness: 0.26 });
    const mHeadIr = new THREE.MeshStandardMaterial({ color: 0x7c8084, metalness: 0.60, roughness: 0.54 });
    const mHead   = (head && head.cost > 500) ? mHeadAl : mHeadIr;
    const mBlock  = isGenI ? mIron : mAl;

    const bW = isBBC ? 2.80 * scale : isSBC ? 2.52 * scale : 2.46 * scale;
    const bH = isBBC ? 1.55 : isSBC ? 1.38 : 1.42;
    const bD = isBBC ? 1.85 : isSBC ? 1.65 : 1.65;

    // ── Block body ──────────────────────────────────────
    mk(new THREE.BoxGeometry(bW, bH, bD), mBlock);
    // Oil pan — deeper, tapered
    mk(new THREE.BoxGeometry(bW * 0.80, 0.38, bD * 0.76), mBlack, 0, -(bH/2 + 0.19), 0);
    mk(new THREE.BoxGeometry(bW * 0.60, 0.22, bD * 0.60), mBlack, 0, -(bH/2 + 0.38), 0);
    // Timing cover (front face)
    mk(new THREE.BoxGeometry(bW * 0.60, bH * 0.68, 0.16), mAl, 0, -bH * 0.11, bD/2 + 0.08);
    // Harmonic damper + pulley ring
    mk(new THREE.CylinderGeometry(0.21, 0.21, 0.18, 24), mBlack, 0, -(bH * 0.27), bD/2 + 0.20, Math.PI/2, 0, 0);
    mk(new THREE.TorusGeometry(0.17, 0.024, 8, 24), mChrome, 0, -(bH * 0.27), bD/2 + 0.29, Math.PI/2, 0, 0);
    // Bellhousing flange (rear)
    mk(new THREE.CylinderGeometry(0.60 * scale, 0.60 * scale, 0.16, 32), mBlack, 0, -(bH * 0.18), -(bD/2 + 0.08), Math.PI/2, 0, 0);
    // Oil filter
    mk(new THREE.CylinderGeometry(0.10, 0.10, 0.32, 12), mBlack, bW/2 + 0.06, -(bH * 0.27), bD * 0.22, 0, 0, Math.PI/2);

    // ── Front accessories ───────────────────────────────
    // Water pump body + pulley
    mk(new THREE.CylinderGeometry(0.20, 0.16, 0.22, 20), mAl, 0, bH * 0.14, bD/2 + 0.20, Math.PI/2, 0, 0);
    mk(new THREE.TorusGeometry(0.16, 0.020, 8, 22), mChrome, 0, bH * 0.14, bD/2 + 0.32, Math.PI/2, 0, 0);
    // Alternator body + pulley
    mk(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 18), mAl, bW * 0.30, bH * 0.18, bD/2 + 0.20, Math.PI/2, 0, 0);
    mk(new THREE.TorusGeometry(0.10, 0.016, 8, 18), mChrome, bW * 0.30, bH * 0.18, bD/2 + 0.34, Math.PI/2, 0, 0);
    // Serpentine belt
    mk(new THREE.TorusGeometry(0.22, 0.011, 6, 32), mRubber, 0, bH * 0.13, bD/2 + 0.31, Math.PI/2, 0, 0);

    // ── Exhaust headers ─────────────────────────────────
    // 4 primaries per bank → collector → exit
    [-1, 1].forEach(side => {
      const sX = side * (bW/2 + 0.05);
      for (let i = 0; i < 4; i++) {
        const z = (-0.48 + i * 0.32) * scale;
        // horizontal stub out of head
        mk(new THREE.CylinderGeometry(0.052, 0.052, 0.28, 8), mExh,
           sX + side * 0.16, bH * 0.16, z, 0, 0, Math.PI/2);
        // 45° sweep down
        mk(new THREE.CylinderGeometry(0.052, 0.052, 0.32, 8), mExh,
           sX + side * 0.33, bH * 0.02, z, 0, 0, side * Math.PI/4);
        // vertical primary drop
        mk(new THREE.CylinderGeometry(0.052, 0.052, 0.30, 8), mExh,
           sX + side * 0.46, -(bH * 0.18), z);
      }
      // collector — merges 4 primaries
      mk(new THREE.CylinderGeometry(0.10, 0.10, 0.52, 12), mExh,
         sX + side * 0.45, -(bH * 0.48), 0);
      // collector exit / H-pipe
      mk(new THREE.CylinderGeometry(0.088, 0.088, 0.30, 12), mExh,
         sX + side * 0.44, -(bH * 0.78), 0.05, side * 0.28, 0, 0);
    });

    // ── Cylinder heads ──────────────────────────────────
    if (isCoyote) {
      // DOHC — heads angled off block shoulders
      [-1, 1].forEach(side => {
        // Head casting
        mk(new THREE.BoxGeometry(2.05 * scale, 0.44, 0.62), mHead,
           side * 0.54, bH * 0.46, 0, 0, 0, side * 0.28);
        // Cam cover (tall, accent color)
        mk(new THREE.BoxGeometry(1.95 * scale, 0.50, 0.58), mAccent,
           side * 0.54, bH * 0.46 + 0.47, 0, 0, 0, side * 0.28);
        // VCT actuator at front of cam cover
        mk(new THREE.CylinderGeometry(0.10, 0.10, 0.14, 14), mChrome,
           side * (0.54 + 0.92 * scale), bH * 0.46 + 0.44, 0.10, Math.PI/2, 0, 0);
        // Spark plug leads (4 per side)
        for (let i = 0; i < 4; i++) {
          mk(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 6), mRubber,
             side * (0.54 + 0.42 * scale), bH * 0.46 + 0.14, (-0.40 + i * 0.27) * scale,
             0, 0, side * 0.55);
        }
      });

      // Coyote intake plenum (valley-fill, between cam covers)
      if (intake) {
        const h = intake.powerCurve === 'race' ? 0.50 : intake.powerCurve === 'high' ? 0.40 : 0.30;
        mk(new THREE.BoxGeometry(1.85 * scale, h, 0.52), mBlack, 0, bH * 0.46 + h * 0.5, 0);
        // 8 individual runners (4 per side)
        for (let i = 0; i < 4; i++) {
          [-1, 1].forEach(side => {
            mk(new THREE.CylinderGeometry(0.058, 0.058, 0.45, 8), mBlack,
               side * 0.26, bH * 0.46 + h * 0.22, (-0.38 + i * 0.25) * scale, 0, 0, side * 0.22);
          });
        }
        // Throttle body + MAF inlet
        mk(new THREE.CylinderGeometry(0.18, 0.18, 0.30, 16), mBlack,
           0, bH * 0.46 + h * 0.50, 0.45, Math.PI/2, 0, 0);
        mk(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 16), mBlack,
           0, bH * 0.46 + h * 0.50, 0.66, Math.PI/2, 0, 0);
      }

    } else if (isGenI) {
      // BBC / SBC OHV — flat head, ribbed valve cover
      [-1, 1].forEach(side => {
        // Head casting
        mk(new THREE.BoxGeometry(bW * 0.80, 0.50, 0.78), mHead,
           side * 0.62, bH/2 + 0.22, 0, 0, 0, side * 0.34);
        // Valve cover base
        mk(new THREE.BoxGeometry(bW * 0.77, 0.32, 0.72), mAccent,
           side * 0.62, bH/2 + 0.60, 0, 0, 0, side * 0.34);
        // Ribs on valve cover (4)
        for (let r = 0; r < 4; r++) {
          mk(new THREE.BoxGeometry(0.028, 0.10, 0.70), mAccent,
             side * (0.62 + (-0.30 + r * 0.20)), bH/2 + 0.76, 0, 0, 0, side * 0.34);
        }
        // Oil filler cap
        mk(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10), mBlack,
           side * 0.60, bH/2 + 0.79, -0.28, 0, 0, side * 0.34);
      });

      // Distributor at rear top of block
      mk(new THREE.CylinderGeometry(0.10, 0.12, 0.44, 12), mBlack,
         -(bW/2 - 0.12), bH/2 + 0.12, -(bD/2 - 0.14));
      // Dist cap (dome)
      mk(new THREE.CylinderGeometry(0.13, 0.13, 0.16, 12), mBlack,
         -(bW/2 - 0.12), bH/2 + 0.38, -(bD/2 - 0.14));
      // 8 plug wires from cap
      for (let w = 0; w < 8; w++) {
        const angle = (w / 8) * Math.PI * 2;
        mk(new THREE.CylinderGeometry(0.010, 0.010, 0.55, 4), mRubber,
           -(bW/2 - 0.12) + Math.cos(angle) * 0.22,
           bH/2 + 0.32,
           -(bD/2 - 0.14) + Math.sin(angle) * 0.22, 0, 0, angle);
      }

      // Intake manifold + carb
      if (intake) {
        const h = intake.powerCurve === 'race' ? 0.78 : intake.powerCurve === 'high' ? 0.62 : 0.44;
        const mfld = intake.powerCurve === 'race' ? mAl : mBlack;
        mk(new THREE.BoxGeometry(bW * 0.72, h, isBBC ? 1.28 : 1.08), mfld,
           0, bH/2 + h/2 + 0.06, 0);

        if (intake.powerCurve === 'race' && isGenI) {
          // Tunnel-ram dual carb
          mk(new THREE.BoxGeometry(0.38, 0.50, 0.68), mAl, -0.28, bH/2 + h + 0.28, 0);
          mk(new THREE.BoxGeometry(0.38, 0.50, 0.68), mAl,  0.28, bH/2 + h + 0.28, 0);
          mk(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 24), mChrome, -0.28, bH/2 + h + 0.62, 0);
          mk(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 24), mChrome,  0.28, bH/2 + h + 0.62, 0);
        } else {
          // Single carb + chrome air cleaner
          mk(new THREE.BoxGeometry(0.68, 0.52, 0.64), mAl, 0, bH/2 + h + 0.30, 0);
          mk(new THREE.CylinderGeometry(0.46, 0.46, 0.18, 24), mChrome, 0, bH/2 + h + 0.65, 0);
          mk(new THREE.CylinderGeometry(0.44, 0.44, 0.14, 24), mBlack, 0, bH/2 + h + 0.75, 0);
        }
      }

    } else {
      // LS / Hemi OHV — flat-top valve covers + coil packs
      [-1, 1].forEach(side => {
        // Head casting
        mk(new THREE.BoxGeometry(bW * 0.84, 0.48, 0.70), mHead,
           side * 0.58, bH/2 + 0.21, 0, 0, 0, side * 0.22);
        // Valve cover
        mk(new THREE.BoxGeometry(bW * 0.80, 0.26, 0.66), mAccent,
           side * 0.58, bH/2 + 0.60, 0, 0, 0, side * 0.22);
        // Coil packs — 4 per side, sitting on valve cover
        for (let c = 0; c < 4; c++) {
          mk(new THREE.BoxGeometry(0.12, 0.14, 0.10), mBlack,
             side * 0.56, bH/2 + 0.76, (-0.38 + c * 0.26) * scale, 0, 0, side * 0.22);
          // Plug boot
          mk(new THREE.CylinderGeometry(0.022, 0.022, 0.30, 6), mRubber,
             side * 0.56, bH/2 + 0.60, (-0.38 + c * 0.26) * scale, 0, 0, side * 0.22);
        }
        // Oil filler cap
        mk(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 10), mChrome,
           side * 0.54, bH/2 + 0.77, 0.30);
      });

      // EFI intake manifold
      if (intake) {
        const h = intake.powerCurve === 'race' ? 0.62 : intake.powerCurve === 'high' ? 0.50 : intake.powerCurve === 'broad' ? 0.40 : 0.34;
        const mfld = (intake.powerCurve === 'race' || intake.powerCurve === 'high') ? mAl : mBlack;
        mk(new THREE.BoxGeometry(bW * 0.60, h, 1.18 * scale), mfld, 0, bH/2 + h * 0.42, 0);

        // 8 individual runners
        for (let i = 0; i < 4; i++) {
          [-1, 1].forEach(side => {
            mk(new THREE.CylinderGeometry(0.068, 0.068, h * 1.05, 8), mfld,
               side * 0.30, bH/2 + h * 0.15, (-0.42 + i * 0.28) * scale, 0, 0, side * 0.16);
          });
        }
        // Throttle body
        mk(new THREE.CylinderGeometry(0.19, 0.19, 0.28, 16), mBlack,
           0, bH/2 + h * 0.52, -(0.58 * scale) - 0.04, Math.PI/2, 0, 0);
        // MAF inlet
        mk(new THREE.CylinderGeometry(0.23, 0.23, 0.18, 16), mBlack,
           0, bH/2 + h * 0.52, -(0.58 * scale) - 0.23, Math.PI/2, 0, 0);
      }
    }

    // ── Forced induction ────────────────────────────────
    if (fi && fi.type === 'turbo') {
      const tX = -(bW/2 + 0.80), tY = -0.10, tZ = 0.70;
      // Turbine housing (hot side — cast iron look)
      mk(new THREE.CylinderGeometry(0.32, 0.32, 0.38, 24),
         new THREE.MeshStandardMaterial({ color: 0x4a4840, metalness: 0.65, roughness: 0.60 }),
         tX, tY, tZ, 0, 0, Math.PI/2);
      // Compressor housing (cold side — polished)
      mk(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 24), mChrome,
         tX - 0.38, tY, tZ, 0, 0, Math.PI/2);
      // Center section
      mk(new THREE.CylinderGeometry(0.14, 0.14, 0.44, 16), mBlack,
         tX - 0.19, tY, tZ, 0, 0, Math.PI/2);
      // Compressor inlet snout
      mk(new THREE.CylinderGeometry(0.14, 0.20, 0.22, 16), mChrome,
         tX - 0.60, tY, tZ, 0, 0, Math.PI/2);
      // Downpipe stub
      mk(new THREE.CylinderGeometry(0.09, 0.09, 0.40, 12), mExh,
         tX, tY - 0.40, tZ, 0.25, 0, 0);
      // Heat glow from turbine housing
      const glow = new THREE.PointLight(0xff5500, 2.2, 2.8);
      glow.position.set(tX, tY, tZ);
      group.add(glow);

    } else if (fi && fi.type === 'roots') {
      // Roots blower sitting on top of intake
      const intH = bH/2 + (intake && intake.powerCurve === 'race' ? 0.78 : intake && intake.powerCurve === 'high' ? 0.62 : 0.44);
      // Main case
      mk(new THREE.BoxGeometry(bW * 0.80, 0.56, bD * 0.78), mBlack, 0, intH + 0.28, 0);
      // 10 case fins on top
      for (let i = 0; i < 10; i++) {
        mk(new THREE.BoxGeometry(bW * 0.78, 0.040, bD * 0.76), mAl, 0, intH + 0.58 + i * 0.060, 0);
      }
      // Top plenum
      mk(new THREE.BoxGeometry(bW * 0.70, 0.20, bD * 0.62), mBlack, 0, intH + 1.20, 0);
      // Inlet scoop
      mk(new THREE.BoxGeometry(0.45, 0.36, 0.42), mBlack, 0, intH + 1.38, 0.18);
      // Drive snout + pulley
      mk(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 18), mAl,
         0, intH + 0.26, bD/2 + 0.20, Math.PI/2, 0, 0);
      mk(new THREE.TorusGeometry(0.24, 0.028, 8, 24), mChrome,
         0, intH + 0.26, bD/2 + 0.32, Math.PI/2, 0, 0);
      // Belt from blower pulley to crank
      mk(new THREE.BoxGeometry(0.05, 0.50, 0.028), mRubber, 0, bH * 0.05, bD/2 + 0.30);

    } else if (fi && fi.type === 'centri') {
      const cX = bW/2 + 0.60, cY = bH * 0.10, cZ = 0.40;
      // Snail housing (tapered cylinder)
      mk(new THREE.CylinderGeometry(0.30, 0.22, 0.52, 24), mChrome, cX, cY, cZ, 0, 0, Math.PI/2);
      // Compressor inlet
      mk(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 16), mChrome, cX + 0.40, cY, cZ, 0, 0, Math.PI/2);
      // Discharge pipe — goes up toward intercooler
      mk(new THREE.CylinderGeometry(0.072, 0.072, 0.50, 10), mChrome, cX + 0.02, cY + 0.44, cZ, 0.20, 0, 0);
      // Drive belt from crank
      mk(new THREE.BoxGeometry(0.05, 0.52, 0.022), mRubber, bW/2 + 0.06, bH * 0.08, bD/2 + 0.28);

    } else if (fi && fi.type === 'nitrous') {
      // NOS bottle (blue)
      const mBottle = new THREE.MeshStandardMaterial({ color: 0x1144ee, metalness: 0.78, roughness: 0.24 });
      mk(new THREE.CylinderGeometry(0.095, 0.095, 0.62, 14), mBottle,
         bW/2 + 0.24, -0.08, -0.48, 0, 0, Math.PI/2);
      // Bottle dome
      mk(new THREE.SphereGeometry(0.095, 12, 8), mBottle,
         bW/2 + 0.57, -0.08, -0.48);
      // Valve / solenoid block
      mk(new THREE.BoxGeometry(0.10, 0.10, 0.10), mChrome,
         bW/2 + 0.24, 0.02, -0.35);
      // Feed line (thin tube running toward intake)
      mk(new THREE.CylinderGeometry(0.016, 0.016, 0.52, 6), mChrome,
         bW/2 + 0.14, 0.06, -0.14, 0.10, 0, Math.PI/2);
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

  const styles = {
    app: { fontFamily: '"JetBrains Mono","SF Mono","Roboto Mono",monospace', background: '#0a0a0c', color: '#e8e8ea', minHeight: '100vh' },
    header: { borderBottom: `1px solid ${accent}44`, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg,#111114 0%,#0a0a0c 100%)', boxShadow: `0 1px 24px ${accent}22` },
    logo: { fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: '26px', letterSpacing: '0.1em', color: accent, textShadow: `0 0 20px ${accent}88` },
    familySwitcher: { display: 'flex', gap: '6px' },
    familyBtn: (active, fam) => ({ padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', border: `1px solid ${active ? ENGINE_FAMILIES[fam].accent : '#2a2a2e'}`, background: active ? ENGINE_FAMILIES[fam].accent + '22' : 'transparent', color: active ? ENGINE_FAMILIES[fam].accent : '#555', transition: 'all 0.15s', boxShadow: active ? `0 0 12px ${ENGINE_FAMILIES[fam].accent}55` : 'none' }),
    main: { display: 'grid', gridTemplateColumns: '320px 1fr 360px', gap: 0, height: 'calc(100vh - 60px)' },
    panel: { background: '#0c0c0f', borderRight: '1px solid #1a1a1e', overflowY: 'auto', padding: '16px' },
    rightPanel: { background: '#0c0c0f', borderLeft: '1px solid #1a1a1e', overflowY: 'auto', padding: '16px' },
    canvas: { position: 'relative', background: '#0a0a0c', overflow: 'hidden' },
    section: { fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: '#666', marginBottom: '8px', borderBottom: '1px solid #1a1a1e', paddingBottom: '6px' },
    tab: (active) => ({ flex: '1', padding: '8px 10px', background: active ? accent : '#15151a', color: active ? '#0a0a0c' : '#666', border: `1px solid ${active ? accent : '#1a1a1e'}`, cursor: 'pointer', fontSize: '10px', fontWeight: 700, transition: 'all 0.12s', boxShadow: active ? `0 0 8px ${accent}66` : 'none' }),
    card: (sel) => ({ position: 'relative', padding: '12px', marginBottom: '6px', background: sel ? `linear-gradient(135deg,${accent}18 0%,#15151a 100%)` : '#15151a', border: `1px solid ${sel ? accent : '#222226'}`, boxShadow: sel ? `0 0 18px ${accent}44, inset 0 0 24px ${accent}0a` : 'none', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }),
    button: { width: '100%', padding: '10px', background: accent, color: '#0a0a0c', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px', marginBottom: '6px', boxShadow: `0 0 12px ${accent}55` },
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
          {(() => {
            // Compute per-tab max values for spec bars
            const maxBlock = Math.max(...currentParts.map(p => p.displacement || 0));
            const maxFlow = Math.max(...currentParts.map(p => p.flow || 0));
            const maxLift = Math.max(...currentParts.map(p => p.lift || 0));
            const maxBoost = Math.max(...currentParts.map(p => p.boost || 0));
            const maxFlowRate = Math.max(...currentParts.map(p => p.flowRate || 0));
            return currentParts.map(part => {
              const sel = build[activeTab] === part.id;
              let barPct = 0;
              if (activeTab === 'block' && maxBlock) barPct = part.displacement / maxBlock;
              else if (activeTab === 'heads' && maxFlow) barPct = part.flow / maxFlow;
              else if (activeTab === 'cam' && maxLift) barPct = part.lift / maxLift;
              else if (activeTab === 'forcedInduction' && maxBoost) barPct = maxBoost ? part.boost / maxBoost : 0;
              else if (activeTab === 'fuel' && maxFlowRate) barPct = part.flowRate / maxFlowRate;
              return (
                <div key={part.id} style={styles.card(sel)} onClick={() => setBuild({ ...build, [activeTab]: part.id })}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px', paddingRight: '52px' }}>{part.name}</div>
                  <div style={{ fontSize: '11px', color: sel ? '#aaa' : '#666', marginBottom: '6px' }}>
                    {activeTab === 'block' && `${part.displacement}ci · ${part.bore}" × ${part.stroke}"`}
                    {activeTab === 'heads' && `${part.flow} cfm · ${part.chamber}cc chamber`}
                    {activeTab === 'cam' && `${part.dur}° dur · ${part.lift.toFixed(3)}" lift · ${part.lsa}° LSA`}
                    {activeTab === 'intake' && part.powerCurve.toUpperCase()}
                    {activeTab === 'forcedInduction' && (part.boost > 0 ? `${part.boost} psi boost` : 'Naturally Aspirated')}
                    {activeTab === 'fuel' && `${part.flowRate} ${part.e85 ? '· E85 capable' : ''}`}
                  </div>
                  {part.notes && (
                    <div style={{ fontSize: '10px', color: sel ? '#888' : '#444', fontStyle: 'italic', marginBottom: barPct > 0 ? '8px' : 0 }}>
                      {part.notes}
                    </div>
                  )}
                  {barPct > 0 && (
                    <div style={{ height: '2px', background: '#1a1a1e', borderRadius: '1px', overflow: 'hidden', marginBottom: part.shopSearch ? '8px' : 0 }}>
                      <div style={{ height: '100%', width: `${barPct * 100}%`, background: sel ? accent : '#333', borderRadius: '1px', transition: 'width 0.3s' }} />
                    </div>
                  )}
                  {part.shopSearch && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: barPct > 0 ? 0 : '8px' }}>
                      <a href={getShopUrl('jegs', part.shopSearch)} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: '4px 0', background: '#181808', border: '1px solid #ffcc0033', color: '#ffcc00', fontSize: '9px', fontWeight: 700, textAlign: 'center', textDecoration: 'none', letterSpacing: '0.12em' }}
                        onClick={e => e.stopPropagation()}>
                        JEGS ↗
                      </a>
                      <a href={getShopUrl('summit', part.shopSearch)} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: '4px 0', background: '#180d08', border: '1px solid #e85c0033', color: '#e87020', fontSize: '9px', fontWeight: 700, textAlign: 'center', textDecoration: 'none', letterSpacing: '0.12em' }}
                        onClick={e => e.stopPropagation()}>
                        SUMMIT ↗
                      </a>
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', color: accent, fontWeight: 700 }}>
                    ${part.cost.toLocaleString()}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* CENTER */}
        <div style={styles.canvas}>
          <div style={{ height: '55%', position: 'relative' }}>
            <Engine3D build={build} />
            <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '10px', color: '#666', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '4px' }}>
              DRAG TO ROTATE · SCROLL TO ZOOM
            </div>
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', gap: '10px' }}>
              {[
                { label: 'PEAK HP', value: peak.hp, sub: `@ ${peak.hpRpm} RPM` },
                { label: 'PEAK TQ', value: `${peak.tq}`, sub: `@ ${peak.tqRpm} RPM` },
                { label: 'BUILD COST', value: `$${(cost / 1000).toFixed(1)}k`, sub: 'parts only' },
              ].map(({ label, value, sub }) => (
                <div key={label} style={{ flex: 1, background: 'rgba(8,8,10,0.85)', padding: '12px 14px', borderTop: `2px solid ${accent}`, boxShadow: `0 0 20px ${accent}33, inset 0 0 30px ${accent}08`, backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', color: '#888', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '34px', fontWeight: 700, color: accent, lineHeight: 1, textShadow: `0 0 24px ${accent}` }}>{value}</div>
                  <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: '45%', padding: '16px', background: '#0c0c0f', borderTop: `1px solid ${accent}22` }}>
            <div style={styles.section}>Dyno {compareWith && `· vs "${compareWith.name}" (${comparePeak.hp} hp / ${comparePeak.tq} tq)`}</div>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a1a20" vertical={false} />
                <XAxis dataKey="rpm" stroke="#444" fontSize={10} tickLine={false} axisLine={{ stroke: '#222' }} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={{ background: '#0e0e12', border: `1px solid ${accent}55`, color: '#e8e8ea', fontSize: '11px', borderRadius: '2px' }} labelFormatter={v => `${v} RPM`} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#888' }} />
                <Area type="monotone" dataKey="hp" stroke={accent} strokeWidth={2.5} fill="url(#hpGrad)" dot={false} name="HP" activeDot={{ r: 4, fill: accent }} />
                <Area type="monotone" dataKey="tq" stroke={accent} strokeWidth={2} strokeDasharray="5 3" fill="url(#tqGrad)" dot={false} name="TQ" activeDot={{ r: 4, fill: accent }} />
                {compareWith && <Area type="monotone" dataKey="hp_b" stroke="#3388ff" strokeWidth={1.5} fill="none" dot={false} name={`HP (${compareWith.name})`} activeDot={{ r: 3, fill: '#3388ff' }} />}
              </AreaChart>
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

          <div style={{ ...styles.section, marginTop: '20px' }}>Shop This Build</div>
          {['block', 'heads', 'cam', 'intake', 'forcedInduction', 'fuel'].map(key => {
            const part = (CAT[key] || []).find(p => p.id === build[key]);
            if (!part?.shopSearch) return null;
            const label = { block: 'BLOCK', heads: 'HEADS', cam: 'CAM', intake: 'INTAKE', forcedInduction: 'BOOST', fuel: 'FUEL' }[key];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', padding: '6px 8px', background: '#15151a', border: '1px solid #1a1a1e' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'inline-block', fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', color: '#555', marginRight: '5px' }}>{label}</span>
                  <span style={{ fontSize: '10px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{part.brand && <span style={{ color: accent, marginRight: '4px' }}>{part.brand}</span>}{part.name}</span>
                </div>
                <a href={getShopUrl('jegs', part.shopSearch)} target="_blank" rel="noopener noreferrer"
                  style={{ flexShrink: 0, padding: '4px 7px', background: '#181808', border: '1px solid #ffcc0044', color: '#ffcc00', fontSize: '9px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.08em' }}>
                  JEGS
                </a>
                <a href={getShopUrl('summit', part.shopSearch)} target="_blank" rel="noopener noreferrer"
                  style={{ flexShrink: 0, padding: '4px 7px', background: '#180d08', border: '1px solid #e85c0044', color: '#e87020', fontSize: '9px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.08em' }}>
                  SUMMIT
                </a>
              </div>
            );
          })}
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
