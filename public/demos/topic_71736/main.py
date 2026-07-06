"""
Square Dance Choreographer - Pose-to-Pose Edition
Create poses, arrange them in sequence, and watch smooth transitions.
"""
import pygame
import math
import sys
import os
import json
import time

# ======================================================================
# INITIALIZATION
# ======================================================================
pygame.init()

WIDTH, HEIGHT = 1200, 720
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Dance Pose Choreographer")
clock = pygame.time.Clock()
FPS = 60

# ======================================================================
# COLORS
# ======================================================================
WHITE = (255, 255, 255)
BLACK = (30, 30, 30)
GRAY = (200, 200, 200)
LIGHT_GRAY = (245, 245, 245)
MID_GRAY = (180, 180, 180)
DARK_GRAY = (120, 120, 120)
BLUE = (100, 150, 220)
LIGHT_BLUE = (200, 220, 255)
GREEN = (100, 180, 120)
LIGHT_GREEN = (200, 240, 210)
ORANGE = (255, 170, 70)
LIGHT_ORANGE = (255, 230, 200)
RED = (220, 90, 90)
LIGHT_RED = (255, 210, 210)
PURPLE = (160, 120, 200)
LIGHT_PURPLE = (230, 215, 245)
PINK = (230, 120, 170)
LIGHT_PINK = (255, 225, 240)
TEAL = (80, 180, 180)
LIGHT_TEAL = (200, 240, 240)

# ======================================================================
# GRID
# ======================================================================
GRID_SIZE = 40
GRID_COLOR = (228, 228, 228)
GRID_COLOR_DARK = (208, 208, 208)

# ======================================================================
# GLOBAL STATE
# ======================================================================
# Pose editing
editing_mode = False  # True = currently creating/editing a pose
pose_list = []        # List of saved poses: [{name, pose_dict}]

# Queue
queue = []            # List of pose indices (references to pose_list)
transition_duration = 0.6  # seconds between poses
pose_hold_time = 0.4      # seconds to hold each pose before transitioning

# Playback
is_playing = False
playback_time = 0.0
playback_start = 0.0
playback_pause_time = 0.0

# Performance
frame_count = 0
fps_display = 60.0
last_fps_time = 0.0

