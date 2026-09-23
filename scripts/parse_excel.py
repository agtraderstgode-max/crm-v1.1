import os
import sys
import json
import xlrd

script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(script_dir, '..'))
excel_path = os.path.join(root_dir, 'stock products name list sku', 'STOCK 23.09.2026.xls')

wb = xlrd.open_workbook(excel_path)
sheet = wb.sheet_by_name('Sheet')

GROUP_TO_CAT = {
    'KAG WALL 18X12 DIGITAL WATER PROOF': 'CAT005',
    'KAG WALL 18 X 12 DARK, LIGHT, HL': 'CAT005',
    'KAG WALL 18X12 DIGITAL WP ELEVATION': 'CAT006',
    'WALL 18 X 12 ELEVATION': 'CAT006',
    '18 X 12 ELEVATION': 'CAT006',
    '18 X 12 HIGH DEPTH ELEVATION (5 PCS)  - REG': 'CAT007',
    'KAG WALL 18 X 12 HIGH DEPTH ELEVATION (5 PCS)  - REG': 'CAT007',
    '18X12 ELEVATION POSTER': 'CAT009',
    
    'KAG WALL 15 X 10 WATER PROOF DARK, LIGHT, HL': 'CAT002',
    'KAG WALL 15 X 10 DARK, LIGHT, HL': 'CAT002',
    'KAG WALL 15 X 10 WATER PROOF ELEVATION': 'CAT003',
    'KAG WALL 15 X 10 ELEVATION': 'CAT003',
    '15X10 POSTER': 'CAT003',
    
    'WALL 12 X 8 PRINTED LIGHT': 'CAT001',
    'WALL 24 X 12 DARK, LIGHT, HL': 'CAT_ELT_01',
    
    'KAG FLOOR 12X12 WATER PROOF MATCHING': 'CAT011',
    'FLOOR 12X12 WATER PROOF MATCHING': 'CAT011',
    'KAG FLOOR 12 X 12 SEMI WP FLOOR FOR 15X10,18X10,18X12 & 24X12': 'CAT010',
    'FLOOR 12 X 12 DIGITAL- MATCHING FLOOR FOR 24X12 AND 18X12': 'CAT_ELT_07',
    
    'KAG FLOOR 12 X 12 DIGITAL PARKING (KAG)': 'CAT012',
    'KAG FLOOR 12 X 12 ROOFING WATER PROOF': 'CAT014',
    'KAG FLOOR 12 X 12 VITRIFIED ROOFING HEAVY': 'CAT015',
    
    'KAG FLOOR 16 X 16 DIGITAL HEAVY DUTY PARKING 12MM': 'CAT018',
    '16 X 16 DIGITAL HEAVY DUTY PARKING 12MM': 'CAT018',
    
    'KAG 20X20 DIGI VITRIFIED PARKING (3PCS)': 'CAT_ELT_09',
    
    '48X24 PGVT': 'CAT035',
    '48X24 CARVING': 'CAT036',
    '48X24 HG': 'CAT036',
    
    'KAG FLOOR 24 X 24 POLISHED GLAZED VITRIFIED': 'CAT025',
    '24X24 GVT MATT': 'CAT025',
    'KAG FLOOR 24 X 24 WOODEN': 'CAT020',
    'FLOOR 24 X 24 PGVT WOOD RUSTIC': 'CAT025',
    'KAG FLOOR 24 X 24 PGVT BOOK MATCH': 'CAT035',
    'KAG 24X24 CARVING PORCELAIN': 'CAT021',
    'KAG FLOOR 24 X 24 SUGAR RUSTIC': 'CAT021',
    '24X24 ROTTO SUGAR PROCELAIN': 'CAT021',
    'FLOOR 24 X 24 RIVA LIGHT': 'CAT022',
    'KAG FLOOR 24 X 24 RIVA DARK': 'CAT023',
    'KAG FLOOR 24X24 PGVT DC GALAXY': 'CAT026',
    
    '24X12 RAFALE': 'CAT_RAF_08',
    '18X12 RAFALE': 'CAT_RAF_10',
    '12X12 RAFALE MAT FLOOR': 'CAT_RAF_12',
    '12X12 RF MAT': 'CAT_RAF_12',
    '16X16 RAFALE': 'CAT_RAF_06',
    '24X24 RAFALE': 'CAT_RAF_03',
    '48X24 RAFALE': 'CAT_RAF_01',
    'KAG FLOOR 48 X 24 PGVT RAFALE': 'CAT_RAF_01',
    
    '48X24 ELITE': 'CAT_ELT_19',
    '48X24 GLOSTER SERIES': 'CAT_ELT_18',
    
    'FLOOR 4 FEET GVT STEP': 'CAT_ELT_32',
    'KAG FLOOR 4 FEET GVT RISER': 'CAT_ELT_33',
    'KAG FLOOR 4 FEET FULL BODY STEP': 'CAT_ELT_36',
    'KAG FLOOR 4 FEET FULL BODY RISER': 'CAT_ELT_37',
    
    'KAG FLOOR 3 FEET GVT STEP': 'CAT_ELT_30',
    'KAG FLOOR 3 FEET GVT RISER': 'CAT_ELT_31',
    'WALL 3 FEET GVT - RISER': 'CAT_ELT_31',
    'KAG FLOOR 3 FEET FULL BODY STEP': 'CAT_ELT_34',
    'KAG FLOOR 3 FEET FULL BODY RISER': 'CAT_ELT_35'
}

