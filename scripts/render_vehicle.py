import os
import sys
import glob
import json
import math
import argparse
from PIL import Image
import numpy as np

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def reconstruct_dxt5nm_normal(in_path, out_path):
    img = Image.open(in_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)
    r_channel = arr[:, :, 0]
    if np.mean(r_channel) > 240 and np.std(r_channel) < 15:
        nx = (arr[:, :, 3] / 255.0) * 2.0 - 1.0
        ny = (arr[:, :, 1] / 255.0) * 2.0 - 1.0
        nz_sq = 1.0 - nx * nx - ny * ny
        nz_sq = np.clip(nz_sq, 0.0, 1.0)
        nz = np.sqrt(nz_sq)
        
        out_r = np.clip((nx + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        out_g = np.clip((ny + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        out_b = np.clip((nz + 1.0) * 0.5 * 255.0, 0, 255).astype(np.uint8)
        
        out_arr = np.stack([out_r, out_g, out_b], axis=-1)
        out_img = Image.fromarray(out_arr, 'RGB')
        out_img.save(out_path)
        return out_path
    else:
        img.convert('RGB').save(out_path)
        return out_path

EXCLUDES_GLOBAL = [
    'dirty', 'dirt', 'interior', 'wheels', 'wheel', 'seating', 'apron', 'shirt', 'pants',
    'boots', 'doctor', 'suit', 'shoes', 'face', 'skin', 'hoodie', 'hair', 'eyebrow',
    'croptop', 'underwear', 'sofa', 'furniture', 'flag', 'bag', 'fence', 'paperbag',
    'bricks', '1x1', 'sweater', 'box', 'headset', 'whistle', 'skirt', 'sneakers', 'hat', 'sole', 'lace'
]

CANONICAL_CONFIGS = {
    'anselmoaf90': {
        'color': 'Red',
        'albedo': 'T_Ferrari SF90_D.png',
        'mask': 'T_Ferrari SF90_Mask Map.png',
        'normal': None,
        'emission': 'T_Ferrari SF90_E.png',
    },
    'bima320': {
        'color': 'Red',
        'custom_tint': (145, 8, 12),
        'custom_fresnel': (78, 6, 8),
        'albedo': 'T_BMW_Albedo.png',
        'mask': 'T_BMW_MASK.png',
        'normal': 'T_BMW_N.png',
        'emission': 'T_Lights_Mask.png',
    },
    'deliverytruck': {
        'color': 'Black',
        'albedo': 'T_UPSTruck_BCMask.png',
        'mask': 'T_UPSTruck_M.png',
        'normal': 'T_UPSTruck_N.png',
        'emission': 'T_UPSTruck_L.png',
        'slots': {
            'm_upstruckwheels': {'type': 'pbr', 'albedo': 'T_UPSTruckWheels_BC.png', 'mask': 'T_UPSTruckWheels_M.png', 'normal': 'T_UPSTruckWheels_N.png'},
            'm_upstruckinterior': {'type': 'pbr', 'albedo': 'T_UPSTruckInterior_BC.png', 'mask': 'T_UPSTruckInterior_M.png', 'normal': 'T_UPSTruckInterior_N.png'},
            'm_glasstransparent': {'type': 'glass'},
            'm_upstruckbody': {'type': 'body'},
        }
    },
    'electricscooter': {
        'color': 'Black',
        'albedo': 'T_ElectricScooter_D+MASK.png',
        'mask': 'T_ElectricScooter_MASK.png',
        'normal': 'T_ElectricScooter_N.png',
        'emission': 'T_ElectricScooter_E.png',
        'slots': {
            'wheel': {'type': 'pbr', 'albedo': 'Wheel_Albedo.png', 'mask': 'Wheel_MaskMap.png', 'normal': 'Wheel_Normal.png'},
            'm_electricscooter': {'type': 'body'},
        }
    },
    'ferdinand112': {
        'color': 'Grey',
        'albedo': 'SM_Porsche911_930-Inspired_D.png',
        'mask': 'SM_Porsche911_930-Inspired_Mask Map.png',
        'normal': 'SM_Porsche911_930-Inspired_N.png',
        'emission': 'SM_Porsche911_930-Inspired_E.png',
        'slots': {
            'm_glasstransparent': {'type': 'glass'},
            'm_porsche': {'type': 'body'},
        }
    },
    'freighttruckt1': {
        'color': 'White',
        'albedo': 'T_FreightlinerTruck_Cabin_D.png',
        'mask': 'T_FreightlinerTruck_Cabin_Mask Map.png',
        'normal': 'T_FreightlinerTruck_Cabin_N.png',
        'emission': 'T_FreightlinerTruck_Cabin_E.png',
        'slots': {
            'm_glasstranscars': {'type': 'glass'},
            'm_freightliner': {'type': 'body'},
        }
    },
    'honzamimic': {
        'color': 'Red',
        'albedo': 'T_HondaCivicLikeCar_D.png',
        'mask': 'T_HondaCivicLikeCar_MaskMap.png',
        'normal': 'T_HondaCivicLikeCar_N.png',
        'emission': 'T_HondaCivicLikeCar_E.png',
    },
    'limo': {
        'color': 'Black',
        'albedo': 'T_Limousine_BC.png',
        'mask': 'T_Limousine_M.png',
        'normal': 'T_Limousine_N.png',
        'emission': 'T_Limousine_E.png',
    },
    'luxuryyacht': {
        'color': 'White',
        'is_boat': True,
        'albedo': 'T_LuxuryYacht_D.png',
        'mask': 'T_LuxuryYacht_Mask Map.png',
        'normal': 'T_LuxuryYacht_N.png',
        'emission': None,
        'slots': {
            'm_glass': {'type': 'glass'},
            'm_glasstranscasinoboat': {'type': 'glass'},
            'm_corner': {'type': 'pbr', 'albedo': 'T_Corner Sofa_D.png', 'mask': 'T_Corner Sofa_Mask Map.png', 'normal': 'T_Corner Sofa_N.png'},
            'm_luxuriousyachtfurniture': {'type': 'pbr', 'albedo': 'T_LuxuriousYacht Furniture_D.png', 'mask': 'T_LuxuriousYacht Furniture_Mask Map.png', 'normal': 'T_LuxuriousYacht Furniture_N.png'},
            'm_luxuriousyachtfurniture_lit': {'type': 'pbr', 'albedo': 'T_LuxuriousYacht Furniture_D.png', 'mask': 'T_LuxuriousYacht Furniture_Mask Map.png', 'normal': 'T_LuxuriousYacht Furniture_N.png'},
            'm_usaflag': {'type': 'pbr', 'albedo': 'T_UsFlag2_D.png'},
            'm_wallflag': {'type': 'pbr', 'albedo': 'T_WallFlag_D.png', 'mask': 'T_WallFlag_MASK.png', 'normal': 'T_WallFlag_N.png'},
            'm_luxuryyachtdeck': {'type': 'pbr', 'normal': 'T_Metal Sheet_N.png'},
            'm_casino_blackmetal': {'type': 'pbr', 'color': (0.05, 0.05, 0.05, 1.0), 'metallic': 0.8, 'roughness': 0.3},
            'm_luxury': {'type': 'body'},
            'm_casino': {'type': 'body'},
        }
    },
    'mersaididash': {
        'color': 'White',
        'albedo': 'Van_low_Exterior_BaseMap copy.png',
        'mask': 'Van_low_Exterior_MaskMap.png',
        'normal': 'Van_low_Exterior_Normal.png',
        'emission': 'Van_low_Exterior_Emissive.png',
    },
    'mersaidimgagt': {
        'color': 'Yellow',
        'albedo': 'T_Mercedes AMG Inspired_D.png',
        'mask': 'T_Mercedes AMG Inspired_Mask Map.png',
        'normal': 'T_Mercedes AMG Inspired_N.png',
        'emission': 'T_Mercedes AMG Inspired_E.png',
    },
    'mersaidis500': {
        'color': 'Black',
        'albedo': 'T_MercedesInspired_D.png',
        'mask': 'T_MercedesInspired_MaskMap.png',
        'normal': 'T_MercedesInspired_N.png',
        'emission': 'T_MercedesInspired_E.png',
        'slots': {
            'm_glasstranscars': {'type': 'glass'},
            'm_mercedesinspired': {'type': 'body'},
        }
    },
    'missamvillian': {
        'color': 'Grey',
        'albedo': 'AudiBody1py.png',
        'mask': 'SM_Audi RS6_M_AudiBody1_MaskMap.png',
        'normal': 'Normal Map from Mesh M_AudiBody1.png',
        'emission': 'Audi_E.png',
        'slots': {
            'm_audibody2_woshader': {'type': 'pbr', 'albedo': 'AudiBody2.png', 'mask': 'SM_Audi RS6_M_AudiBody2_MaskMap.png'},
            'm_audibody1': {'type': 'body'},
            'm_audibodyfresnel': {'type': 'body'},
        }
    },
    'petrollsfanton': {
        'color': 'Black',
        'albedo': 'T_RolsRoyce Inspired_D.png',
        'mask': 'T_RolsRoyce Inspired_Mask Map.png',
        'normal': 'T_RolsRoyce Inspired_N.png',
        'emission': 'T_RolsRoyce Inspired_E.png',
    },
    'speedboat': {
        'color': 'White',
        'is_boat': True,
        'albedo': 'Boat_low_Boat_BaseColor.png',
        'mask': 'T_Boat_MAR.png',
        'normal': 'Boat_low_Boat_Normal.png',
        'emission': None,
        'slots': {
            'm_glasstranscarsdoublesided': {'type': 'glass'},
            'm_speedboat': {'type': 'body'},
        }
    },
    'umcdesert': {
        'color': 'White',
        'albedo': 'Van_D.png',
        'mask': 'Van_Mask.png',
        'normal': 'Van_N.png',
        'emission': 'Van_E.png',
    },
    'umcnunavut': {
        'color': 'Black',
        'albedo': 'T_GMC Yukon Inspired_D.png',
        'mask': 'T_GMC Yukon Inspired_Mask Map.png',
        'normal': 'T_GMC Yukon Inspired_N.png',
        'emission': 'T_GMC Yukon Inspired_E.png',
    },
    'vordpony': {
        'color': 'Blue',
        'albedo': 'T_Mustang 1967 Inspired_D.png',
        'mask': 'T_Mustang 1967 Inspired_Mask Map.png',
        'normal': 'T_Mustang 1967 Inspired_N.png',
        'emission': 'T_Mustang 1967 Inspired_E.png',
    },
    'vordtiaravic': {
        'color': 'Yellow',
        'albedo': 'T_Taxi Civ Version_D.png',
        'mask': 'T_Taxi Civ Version_Mask Map.png',
        'normal': 'T_Taxi Civ Version_N.png',
        'emission': 'T_Taxi Civ Version_E.png',
    },
    'vordv150': {
        'color': 'Red',
        'albedo': 'T_Ford 150 Pickup Truck_D.png',
        'mask': 'T_Ford 150 Pickup Truck_Mask Map.png',
        'normal': 'T_Ford 150 Pickup Truck_N.png',
        'emission': 'T_Ford 150 Pickup Truck_E.png',
    },
    'yacht': {
        'color': 'White',
        'is_boat': True,
        'albedo': 'T_Yacht_D.png',
        'mask': 'T_Yacht_M.png',
        'normal': 'T_Yacht_N.png',
        'emission': None,
        'slots': {
            'm_yacht_seating': {'type': 'pbr', 'albedo': 'T_Yacht_Seating_D.png', 'mask': 'T_Yacht_Seating_M.png', 'normal': 'T_Yacht_Seating_N.png'},
            'm_yacht': {'type': 'body'},
        }
    }
}

VEHICLE_KEYWORDS = {
    'deliverytruck': ['upstruck', 'truck', 'delivery'],
    'electricscooter': ['electricscooter', 'scooter'],
    'freighttruckt1': ['freightliner', 'truck', 'freight'],
    'honzamimic': ['honda', 'civic', 'honza'],
    'limo': ['limo', 'limousine'],
    'luxuryyacht': ['luxuryyacht', 'yacht'],
    'mersaididash': ['vanbig', 'van'],
    'mersaidimgagt': ['amg', 'mercedes'],
    'mersaidis500': ['mercedes', 's class'],
    'missamvillian': ['audi', 'rs6', 'zucchini'],
    'petrollsfanton': ['rolls', 'phantom', 'rolsroyce'],
    'speedboat': ['boat', 'speedboat'],
    'umcdesert': ['van', 'umc'],
    'umcnunavut': ['yukon', 'gmc'],
    'vordpony': ['mustang', 'pony'],
    'vordtiaravic': ['taxiciv', 'taxi', 'crown'],
    'vordv150': ['ford', 'f150', 'pickup'],
    'yacht': ['yacht']
}

def pick_file(all_pngs, patterns, excludes=None, v_name=''):
    excludes = excludes or []
    kw_list = VEHICLE_KEYWORDS.get(v_name.lower(), []) + [v_name.lower()]
    candidates = []
    for f in all_pngs:
        fname = os.path.basename(f).lower()
        if any(ex in fname for ex in excludes):
            continue
        for p_idx, p in enumerate(patterns):
            if p in fname:
                score = (len(patterns) - p_idx) * 5
                for kw in kw_list:
                    if kw in fname:
                        score += 20
                if 'cabin' in fname or 'body1' in fname or 'exterior' in fname:
                    score += 5
                if 'blinkers' in fname:
                    score -= 10
                candidates.append((score, f))
                break
    if not candidates:
        return None
    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1]

def find_vehicle_files(vehicle_dir):
    objs = glob.glob(os.path.join(vehicle_dir, '*.obj'))
    if not objs:
        raise FileNotFoundError(f'No .obj file found in {vehicle_dir}')
    obj_path = objs[0]
    vehicle_name = os.path.splitext(os.path.basename(obj_path))[0]
    v_key = vehicle_name.lower()

    all_pngs = glob.glob(os.path.join(vehicle_dir, '*.png'))
    c_config = CANONICAL_CONFIGS.get(v_key, {})

    # 1. Albedo
    albedo_file = c_config.get('albedo')
    if albedo_file and os.path.exists(os.path.join(vehicle_dir, albedo_file)):
        albedo_path = os.path.join(vehicle_dir, albedo_file)
    else:
        albedo_path = pick_file(all_pngs, ['_d+mask.png', '_bcmask.png', '_d.png', '_albedo.png', 'basecolor.png', '_bc.png'], EXCLUDES_GLOBAL + ['mask map', 'maskmap', 'paint', 'rough', 'metal'], vehicle_name)

    # 2. Mask
    mask_file = c_config.get('mask')
    if mask_file and os.path.exists(os.path.join(vehicle_dir, mask_file)):
        mask_path = os.path.join(vehicle_dir, mask_file)
    else:
        mask_path = pick_file(all_pngs, ['mask map.png', 'maskmap.png', '_mask.png', '_mar.png', '_m.png'], EXCLUDES_GLOBAL + ['emissive', 'emission', 'lights', 'blinkers', 'e_mask', 'paint', 'rough', 'metal'], vehicle_name)

    # 3. Normal
    normal_file = c_config.get('normal')
    if normal_file and os.path.exists(os.path.join(vehicle_dir, normal_file)):
        norm_path = os.path.join(vehicle_dir, normal_file)
    elif normal_file is None and 'normal' in c_config:
        norm_path = None
    else:
        norm_path = pick_file(all_pngs, ['_n.png', 'normal.png'], EXCLUDES_GLOBAL, vehicle_name)

    # 4. Emission
    emission_file = c_config.get('emission')
    if emission_file and os.path.exists(os.path.join(vehicle_dir, emission_file)):
        emission_path = os.path.join(vehicle_dir, emission_file)
    elif emission_file is None and 'emission' in c_config:
        emission_path = None
    else:
        emission_path = pick_file(all_pngs, ['_l.png', '_e.png', 'emission.png', 'lights_mask.png', 'emissive.png', 'emission mask.png'], EXCLUDES_GLOBAL + ['blinkers'], vehicle_name)

    # 5. Slots configuration
    slots_config = {}
    for slot_name, slot_info in c_config.get('slots', {}).items():
        resolved_slot = dict(slot_info)
        for key in ['albedo', 'mask', 'normal', 'emission']:
            if key in resolved_slot and resolved_slot[key]:
                full_p = os.path.join(vehicle_dir, resolved_slot[key])
                if os.path.exists(full_p):
                    resolved_slot[key] = full_p
                else:
                    resolved_slot[key] = None
        slots_config[slot_name.lower()] = resolved_slot

    return {
        'name': vehicle_name,
        'obj': obj_path,
        'albedo': albedo_path,
        'mask': mask_path,
        'normal': norm_path,
        'emission': emission_path,
        'is_boat': c_config.get('is_boat', False),
        'slots': slots_config
    }

def resolve_vehicle_color(vehicle_name, requested_color, repo_root):
    colors_json_path = os.path.join(repo_root, 'data', 'normalized', 'vehicle_colors.json')
    with open(colors_json_path, 'r', encoding='utf-8') as f:
        color_db = json.load(f)

    v_key = vehicle_name.lower()
    c_config = CANONICAL_CONFIGS.get(v_key, {})

    target_name = requested_color or c_config.get('color')

    if target_name:
        for c in color_db:
            if c['name'].lower() == target_name.lower():
                res = dict(c)
                if not requested_color and 'custom_tint' in c_config:
                    ct = c_config['custom_tint']
                    cf = c_config['custom_fresnel']
                    res['tint'] = {'r': ct[0], 'g': ct[1], 'b': ct[2], 'a': 255}
                    res['fresnelColor'] = {'r': cf[0], 'g': cf[1], 'b': cf[2], 'a': 255}
                return res

    showcase_path = os.path.join(repo_root, 'web', 'public', 'images', 'items', f'{vehicle_name}showcase.png')
    if os.path.exists(showcase_path):
        ref = Image.open(showcase_path).convert('RGBA')
        arr = np.array(ref)
        mask = arr[:, :, 3] > 200
        if np.any(mask):
            pixels = arr[mask, :3]
            med_rgb = np.median(pixels, axis=0)
            
            best_color = None
            best_dist = float('inf')
            for c in color_db:
                c_rgb = np.array([c['tint']['r'], c['tint']['g'], c['tint']['b']])
                dist = np.linalg.norm(med_rgb - c_rgb)
                if dist < best_dist:
                    best_dist = dist
                    best_color = c
            if best_color:
                return best_color

    for c in color_db:
        if c['name'].lower() == 'grey':
            return c
    return color_db[0]

def generate_blender_script(files, color_def, output_path, hdri_path, reconstructed_normal):
    tint_r, tint_g, tint_b = color_def['tint']['r'], color_def['tint']['g'], color_def['tint']['b']
    fres_r, fres_g, fres_b = color_def['fresnelColor']['r'], color_def['fresnelColor']['g'], color_def['fresnelColor']['b']
    slots_json_str = json.dumps(files.get('slots', {}))

    script_content = f'''import bpy, math, mathutils, os, json

bpy.ops.wm.read_factory_settings(use_empty=True)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
cpref = bpy.context.preferences.addons['cycles'].preferences
cpref.compute_device_type = 'OPTIX'
for d in cpref.get_devices_for_type('OPTIX'): d.use = True
scene.cycles.samples = 128
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.view_settings.view_transform = 'Standard'

# Load OBJ
bpy.ops.wm.obj_import(filepath={repr(files['obj'])})
car_obj = bpy.context.selected_objects[0]
if 'custom_normal' in car_obj.data.attributes:
    car_obj.data.attributes.remove(car_obj.data.attributes['custom_normal'])
car_obj.data.flip_normals()

for poly in car_obj.data.polygons:
    poly.use_smooth = True

world_corners = [car_obj.matrix_world @ mathutils.Vector(c) for c in car_obj.bound_box]
min_w = mathutils.Vector([min(c[i] for c in world_corners) for i in range(3)])
max_w = mathutils.Vector([max(c[i] for c in world_corners) for i in range(3)])
center_w = (min_w + max_w) / 2.0
dim_w = max_w - min_w

# Setup Camera
cam_data = bpy.data.cameras.new(name='Cam')
cam_data.type = 'ORTHO'
cam_obj = bpy.data.objects.new('Cam', cam_data)
bpy.context.collection.objects.link(cam_obj)
scene.camera = cam_obj

pitch = 28.0
yaw = -47.0
dist = max(20.0, dim_w.length * 2.0)
pitch_rad = math.radians(pitch)
yaw_rad = math.radians(yaw)

cam_x = center_w.x + dist * math.cos(pitch_rad) * math.sin(yaw_rad)
cam_y = center_w.y - dist * math.cos(pitch_rad) * math.cos(yaw_rad)
cam_z = center_w.z + dist * math.sin(pitch_rad)
cam_obj.location = (cam_x, cam_y, cam_z)

target = mathutils.Vector((center_w.x, center_w.y, center_w.z))
direction = target - cam_obj.location
cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
bpy.context.view_layer.update()

inv_mat = cam_obj.matrix_world.inverted()
cam_coords = [inv_mat @ c for c in world_corners]
max_x = max(abs(c.x) for c in cam_coords)
max_y = max(abs(c.y) for c in cam_coords)
cam_data.ortho_scale = max(5.6, max(max_x, max_y) * 2.0 * 1.15)

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def build_glass_material(mat_name='M_Glass'):
    mat = bpy.data.materials.new(mat_name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    n_out = nodes.new(type='ShaderNodeOutputMaterial')
    n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    
    n_bsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.03, 1.0)
    n_bsdf.inputs['Roughness'].default_value = 0.05
    n_bsdf.inputs['Transmission Weight'].default_value = 0.85
    n_bsdf.inputs['IOR'].default_value = 1.52
    return mat

def build_pbr_material(mat_name, albedo_p=None, mask_p=None, norm_p=None, col_override=None, metal_override=None, rough_override=None):
    mat = bpy.data.materials.new(mat_name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    n_out = nodes.new(type='ShaderNodeOutputMaterial')
    n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    n_bsdf.inputs['Coat Weight'].default_value = 0.0
    
    if albedo_p:
        n_d = nodes.new(type='ShaderNodeTexImage')
        n_d.image = bpy.data.images.load(albedo_p)
        n_d.image.colorspace_settings.name = 'sRGB'
        links.new(n_d.outputs['Color'], n_bsdf.inputs['Base Color'])
    elif col_override:
        n_bsdf.inputs['Base Color'].default_value = col_override
    else:
        n_bsdf.inputs['Base Color'].default_value = (0.08, 0.08, 0.08, 1.0)
        
    if mask_p:
        n_m = nodes.new(type='ShaderNodeTexImage')
        n_m.image = bpy.data.images.load(mask_p)
        n_m.image.colorspace_settings.name = 'Non-Color'
        n_sep = nodes.new(type='ShaderNodeSeparateColor')
        links.new(n_m.outputs['Color'], n_sep.inputs['Color'])
        links.new(n_sep.outputs['Red'], n_bsdf.inputs['Metallic'])
        
        n_inv = nodes.new(type='ShaderNodeMath')
        n_inv.operation = 'SUBTRACT'
        n_inv.inputs[0].default_value = 1.0
        links.new(n_m.outputs['Alpha'], n_inv.inputs[1])
        links.new(n_inv.outputs['Value'], n_bsdf.inputs['Roughness'])
    else:
        n_bsdf.inputs['Metallic'].default_value = metal_override if metal_override is not None else 0.0
        n_bsdf.inputs['Roughness'].default_value = rough_override if rough_override is not None else 0.55
        
    if norm_p:
        n_n = nodes.new(type='ShaderNodeTexImage')
        n_n.image = bpy.data.images.load(norm_p)
        n_n.image.colorspace_settings.name = 'Non-Color'
        n_norm = nodes.new(type='ShaderNodeNormalMap')
        n_norm.space = 'TANGENT'
        n_norm.inputs['Strength'].default_value = 1.0
        links.new(n_n.outputs['Color'], n_norm.inputs['Color'])
        links.new(n_norm.outputs['Normal'], n_bsdf.inputs['Normal'])
        
    return mat

def build_body_material(mat_name, albedo_p, mask_p, norm_p, emiss_p, t_r, t_g, t_b, f_r, f_g, f_b, is_boat_hull=False):
    mat = bpy.data.materials.new(mat_name)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    n_out = nodes.new(type='ShaderNodeOutputMaterial')
    n_out.location = (1400, 0)
    n_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    n_bsdf.location = (1000, 0)
    links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])
    
    # Diffuse Texture
    n_d = nodes.new(type='ShaderNodeTexImage')
    n_d.image = bpy.data.images.load(albedo_p)
    n_d.image.colorspace_settings.name = 'sRGB'
    n_d.location = (-400, 300)
    
    # Mask Texture
    if mask_p:
        n_m = nodes.new(type='ShaderNodeTexImage')
        n_m.image = bpy.data.images.load(mask_p)
        n_m.image.colorspace_settings.name = 'Non-Color'
        n_m.location = (-400, -200)
        
        n_sep = nodes.new(type='ShaderNodeSeparateColor')
        n_sep.location = (-100, -200)
        links.new(n_m.outputs['Color'], n_sep.inputs['Color'])
        links.new(n_sep.outputs['Red'], n_bsdf.inputs['Metallic'])
        
        n_inv = nodes.new(type='ShaderNodeMath')
        n_inv.operation = 'SUBTRACT'
        n_inv.inputs[0].default_value = 1.0
        links.new(n_m.outputs['Alpha'], n_inv.inputs[1])
        n_inv.location = (200, -200)
        links.new(n_inv.outputs['Value'], n_bsdf.inputs['Roughness'])
    else:
        n_bsdf.inputs['Metallic'].default_value = 0.0
        n_bsdf.inputs['Roughness'].default_value = 0.35
        
    # Normal Map
    if norm_p:
        n_n = nodes.new(type='ShaderNodeTexImage')
        n_n.image = bpy.data.images.load(norm_p)
        n_n.image.colorspace_settings.name = 'Non-Color'
        n_n.location = (200, -500)
        n_norm = nodes.new(type='ShaderNodeNormalMap')
        n_norm.space = 'TANGENT'
        n_norm.inputs['Strength'].default_value = 1.0
        n_norm.location = (500, -500)
        links.new(n_n.outputs['Color'], n_norm.inputs['Color'])
        links.new(n_norm.outputs['Normal'], n_bsdf.inputs['Normal'])
        
    # Emission
    if emiss_p:
        n_lit = nodes.new(type='ShaderNodeTexImage')
        n_lit.image = bpy.data.images.load(emiss_p)
        n_lit.image.colorspace_settings.name = 'sRGB'
        n_lit.location = (200, -800)
        links.new(n_lit.outputs['Color'], n_bsdf.inputs['Emission Color'])
        n_bsdf.inputs['Emission Strength'].default_value = 2.5

    if is_boat_hull:
        links.new(n_d.outputs['Color'], n_bsdf.inputs['Base Color'])
        n_bsdf.inputs['Coat Weight'].default_value = 0.15
        n_bsdf.inputs['Coat Roughness'].default_value = 0.15
    else:
        # Anselmo Automotive Paint Shader
        tint_lin = (srgb_to_lin(t_r), srgb_to_lin(t_g), srgb_to_lin(t_b), 1.0)
        fresnel_lin = (srgb_to_lin(f_r), srgb_to_lin(f_g), srgb_to_lin(f_b), 1.0)
        
        n_layer = nodes.new(type='ShaderNodeLayerWeight')
        n_layer.inputs['Blend'].default_value = 0.5
        n_layer.location = (-100, 600)
        
        n_mix_paint = nodes.new(type='ShaderNodeMix')
        n_mix_paint.data_type = 'RGBA'
        n_mix_paint.inputs[6].default_value = tint_lin
        n_mix_paint.inputs[7].default_value = fresnel_lin
        links.new(n_layer.outputs['Facing'], n_mix_paint.inputs[0])
        n_mix_paint.location = (200, 600)
        
        n_mix_base = nodes.new(type='ShaderNodeMix')
        n_mix_base.data_type = 'RGBA'
        n_mix_base.location = (500, 300)
        links.new(n_d.outputs['Alpha'], n_mix_base.inputs[0])
        links.new(n_d.outputs['Color'], n_mix_base.inputs[6])
        links.new(n_mix_paint.outputs[2], n_mix_base.inputs[7])
        
        if mask_p:
            n_ao = nodes.new(type='ShaderNodeMix')
            n_ao.data_type = 'RGBA'
            n_ao.blend_type = 'MULTIPLY'
            n_ao.inputs[0].default_value = 0.4
            links.new(n_mix_base.outputs[2], n_ao.inputs[6])
            links.new(n_sep.outputs['Green'], n_ao.inputs[7])
            n_ao.location = (700, 300)
            links.new(n_ao.outputs[2], n_bsdf.inputs['Base Color'])
        else:
            links.new(n_mix_base.outputs[2], n_bsdf.inputs['Base Color'])
            
        links.new(n_d.outputs['Alpha'], n_bsdf.inputs['Coat Weight'])
        n_bsdf.inputs['Coat Roughness'].default_value = 0.08
        n_bsdf.inputs['Coat IOR'].default_value = 1.45
        
    return mat

# Setup Material Slots
slots_dict = json.loads({repr(slots_json_str)})
body_mat = build_body_material(
    'M_Vehicle_Body',
    albedo_p={repr(files['albedo'])},
    mask_p={repr(files['mask'])},
    norm_p={repr(reconstructed_normal)},
    emiss_p={repr(files['emission'])},
    t_r={tint_r}, t_g={tint_g}, t_b={tint_b},
    f_r={fres_r}, f_g={fres_g}, f_b={fres_b},
    is_boat_hull={repr(files.get('is_boat', False))}
)

if not car_obj.material_slots:
    car_obj.data.materials.append(body_mat)
else:
    for slot in car_obj.material_slots:
        s_name = slot.name.lower()
        if s_name in slots_dict:
            s_cfg = slots_dict[s_name]
            stype = s_cfg.get('type')
            if stype == 'glass':
                slot.material = build_glass_material(slot.name)
            elif stype == 'body':
                slot.material = body_mat
            elif stype == 'pbr':
                slot.material = build_pbr_material(
                    slot.name,
                    albedo_p=s_cfg.get('albedo'),
                    mask_p=s_cfg.get('mask'),
                    norm_p=s_cfg.get('normal'),
                    col_override=s_cfg.get('color'),
                    metal_override=s_cfg.get('metallic'),
                    rough_override=s_cfg.get('roughness')
                )
            else:
                slot.material = body_mat
        elif 'glass' in s_name or 'trans' in s_name:
            slot.material = build_glass_material(slot.name)
        elif 'wheel' in s_name:
            slot.material = build_pbr_material(slot.name, rough_override=0.6, metal_override=0.1)
        elif 'interior' in s_name or 'seat' in s_name:
            slot.material = build_pbr_material(slot.name, rough_override=0.65, metal_override=0.0)
        else:
            slot.material = body_mat

# ==========================================
# LIGHTING & ENVIRONMENT (Anselmo studio setup)
# ==========================================
world = bpy.data.worlds.new('CityWorld')
scene.world = world
wn = world.node_tree.nodes
wl = world.node_tree.links
wn.clear()

w_out_node = wn.new(type='ShaderNodeOutputWorld')
w_bg = wn.new(type='ShaderNodeBackground')
w_bg.inputs['Strength'].default_value = 1.4
w_env = wn.new(type='ShaderNodeTexEnvironment')
w_env.image = bpy.data.images.load({repr(hdri_path)})
wl.new(w_env.outputs['Color'], w_bg.inputs['Color'])
wl.new(w_bg.outputs['Background'], w_out_node.inputs['Surface'])

# Main Sun: softer sun with 22 deg angle
sun_data = bpy.data.lights.new('Sun', 'SUN')
sun_data.energy = 1.8
sun_data.angle = math.radians(22.0)
sun_data.color = (1.0, 0.98, 0.95)
sun_obj = bpy.data.objects.new('Sun', sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), math.radians(15), math.radians(-35))

# Soft large fill light for side flank and wheels (scales with vehicle size)
span = max(dim_w.x, dim_w.y, dim_w.z)
fill_data = bpy.data.lights.new('RimFill', 'AREA')
fill_data.energy = 450.0 * max(1.0, (span / 5.0)**2)
fill_data.size = max(10.0, span * 1.5)
fill_data.color = (0.95, 0.98, 1.0)
fill_obj = bpy.data.objects.new('RimFill', fill_data)
bpy.context.collection.objects.link(fill_obj)
fill_obj.location = (center_w.x - span * 1.4, center_w.y - span * 1.6, center_w.z + span * 0.6)
fill_dir = center_w - fill_obj.location
fill_obj.rotation_euler = fill_dir.to_track_quat('-Z', 'Y').to_euler()

# Subtle ground bounce light directed upward into lower wheels and tires
bounce_data = bpy.data.lights.new('WheelBounce', 'AREA')
bounce_data.energy = 120.0 * max(1.0, (span / 5.0)**2)
bounce_data.size = max(4.0, span * 0.8)
bounce_data.color = (0.95, 0.98, 1.0)
bounce_obj = bpy.data.objects.new('WheelBounce', bounce_data)
bpy.context.collection.objects.link(bounce_obj)
bounce_obj.location = (center_w.x - span * 0.8, center_w.y - span * 0.8, min_w.z + 0.1)
bounce_dir = mathutils.Vector((center_w.x, center_w.y, min_w.z + 0.35)) - bounce_obj.location
bounce_obj.rotation_euler = bounce_dir.to_track_quat('-Z', 'Y').to_euler()

scene.render.filepath = {repr(output_path)}
bpy.ops.render.render(write_still=True)
print('Render completed successfully')
'''
    return script_content


def render_single_vehicle(vehicle_dir, requested_color=None, output_override=None):
    scratch_dir = os.path.join(vehicle_dir, 'scratch')
    os.makedirs(scratch_dir, exist_ok=True)

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    hdri_path = r'C:\Program Files\Blender Foundation\Blender 5.2\5.2\datafiles\studiolights\world\city.exr'
    blender_exe = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'

    files = find_vehicle_files(vehicle_dir)
    print(f"\n==========================================")
    print(f"Vehicle: {files['name']}")
    print(f"Directory: {vehicle_dir}")
    print(f"OBJ: {files['obj']}")
    print(f"Albedo: {files['albedo']}")
    print(f"Mask: {files['mask']}")
    print(f"Normal: {files['normal']}")
    print(f"Emission: {files['emission']}")

    reconstructed_normal = None
    if files['normal']:
        recon_path = os.path.join(scratch_dir, 'reconstructed_normal.png')
        reconstruct_dxt5nm_normal(files['normal'], recon_path)
        reconstructed_normal = recon_path

    color_def = resolve_vehicle_color(files['name'], requested_color, repo_root)
    print(f"Selected Paint Color: {color_def['name']} (tint: {color_def['tint']}, fresnel: {color_def['fresnelColor']})")

    output_path = output_override or os.path.join(scratch_dir, 'render_softer_v1.png')

    blend_script_path = os.path.join(scratch_dir, 'run_render.py')
    script_content = generate_blender_script(files, color_def, output_path, hdri_path, reconstructed_normal)
    with open(blend_script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)

    import subprocess
    cmd = [blender_exe, '--background', '--python', blend_script_path]
    print(f"Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"Error rendering {files['name']}, exit code {res.returncode}")
        return False

    print(f"Success! Final render at: {output_path}")
    return True

def main():
    parser = argparse.ArgumentParser(description='Universal Big Ambitions Vehicle Renderer')
    parser.add_argument('--dir', required=True, help='Path to vehicle directory or root folder containing vehicle subdirectories')
    parser.add_argument('--color', default=None, help='Color name from vehicle_colors.json (e.g. Red, Grey, Blue)')
    parser.add_argument('--output', default=None, help='Output PNG file path (default: <dir>/scratch/render_softer_v1.png)')
    parser.add_argument('--outdir', default=None, help='Target directory to save all rendered images')
    parser.add_argument('--all', action='store_true', help='Process all vehicle subdirectories inside --dir')
    args = parser.parse_args()

    target_dir = os.path.abspath(args.dir)
    outdir = os.path.abspath(args.outdir) if args.outdir else None
    if outdir:
        os.makedirs(outdir, exist_ok=True)

    # Check if target_dir itself has an .obj
    direct_objs = glob.glob(os.path.join(target_dir, '*.obj'))
    if direct_objs and not args.all:
        v_name = os.path.splitext(os.path.basename(direct_objs[0]))[0]
        v_out = args.output or (os.path.join(outdir, f"{v_name}.png") if outdir else None)
        render_single_vehicle(target_dir, requested_color=args.color, output_override=v_out)
    else:
        # Find all subdirectories that contain an .obj file
        subdirs = [
            os.path.join(target_dir, d) for d in os.listdir(target_dir)
            if os.path.isdir(os.path.join(target_dir, d)) and glob.glob(os.path.join(target_dir, d, '*.obj'))
        ]
        if not subdirs:
            print(f"No vehicle directories with .obj files found in {target_dir}")
            sys.exit(1)

        print(f"Found {len(subdirs)} vehicle(s) to render.")
        success_count = 0
        for sdir in subdirs:
            v_name = os.path.splitext(os.path.basename(glob.glob(os.path.join(sdir, '*.obj'))[0]))[0]
            v_out = os.path.join(outdir, f"{v_name}.png") if outdir else None
            ok = render_single_vehicle(sdir, requested_color=args.color, output_override=v_out)
            if ok:
                success_count += 1

        print(f"\nBatch rendering finished: {success_count}/{len(subdirs)} vehicles rendered successfully.")

if __name__ == '__main__':
    main()
