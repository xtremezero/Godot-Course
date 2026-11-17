/* Chapter 05 — Pumpkin Run (30 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 5, t: "Chapter 05 — Pumpkin Run", cover: true, html: `
<div class="cov-part">Part II · Beginner &amp; Intermediate Tutorials</div>
<div class="cov-n">05</div>
<h1>Pumpkin Run</h1>
<p class="cov-sub">A third-person 3D collect-a-thon. Block out the level with CSG and GridMap, light it three ways, script a responsive CharacterBody3D player, animate props, and wire spatial audio — your first complete game.</p>
<div class="chips">
  <span class="tag">CSG blockout</span><span class="tag">GridMap + MeshLibrary</span>
  <span class="tag">PBR materials</span><span class="tag">CharacterBody3D</span>
  <span class="tag">LightmapGI</span><span class="tag">AnimationPlayer</span><span class="tag">AudioStreamPlayer3D</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 5, t: "Game Design Document", html: `
<h2>Pumpkin Run — design in one slide</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Genre:</b> third-person collect-a-thon platformer-lite.</li>
      <li><b>Core loop:</b> run &amp; jump through an autumn orchard → collect glowing pumpkin seeds → reach the scarecrow before the timer ends.</li>
      <li><b>Systems:</b> player controller, collectibles + score, hazards (thorn patches), timer, win/lose flow.</li>
      <li><b>Scope guard:</b> one handcrafted level, no combat, no UI beyond HUD text. Each system = one lesson.</li>
    </ul>
  </div>
  <div>
    <div class="flow">
      <div class="fbox"><b>Run &amp; jump</b>CharacterBody3D</div>
      <div class="arr">→</div>
      <div class="fbox"><b>Collect</b>Area3D + signals</div>
      <div class="arr">→</div>
      <div class="fbox"><b>Score &amp; timer</b>HUD + autoload</div>
      <div class="arr">→</div>
      <div class="fbox acc"><b>Win / retry</b>scene flow</div>
    </div>
    <h3>Scene architecture</h3>
    <div class="tree"><span class="b">Main</span> <span class="g">main.tscn</span>
<span class="m">├──</span><span class="y">@level.tscn</span> <span class="m">CSG + GridMap + lights</span>
<span class="m">├──</span><span class="y">@player.tscn</span>
<span class="m">├──</span><span class="y">@seed.tscn</span> <span class="m">× N instances</span>
<span class="m">├──</span><span class="y">@hazards.tscn</span>
<span class="m">└──</span><span class="b">CanvasLayer</span> <span class="g">HUD</span> <span class="m">(+ GameEvents autoload)</span></div>
  </div>
</div>
` },

{ c: 5, t: "Blockout: Plan Before Geometry", html: `
<h2>Blockout discipline</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Scale first:</b> player capsule = 1.8 m tall. Doorways 2.2 m, jumps reach ~1.2 m at our gravity. Blockout with the player present from minute one.</li>
      <li><b>Walk the path:</b> lay the golden path with floor pieces, then dress with walls/props. Gameplay space before decoration.</li>
      <li><b>Two tools this chapter:</b> <b>CSG</b> for organic one-off shapes (mounds, ramps, carve-outs) and <b>GridMap</b> for repeating snapped modules (fences, hedges, walls).</li>
      <li>Gray-box materials until movement feels right — visual polish comes after.</li>
    </ul>
  </div>
  <div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Test the blockout <em>with the controller</em> (next slides). Level design is a feel problem; you cannot judge jumps from the editor camera.</p></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Building art for three weeks, then discovering the level doesn't play. Blockout + controller is a <b>day-one deliverable</b>, not a milestone.</p></div>
    <div class="callout note"><b>ℹ Note</b><p>Export the blockout to glTF (Scene → Export) to preview in Blender — great for art-direction handoff while keeping the gameplay copy authoritative.</p></div>
  </div>
</div>
` },

{ c: 5, t: "CSG: Constructive Solid Geometry", html: `
<h2>CSG — modeling inside the editor</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>CSG nodes combine primitives with boolean <b>operations</b>: Union, Intersection, Subtraction.</li>
      <li><b>CSGCombiner3D</b> parents merge children into one mesh — the blockout's organizational spine.</li>
      <li>Per-node options: <code>operation</code> (Union/Subtract/Intersect) and — the one that matters for levels — <b>use_collision</b> (auto StaticBody3D!).</li>
      <li>Great for: ramps, carved archways, merged mounds, quick prototypes of anything.</li>
      <li>Materials assign per CSG node — flat colors during blockout.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">CSGCombiner3D</span> <span class="g">MoundA</span> <span class="m">(use_collision)</span>
<span class="m">├──</span><span class="b">CSGBox3D</span> <span class="g">Base</span> <span class="m">(union)</span>
<span class="m">├──</span><span class="b">CSGCylinder3D</span> <span class="g">Ramp</span> <span class="m">(union, rotated)</span>
<span class="m">└──</span><span class="b">CSGSphere3D</span> <span class="g">Burrow</span> <span class="m">(subtraction!)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↓ carves a cave</span>

<span class="m">Workflow:</span>
<span class="m">1. Add CSG box → enable use_collision</span>
<span class="m">2. Duplicate, set operation=subtract</span>
<span class="m">3. Overlap → hole appears instantly</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>CSG re-tessellates on edit — fine for design, <b>never ship 200 live CSG nodes</b>. Final levels convert to meshes (right-click → Convert to MeshInstance… or export/import via glTF).</p></div>
  </div>
</div>
` },

{ c: 5, t: "GridMap & MeshLibrary", html: `
<h2>GridMap — snapped modular level kits</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>GridMap</b> paints 3D tiles on a grid; tiles come from a <b>MeshLibrary</b> resource (list of "items": mesh + collision + material).</li>
      <li>Build a library: model modules (fence, hedge, wall 2m) in one scene → <b>Scene → Convert To → MeshLibrary…</b></li>
      <li>In the GridMap: pick item → click to place, <span class="kbd">MMB</span> erase, <span class="kbd">R</span> rotate; settings: <code>cell_size</code> (e.g. 2×2×2), <code>cell_depth/orthogonal_y</code> for non-cubic kits.</li>
      <li>Collisions come along automatically if library scenes had collision shapes.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Modules scene</b>fence.tscn, hedge.tscn, wall.tscn (2m grid)</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Convert To → MeshLibrary</b>library.res</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>GridMap.paint</b>cell_size (2,2,2)</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Fast level kits</b>snapped, collision-ready, data-driven</div>
    </div>
    <div class="callout perf"><b>⚡ Performance</b><p>GridMap stores only cell IDs — a 5,000-cell level is tiny data; internally it batches like MultiMesh. Prefer it over thousands of instanced scenes for repetitive kit-bashing.</p></div>
  </div>
</div>
` },

{ c: 5, t: "GridMap in Practice", html: `
<h2>GridMap workflow, concretely</h2>
<div class="twoR">
  <div>
    <ol class="steps">
      <li>Model 4 hedge/fence modules in Blender (each fitting a 2×2×2 cell, pivot at cell center/bottom).</li>
      <li>One scene per module (with CollisionShape3D), collect in <code>kit.tscn</code>.</li>
      <li><b>Scene ▸ Convert To ▸ MeshLibrary</b> → save <code>orchard_kit.meshlib</code>.</li>
      <li>Add <code>GridMap</code> to the level; assign MeshLibrary; set <code>cell_size = (2, 2, 2)</code>; enable <b>Settings → Physics</b> for collisions.</li>
      <li>Paint the orchard border; <span class="kbd">Shift+MMB</span>-drag paints fill volumes.</li>
    </ol>
  </div>
  <div>
<pre data-file="grid_map_api.gd" data-lang="gdscript"><code># Reading/authoring GridMaps from code
extends GridMap

func _ready() -> void:
	# cell_item index = MeshLibrary item id
	var item := mesh_library.find_item_by_name("hedge")

	# Paint a 10x1 hedge row programmatically:
	for x in 10:
		set_cell_item(Vector3i(x - 5, 0, 8), item)

func count_hedges() -> int:
	return get_used_cells_with_item(
		mesh_library.find_item_by_name("hedge")).size()</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Keep module pivots consistent (cell center, base at y=0). Mixed pivots make painting a nightmare — consistency beats cleverness in kits.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Player Scene Assembly", html: `
<h2>The player scene — assembly before code</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>CharacterBody3D</code> root — a physics body <b>you</b> move (script sets <code>velocity</code>, call <code>move_and_slide()</code>).</li>
      <li><code>CollisionShape3D</code> → <b>CapsuleShape3D</b> (radius 0.4, height 1.8), centered so feet = origin.</li>
      <li><code>MeshInstance3D</code> → pumpkin (capsule + sphere hat, or your first GLB!).</li>
      <li><b>Camera rig:</b> <code>Node3D "CameraPivot"</code> (at chest height) → <code>Camera3D</code> offset back/up, rotated to look down ~15°.</li>
      <li><code>AnimationPlayer</code> + <code>AudioStreamPlayer3D</code> — slots for later slides.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">CharacterBody3D</span> <span class="g">Player</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(capsule 0.4 × 1.8)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="g">PumpkinBody</span>
<span class="m">├──</span><span class="b">Node3D</span> <span class="g">CameraPivot</span> <span class="m">(y=1.4)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">Camera3D</span> <span class="m">(z=+4, y=+1 → rotated)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; current=true</span>
<span class="m">├──</span><span class="b">AnimationPlayer</span>
<span class="m">└──</span><span class="b">AudioStreamPlayer3D</span> <span class="g">JumpSfx</span>
<span class="m">player.gd  ← next slides</span></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Collision shape origin vs visual feet: leave the capsule's bottom exactly at y=0 and <b>offset the shape up by half-height</b>. A centered capsule makes the player hover or sink by design accident.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Input Actions", html: `
<h2>Input Map — the contract with the player</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Project Settings → Input Map. Create: <code>move_left/right/forward/back</code>, <code>jump</code> — keyboard + gamepad events each.</li>
      <li><b>Deadzone 0.2–0.5</b> for sticks; keyboard events ignore it.</li>
      <li>Physical keycodes (<code>physical_keycode</code>) survive AZERTY/QWERTZ layouts — always prefer physical.</li>
      <li>Code talks <b>only</b> to actions — remapping becomes data, not refactoring.</li>
    </ul>
  </div>
  <div>
<pre data-file="input_demo.gd" data-lang="gdscript"><code># Reading the map — all the verbs you need:
extends Node

func _physics_process(_d: float) -> void:
	# Analog 2D vector, deadzone-applied, normalized:
	var dir := Input.get_vector(
		"move_left", "move_right",
		"move_forward", "move_back")
	# dir.y is the "forward/back" axis.

	# Discrete states:
	if Input.is_action_just_pressed("jump"):
		print("jump pressed this tick")
	if Input.is_action_pressed("move_left"):
		print("held")

	# Strength (analog triggers):
	var walk_amount := Input.get_action_strength("move_forward")</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p><code>Input.get_vector</code> is normalized &amp; deadzone-aware — never hand-roll <code>(right - left, ...)</code> math. It also handles diagonal over-speed for free.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Player Controller I: Movement", html: `
<h2>CharacterBody3D — the movement core</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>The 4.x contract: mutate <code>velocity</code>, then <code>move_and_slide()</code>. It handles floors, slopes, walls, stairs (via <code>floor_snap_length</code>).</li>
      <li><b>Camera-relative:</b> transform input by the camera's basis so "forward" follows the view.</li>
      <li>Separate <b>horizontal</b> control (accel toward target) from <b>vertical</b> (gravity + jumps).</li>
      <li><code>motion_mode</code>: Grounded vs Floating (swimming/flying — Ch 8 reuses Floating).</li>
    </ul>
  </div>
  <div>
<pre data-file="player.gd" data-lang="gdscript"><code>class_name Player
extends CharacterBody3D

const SPEED := 6.0
const ACCEL := 30.0        # ground accel (m/s²)
const AIR_ACCEL := 8.0
const JUMP_VELOCITY := 5.2 # ~1.4 m jump at 9.8 gravity

@onready var cam_pivot: Node3D = $CameraPivot

var _gravity: float = ProjectSettings.get_setting(
	"physics/3d/default_gravity")

func _physics_process(delta: float) -> void:
	# 1) gravity — always integrate vertical
	if not is_on_floor():
		velocity.y -= _gravity * delta

	# 2) camera-relative input direction
	var input2d := Input.get_vector(
		"move_left", "move_right",
		"move_forward", "move_back")
	# pivot faces where camera looks (yaw only)
	var fwd := -cam_pivot.global_transform.basis.z
	var right := cam_pivot.global_transform.basis.x
	var wish := (fwd * -input2d.y + right * input2d.x)
	wish.y = 0.0
	wish = wish.normalized()

	# 3) accelerate horizontal velocity toward wish
	var accel := ACCEL if is_on_floor() else AIR_ACCEL
	var target := wish * SPEED
	velocity.x = move_toward(velocity.x, target.x, accel * delta)
	velocity.z = move_toward(velocity.z, target.z, accel * delta)

	# 4) move!
	move_and_slide()</code></pre>
  </div>
</div>
` },

{ c: 5, t: "Player Controller II: Feel", html: `
<h2>Game feel: jump buffering &amp; coyote time</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Coyote time:</b> allow jumps ~0.12 s after leaving a ledge — forgiving platforming.</li>
      <li><b>Jump buffering:</b> remember a jump press ~0.12 s <em>before</em> landing — responsive platforming.</li>
      <li>Both are timers + booleans. Both convert "the game ate my input" into "I meant to do that".</li>
      <li>Extra juice on the pile: squash-stretch scale on jump/land, tilt into velocity, footsteps by <code>get_last_slide_collision</code>.</li>
    </ul>
  </div>
  <div>
<pre data-file="player_jump.gd" data-lang="gdscript"><code># Add to player.gd
const COYOTE := 0.12
const BUFFER := 0.12

var _air_time := 0.0
var _jump_buffer := 0.0

func _physics_process(delta: float) -> void:
	_air_time = 0.0 if is_on_floor() else _air_time + delta
	_jump_buffer = maxf(_jump_buffer - delta, 0.0)

	if Input.is_action_just_pressed("jump"):
		_jump_buffer = BUFFER

	var can_jump := is_on_floor() or _air_time &lt; COYOTE
	if _jump_buffer &gt; 0.0 and can_jump:
		velocity.y = JUMP_VELOCITY
		_jump_buffer = 0.0
		_air_time = COYOTE # consume coyote
		$JumpSfx.play()

	# Variable height: release early → cut upward speed
	if Input.is_action_just_released("jump") \
			and velocity.y &gt; 0.0:
		velocity.y *= 0.5</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Feel parameters (coyote, buffer, accel) belong in <code>@export</code> so you can tune while playing via the Inspector — then bake winning values as defaults.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Camera Follow", html: `
<h2>Camera — smooth follow, no jitter</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Why jitter happens:</b> physics (player) and rendering (camera) run at different rates. Fix: move the camera in <code>_physics_process</code> too — or enable <b>physics interpolation</b> (4.4) and move freely in <code>_process</code>.</li>
      <li><b>Simplest good camera:</b> camera pivot lerps toward a target position above the player; camera itself never rotates except yaw you control.</li>
      <li>Frame-rate independent smoothing: <code>a.lerp(b, 1.0 - exp(-k * delta))</code> — exponential decay, correct at any Hz.</li>
      <li>Optional mouse-orbit: rotate pivot with <code>InputEventMouseMotion</code> while capturing the mouse.</li>
    </ul>
  </div>
  <div>
<pre data-file="camera_follow.gd" data-lang="gdscript"><code>extends Node3D  # CameraPivot

@export var follow_speed := 8.0   # higher = tighter
@export var height := 2.0
@export var distance := 5.0

@onready var player: Node3D = %Player

func _physics_process(delta: float) -> void:
	# Aim point drifts ahead of the player:
	var look = player.global_position \
		+ player.velocity * 0.25
	look.y += height

	# Exponential smoothing (Hz-independent):
	var k := 1.0 - exp(-follow_speed * delta)
	global_position = global_position.lerp(look, k)

func _unhandled_input(event: InputEvent) -> void:
	# Mouse orbit (optional):
	if event is InputEventMouseMotion \
			and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * 0.003)</code></pre>
  </div>
</div>
` },

{ c: 5, t: "Collectibles", html: `
<h2>Collectibles — Area3D + signals</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>Area3D</code> = sensor region (no physics response, just detection). Perfect for pickups, triggers, hazards.</li>
      <li>Add <code>CollisionShape3D</code> (sphere 0.5) + a glowing mesh (emission!) + <code>AudioStreamPlayer3D</code> for the pickup pling.</li>
      <li>Collision <b>masks</b> only (areas detect; they don't need a layer here): mask = player layer.</li>
      <li>Seed emits <code>collected</code>; HUD listens; seed <code>queue_free()</code>s itself with a little scale-out tween.</li>
    </ul>
  </div>
  <div>
<pre data-file="seed.gd" data-lang="gdscript"><code>class_name Seed
extends Area3D

signal collected(points: int)

@export var points := 10
@onready var mesh: MeshInstance3D = $Mesh

func _ready() -> void:
	# Idle bob &amp; spin — visual telegraphing.
	var tw := create_tween().set_loops()
	tw.tween_property(mesh, "position:y", 0.25, 0.8)\
		.as_relative().set_trans(Tween.TRANS_SINE)
	tw.tween_property(mesh, "position:y", -0.25, 0.8)\
		.as_relative().set_trans(Tween.TRANS_SINE)

func _on_body_entered(body: Node3D) -> void:
	if not body is Player:
		return
	collected.emit(points)
	$PickupSfx.play()
	# Shrink-pop, then free after sound finishes:
	var tw := create_tween()
	tw.tween_property(self, "scale", Vector3.ZERO, 0.15)
	tw.tween_callback(queue_free)</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Area signals fire for <b>every matching body</b> — always type-check inside the handler (as above). A stray RigidBody ball shouldn't feed the score.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Score, Timer & HUD", html: `
<h2>Game state &amp; HUD — the event bus pattern</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Autoload</b> <code>GameEvents</b> (Project Settings → Autoload): the global signal hub. Scene A shouts, scene B reacts — zero coupling.</li>
      <li>HUD subscribes in <code>_ready</code>, unsubscribs automatically when freed.</li>
      <li>Timer = <code>Timer</code> node, <code>timeout</code> → <code>game_over</code>; win check when <code>seeds_collected == total</code>.</li>
      <li><code>CanvasLayer</code> keeps UI glued to the screen regardless of 3D camera motion.</li>
    </ul>
  </div>
  <div>
<pre data-file="game_events.gd" data-lang="gdscript"><code># Autoload singleton: res://autoload/game_events.gd
extends Node

signal score_changed(total: int)
signal seed_collected(points: int)
signal game_over(won: bool)

var score := 0 : set = _set_score

func add_score(points: int) -> void:
	score += points
	seed_collected.emit(points)

func _set_score(v: int) -> void:
	score = v
	score_changed.emit(score)</code></pre>
<pre data-file="hud.gd" data-lang="gdscript"><code>extends CanvasLayer

func _ready() -> void:
	GameEvents.score_changed.connect(
		func(t): %Score.text = "Score %d" % t)
	GameEvents.game_over.connect(_on_over)

func _on_over(won: bool) -> void:
	%Result.text = "SAVED!" if won else "NIGHT FELL…"
	%Result.show()
	await get_tree().create_timer(2.0).timeout
	get_tree().reload_current_scene()</code></pre>
  </div>
</div>
` },

{ c: 5, t: "Lighting I: The Three Lights", html: `
<h2>Godot's light nodes</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Node</th><th>Shape</th><th>Cheapest usage</th><th>Pumpkin Run role</th></tr>
  <tr><td><code>DirectionalLight3D</code></td><td>infinite parallel rays</td><td>exactly one sun/moon</td><td>autumn sun, shadows for the whole orchard</td></tr>
  <tr><td><code>OmniLight3D</code></td><td>point, all directions</td><td>lamps, fires, pickups glow</td><td>lanterns by the gate, seed sparkle</td></tr>
  <tr><td><code>SpotLight3D</code></td><td>cone</td><td>flashlights, stage</td><td>scarecrow spotlight (drama!)</td></tr>
</table></div>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Energy</b> = intensity (can exceed 1 with HDR); <b>color</b> sells time of day (warm 4000K sunsets vs cool shade fill).</li>
      <li><b>Light baking axis:</b> DirectionalLight3D rotation = sun angle; keep ~30–60° elevation for readable shadows.</li>
      <li>Shadows: Directional = one shadow map set (split); Omni = cube (6 passes!) — budget omni shadows ruthlessly.</li>
    </ul>
  </div>
  <div>
<pre data-file="lantern.gd" data-lang="gdscript"><code># Flickering lantern — 90% of "alive" lighting
extends OmniLight3D

@export var base_energy := 1.6
@export var flicker_amount := 0.25
@export var speed := 11.0

func _process(delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0
	# Layered sines = organic, non-repeating flicker:
	energy = base_energy \
		+ flicker_amount * sin(t * speed) \
		+ 0.5 * flicker_amount * sin(t * speed * 2.7)</code></pre>
  </div>
</div>
` },

{ c: 5, t: "Lighting II: Shadows & Quality", html: `
<h2>Shadow tuning that doesn't tank frames</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>DirectionalLight3D</b> → Shadow: <code>blend_splits</code> (soft distance), <code>max_distance</code> (cull far shadows), 2 or 4 splits; <b>PSSM</b> distributes resolution near→far.</li>
      <li><b>Omni/Spot:</b> <code>shadow_bias</code> up to kill acne; <code>normal_bias</code> first line of defense.</li>
      <li>Project Settings → Rendering → Quality → <b>Shadow Atlas</b> size: 4096 desktop default; 2048 for mobile-ish budgets.</li>
      <li><b>Overdraw is the enemy:</b> shadow-casting lights multiply scene draw cost. Lock: only hero lights cast shadows.</li>
      <li>Debug live: viewport menu → <b>Display Advanced → Shadow Atlas</b>.</li>
    </ul>
  </div>
  <div>
    <div class="callout perf"><b>⚡ Performance</b><p>Each shadow-casting light re-renders casters. 1 sun + 3 shadowed lanterns ≈ fine; 30 shadowed lanterns = death. Non-shadowed fill lights are nearly free (Forward+ clusters them).</p></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Start bias defaults → raise <code>normal_bias</code> slightly until acne stops; raise <code>bias</code> only if peter-panning (shadows detaching) is acceptable. Never max both blindly.</p></div>
    <div class="callout note"><b>ℹ Note</b><p>Mobile renderer: shadows are more expensive; prefer baked (next slides) + one real-time sun. Compatibility supports them too but budget harder.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Lighting III: Ambient & Sky", html: `
<h2>Ambient light &amp; the sky's contribution</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Sky</b> (ProceduralSkyMaterial or PanoramaSkyMaterial) isn't just a backdrop: with <b>Source → Sky</b> ambient mode, the sky <em>irradiates the scene</em> — blue skies tint shadows blue. Physical and free.</li>
      <li>Ambient settings: <b>Source</b> (Background color / Sky / disabled), <b>Energy</b>, <b>Sky Contribution</b>.</li>
      <li><b>ProceduralSkyMaterial</b>: sun angle, sky/ground horizon colors — an entire art-directed sunset from 6 sliders.</li>
      <li><b>Reflections:</b> the sky also feeds specular ambient — PBR metals look right at no cost.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">WorldEnvironment</span>
<span class="m">└─ </span><span class="b">Environment</span>
<span class="m">&nbsp;&nbsp;&nbsp;background_mode = </span><span class="y">Sky</span>
<span class="m">&nbsp;&nbsp;&nbsp;└─ </span><span class="b">Sky</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sky_material = </span><span class="b">ProceduralSkyMaterial</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;· sky_top_color   # deep blue</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;· horizon_color   # peach</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;· ground_bottom_color # soil</span>
<span class="m">&nbsp;&nbsp;&nbsp;ambient_light_source = </span><span class="y">Sky</span>
<span class="m">&nbsp;&nbsp;&nbsp;ambient_light_energy = 1.2</span>
<span class="m">&nbsp;&nbsp;&nbsp;tonemap_mode = ACES  (later slide)</span></div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Sky irradiance is captured into a small cubemap radiance texture; rougher materials read blurred mips of it. That's why a sky "just works" as ambient &amp; reflections.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Lighting IV: LightmapGI Baking", html: `
<h2>LightmapGI — baked global illumination</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>GI = bounced light.</b> Baking precomputes it offline into lightmap textures — runtime cost ~one texture fetch. Static scenes' best friend.</li>
      <li>Recipe: meshes need <b>UV2</b> (glTF import "Lightmap UV2" or <code>UV Unwrap</code> on primitives via <code>Mesh → Lightmap Unwrap</code>) → add <code>LightmapGI</code> → <b>Bake Lightmaps</b>.</li>
      <li>Output: <code>LightmapGIData</code> resource — per-texel direct+indirect light in UV2 space; dynamic objects sample it via light probes automatically.</li>
      <li>Baking captures <em>static</em> light. Moving lanterns stay realtime on top (hybrid lighting).</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Static geometry</b>+ UV2 unwrap</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>LightmapGI.bake</b>offline raytraced (SDFGI-based baker)</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>.lmbake textures</b>direct+indirect, per-object</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Runtime</b>nearly free; probes light movers</div>
    </div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Bake once per lighting change — the .lmbake data commits to version control like any asset. CI tip: bakes belong on an artist machine, not the build server.</p></div>
  </div>
</div>
` },

{ c: 5, t: "GI Strategy Comparison", html: `
<h2>Choosing your GI strategy</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Method</th><th>Runtime cost</th><th>Dynamic lights</th><th>Dynamic geometry</th><th>Use when</th></tr>
  <tr><td>None (ambient)</td><td>zero</td><td>n/a</td><td>n/a</td><td>stylized flat looks</td></tr>
  <tr><td><b>LightmapGI</b> (baked)</td><td>~free</td><td>only realtime extras</td><td>no (probes only)</td><td>static levels (Pumpkin Run!)</td></tr>
  <tr><td><b>VoxelGI</b></td><td>medium-high</td><td>yes (within voxel volume)</td><td>yes</td><td>medium dynamic scenes</td></tr>
  <tr><td><b>SDFGI</b> (Forward+)</td><td>medium</td><td>yes</td><td>static framing, dynamic light</td><td>open-world realism</td></tr>
  <tr><td>ReflectionProbe tricks</td><td>low</td><td>no</td><td>partial</td><td>one-room gloss fixes</td></tr>
</table></div>
<div class="two">
  <div class="callout note"><b>ℹ Note</b><p>Pumpkin Run ships <b>LightmapGI</b> for the orchard + 3 realtime lanterns. Chapters 8 &amp; 13 exercise VoxelGI/SDFGI in depth.</p></div>
  <div class="callout ver"><b>◷ Version Note</b><p>Mobile &amp; Compatibility renderers: no SDFGI; LightmapGI is your GI workhorse there. Forward+ has the full menu (Ch 13 matrix).</p></div>
</div>
` },

{ c: 5, t: "Environment & Post-Processing", html: `
<h2>Environment — the grading suite</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Tone mapping</b> converts HDR light → screen. <b>ACES</b> or <b>Filmic</b> for filmic falloff; Linear looks harsh.</li>
      <li><b>Glow</b>: HDR energy &gt; threshold blooms. Modes: additive (soft) vs replace (screen). Emissive seeds + glow = instant readability.</li>
      <li><b>SSAO</b> (Forward+/Mobile): contact shadows in crevices — groundedness for the whole level.</li>
      <li><b>SSR / adjustments / Vignette / Film grain</b>: the seasoning rack; one at a time, taste as you go.</li>
      <li><b>Camera attributes</b>: exposure (auto/manual), DOF near/far — Ch 8 goes deep.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">Environment checklist (Pumpkin Run)</span>
<span class="y">tonemap_mode</span> <span class="m">= ACES</span>
<span class="y">tonemap_exposure</span> <span class="m">= 1.0</span>
<span class="y">glow_enabled</span> <span class="m">= true</span>
<span class="m">· intensity 0.8, strength 1.0</span>
<span class="m">· hdr_threshold 1.0</span>
<span class="m">· bloom/fade to taste</span>
<span class="y">ssao_enabled</span> <span class="m">= true</span>
<span class="y">adjustment_enabled</span> <span class="m">= true</span>
<span class="m">· slight warm saturation boost</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Do lighting → then tone mapping → then one effect at a time. Grading a broken light scene just bakes the breakage in.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Level Materials: PBR in Action", html: `
<h2>Dressing the orchard — materials that sell scale</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Ground:</b> one soil material — texture with subtle noise + <b>UV1 triplanar</b> (no stretching on CSG!), roughness 0.95.</li>
      <li><b>Hedges (GridMap):</b> shared leaf material, normal map for depth, <b>detail albedo</b> for close-up richness.</li>
      <li><b>Fences:</b> wood — roughness 0.8, slight metallic 0; grain normal map.</li>
      <li><b>Hero prop (scarecrow):</b> full ORM set from Ch 3's workflow — the one asset that gets budget textures.</li>
      <li>Consistent sun + consistent materials = coherent world; more powerful than any single fancy shader.</li>
    </ul>
  </div>
  <div>
<pre data-file="soil_material.gd" data-lang="gdscript"><code># Authoring a triplanar material in code (usually
# you'd do this in the Inspector — shown to teach):
var soil := StandardMaterial3D.new()
soil.albedo_texture = load("res://assets/tex/soil.png")
soil.roughness = 0.95
soil.uv1_triplanar = true          # world-space XZ/Y projection
soil.uv1_scale = Vector3(4, 4, 4)  # meters per tile
soil.detail_enabled = true
soil.detail_albedo = load("res://assets/tex/soil_detail.png")
soil.detail_albedo_scale = 0.125

# Assign to every floor CSG at once:
for node in get_tree().get_nodes_in_group("ground"):
	node.material = soil  # shared = cheap</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>Triplanar tripsles texture fetches — fine for floors, wasteful on thousand-instance kits. Keep it for hero surfaces.</p></div>
  </div>
</div>
` },

{ c: 5, t: "AnimationPlayer I: Concepts", html: `
<h2>AnimationPlayer — everything animatable</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>One node animates <b>any property of any node</b> it can reach: transforms, materials, lights, even <code>method calls</code> and audio tracks.</li>
      <li><b>Animation resource</b> = named clip (e.g. <code>idle</code>, <code>open</code>) containing <b>tracks</b>; a track = target property + keyframes + interpolation.</li>
      <li>Track types: Property · Method Call · Bezier (curve editing) · Audio · Animation (nesting).</li>
      <li>Key anything via the Inspector's <b>key icon</b> while the animation track is armed.</li>
      <li>Playback API: <code>play("clip")</code>, <code>queue()</code>, <code>pause()</code>, <code>stop()</code>, signals <code>animation_finished</code>.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">AnimationPlayer</span>
<span class="m">└─ </span><span class="g">gate_open</span> <span class="m">(clip)</span>
<span class="m">&nbsp;&nbsp;&nbsp;├─ track: Gate:position</span>
<span class="m">&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp; 0.0s → (0,0,0)   [ease-out]</span>
<span class="m">&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp; 1.0s → (0,3,0)</span>
<span class="m">&nbsp;&nbsp;&nbsp;├─ track: GateLight:energy</span>
<span class="m">&nbsp;&nbsp;&nbsp;└─ track: Gate:queue_redraw</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (method call @ keyframe)</span>

<span class="m">Timeline: 0 ───────▶ 1.0s   len=1</span></div>
    <div class="callout note"><b>ℹ Note</b><p>Non-linear keyframe interpolation per key: Linear, Ease (in/out/in-out…), Step (discrete), plus a Wrap mode (loop/ping-pong) per clip.</p></div>
  </div>
</div>
` },

{ c: 5, t: "AnimationPlayer II: Authoring & Playing", html: `
<h2>Animating the orchard gate &amp; scarecrow</h2>
<div class="twoR">
  <div>
    <ol class="steps">
      <li>Select AnimationPlayer → Animation → <b>New</b> → name <code>gate_open</code>.</li>
      <li>Select Gate node; in Inspector, key <code>position</code> (key icon) at t=0. Move playhead to 1.0 s, change position, key again. A track is born.</li>
      <li>Refine: select keys in the track → right-click → transition curves; or use the <b>Bezier</b> editor for energy/light tracks.</li>
      <li>Repeat for the scarecrow: <code>idle</code> (gentle sway loop), <code>cheer</code> (win pose).</li>
      <li>Enable <b>Autoplay on Load</b> on idle.</li>
    </ol>
  </div>
  <div>
<pre data-file="gate.gd" data-lang="gdscript"><code>extends Node3D

@onready var anim: AnimationPlayer = $AnimationPlayer

func _ready() -> void:
	GameEvents.game_over.connect(_on_game_over)

func _on_game_over(won: bool) -> void:
	if won:
		# queue() chains after the current clip:
		anim.queue("gate_open")
		anim.queue("scarecrow_cheer")

	# React to clip completion:
	anim.animation_finished.connect(
		func(name): print("%s done" % name))</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Name clips with verbs (<code>open</code>, <code>cheer</code>, <code>hit</code>). Code that says <code>anim.play("open")</code> reads like intent; <code>anim.play("Anim_03_final")</code> reads like regret.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Audio Architecture", html: `
<h2>Audio in Godot — buses &amp; players</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>AudioServer</b> mixes <b>buses</b> (Master → Music, SFX, Ambience). Effects (Reverb, LowPass, Compressor) attach per bus — mix like a DAW.</li>
      <li>Players: <code>AudioStreamPlayer</code> (non-positional: UI/music), <code>AudioStreamPlayer3D</code> (positional), <code>AudioStreamPlayer2D</code>.</li>
      <li>Buses live in the bottom <b>Audio panel</b>; bus layout is a project resource.</li>
      <li>Volume = dB (negative attenuation); <code>volume_db</code> on players and buses.</li>
      <li>Route: player → <code>bus = "SFX"</code>. One bus reverb shared by 50 sounds = one DSP, not 50.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">Master</span> <span class="m">(limiter)</span>
<span class="m">├──</span> <span class="g">Music</span> <span class="m">(stream player)</span>
<span class="m">└──</span> <span class="g">SFX</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;├──</span> <span class="g">Ambience</span> <span class="m">(+ wind loop)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;└──</span> <span class="g">Footsteps</span>

<span class="m">AudioStreamPlayer3D props:</span>
<span class="y">stream · bus · volume_db</span>
<span class="y">unit_size · max_db</span>
<span class="y">attenuation_model</span>
<span class="y">max_distance · doppler</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Build the bus graph on day one (Master/Music/SFX/Ambience + master limiter). Retrofiting audio architecture across a project is a weekend you don't get back.</p></div>
  </div>
</div>
` },

{ c: 5, t: "AudioStreamPlayer3D", html: `
<h2>Spatial audio — sound with a position</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>AudioStreamPlayer3D</code> pans &amp; attenuates by listener distance/angle (needs a <b>current Camera3D</b> as listener).</li>
      <li><b>Attenuation models:</b> Inverse (natural), Linear, Disabled… tune <code>unit_size</code> (bigger = audible farther) &amp; <code>max_db</code> cap.</li>
      <li><b>Doppler tracking</b> on by default option — pass-by whoosh for free.</li>
      <li><code>max_polyphony</code> lets one node layer N overlapping plays — footstep spam solved.</li>
      <li>Music: plain <code>AudioStreamPlayer</code> (no position), on the Music bus.</li>
    </ul>
  </div>
  <div>
<pre data-file="sfx.gd" data-lang="gdscript"><code># Seed pickup: crisp positional blip
extends AudioStreamPlayer3D

func _ready() -> void:
	bus = "SFX"
	unit_size = 6.0        # audible ~10 m
	max_db = -3.0
	pitch_scale = randf_range(0.95, 1.05)  # avoid repetition

# Footsteps on the player (polyphonic):
extends AudioStreamPlayer3D

func step() -> void:
	max_polyphony = 4
	pitch_scale = randf_range(0.9, 1.1)
	play()

# _physics_process: every ~0.35 m of ground travel → step()</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>Positional voices cost CPU per active voice; <code>max_polyphony</code> and modest <code>max_distance</code> keep the mixer cool. Chapter 13 covers <code>AudioServer</code> voice budgeting.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Ambience & Music Layers", html: `
<h2>One ambience scene, three loops</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Wind bed:</b> non-positional, Music-adjacent <code>Ambience</code> bus, -12 dB — constant world texture.</li>
      <li><b>Crow/wind gusts:</b> positional players scattered in the level on timers — space feels populated.</li>
      <li><b>Music:</b> two stems — calm loop + win sting. Duck music −4 dB under game over via a tween on <code>volume_db</code>.</li>
      <li>Volume sweeps with tweens, not snaps: <code>tween_property(player, "volume_db", -18.0, 1.5)</code>.</li>
    </ul>
  </div>
  <div>
<pre data-file="ambience.gd" data-lang="gdscript"><code>extends Node3D  # ambient_emitters.tscn root

@export var gust_sfx: AudioStream
@export var crow_sfx: AudioStream

var _players: Array[AudioStreamPlayer3D] = []

func _ready() -> void:
	for i in 6:  # scatter 6 emitters on the map
		var p := AudioStreamPlayer3D.new()
		p.stream = [gust_sfx, crow_sfx].pick_random()
		p.bus = "Ambience"
		p.unit_size = 20.0   # far-reaching
		p.position = Vector3(
			randf_range(-40, 40), randf_range(3, 8),
			randf_range(-40, 40))
		add_child(p)
		_players.append(p)
	_schedule_gusts()

func _schedule_gusts() -> void:
	await get_tree().create_timer(randf_range(3, 9)).timeout
	_players.pick_random().play()
	_schedule_gusts()   # recursive ambient scheduler</code></pre>
  </div>
</div>
` },

{ c: 5, t: "Juice: Particles & Feedback", html: `
<h2>Feedback loops — the polish pass</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>GPUParticles3D</b> + <code>ParticleProcessMaterial</code>: seed-pickup burst (one_shot), landing dust, goal confetti.</li>
      <li><b>Camera kick:</b> tiny FOV pulse on pickup (<code>fov 75 → 78 → 75</code>, 0.15 s).</li>
      <li><b>Land squash:</b> scale (1.15, 0.8, 1.15) → (1,1,1) tween on landing, driven by <code>is_on_floor()</code> edge-detection.</li>
      <li><b>Hazard telegraph:</b> thorn patch pulses red 0.5 s before it hurts.</li>
      <li>Rule: every player action &amp; every world event gets a <em>visible and audible</em> receipt.</li>
    </ul>
  </div>
  <div>
<pre data-file="pickup_burst.gd" data-lang="gdscript"><code># One-shot burst driven from code
extends GPUParticles3D

func burst() -> void:
	one_shot = true
	emitting = true          # fires once
	await finished           # GPUParticles3D signal
	queue_free()

# Called by Seed on collect:
# var fx := burst_fx_scene.instantiate()
# add_sibling(fx); fx.global_position = global_position
# fx.burst()</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Juice tweens live on <b>separate visual child nodes</b>, never the physics body itself — physics and visuals keep independent scales/rotations.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Win/Lose Flow", html: `
<h2>Game flow — states without a framework</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Three states: <code>PLAYING</code> → <code>WON</code> / <code>LOST</code>. One enum in the autoload beats a state-machine library at this scope.</li>
      <li><b>Win:</b> all seeds collected → reach the gate → <code>game_over.emit(true)</code>.</li>
      <li><b>Lose:</b> timer <code>timeout</code> → <code>game_over.emit(false)</code>.</li>
      <li>On game over: freeze gameplay (<code>get_tree().paused = true</code>, players with <code>process_mode = PROCESS_MODE_ALWAYS</code> keep running), show result, offer retry.</li>
    </ul>
  </div>
  <div>
<pre data-file="game_flow.gd" data-lang="gdscript"><code># In GameEvents autoload
enum State { PLAYING, WON, LOST }
var state := State.PLAYING

func end_game(won: bool) -> void:
	if state != State.PLAYING:
		return  # guard against double-fires
	state = State.WON if won else State.LOST
	get_tree().paused = true
	game_over.emit(won)

func restart() -> void:
	get_tree().paused = false
	state = State.PLAYING
	get_tree().reload_current_scene()</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Pausing stops timers, tweens, AND your "unpause" button's parent if it's not <code>PROCESS_MODE_ALWAYS</code>. Design the pause-immune set deliberately (Ch 8/11 expand this).</p></div>
  </div>
</div>
` },

{ c: 5, t: "Performance Pass", html: `
<h2>Ship-shape: the performance pass</h2>
<div class="two">
  <div>
    <h3>Measured optimizations</h3>
    <ul class="pts">
      <li><b>Profiler first</b> (Debugger → Profiler): find the top functions; fix those only.</li>
      <li>Convert finished CSG → MeshInstances; merge with <code>SurfaceTool</code> or export/import glTF.</li>
      <li>GridMap &gt; instanced scenes for kits (batched internally).</li>
      <li>Shadow-casting lights: sun + ≤3 (per the lighting slides).</li>
      <li><code>visibility_range</code> on distant decorations; bake GI; one shared material per category.</li>
      <li>Seeds: 40 spinning Area3Ds is fine — but they share ONE material &amp; ONE scene.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">$ godot --headless --import &amp;&amp; godot --path .</span>
<span class="dim">Profiler 60s sample:</span>
   process  2.1 ms  <span class="dim">← target &lt; 8 ms @120Hz</span>
   physics  1.4 ms
   draw calls ~180  <span class="dim">(menu: rendering debug)</span>
<span class="err">warning: shadow atlas full → raise or trim shadowed lights</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>Budget by frame time, not FPS: 60 FPS = 16.6 ms total. Log <code>Performance.TIME_PROCESS</code> in a debug overlay (Ch 3) and watch the trend as you add content.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Pumpkin Run Pitfalls", html: `
<h2>Chapter 05 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Sticky walls / flying player</b><p><code>move_and_slide</code> respects <code>wall_min_slide_angle</code>; if you keep horizontal speed on wall contact you'll climb. Zero wish-direction when blocked: rely on <code>velocity</code> zeroing, don't fight it manually.</p></div>
    <div class="callout pit"><b>⚠ Camera inside geometry</b><p>Fixed-offset cameras clip walls. Add a <code>RayCast3D</code> from pivot to camera; pull the camera to the hit point + margin.</p></div>
    <div class="callout pit"><b>⚠ Signals connected twice</b><p>Restart via <code>reload_current_scene</code> recreates nodes — connections made in <code>_ready</code> are fresh each time (good), but autoload→scene connections made manually can duplicate (guard with <code>is_connected</code>).</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Baked lightmaps on moving objects</b><p>LightmapGI static data on a moved mesh = light "swimming". Keep baked receivers static; movers get probe-lit automatically.</p></div>
    <div class="callout pit"><b>⚠ Audio desync after pause</b><p>Paused audio resumes where it left; if that's wrong for your design, stop/capture positions on pause and re-seek on resume.</p></div>
    <div class="callout pit"><b>⚠ queue_free during physics callback</b><p>Freeing nodes inside <code>body_entered</code> can crash in 4.x — prefer <code>queue_free()</code> (deferred by design) over <code>free()</code>, and <code>set_deferred</code> for physics properties.</p></div>
  </div>
</div>
` },

{ c: 5, t: "Chapter 05 Exercises", html: `
<h2>Exercises — Pumpkin Run</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 5.1 — Blockout sprint</b><p>90 minutes: CSG-only level (floor, 3 ramps, 1 carved tunnel, GridMap fence perimeter) + playable controller. No textures allowed. Judge: can you complete a lap blindfolded-memorized?</p></div>
  <div class="callout ex"><b>✎ Ex 5.2 — Feel lab</b><p>Export coyote/buffer/accel/air-accel; blind-tune with a partner forwarding you values. Record which combos read "floaty" vs "tight".</p></div>
  <div class="callout ex"><b>✎ Ex 5.3 — Lighting study</b><p>Same blockout, three skies: noon, golden hour, moonlit. Only DirectionalLight3D + ProceduralSky params + ambient energy. Screenshot triptych.</p></div>
  <div class="callout ex"><b>✎ Ex 5.4 — Bake day</b><p>UV2-unwrap the level, bake LightmapGI, measure FPS delta (debug overlay) before/after. Then break it: move a baked mesh, observe, revert.</p></div>
  <div class="callout ex"><b>✎ Ex 5.5 — Full loop</b><p>Seeds + timer + win gate + retry. Ship a friend a ZIP of the project folder; watch them play without instructions. Take notes. (This IS game development.)</p></div>
</div>
` },

{ c: 5, t: "Chapter 05 Recap", html: `
<h2>Chapter 05 — recap</h2>
<div class="two">
  <div>
    <h3>Systems delivered</h3>
    <ul class="pts">
      <li>CSG blockout + GridMap modular kits (and when to convert away from both).</li>
      <li>CharacterBody3D controller: accel, gravity, coyote/buffer, variable jump.</li>
      <li>Smooth follow camera (physics-rate, exponential smoothing).</li>
      <li>Area3D pickups → event-bus score → HUD → win/lose flow with pause.</li>
      <li>Lighting: sun/omni/spot, shadow budgets, sky ambient, LightmapGI bake, post stack.</li>
      <li>AnimationPlayer clips authored &amp; chained from code.</li>
      <li>Audio buses + positional SFX + layered ambience.</li>
    </ul>
  </div>
  <div>
    <h3>Concepts banked for later</h3>
    <ul class="pts">
      <li>Physics-vs-process tick rates → Ch 8/12 interpolation.</li>
      <li>Event bus → Ch 11's whole architecture.</li>
      <li>GI menu → fully exercised in Ch 13.</li>
      <li>Bake &amp; budgets → production workflow in Ch 14 exports.</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Chapter 06 Tube Cleaner</b>: stop collecting, start defending — runtime instancing, aiming, hitscan vs projectiles, enemy FSMs, and object pooling.</p></div>
  </div>
</div>
` }

);