# ======================================================================
# STICKMAN CLASS - Full IK + all joints draggable
# ======================================================================
class Stickman:
    def __init__(self, x, y):
        # Foot positions (fixed on ground - root)
        self.left_foot_x = x - 24
        self.left_foot_y = y + 115
        self.right_foot_x = x + 24
        self.right_foot_y = y + 115
        
        # Hip position (movable via IK)
        self.hip_x = x
        self.hip_y = y
        
        # Default positions
        self.default_left_foot = (self.left_foot_x, self.left_foot_y)
        self.default_right_foot = (self.right_foot_x, self.right_foot_y)
        self.default_hip = (x, y)
        
        # Knee bend direction
        self.left_knee_side = -1
        self.right_knee_side = 1
        
        # Upper body joint angles
        self.joints = {
            'spine_angle': 0.0,
            'neck_angle': 0.0,
            'left_shoulder_angle': -0.3,
            'left_elbow_angle': 0.2,
            'right_shoulder_angle': 0.3,
            'right_elbow_angle': 0.2,
        }
        
        self.default_joints = self.joints.copy()
        
        # Bone lengths
        self.head_radius = 30
        self.neck_len = 14
        self.torso_len = 85
        self.hip_width = 48
        self.upper_arm_len = 60
        self.forearm_len = 50
        self.thigh_len = 75
        self.calf_len = 68
        self.foot_len = 30
    
    def _solve_leg_ik(self, foot_x, foot_y, hip_x, hip_y, bend_side=1):
        """2-bone IK solver."""
        dx = hip_x - foot_x
        dy = hip_y - foot_y
        dist = math.hypot(dx, dy)
        
        max_len = self.thigh_len + self.calf_len
        min_len = abs(self.thigh_len - self.calf_len)
        
        if dist > max_len - 1:
            dist = max_len - 1
            if math.hypot(dx, dy) > 0:
                ratio = dist / math.hypot(dx, dy)
                hip_x = foot_x + dx * ratio
                hip_y = foot_y + dy * ratio
            dx = hip_x - foot_x
            dy = hip_y - foot_y
        if dist < min_len + 1:
            dist = min_len + 1
        
        a = self.thigh_len
        b = self.calf_len
        c = dist
        
        cos_theta = (a*a + b*b - c*c) / (2 * a * b)
        cos_theta = max(-1.0, min(1.0, cos_theta))
        knee_bend = math.acos(cos_theta)
        
        foot_to_hip_angle = math.atan2(dy, dx)
        sin_alpha = a * math.sin(knee_bend) / c
        sin_alpha = max(-1.0, min(1.0, sin_alpha))
        alpha = math.asin(sin_alpha)
        
        knee_angle = foot_to_hip_angle - bend_side * alpha
        knee_x = foot_x + math.cos(knee_angle) * b
        knee_y = foot_y + math.sin(knee_angle) * b
        
        return knee_x, knee_y
    
    def get_joint_positions(self):
        j = {}
        
        j['hip'] = (self.hip_x, self.hip_y)
        
        left_hip_x = self.hip_x - self.hip_width / 2
        left_hip_y = self.hip_y
        right_hip_x = self.hip_x + self.hip_width / 2
        right_hip_y = self.hip_y
        j['left_hip'] = (left_hip_x, left_hip_y)
        j['right_hip'] = (right_hip_x, right_hip_y)
        
        # Left leg
        left_knee_x, left_knee_y = self._solve_leg_ik(
            self.left_foot_x, self.left_foot_y,
            left_hip_x, left_hip_y, self.left_knee_side
        )
        j['left_knee'] = (left_knee_x, left_knee_y)
        j['left_ankle'] = (self.left_foot_x, self.left_foot_y)
        
        # Right leg
        right_knee_x, right_knee_y = self._solve_leg_ik(
            self.right_foot_x, self.right_foot_y,
            right_hip_x, right_hip_y, self.right_knee_side
        )
        j['right_knee'] = (right_knee_x, right_knee_y)
        j['right_ankle'] = (self.right_foot_x, self.right_foot_y)
        
        # Upper body
        spine_base_x = self.hip_x
        spine_base_y = self.hip_y - 10
        j['spine_base'] = (spine_base_x, spine_base_y)
        
        spine_angle = self.joints['spine_angle']
        shoulder_x = spine_base_x + math.sin(spine_angle) * self.torso_len
        shoulder_y = spine_base_y - math.cos(spine_angle) * self.torso_len
        j['shoulder_center'] = (shoulder_x, shoulder_y)
        
        neck_angle = self.joints['neck_angle'] + spine_angle
        neck_top_x = shoulder_x + math.sin(neck_angle) * self.neck_len
        neck_top_y = shoulder_y - math.cos(neck_angle) * self.neck_len
        j['neck'] = (neck_top_x, neck_top_y)
        
        head_cx = neck_top_x + math.sin(neck_angle) * self.head_radius * 0.5
        head_cy = neck_top_y - math.cos(neck_angle) * self.head_radius * 0.5
        j['head_center'] = (head_cx, head_cy)
        j['head_top'] = (head_cx, head_cy - self.head_radius)
        
        # Left arm
        left_shoulder_x = shoulder_x - 38
        left_shoulder_y = shoulder_y + 8
        j['left_shoulder'] = (left_shoulder_x, left_shoulder_y)
        
        l_shoulder_angle = self.joints['left_shoulder_angle'] + spine_angle
        left_elbow_x = left_shoulder_x + math.sin(l_shoulder_angle) * self.upper_arm_len
        left_elbow_y = left_shoulder_y + math.cos(l_shoulder_angle) * self.upper_arm_len
        j['left_elbow'] = (left_elbow_x, left_elbow_y)
        
        l_elbow_angle = self.joints['left_elbow_angle'] + l_shoulder_angle
        left_wrist_x = left_elbow_x + math.sin(l_elbow_angle) * self.forearm_len
        left_wrist_y = left_elbow_y + math.cos(l_elbow_angle) * self.forearm_len
        j['left_wrist'] = (left_wrist_x, left_wrist_y)
        
        # Right arm
        right_shoulder_x = shoulder_x + 38
        right_shoulder_y = shoulder_y + 8
        j['right_shoulder'] = (right_shoulder_x, right_shoulder_y)
        
        r_shoulder_angle = self.joints['right_shoulder_angle'] + spine_angle
        right_elbow_x = right_shoulder_x + math.sin(r_shoulder_angle) * self.upper_arm_len
        right_elbow_y = right_shoulder_y + math.cos(r_shoulder_angle) * self.upper_arm_len
        j['right_elbow'] = (right_elbow_x, right_elbow_y)
        
        r_elbow_angle = self.joints['right_elbow_angle'] + r_shoulder_angle
        right_wrist_x = right_elbow_x + math.sin(r_elbow_angle) * self.forearm_len
        right_wrist_y = right_elbow_y + math.cos(r_elbow_angle) * self.forearm_len
        j['right_wrist'] = (right_wrist_x, right_wrist_y)
        
        return j
    
    def get_pose_dict(self):
        return {
            'joints': {k: float(v) for k, v in self.joints.items()},
            'hip_x': float(self.hip_x),
            'hip_y': float(self.hip_y),
            'left_foot_x': float(self.left_foot_x),
            'left_foot_y': float(self.left_foot_y),
            'right_foot_x': float(self.right_foot_x),
            'right_foot_y': float(self.right_foot_y),
            'left_knee_side': int(self.left_knee_side),
            'right_knee_side': int(self.right_knee_side),
        }
    
    def set_pose_dict(self, pose):
        if 'joints' in pose:
            for k, v in pose['joints'].items():
                if k in self.joints:
                    self.joints[k] = float(v)
        if 'hip_x' in pose:
            self.hip_x = float(pose['hip_x'])
        if 'hip_y' in pose:
            self.hip_y = float(pose['hip_y'])
        if 'left_foot_x' in pose:
            self.left_foot_x = float(pose['left_foot_x'])
        if 'left_foot_y' in pose:
            self.left_foot_y = float(pose['left_foot_y'])
        if 'right_foot_x' in pose:
            self.right_foot_x = float(pose['right_foot_x'])
        if 'right_foot_y' in pose:
            self.right_foot_y = float(pose['right_foot_y'])
        if 'left_knee_side' in pose:
            self.left_knee_side = int(pose['left_knee_side'])
        if 'right_knee_side' in pose:
            self.right_knee_side = int(pose['right_knee_side'])
    
    def reset_pose(self):
        self.joints = self.default_joints.copy()
        self.hip_x = self.default_hip[0]
        self.hip_y = self.default_hip[1]
        self.left_foot_x = self.default_left_foot[0]
        self.left_foot_y = self.default_left_foot[1]
        self.right_foot_x = self.default_right_foot[0]
        self.right_foot_y = self.default_right_foot[1]
        self.left_knee_side = -1
        self.right_knee_side = 1
    
    def draw(self, surface, show_handles=False, highlight_joint=None):
        j = self.get_joint_positions()
        lw = 6
        
        # Ground shadow
        shadow_y = max(self.left_foot_y, self.right_foot_y) + 12
        mid_x = (self.left_foot_x + self.right_foot_x) / 2
        shadow_surface = pygame.Surface((180, 30), pygame.SRCALPHA)
        pygame.draw.ellipse(shadow_surface, (0, 0, 0, 30), (0, 0, 180, 30))
        surface.blit(shadow_surface, (mid_x - 90, shadow_y - 15))
        
        # Body
        pygame.draw.line(surface, BLACK, j['spine_base'], j['shoulder_center'], lw)
        pygame.draw.line(surface, BLACK, j['shoulder_center'], j['neck'], lw - 1)
        
        # Head
        hx, hy = j['head_center']
        pygame.draw.circle(surface, WHITE, (int(hx), int(hy)), self.head_radius)
        pygame.draw.circle(surface, BLACK, (int(hx), int(hy)), self.head_radius, lw - 1)
        
        # Eyes - simple dots (classic stickman style)
        eye_y = hy - 2
        pygame.draw.circle(surface, BLACK, (int(hx - 7), int(eye_y)), 2)
        pygame.draw.circle(surface, BLACK, (int(hx + 7), int(eye_y)), 2)
        # Mouth - simple straight line
        pygame.draw.line(surface, BLACK, (hx - 5, hy + 6), (hx + 5, hy + 6), 2)
        
        # Shoulder line
        pygame.draw.line(surface, BLACK, j['left_shoulder'], j['right_shoulder'], lw - 1)
        
        # Arms
        pygame.draw.line(surface, BLACK, j['left_shoulder'], j['left_elbow'], lw)
        pygame.draw.line(surface, BLACK, j['left_elbow'], j['left_wrist'], lw - 1)
        pygame.draw.circle(surface, BLACK, (int(j['left_wrist'][0]), int(j['left_wrist'][1])), 5)
        
        pygame.draw.line(surface, BLACK, j['right_shoulder'], j['right_elbow'], lw)
        pygame.draw.line(surface, BLACK, j['right_elbow'], j['right_wrist'], lw - 1)
        pygame.draw.circle(surface, BLACK, (int(j['right_wrist'][0]), int(j['right_wrist'][1])), 5)
        
        # Hip line
        pygame.draw.line(surface, BLACK, j['left_hip'], j['right_hip'], lw - 1)
        
        # Legs (IK)
        pygame.draw.line(surface, BLACK, j['left_hip'], j['left_knee'], lw)
        pygame.draw.line(surface, BLACK, j['left_knee'], j['left_ankle'], lw - 1)
        pygame.draw.line(surface, BLACK,
                        (j['left_ankle'][0] - 16, j['left_ankle'][1] + 4),
                        (j['left_ankle'][0] + 20, j['left_ankle'][1] + 4), lw)
        
        pygame.draw.line(surface, BLACK, j['right_hip'], j['right_knee'], lw)
        pygame.draw.line(surface, BLACK, j['right_knee'], j['right_ankle'], lw - 1)
        pygame.draw.line(surface, BLACK,
                        (j['right_ankle'][0] - 16, j['right_ankle'][1] + 4),
                        (j['right_ankle'][0] + 20, j['right_ankle'][1] + 4), lw)
        
        if show_handles:
            self._draw_handles(surface, j, highlight_joint)
    
    def _draw_handles(self, surface, j, highlight_joint):
        """Draw draggable joint handles."""
        # Joint categories with different colors
        angle_joints = [
            ('head_center', PURPLE, 22),
            ('shoulder_center', TEAL, 16),
            ('left_shoulder', BLUE, 14),
            ('right_shoulder', BLUE, 14),
            ('left_elbow', BLUE, 14),
            ('right_elbow', BLUE, 14),
            ('left_wrist', BLUE, 14),
            ('right_wrist', BLUE, 14),
        ]
        
        for name, color, size in angle_joints:
            if name in j:
                px, py = j[name]
                is_hi = (highlight_joint == name)
                c = ORANGE if is_hi else color
                pygame.draw.circle(surface, WHITE, (int(px), int(py)), size)
                pygame.draw.circle(surface, c, (int(px), int(py)), size, 2)
                pygame.draw.circle(surface, c, (int(px), int(py)), size // 2)
        
        # Hip position handle (green cross - special)
        if 'hip' in j:
            hx, hy = j['hip']
            is_hi = (highlight_joint == 'hip')
            color = ORANGE if is_hi else GREEN
            pygame.draw.circle(surface, WHITE, (int(hx), int(hy)), 14)
            pygame.draw.circle(surface, color, (int(hx), int(hy)), 14, 2)
            pygame.draw.line(surface, color, (hx - 8, hy), (hx + 8, hy), 2)
            pygame.draw.line(surface, color, (hx, hy - 8), (hx, hy + 8), 2)
        
        # Knee flip handles (red squares - click to flip)
        for knee in ['left_knee', 'right_knee']:
            if knee in j:
                kx, ky = j[knee]
                is_hi = (highlight_joint == knee)
                color = ORANGE if is_hi else RED
                rect_size = 14
                pygame.draw.rect(surface, WHITE,
                                (kx - rect_size//2, ky - rect_size//2, rect_size, rect_size))
                pygame.draw.rect(surface, color,
                                (kx - rect_size//2, ky - rect_size//2, rect_size, rect_size), 2)
                pygame.draw.circle(surface, color, (int(kx), int(ky)), 4)
    
    def get_joint_at(self, x, y):
        """Find which joint is at (x, y). Returns (name, control_type, param)."""
        j = self.get_joint_positions()
        
        # Priority list (most important first)
        draggable = [
            # HIP - position control (most important)
            ('hip', 'hip_position', None, 22),
            # Head - neck angle
            ('head_center', 'angle', 'neck_angle', 24),
            # Shoulder center - spine angle
            ('shoulder_center', 'angle', 'spine_angle', 18),
            # Wrists - shoulder angle
            ('left_wrist', 'angle', 'left_shoulder_angle', 16),
            ('right_wrist', 'angle', 'right_shoulder_angle', 16),
            # Elbows - elbow angle
            ('left_elbow', 'angle', 'left_elbow_angle', 16),
            ('right_elbow', 'angle', 'right_elbow_angle', 16),
            # Shoulders
            ('left_shoulder', 'angle', 'left_shoulder_angle', 16),
            ('right_shoulder', 'angle', 'right_shoulder_angle', 16),
            # Knees - flip direction
            ('left_knee', 'knee_flip', 'left', 18),
            ('right_knee', 'knee_flip', 'right', 18),
        ]
        
        for joint_name, control_type, param, hit_radius in draggable:
            if joint_name in j:
                jx, jy = j[joint_name]
                dist = math.hypot(x - jx, y - jy)
                if dist < hit_radius:
                    return joint_name, control_type, param
        
        return None, None, None
    
    def adjust_joint(self, angle_key, delta):
        if angle_key and angle_key in self.joints:
            self.joints[angle_key] += delta
            if angle_key in ['left_elbow_angle', 'right_elbow_angle']:
                self.joints[angle_key] = max(-1.0, min(3.0, self.joints[angle_key]))
            elif angle_key in ['left_shoulder_angle', 'right_shoulder_angle']:
                self.joints[angle_key] = max(-3.0, min(3.0, self.joints[angle_key]))
            elif angle_key == 'spine_angle':
                self.joints[angle_key] = max(-1.0, min(1.0, self.joints[angle_key]))
            elif angle_key == 'neck_angle':
                self.joints[angle_key] = max(-0.8, min(0.8, self.joints[angle_key]))
    
    def move_hip(self, dx, dy):
        self.hip_x += dx
        self.hip_y += dy
        center_x = (self.left_foot_x + self.right_foot_x) / 2
        self.hip_x = max(center_x - 150, min(center_x + 150, self.hip_x))
        self.hip_y = max(self.left_foot_y - 190, min(self.left_foot_y - 30, self.hip_y))
    
    def flip_knee(self, side):
        if side == 'left':
            self.left_knee_side *= -1
        elif side == 'right':
            self.right_knee_side *= -1

stickman = Stickman(WIDTH // 2, HEIGHT // 2 - 50)

# ======================================================================
# EASING FUNCTIONS
# ======================================================================
def ease_in_out(t):
    """Smooth ease-in-out using sin function. t: 0 -> 1"""
    return 0.5 - 0.5 * math.cos(math.pi * t)

def ease_in_out_strong(t):
    """Stronger ease-in-out. t: 0 -> 1"""
    return 0.5 - 0.5 * math.cos(math.pi * t * t * (3 - 2 * t))

# ======================================================================
# POSE BLENDING
# ======================================================================
def blend_poses(pose_a, pose_b, alpha):
    """Blend between two poses with ease-in-out. alpha: 0 -> 1"""
    t = ease_in_out(alpha)
    
    blended = {'joints': {}}
    for key in pose_a.get('joints', {}):
        if key in pose_b.get('joints', {}):
            blended['joints'][key] = (
                pose_a['joints'][key] + 
                (pose_b['joints'][key] - pose_a['joints'][key]) * t
            )
    
    numeric_fields = ['hip_x', 'hip_y', 'left_foot_x', 'left_foot_y',
                    'right_foot_x', 'right_foot_y']
    
    for field in numeric_fields:
        if field in pose_a and field in pose_b:
            blended[field] = pose_a[field] + (pose_b[field] - pose_a[field]) * t
    
    # Knee side - snap at 50%
    for field in ['left_knee_side', 'right_knee_side']:
        if field in pose_a and field in pose_b:
            blended[field] = pose_b[field] if alpha > 0.5 else pose_a[field]
    
    return blended

# ======================================================================
# PLAYBACK LOGIC
# ======================================================================
def get_total_duration():
    """Total queue playback time."""
    if len(queue) == 0:
        return 0
    if len(queue) == 1:
        return pose_hold_time
    return len(queue) * pose_hold_time + (len(queue) - 1) * transition_duration

def get_pose_at_time(t):
    """
    Get blended pose at time t.
    Returns (pose_dict, current_pose_index, is_transitioning)
    """
    if len(queue) == 0:
        return None, -1, False
    
    if len(queue) == 1:
        idx = queue[0]
        return pose_list[idx]['pose'], 0, False
    
    total = get_total_duration()
    t = t % total
    
    segment_duration = pose_hold_time + transition_duration
    
    for i in range(len(queue)):
        seg_start = i * segment_duration
        seg_end = seg_start + pose_hold_time
        trans_end = seg_start + segment_duration
        
        if seg_start <= t < seg_end:
            # Holding pose i
            idx = queue[i]
            return pose_list[idx]['pose'], i, False
        
        if seg_end <= t < trans_end and i < len(queue) - 1:
            # Transitioning from i to i+1
            trans_t = (t - seg_end) / transition_duration
            pose_a = pose_list[queue[i]]['pose']
            pose_b = pose_list[queue[i + 1]]['pose']
            blended = blend_poses(pose_a, pose_b, trans_t)
            return blended, i, True
    
    # Last pose hold (end of timeline)
    idx = queue[-1]
    return pose_list[idx]['pose'], len(queue) - 1, False

# ======================================================================
# UI: BUTTON
# ======================================================================
class Button:
    def __init__(self, x, y, w, h, text, color, hover_color, click_color,
                 text_color=WHITE, font_size=22, enabled=True):
        self.rect = pygame.Rect(x, y, w, h)
        self.text = text
        self.color = color
        self.hover_color = hover_color
        self.click_color = click_color
        self.text_color = text_color
        self.font_size = font_size
        self.enabled = enabled
        self.is_hovered = False
        self.is_clicked = False
        self.is_active = False
    
    def handle_event(self, event):
        if not self.enabled:
            return False
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1 and self.rect.collidepoint(event.pos):
                self.is_clicked = True
        elif event.type == pygame.MOUSEBUTTONUP:
            if event.button == 1:
                was_clicked = self.is_clicked and self.rect.collidepoint(event.pos)
                self.is_clicked = False
                if was_clicked:
                    return True
        return False
    
    def draw(self, surface):
        if not self.enabled:
            color = MID_GRAY
            text_color = DARK_GRAY
        elif self.is_active:
            color = self.click_color
            text_color = WHITE
        elif self.is_clicked:
            color = self.click_color
            text_color = WHITE
        elif self.is_hovered:
            color = self.hover_color
            text_color = self.text_color
        else:
            color = self.color
            text_color = self.text_color
        
        pygame.draw.rect(surface, color, self.rect, border_radius=8)
        pygame.draw.rect(surface, (0, 0, 0, 25), self.rect, 2, border_radius=8)
        
        font = pygame.font.Font(None, self.font_size)
        text_surf = font.render(self.text, True, text_color)
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)

# ======================================================================
# POSE BUTTON (with + button to add to queue)
# ======================================================================
class PoseButton:
    def __init__(self, x, y, w, h, name, index, color=BLUE):
        self.rect = pygame.Rect(x, y, w, h)
        self.name = name
        self.index = index
        self.color = color
        self.is_hovered = False
        self.is_hovered_plus = False
        self.plus_rect = pygame.Rect(x + w - 36, y + 4, 32, h - 8)
    
    def handle_event(self, event):
        """Returns ('edit', index) or ('add', index) or None"""
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
            self.is_hovered_plus = self.plus_rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:
                if self.plus_rect.collidepoint(event.pos):
                    return ('add', self.index)
                elif self.rect.collidepoint(event.pos):
                    return ('edit', self.index)
        return None
    
    def draw(self, surface):
        # Main button
        if self.is_hovered and not self.is_hovered_plus:
            bg_color = LIGHT_BLUE
            text_color = BLACK
        else:
            bg_color = WHITE
            text_color = BLACK
        
        pygame.draw.rect(surface, bg_color, self.rect, border_radius=6)
        pygame.draw.rect(surface, self.color, self.rect, 2, border_radius=6)
        
        # Pose name
        font = pygame.font.Font(None, 20)
        name_surf = font.render(self.name, True, text_color)
        surface.blit(name_surf, (self.rect.x + 10, self.rect.y + 7))
        
        # + button
        plus_bg = GREEN if self.is_hovered_plus else LIGHT_GREEN
        pygame.draw.rect(surface, plus_bg, self.plus_rect, border_radius=4)
        pygame.draw.rect(surface, self.color, self.plus_rect, 1, border_radius=4)
        plus_font = pygame.font.Font(None, 28)
        plus_surf = plus_font.render('+', True, (0, 100, 0))
        plus_rect = plus_surf.get_rect(center=self.plus_rect.center)
        surface.blit(plus_surf, plus_rect)

# ======================================================================
# CREATE UI
# ======================================================================
left_panel_x = 20
left_panel_w = 250
panel_y = 20
panel_h = HEIGHT - 40

right_panel_x = WIDTH - 270
right_panel_w = 250

# Left panel buttons
new_pose_btn = Button(left_panel_x + 15, panel_y + 15, 220, 44,
                      '+ New Pose', LIGHT_GREEN, GREEN, GREEN, BLACK, 22)

# Pose buttons list (created dynamically)
pose_buttons = []

def rebuild_pose_buttons():
    global pose_buttons
    pose_buttons = []
    y = panel_y + 75
    for i, pose in enumerate(pose_list):
        btn = PoseButton(left_panel_x + 15, y, 220, 40, pose['name'], i, BLUE)
        pose_buttons.append(btn)
        y += 48

rebuild_pose_buttons()

# Editing controls
save_pose_btn = Button(left_panel_x + 15, panel_y + panel_h - 100, 105, 38,
                       'Save', LIGHT_GREEN, GREEN, GREEN, BLACK, 18, enabled=False)
cancel_pose_btn = Button(left_panel_x + 130, panel_y + panel_h - 100, 105, 38,
                         'Cancel', LIGHT_RED, RED, RED, WHITE, 18, enabled=False)

# Right panel - queue controls
queue_clear_btn = Button(right_panel_x + 15, 55, 80, 34,
                         'Clear', LIGHT_RED, RED, RED, WHITE, 18)
queue_play_btn = Button(right_panel_x + 105, 55, 70, 34,
                        'Play', LIGHT_GREEN, GREEN, GREEN, BLACK, 18, enabled=False)
queue_stop_btn = Button(right_panel_x + 185, 55, 50, 34,
                        'Stop', LIGHT_ORANGE, ORANGE, ORANGE, BLACK, 16, enabled=False)

# Transition duration controls
trans_minus_btn = Button(right_panel_x + 15, 105, 36, 32,
                         '-', LIGHT_GRAY, MID_GRAY, DARK_GRAY, BLACK, 22)
trans_plus_btn = Button(right_panel_x + 155, 105, 36, 32,
                        '+', LIGHT_GRAY, MID_GRAY, DARK_GRAY, BLACK, 22)

# Hold time controls
hold_minus_btn = Button(right_panel_x + 15, 150, 36, 32,
                        '-', LIGHT_GRAY, MID_GRAY, DARK_GRAY, BLACK, 22)
hold_plus_btn = Button(right_panel_x + 155, 150, 36, 32,
                       '+', LIGHT_GRAY, MID_GRAY, DARK_GRAY, BLACK, 22)

# Save/Load choreography
save_choreo_btn = Button(right_panel_x + 15, panel_y + panel_h - 90, 105, 38,
                         'Save', LIGHT_BLUE, BLUE, BLUE, WHITE, 18)
load_choreo_btn = Button(right_panel_x + 130, panel_y + panel_h - 90, 105, 38,
                         'Load', LIGHT_GRAY, MID_GRAY, DARK_GRAY, BLACK, 18)

# ======================================================================
# DRAW FUNCTIONS
# ======================================================================
def draw_grid(surface):
    surface.fill(WHITE)
    
    for x in range(0, WIDTH, GRID_SIZE):
        pygame.draw.line(surface, GRID_COLOR, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, GRID_SIZE):
        pygame.draw.line(surface, GRID_COLOR, (0, y), (WIDTH, y))
    
    for x in range(0, WIDTH, GRID_SIZE * 5):
        pygame.draw.line(surface, GRID_COLOR_DARK, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, GRID_SIZE * 5):
        pygame.draw.line(surface, GRID_COLOR_DARK, (0, y), (WIDTH, y))

def draw_left_panel(surface):
    rect = pygame.Rect(left_panel_x, panel_y, left_panel_w, panel_h)
    pygame.draw.rect(surface, LIGHT_GRAY, rect, border_radius=12)
    pygame.draw.rect(surface, GRAY, rect, 2, border_radius=12)
    
    font_title = pygame.font.Font(None, 26)
    title = font_title.render('Poses', True, BLACK)
    surface.blit(title, (left_panel_x + 15, panel_y + 18))
    
    # Divider
    pygame.draw.line(surface, GRAY,
                     (left_panel_x + 15, panel_y + 66),
                     (left_panel_x + left_panel_w - 15, panel_y + 66), 2)
    
    # Count
    font_count = pygame.font.Font(None, 18)
    count = font_count.render(f'{len(pose_list)} poses', True, DARK_GRAY)
    surface.blit(count, (left_panel_x + left_panel_w - 75, panel_y + 22))
    
    # Editing status
    if editing_mode:
        edit_bg = pygame.Rect(left_panel_x + 15, panel_y + panel_h - 150,
                             left_panel_w - 30, 40)
        pygame.draw.rect(surface, LIGHT_ORANGE, edit_bg, border_radius=6)
        font_edit = pygame.font.Font(None, 19)
        edit_text = font_edit.render('Drag joints to pose', True, BLACK)
        surface.blit(edit_text, (edit_bg.x + 10, edit_bg.y + 10))

def draw_right_panel(surface):
    rect = pygame.Rect(right_panel_x, panel_y, right_panel_w, panel_h)
    pygame.draw.rect(surface, LIGHT_GRAY, rect, border_radius=12)
    pygame.draw.rect(surface, GRAY, rect, 2, border_radius=12)
    
    font_title = pygame.font.Font(None, 26)
    title = font_title.render('Choreography', True, BLACK)
    surface.blit(title, (right_panel_x + 15, panel_y + 15))
    
    # Queue count
    total_dur = get_total_duration()
    font_info = pygame.font.Font(None, 17)
    info = font_info.render(f'{len(queue)} steps | {total_dur:.1f}s', True, DARK_GRAY)
    surface.blit(info, (right_panel_x + right_panel_w - 110, panel_y + 18))
    
    # Transition time label
    font_label = pygame.font.Font(None, 18)
    trans_label = font_label.render(f'Transition: {transition_duration:.1f}s', True, BLACK)
    surface.blit(trans_label, (right_panel_x + 58, 112))
    
    # Hold time label
    hold_label = font_label.render(f'Hold: {pose_hold_time:.1f}s', True, BLACK)
    surface.blit(hold_label, (right_panel_x + 58, 157))
    
    # Divider
    pygame.draw.line(surface, GRAY,
                     (right_panel_x + 15, 195),
                     (right_panel_x + right_panel_w - 15, 195), 2)
    
    # Queue items
    draw_queue_items(surface)
    
    # Timeline
    draw_timeline(surface)

def draw_queue_items(surface):
    """Draw queue as horizontal sequence of pose boxes with arrows."""
    y_start = 215
    max_per_row = 4
    item_w = 52
    item_h = 40
    gap_x = 6
    start_x = right_panel_x + 15
    
    for i, pose_idx in enumerate(queue[:20]):  # max 20 visible
        row = i // max_per_row
        col = i % max_per_row
        
        x = start_x + col * (item_w + gap_x + 12)
        y = y_start + row * (item_h + 8)
        
        # Box
        is_current = (is_playing and current_playback_index == i)
        bg = LIGHT_BLUE if is_current else WHITE
        border = BLUE
        
        pygame.draw.rect(surface, bg, (x, y, item_w, item_h), border_radius=4)
        pygame.draw.rect(surface, border, (x, y, item_w, item_h), 2, border_radius=4)
        
        # Pose name
        if pose_idx < len(pose_list):
            name = pose_list[pose_idx]['name']
            font = pygame.font.Font(None, 14)
            name_surf = font.render(name, True, BLACK)
            name_rect = name_surf.get_rect(centerx=x + item_w//2, top=y + 4)
            surface.blit(name_surf, name_rect)
        
        # Index number
        font_idx = pygame.font.Font(None, 13)
        idx_surf = font_idx.render(f'#{i+1}', True, DARK_GRAY)
        surface.blit(idx_surf, (x + 3, y + item_h - 14))
        
        # Delete button (small x)
        del_rect = pygame.Rect(x + item_w - 12, y + 2, 10, 10)
        pygame.draw.rect(surface, LIGHT_RED, del_rect, border_radius=2)
        font_x = pygame.font.Font(None, 12)
        x_surf = font_x.render('x', True, RED)
        surface.blit(x_surf, (del_rect.x + 2, del_rect.y - 1))
        
        # Arrow between items (except last in row)
        if col < max_per_row - 1 and i < len(queue) - 1:
            arrow_x = x + item_w + 2
            arrow_y = y + item_h // 2
            pygame.draw.line(surface, DARK_GRAY,
                            (arrow_x, arrow_y), (arrow_x + gap_x + 4, arrow_y), 2)
            # Arrowhead
            pygame.draw.polygon(surface, DARK_GRAY, [
                (arrow_x + gap_x + 4, arrow_y),
                (arrow_x + gap_x, arrow_y - 4),
                (arrow_x + gap_x, arrow_y + 4),
            ])
    
    if len(queue) == 0:
        font_empty = pygame.font.Font(None, 17)
        empty = font_empty.render('Click + on a pose to add', True, DARK_GRAY)
        surface.blit(empty, (right_panel_x + 20, y_start + 10))

def draw_timeline(surface):
    """Draw a simple timeline bar."""
    y = panel_y + panel_h - 140
    bar_x = right_panel_x + 15
    bar_w = right_panel_w - 30
    bar_h = 10
    
    total = get_total_duration()
    if total <= 0:
        total = 1
    
    # Background
    pygame.draw.rect(surface, WHITE, (bar_x, y, bar_w, bar_h), border_radius=5)
    pygame.draw.rect(surface, GRAY, (bar_x, y, bar_w, bar_h), 1, border_radius=5)
    
    # Playback position
    if is_playing and len(queue) > 0:
        progress = min(1.0, playback_time / total)
        fill_w = int(bar_w * progress)
        if fill_w > 0:
            fill_surf = pygame.Surface((fill_w, bar_h), pygame.SRCALPHA)
            pygame.draw.rect(fill_surf, (100, 180, 120, 180),
                           (0, 0, fill_w, bar_h), border_radius=5)
            surface.blit(fill_surf, (bar_x, y))
        
        # Playhead
        head_x = bar_x + fill_w
        pygame.draw.circle(surface, GREEN, (head_x, y + bar_h // 2), 6)
    
    # Labels
    font = pygame.font.Font(None, 15)
    start_label = font.render('0s', True, DARK_GRAY)
    end_label = font.render(f'{total:.1f}s', True, DARK_GRAY)
    surface.blit(start_label, (bar_x, y + 14))
    surface.blit(end_label, (bar_x + bar_w - 30, y + 14))

def draw_editing_banner(surface):
    if not editing_mode:
        return
    
    banner_h = 38
    banner_rect = pygame.Rect(0, 0, WIDTH, banner_h)
    pygame.draw.rect(surface, ORANGE, banner_rect)
    
    font = pygame.font.Font(None, 22)
    text = 'POSE EDITING - Drag joints to adjust | Click Save when done'
    text_surf = font.render(text, True, WHITE)
    text_rect = text_surf.get_rect(center=(WIDTH // 2, banner_h // 2))
    surface.blit(text_surf, text_rect)

def draw_fps_counter(surface):
    font = pygame.font.Font(None, 20)
    fps_text = f'FPS: {fps_display:.1f}'
    text_surf = font.render(fps_text, True, DARK_GRAY)
    surface.blit(text_surf, (WIDTH - 90, 5))

# ======================================================================
# QUEUE CLICK HANDLER
# ======================================================================
def handle_queue_click(pos):
    """Check if clicked on a queue item's delete button."""
    y_start = 215
    max_per_row = 4
    item_w = 52
    item_h = 40
    gap_x = 6
    start_x = right_panel_x + 15
    
    for i in range(len(queue)):
        row = i // max_per_row
        col = i % max_per_row
        x = start_x + col * (item_w + gap_x + 12)
        y = y_start + row * (item_h + 8)
        
        del_rect = pygame.Rect(x + item_w - 12, y + 2, 10, 10)
        if del_rect.collidepoint(pos):
            queue.pop(i)
            rebuild_pose_buttons()
            update_queue_buttons_enabled()
            return True
    return False

def update_queue_buttons_enabled():
    has_queue = len(queue) > 0
    queue_play_btn.enabled = has_queue
    queue_stop_btn.enabled = has_queue
    queue_clear_btn.enabled = has_queue
    if not has_queue:
        queue_play_btn.text = 'Play'

# ======================================================================
# POSE MANAGEMENT
# ======================================================================
def start_new_pose():
    global editing_mode
    editing_mode = True
    stickman.reset_pose()
    save_pose_btn.enabled = True
    cancel_pose_btn.enabled = True
    new_pose_btn.enabled = False
    queue_play_btn.enabled = False
    is_playing = False
    print("[Pose] New pose editing started")

def save_current_pose():
    global editing_mode
    if not editing_mode:
        return
    
    pose = stickman.get_pose_dict()
    name = f'Act{len(pose_list) + 1}'
    pose_list.append({'name': name, 'pose': pose})
    
    editing_mode = False
    save_pose_btn.enabled = False
    cancel_pose_btn.enabled = False
    new_pose_btn.enabled = True
    update_queue_buttons_enabled()
    rebuild_pose_buttons()
    print(f"[Pose] Saved: {name}")

def cancel_pose_edit():
    global editing_mode
    editing_mode = False
    save_pose_btn.enabled = False
    cancel_pose_btn.enabled = False
    new_pose_btn.enabled = True
    update_queue_buttons_enabled()
    stickman.reset_pose()
    print("[Pose] Edit cancelled")

def edit_pose(index):
    global editing_mode
    if index < 0 or index >= len(pose_list):
        return
    
    editing_mode = True
    stickman.set_pose_dict(pose_list[index]['pose'])
    save_pose_btn.enabled = True
    cancel_pose_btn.enabled = True
    new_pose_btn.enabled = False
    queue_play_btn.enabled = False
    print(f"[Pose] Editing: {pose_list[index]['name']}")

def add_pose_to_queue(index):
    queue.append(index)
    update_queue_buttons_enabled()
    pose_name = pose_list[index]['name'] if index < len(pose_list) else '?'
    print(f"[Queue] Added {pose_name} (total: {len(queue)})")

# ======================================================================
# SAVE / LOAD
# ======================================================================
def save_choreography(filepath):
    data = {
        'version': '2.0-pose',
        'poses': [],
        'queue': queue,
        'transition_duration': transition_duration,
        'pose_hold_time': pose_hold_time,
    }
    
    for pose in pose_list:
        data['poses'].append({
            'name': pose['name'],
            'pose': pose['pose'],
        })
    
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"[Save] Saved to {filepath}")
        return True
    except Exception as e:
        print(f"[Save] Failed: {e}")
        return False

def load_choreography(filepath):
    global pose_list, queue, transition_duration, pose_hold_time
    
    if not os.path.exists(filepath):
        print(f"[Load] File not found: {filepath}")
        return False
    
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        pose_list = []
        for p in data.get('poses', []):
            pose_list.append({'name': p['name'], 'pose': p['pose']})
        
        queue = data.get('queue', [])
        transition_duration = float(data.get('transition_duration', 0.6))
        pose_hold_time = float(data.get('pose_hold_time', 0.4))
        
        rebuild_pose_buttons()
        update_queue_buttons_enabled()
        print(f"[Load] Loaded {len(pose_list)} poses, {len(queue)} queue items")
        return True
    except Exception as e:
        print(f"[Load] Failed: {e}")
        return False

# ======================================================================
# MAIN LOOP
# ======================================================================
current_playback_index = -1

def main():
    global is_playing, playback_time, playback_start, playback_pause_time
    global current_playback_index
    global frame_count, fps_display, last_fps_time
    global transition_duration, pose_hold_time
    
    running = True
    dragging = False
    selected_joint = None
    drag_control_type = None
    drag_param = None
    drag_start_mouse = None
    
    last_time = time.time()
    
    while running:
        now = time.time()
        dt = now - last_time
        last_time = now
        
        # FPS
        frame_count += 1
        if now - last_fps_time >= 1.0:
            fps_display = frame_count / (now - last_fps_time)
            frame_count = 0
            last_fps_time = now
        
        # Playback update
        if is_playing and len(queue) > 0:
            playback_time = now - playback_start
            total = get_total_duration()
            if total > 0:
                playback_time = playback_time % total
            
            pose_dict, idx, transitioning = get_pose_at_time(playback_time)
            if pose_dict:
                stickman.set_pose_dict(pose_dict)
                current_playback_index = idx
        
        # Events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if editing_mode:
                        cancel_pose_edit()
                    elif is_playing:
                        is_playing = False
                        queue_play_btn.text = 'Play'
                
                elif event.key == pygame.K_SPACE:
                    if not editing_mode and len(queue) > 0:
                        is_playing = not is_playing
                        if is_playing:
                            playback_start = now - playback_pause_time
                            queue_play_btn.text = 'Pause'
                        else:
                            playback_pause_time = playback_time
                            queue_play_btn.text = 'Play'
            
            if event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    # Queue delete check
                    if not editing_mode:
                        handle_queue_click(event.pos)
                    
                    # Joint dragging in editing mode
                    if editing_mode:
                        jname, ctype, param = stickman.get_joint_at(event.pos[0], event.pos[1])
                        if jname:
                            if ctype == 'knee_flip':
                                stickman.flip_knee(param)
                                selected_joint = jname
                            else:
                                dragging = True
                                selected_joint = jname
                                drag_control_type = ctype
                                drag_param = param
                                drag_start_mouse = event.pos
            
            if event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    dragging = False
                    selected_joint = None
                    drag_control_type = None
                    drag_param = None
            
            if event.type == pygame.MOUSEMOTION:
                if dragging and editing_mode:
                    dx = event.pos[0] - drag_start_mouse[0]
                    dy = event.pos[1] - drag_start_mouse[1]
                    
                    if drag_control_type == 'angle' and drag_param:
                        delta = dx * 0.02
                        stickman.adjust_joint(drag_param, delta)
                        drag_start_mouse = event.pos
                    elif drag_control_type == 'hip_position':
                        stickman.move_hip(dx, dy)
                        drag_start_mouse = event.pos
            
            # ---- Button events ----
            
            # New pose
            if new_pose_btn.handle_event(event):
                start_new_pose()
            
            # Save / cancel pose
            if save_pose_btn.handle_event(event):
                save_current_pose()
            
            if cancel_pose_btn.handle_event(event):
                cancel_pose_edit()
            
            # Pose buttons (edit / add)
            for pb in pose_buttons:
                result = pb.handle_event(event)
                if result:
                    action, idx = result
                    if action == 'edit':
                        edit_pose(idx)
                    elif action == 'add':
                        add_pose_to_queue(idx)
            
            # Queue controls
            if queue_clear_btn.handle_event(event):
                queue.clear()
                playback_time = 0.0
                playback_pause_time = 0.0
                current_playback_index = -1
                update_queue_buttons_enabled()
            
            if queue_play_btn.handle_event(event):
                if len(queue) > 0:
                    is_playing = not is_playing
                    if is_playing:
                        playback_start = now - playback_pause_time
                        queue_play_btn.text = 'Pause'
                    else:
                        playback_pause_time = playback_time
                        queue_play_btn.text = 'Play'
            
            if queue_stop_btn.handle_event(event):
                is_playing = False
                queue_play_btn.text = 'Play'
                playback_time = 0.0
                playback_pause_time = 0.0
                current_playback_index = -1
                if len(pose_list) > 0:
                    stickman.set_pose_dict(pose_list[0]['pose'])
            
            # Transition duration
            if trans_minus_btn.handle_event(event):
                transition_duration = max(0.1, transition_duration - 0.1)
            
            if trans_plus_btn.handle_event(event):
                transition_duration = min(5.0, transition_duration + 0.1)
            
            # Hold time
            if hold_minus_btn.handle_event(event):
                pose_hold_time = max(0.1, pose_hold_time - 0.1)
            
            if hold_plus_btn.handle_event(event):
                pose_hold_time = min(5.0, pose_hold_time + 0.1)
            
            # Save / load
            if save_choreo_btn.handle_event(event):
                save_choreography('choreography.json')
            
            if load_choreo_btn.handle_event(event):
                load_choreography('choreography.json')
        
        # ---- Draw ----
        draw_grid(screen)
        stickman.draw(screen, show_handles=editing_mode, highlight_joint=selected_joint)
        draw_left_panel(screen)
        draw_right_panel(screen)
        
        # Buttons
        new_pose_btn.draw(screen)
        for pb in pose_buttons:
            pb.draw(screen)
        save_pose_btn.draw(screen)
        cancel_pose_btn.draw(screen)
        
        queue_clear_btn.draw(screen)
        queue_play_btn.draw(screen)
        queue_stop_btn.draw(screen)
        
        trans_minus_btn.draw(screen)
        trans_plus_btn.draw(screen)
        hold_minus_btn.draw(screen)
        hold_plus_btn.draw(screen)
        
        save_choreo_btn.draw(screen)
        load_choreo_btn.draw(screen)
        
        draw_editing_banner(screen)
        draw_fps_counter(screen)
        
        # Bottom hint
        if not editing_mode:
            font_hint = pygame.font.Font(None, 18)
            hint = font_hint.render(
                'New Pose: create a pose | + : add to queue | Space: play/pause',
                True, DARK_GRAY
            )
            hint_rect = hint.get_rect(centerx=WIDTH // 2, bottom=HEIGHT - 20)
            screen.blit(hint, hint_rect)
        
        pygame.display.flip()
        clock.tick(FPS)
    
    pygame.quit()
    sys.exit()

if __name__ == '__main__':
    print("=" * 60)
    print("Dance Pose Choreographer v2.0")
    print("=" * 60)
    print("[INFO] Starting up...")
    print("[INFO] Click 'New Pose' to start creating poses")
    main()