def get_size(grp):
    for s in ['48X24', '48 X 24', '24X12', '24 X 12', '18X12', '18 X 12', '15X10', '15 X 10', '12X8', '12 X 8', '24X24', '24 X 24', '20X20', '20 X 20', '16X16', '16 X 16', '12X12', '12 X 12', '4 FEET', '3 FEET']:
        if s in grp.upper():
            return s.replace(' ', '')
    return '18X12'

def get_brand(grp):
    if 'RAFALE' in grp.upper():
        return 'KAG RAFALE'
    if any(k in grp.upper() for k in ['ELITE', 'GLOSTER', 'FEET']):
        return 'KAG ELITE'
    return 'KAG STUDIO'

def get_finish(grp):
    u = grp.upper()
    if 'PGVT' in u: return 'PGVT'
    if 'CARVING' in u: return 'Carving'
    if 'HIGH DEPTH' in u: return 'High Depth Elevation'
    if 'ELEVATION' in u: return 'Elevation'
    if 'POSTER' in u: return 'Poster'
    if 'ROOFING' in u: return 'Roofing'
    if 'PARKING' in u: return 'Heavy Duty Parking'
    if 'WATER PROOF' in u or 'WP' in u: return 'Water Proof'
    if 'RIVA' in u: return 'Double Charge'
    if 'GVT' in u: return 'GVT'
    if 'WOOD' in u: return 'Wooden'
    if 'FULL BODY' in u: return 'Full Body'
    if 'STEP' in u: return 'Step'
    if 'RISER' in u: return 'Riser'
    return 'Glossy / Matt'

products = []
count = 0
for i in range(5, sheet.nrows):
    row = sheet.row_values(i)
    prod = str(row[1]).strip()
    grp = str(row[2]).strip()
    if prod and grp:
        count += 1
        p_id = f'TL-{count:04d}'
        cat_id = GROUP_TO_CAT.get(grp, 'CAT005')
        size = get_size(grp)
        brand = get_brand(grp)
        finish = get_finish(grp)
        products.append({
            'id': p_id,
            'name': prod,
            'brand': brand,
            'category_id': cat_id,
            'size': size,
            'finish': finish,
            'price': '',
            'stock': 100,
            'reserved': 0,
            'available': 100,
            'min': 20,
            'unit': 'boxes'
        })

print(json.dumps(products))
