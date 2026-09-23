import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

// Load .env
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(rootDir, '.env'))) {
    process.loadEnvFile(path.join(rootDir, '.env'))
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fyycsuprnwpacbsiyzrt.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_9YNgEYYtwKsklAorPWj-xA_z7mUS_kk'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 1. ALL CATEGORIES DEFINITION (STUDIO, RAFALE, ELITE)
const CATEGORIES = [
  // --- STUDIO COLLECTION (14-06-2026) ---
  { id: 'CAT001', size: '12X8', name: 'White, Ivory, Skublue', type: 'WALL', sqft_per_box: 7.75, pcs_per_box: 12, mrp: 295, online_price: 266, sqft_price: 34, discount_pct: 10, weight_per_box: 8 },
  { id: 'CAT002', size: '15X10', name: 'All Waterproof - Light Dark & Highlighter', type: 'WALL', sqft_per_box: 8.07, pcs_per_box: 8, mrp: 380, online_price: 342, sqft_price: 42, discount_pct: 10, weight_per_box: 8 },
  { id: 'CAT003', size: '15X10', name: 'Elevation', type: 'WALL', sqft_per_box: 8.07, pcs_per_box: 8, mrp: 420, online_price: 378, sqft_price: 47, discount_pct: 10, weight_per_box: 8 },
  { id: 'CAT004', size: '18X12', name: 'Semi Waterproof All Names', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 6, mrp: 445, online_price: 401, sqft_price: 46, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT005', size: '18X12', name: 'Waterproof (Ivory, White, Grey 10000, 30000, Golden, Luster Kitchen, Decore)', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 6, mrp: 465, online_price: 419, sqft_price: 48, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT006', size: '18X12', name: 'Elevation / Glitter Series', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 6, mrp: 500, online_price: 450, sqft_price: 52, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT007', size: '18X12', name: 'High Depth Interior & Exterior Elevation', type: 'WALL', sqft_per_box: 7.27, pcs_per_box: 5, mrp: 500, online_price: 450, sqft_price: 62, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT008', size: '18X12', name: 'High Depth Elevation - SOL Body', type: 'WALL', sqft_per_box: 7.27, pcs_per_box: 5, mrp: 540, online_price: 486, sqft_price: 67, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT009', size: '18X12', name: '6Pcs Poster *', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 6, mrp: 1500, online_price: 577, sqft_price: 66, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT010', size: '12X12', name: 'Semi Waterproof Matching Floor for 18x12, 15x10', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 9, mrp: 520, online_price: 468, sqft_price: 54, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT011', size: '12X12', name: 'Waterproof Matching Floor for 15x10, 18x12', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 9, mrp: 540, online_price: 486, sqft_price: 56, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT012', size: '12X12', name: 'Digital Parking, Steps & Riser', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 8, mrp: 465, online_price: 419, sqft_price: 54, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT013', size: '12X12', name: 'JUMBO Roofing', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 8, mrp: 480, online_price: 432, sqft_price: 56, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT014', size: '12X12', name: 'Roofing & SPARKLE - Water Proof', type: 'FLOOR', sqft_per_box: 8.72, pcs_per_box: 9, mrp: 480, online_price: 432, sqft_price: 50, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT015', size: '12X12', name: 'Vitrified Roofing Heavy - Water Proof', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 8, mrp: 530, online_price: 477, sqft_price: 62, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT016', size: '12X12', name: 'Morracon, Athangudi, cloudy, wooden rustic, terraso, Grass', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 8, mrp: 550, online_price: 495, sqft_price: 64, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT017', size: '12X12', name: 'Roofing Heavy', type: 'FLOOR', sqft_per_box: 9.68, pcs_per_box: 10, mrp: 535, online_price: 482, sqft_price: 50, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT018', size: '16X16', name: 'Digital Heavy Duty Parking', type: 'FLOOR', sqft_per_box: 8.61, pcs_per_box: 5, mrp: 650, online_price: 585, sqft_price: 68, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT019', size: '16X16', name: 'PARKING SUGAR', type: 'FLOOR', sqft_per_box: 8.61, pcs_per_box: 5, mrp: 690, online_price: 621, sqft_price: 72, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT020', size: '24X24', name: 'Porcelain Digital - Wood, Rustic, Glaicha, Grass, Punch, Satin', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1035, online_price: 932, sqft_price: 60, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT021', size: '24X24', name: 'Porcelain - Carving, Crystal, Glamour, Rotto Sugar', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1120, online_price: 1008, sqft_price: 65, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT022', size: '24X24 DOUBLE CHARGE', name: 'Riva Light', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1165, online_price: 1049, sqft_price: 68, discount_pct: 10, weight_per_box: 25 },
  { id: 'CAT023', size: '24X24 DOUBLE CHARGE', name: 'Riva Dark', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1280, online_price: 1152, sqft_price: 74, discount_pct: 10, weight_per_box: 25 },
  { id: 'CAT024', size: '24X24 DOUBLE CHARGE', name: 'Amazon Light', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1270, online_price: 1143, sqft_price: 74, discount_pct: 10, weight_per_box: 25 },
  { id: 'CAT025', size: '24X24 GVT', name: 'PGVT, GVT - Wood, Rustic & MATT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1145, online_price: 1031, sqft_price: 66, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT026', size: '24X24 GVT', name: 'PGVT Galaxy DC', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1190, online_price: 1071, sqft_price: 69, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT027', size: '24X24 FULL BODY', name: 'FULL BODY - LIGHT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1275, online_price: 1148, sqft_price: 74, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT028', size: '24X24 FULL BODY', name: 'FULL BODY - SEMI', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1380, online_price: 1242, sqft_price: 80, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT029', size: '24X24 FULL BODY', name: 'FULL BODY - DARK', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1490, online_price: 1341, sqft_price: 87, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT030', size: '24X24 FULL BODY', name: '12MM FULL BODY - LIGHT', type: 'FLOOR', sqft_per_box: 11.6, pcs_per_box: 3, mrp: 1675, online_price: 1508, sqft_price: 130, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT031', size: '24X24 FULL BODY', name: '12MM FULL BODY - DARK', type: 'FLOOR', sqft_per_box: 11.6, pcs_per_box: 3, mrp: 1780, online_price: 1602, sqft_price: 138, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT032', size: '48X24 FULL BODY', name: 'FULL BODY - LIGHT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1675, online_price: 1508, sqft_price: 97, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT033', size: '48X24 FULL BODY', name: 'FULL BODY - SEMI', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1780, online_price: 1602, sqft_price: 103, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT034', size: '48X24 FULL BODY', name: 'FULL BODY - DARK', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1890, online_price: 1701, sqft_price: 110, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT035', size: '48X24', name: 'PGVT, Book Match, GVT- Rustic, Wood', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1145, online_price: 1031, sqft_price: 66, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT036', size: '48X24', name: 'PGVT - High Glossy HG CARVING', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1520, online_price: 1368, sqft_price: 88, discount_pct: 10, weight_per_box: 26 },

  // --- RAFALE COLLECTION (15-06-2026) ---
  { id: 'CAT_RAF_01', size: '48X24', name: 'RAFALE PGVT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1095, online_price: 986, sqft_price: 64, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_RAF_02', size: '48X24', name: 'RAFALE CARVING, Satin', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1255, online_price: 1130, sqft_price: 73, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_RAF_03', size: '24X24', name: 'RAFALE Nano Vitrified / GLOSSY / MATT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 995, online_price: 896, sqft_price: 58, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_RAF_04', size: '24X24', name: 'RAFALE SUGAR', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1080, online_price: 972, sqft_price: 63, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_RAF_05', size: '24X24', name: 'RAFALE ROOFING', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1120, online_price: 1008, sqft_price: 65, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_RAF_06', size: '16X16', name: 'RAFALE PARKING', type: 'FLOOR', sqft_per_box: 8.61, pcs_per_box: 5, mrp: 615, online_price: 554, sqft_price: 64, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_RAF_07', size: '12X12', name: 'RAFALE ROOFING', type: 'FLOOR', sqft_per_box: 9.68, pcs_per_box: 10, mrp: 500, online_price: 450, sqft_price: 46, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_RAF_08', size: '24X12', name: 'RAFALE Dark Light & High Lighter', type: 'WALL', sqft_per_box: 9.69, pcs_per_box: 5, mrp: 595, online_price: 536, sqft_price: 55, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_RAF_09', size: '12X12', name: 'RAFALE Matching Floor - 24x12', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 9, mrp: 540, online_price: 486, sqft_price: 56, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT_RAF_10', size: '18X12', name: 'RAFALE Semi Water Proof All', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 6, mrp: 435, online_price: 392, sqft_price: 45, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT_RAF_11', size: '18X12', name: 'RAFALE Elevation', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 6, mrp: 485, online_price: 437, sqft_price: 50, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT_RAF_12', size: '12X12', name: 'RAFALE Matching Floor - 18x12', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 9, mrp: 520, online_price: 468, sqft_price: 54, discount_pct: 10, weight_per_box: 10 },

  // --- ELITE COLLECTION (14-06-2026) ---
  { id: 'CAT_ELT_01', size: '24X12', name: 'ELITE Dark, Light, HL, Reactive & Carving - Cluster', type: 'WALL', sqft_per_box: 9.69, pcs_per_box: 5, mrp: 715, online_price: 644, sqft_price: 66, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_02', size: '24X12', name: 'ELITE Poster', type: 'WALL', sqft_per_box: 7.75, pcs_per_box: 4, mrp: 715, online_price: 644, sqft_price: 83, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT_ELT_03', size: '24X12', name: 'ELITE Elevation & Wall Body High Depth Elevation, Sugar', type: 'WALL', sqft_per_box: 9.69, pcs_per_box: 5, mrp: 795, online_price: 716, sqft_price: 74, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_04', size: '24X12', name: 'ELITE Black Sugar & Glue', type: 'WALL', sqft_per_box: 9.69, pcs_per_box: 5, mrp: 830, online_price: 747, sqft_price: 77, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_05', size: '24X12', name: 'ELITE Super White, Color Elevation / High Depth - SOL Body', type: 'WALL', sqft_per_box: 9.69, pcs_per_box: 5, mrp: 850, online_price: 765, sqft_price: 79, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_06', size: '22X12', name: 'ELITE High Depth Elevation - INTERLOCK', type: 'WALL', sqft_per_box: 7.10, pcs_per_box: 4, mrp: 850, online_price: 765, sqft_price: 108, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT_ELT_07', size: '12X12', name: 'ELITE WaterProof Matching Floor for 24x12', type: 'WALL', sqft_per_box: 8.72, pcs_per_box: 9, mrp: 540, online_price: 486, sqft_price: 56, discount_pct: 10, weight_per_box: 10 },
  { id: 'CAT_ELT_08', size: '16X16', name: 'ELITE Digital Heavy Duty Parking', type: 'FLOOR', sqft_per_box: 8.61, pcs_per_box: 5, mrp: 690, online_price: 621, sqft_price: 72, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_09', size: '20X20', name: 'ELITE Digital Heavy Duty Parking', type: 'FLOOR', sqft_per_box: 8.07, pcs_per_box: 3, mrp: 740, online_price: 666, sqft_price: 83, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_10', size: '24X24', name: 'ELITE Heavy Parking', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 2, mrp: 1015, online_price: 914, sqft_price: 118, discount_pct: 10, weight_per_box: 15 },
  { id: 'CAT_ELT_11', size: '24X24', name: 'ELITE SUMO ROOFING / VITRO - MATT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1120, online_price: 1008, sqft_price: 65, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_ELT_12', size: '24X24', name: 'ELITE VITRO - CARVING, LAPATO', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1225, online_price: 1103, sqft_price: 71, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_ELT_13', size: '24X24', name: 'ELITE VITRO PUNCH - CARVING, MORRACON, ATHANGUDI', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1305, online_price: 1175, sqft_price: 76, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_ELT_14', size: '24X24 FULL BODY', name: 'ELITE OPAL SATIN / MONOSTONE - Light', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1660, online_price: 1494, sqft_price: 96, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_15', size: '24X24 FULL BODY', name: 'ELITE OPAL SATIN / MONOSTONE - Dark', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 4, mrp: 1885, online_price: 1697, sqft_price: 109, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_16', size: '48X24', name: 'ELITE CARVING - SATIN, WOOD, RUSTIC & DARK', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1305, online_price: 1175, sqft_price: 76, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_17', size: '48X24', name: 'ELITE GLUE CARVING, PUNCH', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1520, online_price: 1368, sqft_price: 88, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_18', size: '48X24', name: 'ELITE Gloster, Subway', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1705, online_price: 1535, sqft_price: 99, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_19', size: '48X24 GVT', name: 'ELITE PGVT', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1445, online_price: 1301, sqft_price: 84, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_20', size: '48X24 GVT', name: 'ELITE RAINBOW / MATT CARVING', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1595, online_price: 1436, sqft_price: 93, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_21', size: '48X24 GVT', name: 'ELITE HG carving / PUNCH', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1705, online_price: 1535, sqft_price: 99, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_22', size: '48X24 GVT', name: 'ELITE CRISTAL HG / VELVET CARVING', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1920, online_price: 1728, sqft_price: 111, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_23', size: '48X24 GVT', name: 'ELITE GRANULA, DDG - GLUE SUGAR', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 2130, online_price: 1917, sqft_price: 124, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_24', size: '48X24 GVT', name: 'ELITE VELVET / ENGRAVE, R10/R11 & STONEX', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1810, online_price: 1629, sqft_price: 105, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_25', size: '48X24 FULL BODY', name: 'ELITE Full Body Datsun', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 2060, online_price: 1854, sqft_price: 120, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_26', size: '48X24 FULL BODY', name: 'ELITE Full Body - Datsun Gesso, Tac Beige', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 2285, online_price: 2057, sqft_price: 133, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_27', size: '48X24 FULL BODY', name: 'ELITE Full Body - Civic White', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 2505, online_price: 2255, sqft_price: 145, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_28', size: '48X24 DOUBLE CHARGE', name: 'ELITE Prime Light', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1550, online_price: 1395, sqft_price: 90, discount_pct: 10, weight_per_box: 26 },
  { id: 'CAT_ELT_29', size: '48X24 DOUBLE CHARGE', name: 'ELITE Prime Dark, Sigma Light', type: 'FLOOR', sqft_per_box: 15.5, pcs_per_box: 2, mrp: 1660, online_price: 1494, sqft_price: 96, discount_pct: 10, weight_per_box: 26 },

  // --- STEPS & RISERS (ELITE) ---
  { id: 'CAT_ELT_30', size: '3 FEET', name: 'ELITE 3 Feet GVT - Step', type: 'FLOOR', sqft_per_box: 11.62, pcs_per_box: 4, mrp: 1480, online_price: 1332, sqft_price: 115, discount_pct: 10, weight_per_box: 16 },
  { id: 'CAT_ELT_31', size: '3 FEET', name: 'ELITE 3 Feet GVT - Riser', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 4, mrp: 990, online_price: 891, sqft_price: 115, discount_pct: 10, weight_per_box: 12 },
  { id: 'CAT_ELT_32', size: '4 FEET', name: 'ELITE 4 Feet GVT - Step', type: 'FLOOR', sqft_per_box: 15.4, pcs_per_box: 4, mrp: 1975, online_price: 1778, sqft_price: 115, discount_pct: 10, weight_per_box: 22 },
  { id: 'CAT_ELT_33', size: '4 FEET', name: 'ELITE 4 Feet GVT - Riser', type: 'FLOOR', sqft_per_box: 10.3, pcs_per_box: 4, mrp: 1320, online_price: 1188, sqft_price: 115, discount_pct: 10, weight_per_box: 16 },
  { id: 'CAT_ELT_34', size: '3 FEET', name: 'ELITE 3 Feet Full Body GVT - Step', type: 'FLOOR', sqft_per_box: 11.62, pcs_per_box: 4, mrp: 2255, online_price: 2030, sqft_price: 175, discount_pct: 10, weight_per_box: 18 },
  { id: 'CAT_ELT_35', size: '3 FEET', name: 'ELITE 3 Feet Full Body GVT - Riser', type: 'FLOOR', sqft_per_box: 7.75, pcs_per_box: 4, mrp: 1505, online_price: 1355, sqft_price: 175, discount_pct: 10, weight_per_box: 14 },
  { id: 'CAT_ELT_36', size: '4 FEET', name: 'ELITE 4 Feet Full Body GVT - Step', type: 'FLOOR', sqft_per_box: 15.4, pcs_per_box: 4, mrp: 3010, online_price: 2709, sqft_price: 176, discount_pct: 10, weight_per_box: 24 },
  { id: 'CAT_ELT_37', size: '4 FEET', name: 'ELITE 4 Feet Full Body GVT - Riser', type: 'FLOOR', sqft_per_box: 10.33, pcs_per_box: 4, mrp: 2005, online_price: 1805, sqft_price: 175, discount_pct: 10, weight_per_box: 18 },
]

async function runImport() {
  console.log('🚀 Starting Category & Product Import Pipeline...')

  // Step 1: Upsert all categories
  console.log(`📦 Upserting ${CATEGORIES.length} categories into Supabase...`)
  for (let i = 0; i < CATEGORIES.length; i += 20) {
    const chunk = CATEGORIES.slice(i, i + 20)
    const { error } = await supabase.from('categories').upsert(chunk, { onConflict: 'id' })
    if (error) {
      console.error('❌ Error upserting categories chunk:', error.message)
      process.exit(1)
    }
  }
  console.log(`✅ ${CATEGORIES.length} categories upserted successfully.`)

  // Step 2: Parse Excel file via Python script
  const parseScript = path.join(__dirname, 'parse_excel.py')
  console.log(`\n📄 Parsing products using ${parseScript}...`)
  const jsonStr = execSync(`python3 "${parseScript}"`, { maxBuffer: 50 * 1024 * 1024 }).toString()
  const products = JSON.parse(jsonStr)
  console.log(`✅ Extracted ${products.length} products from Excel!`)

  // Step 3: Remove old products from products table
  console.log('\n🧹 Cleaning old products from Supabase...')
  while (true) {
    const { data: existingProds } = await supabase.from('products').select('id').range(0, 999)
    if (!existingProds || existingProds.length === 0) break
    const oldIds = existingProds.map(p => p.id)
    for (let i = 0; i < oldIds.length; i += 100) {
      const chunk = oldIds.slice(i, i + 100)
      await supabase.from('products').delete().in('id', chunk)
    }
    console.log(`  🗑️ Cleared batch of ${oldIds.length} prior products...`)
  }
  console.log(`✅ Supabase products table cleared.`)

  // Step 4: Bulk upsert all 1,140 products in batches
  console.log(`\n📥 Upserting ${products.length} products into Supabase 'products' table...`)
  const batchSize = 100
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error(`❌ Batch upsert error at ${i}..${i + batch.length}:`, error.message)
      process.exit(1)
    }
    console.log(`  ✓ Upserted ${Math.min(i + batchSize, products.length)} / ${products.length}`)
  }
  console.log(`🎉 All ${products.length} products upserted into Supabase!`)

  // Step 5: Generate local data files & enrich Quotation Planner TILE_DB
  console.log('\n💾 Generating local product cache for fast offline access...')
  const catMap = new Map(CATEGORIES.map(c => [c.id, c]))
  const enrichedProducts = products.map(p => {
    const cat = catMap.get(p.category_id)
    return {
      ...p,
      mrp: cat ? cat.mrp : 0,
      online_price: cat ? cat.online_price : 0,
      sqft_price: cat ? cat.sqft_price : 0,
      pcs_per_box: cat ? cat.pcs_per_box : 0,
      sqft_per_box: cat ? cat.sqft_per_box : 0,
      weight_per_box: cat ? cat.weight_per_box : 0,
      category_name: cat ? cat.name : ''
    }
  })

  // Save to src/data/allProductsData.json and data/
  const dataDir = path.join(rootDir, 'src', 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(path.join(dataDir, 'allProductsData.json'), JSON.stringify(enrichedProducts, null, 2), 'utf-8')
  console.log('✅ Saved src/data/allProductsData.json')

  // Save to data/products.json and data/categories.json for offline server mode
  const localDataDir = path.join(rootDir, 'data')
  if (!fs.existsSync(localDataDir)) fs.mkdirSync(localDataDir, { recursive: true })
  fs.writeFileSync(path.join(localDataDir, 'products.json'), JSON.stringify(products, null, 2), 'utf-8')
  fs.writeFileSync(path.join(localDataDir, 'categories.json'), JSON.stringify(CATEGORIES, null, 2), 'utf-8')
  console.log('✅ Saved data/products.json and data/categories.json')

  // Generate TILE_DB entries for Quotation Planner
  console.log('\n📐 Building complete TILE_DB for Quotation Planner...')
  const plannerTiles = enrichedProducts.map(p => ({
    name: `${p.name} ${p.size} ${p.finish}`.trim(),
    coverage: p.sqft_per_box || 15.5,
    weight: p.weight_per_box || 25,
    sqftPrice: p.sqft_price || 0,
    mrp: p.mrp || 0,
    price: Math.round((p.sqft_price || 0) * (p.sqft_per_box || 15.5))
  }))

  fs.writeFileSync(path.join(dataDir, 'quotationPlannerTiles.json'), JSON.stringify(plannerTiles, null, 2), 'utf-8')
  console.log(`✅ Saved ${plannerTiles.length} tile specifications for Quotation Planner.`)

  console.log('\n🎉 COMPLETED SUCCESSFULLY! All 1,140 products and Studio/Rafale/Elite pricelists are live in the database.')
}

runImport().catch(err => {
  console.error('Fatal import error:', err)
  process.exit(1)
})
