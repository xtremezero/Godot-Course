/* Chapter 10 — 3D Character Animation & Retargeting (26 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 10, t: "Chapter 10 — Animation & Retargeting", cover: true, html: `
<div class="cov-part">Part III · Advanced Systems &amp; Projects</div>
<div class="cov-n">10</div>
<h1>3D Character Animation &amp; Retargeting</h1>
<p class="cov-sub">Everything between Blender and believable motion: Skeleton3D and bone hierarchies, skinned meshes, BoneMap retargeting so any rig animates any character, AnimationPlayer trackcraft, and AnimationTree state machines + BlendSpaces for locomotion.</p>
<div class="chips">
  <span class="tag">Skeleton3D</span><span class="tag">Bone hierarchy</span>
  <span class="tag">Skinned meshes</span><span class="tag">BoneMap retargeting</span>
  <span class="tag">AnimationPlayer</span><span class="tag">AnimationTree · BlendSpace</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 10, t: "The Skinned Mesh Pipeline", html: `
<h2>Pipeline overview — DCC to motion</h2>
<div class="flow">
  <div class="fbox"><b>Blender</b>mesh + armature + weights + actions</div>
  <div class="arr">→</div>
  <div class="fbox"><b>Export .glb</b>glTF skinning extension</div>
  <div class="arr">→</div>
  <div class="fbox"><b>Import</b>Skeleton3D + MeshInstance3D + AnimationPlayer</div>
  <div class="arr">→</div>
  <div class="fbox acc"><b>Runtime</b>AnimationPlayer/Tree drive bones</div>
</div>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Rig (armature)</b> = hierarchy of bones; <b>skinning</b> = per-vertex weights binding mesh to bones.</li>
      <li>Importing a rigged glb produces: <code>Skeleton3D</code> (bones), <code>MeshInstance3D</code> (skinned surface), <code>AnimationPlayer</code> (clips).</li>
      <li>The whole chapter = understanding these three artifacts + two controllers.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">character.glb</span>
<span class="m">├──</span><span class="b">Skeleton3D</span> <span class="g">Armature</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="m">Root</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp; └──</span><span class="m">Hips → Spine → …</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">BoneAttachment3D</span> <span class="m">(props)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="g">Body</span> <span class="m">(skinned)</span>
<span class="m">└──</span><span class="b">AnimationPlayer</span> <span class="m">(idle/walk/run…)</span></div>
  </div>
</div>
` },

{ c: 10, t: "Skeleton3D: Bones as Transforms", html: `
<h2>Skeleton3D — a tree of transforms on stilts</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>A bone is <b>just a named transform in a parent chain</b> (position + rotation + scale relative to parent bone).</li>
      <li><b>Rest pose</b>: the reference pose baked at import — the identity the skeleton returns to; also used by retargeting math.</li>
      <li>Per-bone IDs: <code>find_bone("Hips")</code>; pose access: <code>get_bone_pose(id)</code> (rest space), <code>set_bone_pose_position/rotation</code>, and global: <code>get_bone_global_pose(id)</code>.</li>
      <li>Editing bones at runtime = procedural animation (wave an arm, aim a spine — slide 22).</li>
      <li><b>Modifiers</b> (4.4+): per-bone constraints stack — replaces the deprecated SkeletonIK3D.</li>
    </ul>
  </div>
  <div>
<pre data-file="bone_probe.gd" data-lang="gdscript"><code>extends Skeleton3D

func _ready() -> void:
	# Enumerate the rig:
	for i in get_bone_count():
		var n := get_bone_name(i)
		var parent := get_bone_parent(i)
		print("%2d %-24s parent=%d"
			% [i, n, parent])

	# Read a hand's world position (e.g. for effects):
	var hand := find_bone("RightHand")
	var hand_xf: Transform3D = \
		get_bone_global_pose(hand) * global_transform
	print("right hand at ", hand_xf.origin)</code></pre>
    <div class="callout note"><b>ℹ Note</b><p>Bone "global pose" is relative to the <em>skeleton node</em>, not the world — compose with <code>global_transform</code> when you need world space.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Skinned Meshes & Weights", html: `
<h2>Skinning — how mesh follows bones</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Each skinned vertex carries up to <b>4 bone indices + 4 weights</b> (sum = 1) in the mesh's <code>BONES/WEIGHTS</code> arrays.</li>
      <li>GPU: final position = Σ (bone_matrix × vertex) × weight — a linear blend ("LBS"), executed in the vertex shader.</li>
      <li>Import option <b>skins</b>: 4 vs 8 influences per vertex (8 = smoother shoulders, heavier).</li>
      <li>Godot separates the skin from the skeleton (<code>skin</code> resource on MeshInstance3D) — one skeleton can drive many mesh instances (gear swaps!).</li>
      <li>Artifacts at joints (candy-wrapper) = weight quality issue → fix in Blender, not code.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Rest pose</b>skeleton's reference transforms</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Bone pose</b>animated offsets per bone</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Vertex shader</b>blend 4 bones × weights</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Deformed mesh</b>what you see</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Bone transforms reach the GPU as a texture or UBO of <b>inverse-rest × current</b> matrices (the "skin matrix"). That's why rest poses must be stable — retargeting (next) is largely rest-pose algebra.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Importing Characters", html: `
<h2>Character import checklist</h2>
<div class="two">
  <div>
    <ol class="steps">
      <li>Blender: <b>NLA-ready actions</b> (each clip its own action, pushed to NLA strips or "stash"); +Y up, meters, armature at origin.</li>
      <li>Export glb with <b>Skinning + Animation</b> enabled.</li>
      <li>Godot import dock: Nodes → Root Type <code>Node3D</code> (gameplay wrapper adds CharacterBody3D itself); Meshes → <b>Ensure Tangents</b>; Animation → import on, sensible FPS, loops marked <em>loop</em> in Blender or re-flagged here.</li>
      <li>Verify: <code>Skeleton3D</code> bones list, <code>AnimationPlayer</code> animation list — everything visible in the importer preview.</li>
      <li>Extract materials (Ch 4) so tuning doesn't re-export.</li>
    </ol>
  </div>
  <div>
    <div class="callout bp"><b>✓ Best Practice</b><p><b>In-place locomotion</b> clips (walk/run cycle at origin) — root motion is powerful but adds a whole controller layer; earn it when you need it (slide 20).</p></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Animations missing after import = Blender side: actions not in NLA strips aren't exported. "Stash" every action (Push Down or the film-strip icon).</p></div>
    <div class="callout note"><b>ℹ Note</b><p>Mixamo: download "FBX with skin", convert via Blender's Mixamo-importer or online glTF converters, then run the retargeting pipeline — next slides make any bone naming work.</p></div>
  </div>
</div>
` },

{ c: 10, t: "The Retargeting Problem", html: `
<h2>Why retargeting exists</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Animation data targets <b>bone names + rest proportions</b>. Mixamo's <code>Mixamorig_Hips</code> ≠ Blender Rigify's <code>DEF-spine</code> ≠ your game rig's <code>Hips</code>.</li>
      <li>Naive share = garbage: clips snap to wrong bones, or apply in the wrong rest space (a T-pose clip onto an A-pose rig = pretzel).</li>
      <li><b>Retargeting</b> = a mapping (names) + rest-space correction (math) so one animation library drives many characters.</li>
      <li>Godot's answer: <code>BoneMap</code> + <code>SkeletonProfile</code> — industry-standard approach (like Unity's Avatars / Unreal's Rigs).</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Source rig</b>Mixamo bones · its rest pose</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>BoneMap + profile</b>"Hips means hips" + rest fixer</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Target rig</b>your character · its rest pose</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Result</b>one library → every humanoid</div>
    </div>
  </div>
</div>
` },

{ c: 10, t: "BoneMap & SkeletonProfile", html: `
<h2>BoneMap — the mapping resource</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>BoneMap</code>: dictionary <code>profile_bone → your_bone</code> (StringName → StringName).</li>
      <li><code>SkeletonProfile</code>: the canonical skeleton definition — bone names, hierarchy, required bones, rest directions. Godot ships <b>SkeletonProfileHumanoid</b>.</li>
      <li>Two placements, two purposes:
        <ul>
          <li><b>Import dock → Retarget</b>: remaps the glb's animations to the profile at import (bakes corrected clips).</li>
          <li><b>Skeleton3D.bone_map</b>: converts live pose/animation at runtime between profile ↔ rig.</li>
        </ul></li>
      <li>Editor UX: assign a BoneMap to Skeleton3D → Godot <b>auto-fills mappings</b> by name heuristics; you correct the stragglers.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">SkeletonProfileHumanoid (excerpt)</span>
<span class="y">Root → Hips → Spine → Chest →</span>
<span class="m">&nbsp;&nbsp;Neck → Head</span>
<span class="m">Hips → LeftUpperLeg → LeftLowerLeg</span>
<span class="m">&nbsp;&nbsp;→ LeftFoot → LeftToes</span>
<span class="m">Chest → LeftShoulder → LeftUpperArm</span>
<span class="m">&nbsp;&nbsp;→ LeftLowerArm → LeftHand…</span>

<span class="m">BoneMap (your rig):</span>
<span class="y">"Hips"        → "mixamorig:Hips"</span>
<span class="y">"LeftHand"    → "mixamorig:LeftHand"</span>
<span class="m">…</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Standardize every character on <b>SkeletonProfileHumanoid</b> names early. Retarget once at import; games then share a single animation library.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Retargeting Workflow", html: `
<h2>The retarget workflow, step by step</h2>
<div class="twoR">
  <div>
    <ol class="steps">
      <li>Open character's glb import → <b>Retarget</b> section → new BoneMap → profile = <b>Godot Humanoid</b> (or the imported profile from your source rig).</li>
      <li>Map bones — the 3D preview shows mapped skeleton; fix red/unmapped required bones.</li>
      <li>Decide <b>Rest Fixer</b> (compat rest orientation) and "Apply Node Transforms" per source quirks.</li>
      <li>Reimport → animations now play correctly on this rig even if authored for another.</li>
      <li>Repeat per character; or skip entirely by rigging everything humanoid-identical.</li>
    </ol>
  </div>
  <div>
<pre data-file="runtime_retarget.gd" data-lang="gdscript"><code># Runtime retarget (Skeleton3D.bone_map):
extends Skeleton3D

func _ready() -> void:
	# bone_map assigned via Inspector — mapping:
	# profile name → this skeleton's bone name
	if bone_map:
		for prof_name in bone_map.get_profile()\
				.get_bone_names():
			var local := bone_map.get_bone_mapping(
				prof_name)
			print("%s ← %s" % [prof_name, local])

# Bonus: retarget poses at runtime manually:
func copy_pose(from: Skeleton3D, map: BoneMap) -> void:
	for i in from.get_bone_count():
		var prof := map.get_profile_bone_name(  # map lookup
			from.get_bone_name(i))
		var mine := find_bone(map.get_bone_mapping(prof))
		if mine &gt;= 0:
			set_bone_pose_rotation(mine,
				from.get_bone_pose_rotation(i))</code></pre>
    <div class="callout ver"><b>◷ Version Note</b><p>Retargeting landed in <b>4.2</b> and matured through 4.3. If tutorials from 4.0/4.1 hand-roll bone remaps — that pain is exactly what BoneMap replaced.</p></div>
  </div>
</div>
` },

{ c: 10, t: "AnimationPlayer Trackcraft", html: `
<h2>Tracks beyond transforms</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Property track</b>: any node path + property — <code>Visuals/Mesh:surface_material_override/0.emission_energy</code> counts as animation.</li>
      <li><b>Method Call track</b>: fire <code>footstep()</code> at exact frames — the clean footstep-sync pattern.</li>
      <li><b>Bezier track</b>: hand-drawn curves for light energy / camera fov / audio volume.</li>
      <li><b>Audio track</b>: embed SFX into the clip itself (lip flap, footsteps baked in).</li>
      <li><b>Animation track</b>: nest other clips (sequences) — the gateway to combo trees.</li>
      <li>Compression + <b>Remove Immutable Tracks</b> on import keeps clips lean.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="g">attack.anim</span>
<span class="m">├─ </span><span class="y">Skeleton3D:bone/5/pose</span> <span class="m">(rotation keys)</span>
<span class="m">├─ </span><span class="y">Arm/scale</span> <span class="m">(squash!)</span>
<span class="m">├─ </span><span class="y">method: play_sfx("swing")</span> <span class="m">@ 0.12s</span>
<span class="m">├─ </span><span class="y">method: hitbox_on()</span> <span class="m">@ 0.18s</span>
<span class="m">├─ </span><span class="y">method: hitbox_off()</span> <span class="m">@ 0.30s</span>
<span class="m">└─ </span><span class="y">audio: sword_whoosh</span> <span class="m">@ 0.1s</span>

<span class="m">len 0.55 · loop off</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Gameplay hooks (hitboxes) belong on <b>method call tracks</b>, not in code timers — the animation IS the timing source of truth.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Driving AnimationPlayer", html: `
<h2>Playback API patterns</h2>
<div class="twoR">
  <div>
<pre data-file="anim_play.gd" data-lang="gdscript"><code>extends AnimationPlayer

func _ready() -> void:
	animation_finished.connect(_on_done)

func attack() -> void:
	if current_animation == "attack":
		return               # no restarts mid-swing
	play("attack")

func _on_done(name: StringName) -> void:
	match name:
		"attack":
			play("idle")    # or return-to-logic
		"death":
			set_process(false)

# Queuing sequences:
func taunt_then_attack() -> void:
	stop()
	queue("taunt")
	queue("attack")       # plays after taunt ends

# Cross-code sync: speed as a variable:
func set_time_scale(f: float) -> void:
	speed_scale = f        # hitstop, slo-mo, rage</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><code>play(name, custom_blend, speed, from_end)</code> — the full signature has blending built in.</li>
      <li><code>queue()</code> chains; <code>stop()</code> clears.</li>
      <li><code>speed_scale</code> = global clip speed — slo-mo &amp; hitstop without Engine.time_scale (locals only!).</li>
      <li><code>seek(t)</code> jumps; <code>current_animation_position</code> reads progress for logic windows ("cancel window").</li>
      <li>Signals: <code>animation_finished</code>, <code>animation_changed</code>, <code>caches_cleared</code>.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Calling <code>play</code> every frame with the same name restarts the clip each call — guard it (as above). Symptom: first keyframe flickering forever.</p></div>
  </div>
</div>
` },

{ c: 10, t: "AnimationTree I: Why", html: `
<h2>Why AnimationTree exists</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>AnimationPlayer plays <b>one clip at a time</b>; characters need <b>blends + state logic</b>: walk↔run by speed, aim-vs-move layers, jump interrupts.</li>
      <li><code>AnimationTree</code> = a <b>graph of blend nodes</b> evaluated every frame, driving its AnimationPlayer.</li>
      <li>Root types:
        <ul>
          <li><b>AnimationNodeAnimation</b> — single clip passthrough</li>
          <li><b>AnimationNodeBlend1D/2D/Tree</b> — continuous blends</li>
          <li><b>AnimationNodeStateMachine</b> — discrete states + transitions</li>
          <li><b>AnimationNodeSync</b> — keep two branches time-aligned</li>
        </ul></li>
      <li>Parameters drive everything from code: <code>tree["parameters/blend_position"] = v</code>.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">AnimationTree</span>
<span class="m">├ anim_player → AnimationPlayer ✓</span>
<span class="m">└ tree_root:</span>
<span class="m">&nbsp;&nbsp;&nbsp;AnimationNodeStateMachine</span>
<span class="m">&nbsp;&nbsp;&nbsp;├─ </span><span class="y">idle</span>
<span class="m">&nbsp;&nbsp;&nbsp;├─ </span><span class="y">move</span> <span class="m">(BlendSpace1D inside)</span>
<span class="m">&nbsp;&nbsp;&nbsp;├─ </span><span class="y">jump</span> · <span class="y">attack</span>
<span class="m">&nbsp;&nbsp;&nbsp;└─ transitions on conditions</span>

<span class="m">code sets:</span>
<span class="m">· parameters/conditions/is_moving</span>
<span class="m">· parameters/move/blend_position</span></div>
    <div class="callout note"><b>ℹ Note</b><p>AnimationTree <b>replaces</b> hand-managed play() calls for locomotion — pick one driver per character or they'll fight.</p></div>
  </div>
</div>
` },

{ c: 10, t: "AnimationTree II: BlendSpace1D", html: `
<h2>BlendSpace1D — locomotion by one axis</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>A 1D grid: clips pinned at points along an axis (e.g. −1 walk_back, 0 idle, 0.5 jog, 1 sprint).</li>
      <li>Blend position between points → <b>pose interpolation</b>, not clip switching — no pops, no foot slide at the seams.</li>
      <li>Code writes velocity-derived value every physics tick; visual polish for free.</li>
      <li><b>Sync mode</b> keeps clips phase-locked (left feet stay left feet).</li>
    </ul>
  </div>
  <div>
<pre data-file="locomotion.gd" data-lang="gdscript"><code>extends CharacterBody3D

@onready var tree: AnimationTree = $AnimationTree
@onready var state_machine: AnimationNodeStateMachinePlayback = \
	tree["parameters/playback"]

const WALK := 3.0
const RUN := 7.0

func _physics_process(_d: float) -> void:
	var hspeed := Vector2(
		velocity.x, velocity.z).length()

	# Map speed → blend axis (-0.2 idle deadzone):
	var axis := remap(hspeed, 0.0, RUN, -0.2, 1.0)
	tree["parameters/Move/blend_position"] = axis

	# State machine gate:
	tree["parameters/conditions/moving"] = hspeed &gt; 0.3
	tree["parameters/conditions/still"] = hspeed &lt;= 0.3</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Place idle at 0 and add a <b>small deadzone</b> (−0.2…0) so micro-drift doesn't shimmer between idle and walk.</p></div>
  </div>
</div>
` },

{ c: 10, t: "AnimationTree III: BlendSpace2D", html: `
<h2>BlendSpace2D — direction-aware blends</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Clips on a 2D plane — canonical layout: <b>8-directional movement</b> around the edge, idle at center.</li>
      <li>Blend input = direction vector (stick X/Y, or velocity direction in character space).</li>
      <li>Auto-triangulation fills the interior with barycentric blends; place points so triangles look sane (no thin slivers).</li>
      <li>Use when strafing matters (top-down, twin-stick); forward-only games stay 1D.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">BlendSpace2D (top-down character)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="y">walk_fwd (0,-1)</span>
<span class="m">&nbsp;&nbsp;</span><span class="y">walk_L</span><span class="m">┌─────────┐</span><span class="y">walk_R</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="m">│&nbsp;</span><span class="g">idle</span><span class="m">&nbsp;&nbsp;&nbsp;&nbsp;│</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="m">│&nbsp;(0,0)&nbsp;&nbsp;&nbsp;│</span>
<span class="m">&nbsp;&nbsp;</span><span class="y">walk_bL</span><span class="m">└─────────┘</span><span class="y">walk_bR</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="y">walk_back</span>

<span class="m">code: tree["parameters/Move/blend_position"] =</span>
<span class="m">&nbsp;&nbsp;Vector2(input.x, input.y)  # char-space</span></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>BlendSpace2D with <b>un-synced clips</b> of different lengths = foot phase chaos mid-blend. Enable Sync (and match cycle lengths in Blender when possible).</p></div>
  </div>
</div>
` },

{ c: 10, t: "AnimationTree IV: State Machine", html: `
<h2>AnimationNodeStateMachine</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>States = animations or blend nodes; <b>transitions</b> = arrows with:</li>
      <li>· <b>Conditions</b> (bool/trigger parameters read from code)</li>
      <li>· <b>Switch</b> modes (AtEnd / Immediate) &amp; <b>advance modes</b></li>
      <li>· <b>Xfade time</b> — crossfade seconds (0.1–0.25 typical locomotion)</li>
      <li>Code drives via the <code>playback</code> object: <code>travel("Attack")</code> walks the shortest legal path; <code>jump_to()</code> teleports states.</li>
      <li>End states + auto-advance chains build cutscene sequences without code.</li>
    </ul>
  </div>
  <div>
<pre data-file="state_machine.gd" data-lang="gdscript"><code>extends CharacterBody3D

@onready var playback: AnimationNodeStateMachinePlayback = \
	$AnimationTree["parameters/playback"]

func _physics_process(delta: float) -> void:
	$AnimationTree["parameters/conditions/in_air"] = \
		not is_on_floor()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("attack") and is_on_floor():
		playback.travel("Attack")   # finds the path

# Grounded → Attack requires:
#   condition "attacking" OR travel() target reachable
# Attack → Grounded auto-advances AtEnd (0.15 xfade)

# Reading where we are:
print(playback.get_current_node())
print(playback.get_current_play_position())</code></pre>
  </div>
</div>
` },

{ c: 10, t: "Full Locomotion Stack", html: `
<h2>Composing it — the production stack</h2>
<div class="two">
  <div>
    <div class="tree"><span class="b">AnimationTree</span> <span class="m">(StateMachine root)</span>
<span class="m">├─ </span><span class="y">Grounded</span> <span class="m">(BlendSpace1D)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├─ idle @ -0.2</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├─ walk @ 0.0</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├─ jog  @ 0.5</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └─ run  @ 1.0</span>
<span class="m">├─ </span><span class="y">Air</span> <span class="m">(jump rise / fall blends)</span>
<span class="m">└─ </span><span class="y">Actions</span> <span class="m">(attack/roll/death)</span>

<span class="m">transitions:</span>
<span class="m">Grounded → Air    cond: in_air (0.12 xfade)</span>
<span class="m">Air → Grounded    cond: !in_air (0.15)</span>
<span class="m">Grounded → Attack travel() on input</span>
<span class="m">Any → Death       cond: dead (travel, 0.2)</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Layered logic:</b> state machine for <em>discrete</em> modes; BlendSpaces for <em>continuous</em> variation inside each mode.</li>
      <li>Conditions come from gameplay facts (is_on_floor, velocity, hp) — never from the animation side.</li>
      <li>Add an <b>Overlay/Aim layer</b> (BlendTree with add/layer weights) for aiming-on-top-of-locomotion later.</li>
      <li>This exact stack runs Pumpkin-Run-grown characters and the Ch 12 platformer unchanged.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Build the stack incrementally: 1) BlendSpace1D movement · 2) add Air · 3) add Actions. Test in isolation with manual parameter writes before wiring gameplay.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Root Motion", html: `
<h2>Root motion — animation moves the body</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Some clips contain authored travel (a lunge, a roll). With root motion, the <b>skeleton's root bone motion drives the CharacterBody</b> — no foot-slide, perfect sync.</li>
      <li>Enable in AnimationPlayer clip: <b>Root Motion Track</b> = the root bone's track path.</li>
      <li>Consume in code: <code>AnimationTree.get_root_motion_position()</code> / <code>_rotation()</code> — deltas in character space, per physics tick.</li>
      <li>Gravity/collision still handled by move_and_slide — root motion replaces the horizontal drive only.</li>
    </ul>
  </div>
  <div>
<pre data-file="root_motion.gd" data-lang="gdscript"><code>extends CharacterBody3D

@onready var tree: AnimationTree = $AnimationTree

func _physics_process(delta: float) -> void:
	if is_multiplayer_authority():   # net-aware (Ch 9!)
		# Root-motion delta this tick (character space):
		var rm_pos := tree.get_root_motion_position()
		var rm_rot := tree.get_root_motion_rotation()

		if rm_pos != Vector3.ZERO:
			# apply in world orientation:
			velocity.x = 0.0
			velocity.z = 0.0
			var world_move := global_transform.basis \
				* rm_pos / delta
			velocity = Vector3(
				world_move.x, velocity.y, world_move.z)
		move_and_slide()
		rotate_y(rm_rot.get_angle())</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Root motion + manual <code>position +=</code> drives = double movement. Pick one driver per state (usually: root-motion for attacks/rolls, parametric for locomotion).</p></div>
  </div>
</div>
` },

{ c: 10, t: "Bone Attachments & Props", html: `
<h2>BoneAttachment3D — riding bones</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>BoneAttachment3D</code> = Node3D that follows a named bone's transform. Parent weapons, tool-tips, muzzle markers to hands.</li>
      <li>Set <code>bone_name</code>; optional <code>override_pose</code> lets it also <em>pose</em> the bone (editor posing aid).</li>
      <li><b>Two-handed grip / aim poses:</b> animate the hand TO the prop; attachment provides the socket.</li>
      <li>Socket alternative: <code>Skeleton3D.find_bone + get_bone_global_pose</code> every tick in code — attachments are the free version.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Skeleton3D</span>
<span class="m">└──</span><span class="b">BoneAttachment3D</span> <span class="g">RightHandSocket</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;bone_name = "RightHand"</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;└──</span><span class="y">@sword.tscn</span> <span class="m">(instance)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──</span><span class="b">AudioStreamPlayer3D</span> <span class="m">whoosh</span>

<span class="m"># swap gear: free(sword); equip(new)</span></div>
<pre data-file="equip.gd" data-lang="gdscript"><code>extends BoneAttachment3D

var _held: Node3D = null

func equip(scene: PackedScene) -> void:
	if _held:
		_held.queue_free()
	_held = scene.instantiate()
	add_child(_held)</code></pre>
  </div>
</div>
` },

{ c: 10, t: "Procedural Animation", html: `
<h2>Code-driven motion layered on top</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Aim/look-at:</b> rotate Head + Spine bones toward a target — layered AFTER the animation update so it wins.</li>
      <li><b>Recoil/impulse:</b> additive bone offsets decaying with springs.</li>
      <li><b>Physics bones:</b> <code>PhysicalBone3D</code> (ragdoll) — simulate bones as jointed bodies on demand (death = enable ragdoll).</li>
      <li>Order matters: AnimationPlayer/Tree pose → your <code>_process</code> tweaks → GPU skins. Modify in <code>_process</code> (post-animation by default ordering).</li>
    </ul>
  </div>
  <div>
<pre data-file="look_at_bone.gd" data-lang="gdscript"><code>extends Skeleton3D

@export_node_path("Marker3D") var target_path

func _process(_d: float) -> void:
	var target: Node3D = get_node(target_path)
	var head := find_bone("Head")
	var spine := find_bone("Spine2")

	# Current world look of the head bone:
	var head_xf := global_transform \
		* get_bone_global_pose(head)
	var to_t := target.global_position - head_xf.origin

	# Rotation from head's -Z toward target:
	var q := Quaternion(
		head_xf.basis.z, to_t.normalized())

	# Split 60% spine / 40% head — natural bends:
	_apply_rot(head, q.slerp(
		Quaternion.IDENTITY, 0.6))
	_apply_rot(spine, q.slerp(
		Quaternion.IDENTITY, 0.4))

func _apply_rot(bone: int, rot: Quaternion) -> void:
	set_bone_pose_rotation(bone,
		get_bone_pose_rotation(bone) * rot)</code></pre>
  </div>
</div>
` },

{ c: 10, t: "IK & Constraints", html: `
<h2>Foot IK and the constraint system</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Foot placement IK:</b> raycast down from ankle → if ground closer than rest height, lift the foot bone to the hit + orient to the normal.</li>
      <li>Classic implementation: per-leg RayCast3D + <code>set_bone_pose_position(Foot)</code> + a knee-pole pole — ~60 lines, transforms walk cycles on stairs.</li>
      <li><b>4.4 BoneConstraint system:</b> <code>LookAtModifier3D</code> (aim any bone chain at a target), <code>PhysicalBoneSimulator3D</code> (ragdoll-lite), extensible modifiers — the modern replacement for deprecated SkeletonIK3D.</li>
      <li>Pre-4.4: SkeletonIK3D still works (FABRIK solver) but is legacy.</li>
    </ul>
  </div>
  <div>
<pre data-file="foot_ik.gd" data-lang="gdscript"><code>extends Skeleton3D  # per foot (2 instances)

@export var foot_bone := "LeftFoot"
@export var rest_height := 0.18

func _process(_d: float) -> void:
	var id := find_bone(foot_bone)
	var foot_xf := global_transform * get_bone_global_pose(id)

	%DownRay.global_position = foot_xf.origin \
		+ Vector3.UP * 0.4
	%DownRay.force_raycast_update()

	if %DownRay.is_colliding():
		var hit := %DownRay.get_collision_point()
		var lift := hit.y + rest_height - foot_xf.origin.y
		if lift &gt; 0.0:
			# raise foot bone (in bone-parent space):
			var p := get_bone_pose_position(id)
			set_bone_pose_position(id,
				p + global_transform.basis.y * lift)</code></pre>
    <div class="callout ver"><b>◷ Version Note</b><p>Targeting 4.0–4.3? Use SkeletonIK3D. On 4.4+ prefer the constraint nodes — cleaner API, live in the tree, multiplayer-agnostic.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Optimizing Animation", html: `
<h2>Animation performance</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Track count</b> drives CPU: every animated bone = per-frame interpolation work. Import with <b>Remove Immutable Tracks</b>; strip bones you never animate.</li>
      <li><b>AnimationTree costs</b> scale with simultaneously blended nodes — a 3-clip blend × 50 characters adds up; LOD distant characters to plain AnimationPlayer.</li>
      <li><b>Retarget-at-import</b>, not per-frame runtime remaps on crowds.</li>
      <li>GPU side is fixed-cost (skin matrices per skeleton per frame) — modest; skins with 4 influences beat 8 on mobile.</li>
      <li>Measure: Profiler → <code>AnimationMixer::_process</code> rows.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Profiler @ 40 animated characters:</span>
AnimationMixer::_process  3.1 ms  <span class="dim">← hot</span>
<span class="dim">after "Remove Immutable" + distant LOD:</span>
AnimationMixer::_process  1.4 ms
<span class="dim">tracks: 11,204 → 3,180</span>
<span class="err">rule of thumb: &lt; 0.05 ms per character</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>Crowd LOD ladder: full tree → AnimationPlayer clip → freeze on pose → (far) billboard/imposter. Each step ≈ 10× cheaper.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Animation & Multiplayer", html: `
<h2>Net-aware characters</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Don't sync bone transforms.</b> Sync a small <code>anim_state</code> (clip id + blend axis) — each client animates locally (Ch 9's minimal-state doctrine).</li>
      <li>Triggers (attack) = RPC events; transitions fire identically everywhere from the same condition stream.</li>
      <li>Root motion: apply on the authority, sync resulting transform (position), never the motion itself.</li>
      <li>Latency trick: fire remote VFX (muzzle flash) immediately on the shooter; reconcile state after.</li>
    </ul>
  </div>
  <div>
<pre data-file="net_anim.gd" data-lang="gdscript"><code>extends CharacterBody3D

# Synchronized (MultiplayerSynchronizer):
var anim_clip := 0        # enum → clip name
var anim_blend := 0.0     # BlendSpace axis

const CLIPS: Array[StringName] = [
	&amp;"idle", &amp;"walk", &amp;"run", &amp;"attack"]

func _process(_d: float) -> void:
	if is_multiplayer_authority():
		anim_blend = _compute_blend_from_velocity()
	$AnimationTree["parameters/Move/blend_position"] = \
		anim_blend
	# state selection identical on every peer:</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Deterministic animation = same clips + same params + same conditions. Version-lock animation libraries across builds; a renamed clip is a network desync.</p></div>
  </div>
</div>
` },

{ c: 10, t: "Chapter 10 Pitfalls", html: `
<h2>Chapter 10 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Scale-hacked rigs</b><p>Blender rigs with 0.01 scale or cm units import 100× off; armatures offset from origin wobble. Clean rig, meters, origin at feet — before export.</p></div>
    <div class="callout pit"><b>⚠ Animations baked with mesh transforms</b><p>A clip animating the mesh node + bones double-transforms. In Blender, animate bones only; keep mesh root static.</p></div>
    <div class="callout pit"><b>⚠ Blending through the wrong rest poses</b><p>Retargeting without the rest fixer: limbs twist 90°. If a remapped character looks like a pretzel — it's rest space, not weights.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ AnimationTree fight club</b><p>Both <code>play()</code> and the tree driving one player = first-frame flicker. One driver per rig; wrap the other's API behind your controller.</p></div>
    <div class="callout pit"><b>⚠ Trigger conditions that never reset</b><p>StateMachine triggers (one-shot bools) left true re-fire on re-entry. Reset them in the transition's code (or use travel()).</p></div>
  </div>
</div>
` },

{ c: 10, t: "Chapter 10 Exercises", html: `
<h2>Exercises — Animation &amp; Retargeting</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 10.1 — Skeleton census</b><p>Script that prints any glb's full bone hierarchy with parent/child counts. Run on: your rig, a Mixamo download, a Rigify export. Compare naming conventions in a table.</p></div>
  <div class="callout ex"><b>✎ Ex 10.2 — Retarget two heroes</b><p>Take one Mixamo animation; retarget onto two different characters via BoneMap. Verify both play without pretzel. Document each bone-mapping correction you made by hand.</p></div>
  <div class="callout ex"><b>✎ Ex 10.3 — Locomotion stack</b><p>Idle/walk/run BlendSpace1D + Air state + one attack, driven by Pumpkin Run's controller. Success bar: no foot sliding on speed ramps, no pop on jump land.</p></div>
  <div class="callout ex"><b>✎ Ex 10.4 — Look-at layer</b><p>Head/Spine look-at targeting the camera aim, 60/40 split, clamped to ±70°. Then break it on purpose (target behind head) and fix the clamp.</p></div>
  <div class="callout ex"><b>✎ Ex 10.5 — Death by three ways</b><p>Same character: (1) play death clip, (2) ragdoll via PhysicalBone3D, (3) freeze + fall tween. Compare feel in 5 sentences.</p></div>
</div>
` },

{ c: 10, t: "Chapter 10 Recap", html: `
<h2>Chapter 10 — recap</h2>
<div class="two">
  <div>
    <h3>Animation mastery delivered</h3>
    <ul class="pts">
      <li>Skeleton3D = named transform hierarchy + rest pose.</li>
      <li>Skinning: 4-weight vertex blending on GPU.</li>
      <li>Import: NLA actions, nodes/skins/loops settings.</li>
      <li>Retargeting: BoneMap + SkeletonProfileHumanoid, rest fixer.</li>
      <li>Track types; method-call gameplay hooks.</li>
      <li>AnimationTree: StateMachine + BlendSpace1D/2D + sync.</li>
      <li>Root motion, bone sockets, procedural look-at, foot IK.</li>
      <li>Net-aware minimal-state animation.</li>
    </ul>
  </div>
  <div>
    <h3>Design instincts</h3>
    <ul class="pts">
      <li>Discrete modes → state machine; continuous variation → blend spaces.</li>
      <li>Animation is timing truth — hang gameplay on method tracks.</li>
      <li>Retarget early, share libraries forever.</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Chapter 11 Flying Buddha</b> — a deceptively simple memory game engineered around pure signal architecture and procedural grid layout.</p></div>
  </div>
</div>
` }

);
