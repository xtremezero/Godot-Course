/* Chapter 07 — Pinball (24 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 7, t: "Chapter 07 — Pinball", cover: true, html: `
<div class="cov-part">Part II · Beginner &amp; Intermediate Tutorials</div>
<div class="cov-n">07</div>
<h1>Pinball</h1>
<p class="cov-sub">Pure physics gameplay: a RigidBody3D ball, PhysicsMaterials for bounce, Area3D bumpers with impulses, HingeJoint3D flippers, and a sewer hazard that eats your ball. The chapter where you stop fighting the physics engine and start directing it.</p>
<div class="chips">
  <span class="tag">RigidBody3D</span><span class="tag">PhysicsMaterial</span>
  <span class="tag">Impulses &amp; forces</span><span class="tag">Area3D triggers</span>
  <span class="tag">HingeJoint3D flippers</span><span class="tag">CCD &amp; determinism</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 7, t: "Design & Physics Goals", html: `
<h2>Pinball — what physics must deliver</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Board:</b> a tilted 3D table (gravity does the work), walls, bumpers, two flippers, one drain (the sewer).</li>
      <li><b>Player agency is tiny:</b> 2 flipper inputs + plunger. <em>Everything</em> else is simulation — that's the genre's charm and this chapter's teaching payload.</li>
      <li><b>Design goal:</b> readable chaos — the ball must be fast but predictable enough to skill-play.</li>
      <li><b>Engineering goals:</b> stable rigid bodies, tuned materials, joint motors, contact reporting, no tunneling.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Plunger</b>impulse launch</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Field</b>bumpers · slingshots · gravity (~9.8·sin θ)</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Flippers</b>motorized hinges</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Drain</b>Area3D → ball lost → multiball?</div>
    </div>
  </div>
</div>
` },

{ c: 7, t: "RigidBody3D Theory", html: `
<h2>RigidBody3D — the simulation citizen</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>You don't move it; forces do.</b> The physics server integrates position every tick from velocity/torque.</li>
      <li>Ways to influence:
        <ul>
          <li><code>apply_central_force(f)</code> — continuous push</li>
          <li><code>apply_impulse(j, pos)</code> — instant kick (bumpers!)</li>
          <li><code>apply_torque(t)</code> / <code>apply_torque_impulse</code></li>
          <li><code>linear_velocity</code> direct set — last resort, breaks physics assumptions</li>
        </ul></li>
      <li>Damping: <code>linear_damp</code>/<code>angular_damp</code> (air/rolling resistance) — pinball wants ~0.1.</li>
      <li><code>mass</code> + inertia (auto or custom); <code>can_sleep</code> matters for still balls.</li>
      <li><b>Never</b> parent a rigid body under moving nodes or scale its ancestors.</li>
    </ul>
  </div>
  <div>
<pre data-file="ball_basics.gd" data-lang="gdscript"><code>extends RigidBody3D  # Ball

func _ready() -> void:
	mass = 1.0
	# Continuous collision detection: fast ball,
	# thin walls — no tunneling:
	continuous_cd = true
	# PhysicsMaterial (see next slide):
	var pm := PhysicsMaterial.new()
	pm.bounce = 0.45
	pm.friction = 0.08   # slides, doesn't roll-stick
	physics_material_override = pm
	contact_monitor = true
	max_contacts_reported = 4   # for SFX (later)

func nudge(side: float) -> void:
	# Player table-nudge: impulse, not teleport:
	apply_central_impulse(Vector3(side, 0, -0.4))</code></pre>
    <div class="callout deep"><b>◉ Deep Dive</b><p>RigidBody3D position is <b>state owned by the server</b>; teleports mid-simulation desync broadphase. If you must move it: <code>freeze = true</code> → move → <code>freeze = false</code>, or use <code>PhysicsServer3D.body_set_state</code>.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Physics Materials", html: `
<h2>PhysicsMaterial — friction &amp; bounce</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Two halves: <code>friction</code> (0 ice → 1 rubber) and <code>bounce</code> (0 dead → 1 superball).</li>
      <li>Combine per contact via <b>combine modes</b>: average, multiply, min, max — set per material (<code>friction_combine_mode</code>…).</li>
      <li><b>Real pinball tables:</b> ball is steel (bounce ~0.9 vs steel), playfield is wood with low friction — the <em>combination</em> yields lively-but-controllable.</li>
      <li><code>rough</code> and <code>absorbent</code> flags fine-tune (rough = use surface normals for friction; absorbent = don't bounce).</li>
      <li>Assign on <em>both</em> ball and table via <code>physics_material_override</code>.</li>
    </ul>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Surface</th><th>friction</th><th>bounce</th><th>Feel</th></tr>
      <tr><td>Playfield (wood)</td><td>0.1</td><td>0.3</td><td>fast, predictable</td></tr>
      <tr><td>Wall (steel)</td><td>0.05</td><td>0.6</td><td>lively rebounds</td></tr>
      <tr><td>Bumper rubber</td><td>0.4</td><td>0.9</td><td>explosive pops</td></tr>
      <tr><td>Flipper rubber</td><td>0.6</td><td>0.5</td><td>grip for control shots</td></tr>
      <tr><td>Drain chute</td><td>0.0</td><td>0.0</td><td>absorbed — done</td></tr>
    </table></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Tune combinations on a <b>test ramp</b> scene (drop ball from fixed height, measure bounce height) — 30 minutes of instrumented tuning beats hours of "feel it out".</p></div>
  </div>
</div>
` },

{ c: 7, t: "The Ball & CCD", html: `
<h2>Ball setup &amp; continuous collision</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>SphereShape3D</b> radius 0.05 m (real pinball ~27 mm) — small, fast objects are exactly the CCD use case.</li>
      <li><code>continuous_cd = true</code>: the server sweeps a capsule between ticks instead of sampling points — costs a bit, eliminates tunneling through 2 cm walls.</li>
      <li><b>max_contacts_reported</b> = 4 and <code>contact_monitor</code>: enables <code>body_entered</code> + contact data for audio strength.</li>
      <li><b>can_sleep</b>: true (resting ball in the plunger lane shouldn't burn CPU) — wake with impulses naturally.</li>
    </ul>
  </div>
  <div>
<pre data-file="ball.gd" data-lang="gdscript"><code>extends RigidBody3D

signal speed_measured(kmh: float)

func _physics_process(_d: float) -> void:
	# Telemetry: read-only velocity access is fine.
	var kmh := linear_velocity.length() * 3.6
	if Engine.get_physics_frames() % 6 == 0:
		speed_measured.emit(kmh)

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
	# The sanctioned place for custom physics math:
	# clamp max speed to keep the sim readable.
	var v := state.linear_velocity
	var max_speed := 12.0
	if v.length() &gt; max_speed:
		state.linear_velocity = v.normalized() * max_speed</code></pre>
    <div class="callout deep"><b>◉ Deep Dive</b><p><code>_integrate_forces</code> runs inside the body's solve with direct state access — the professional hook for buoyancy, wind, magnets, speed caps.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Collision Shapes for Physics", html: `
<h2>Shapes: primitives beat triangle meshes</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Primitive shapes</b> (sphere/box/capsule/cylinder) = analytic, bullet-fast, perfectly stable. Use them everywhere you can.</li>
      <li><b>ConcavePolygonShape3D</b> (trimesh): exact but static-only &amp; expensive; ball may "stick" on internal edges. Reserve for decorative complex walls.</li>
      <li><b>ConvexPolygonShape3D</b> (convex hull): dynamic-friendly approximation for imported meshes.</li>
      <li><b>WorldBoundaryShape3D</b>: infinite plane — the "ball fell off the world" safety net.</li>
      <li>Rule: author gameplay surfaces from primitive composites; trimesh only where looks demand.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">Curved table corner, the right way:</span>
<span class="b">StaticBody3D</span> <span class="g">CornerCurve</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(box)</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(box rotated 45°)</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(box rotated 22.5°)</span>
<span class="m">└──</span><span class="b">MeshInstance3D</span> <span class="m">(pretty curve, no collision!)</span>

<span class="m"># Visual mesh ≠ collision shape.</span>
<span class="m"># They are independent, by design.</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Debug → <b>Visible Collision Shapes</b> while tuning. Your eyes on the actual collision geometry kill 90% of "weird bounce" reports.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Table Construction", html: `
<h2>Building the board</h2>
<div class="two">
  <div>
    <ol class="steps">
      <li><code>StaticBody3D</code> playfield — box shape, wood PhysicsMaterial, tilted −6.5° on X (gravity component along the slope = the game's soul).</li>
      <li>Walls: boxes with steel material; outer rails taller than the ball's center to cage it.</li>
      <li>Launch lane: a box channel on the right + one-way gate (next slides).</li>
      <li>Bumpers: cylinders + Area3D (next). Targets: thin boxes with hinge droop.</li>
      <li>Drain: gap at the bottom feeding the <code>Sewer</code> Area3D.</li>
      <li>Everything static: <b>one</b> StaticBody3D with many shapes is fine (and faster than dozens of bodies).</li>
    </ol>
  </div>
  <div>
    <div class="tree"><span class="b">StaticBody3D</span> <span class="g">Table</span> <span class="m">(rot.x = -6.5°)</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="g">PlayfieldBox</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="g">WallLeft</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="g">WallRight</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="g">ArchTop</span> <span class="m">(3 boxes)</span>
<span class="m">└──</span><span class="b">MeshInstance3D</span> <span class="g">TableArt</span> <span class="m">(no shape)</span>

<span class="m">gravity along slope:</span>
<span class="m">g_t = 9.8 · sin(6.5°) ≈ 1.1 m/s² downward pull</span></div>
    <div class="callout note"><b>ℹ Note</b><p>Keep default world gravity (−Y); the tilt comes from geometry. Physically honest and tuning stays in one obvious place.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Flippers I: HingeJoint3D Theory", html: `
<h2>HingeJoint3D — motorized hinges</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>A joint constrains two bodies to rotate around one axis. <b>HingeJoint3D</b> parameters: limits (upper/lower angle), motor (target angular velocity + max torque), spring/damping.</li>
      <li><b>Flipper anatomy:</b> a static anchor <code>StaticBody3D</code> + a <b>RigidBody3D paddle</b> + hinge between them.</li>
      <li>Rest: lower limit ≈ −30° (down). Fired: motor spins at high angular velocity toward +33° upper limit.</li>
      <li>Released: motor reverses gently. The <em>asymmetry</em> (fast up, relaxed down) is the pinball feel.</li>
      <li>Torque must beat ball impacts: start <code>motor_max_torque</code> ≈ 100+ for a 1 kg ball.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">Flipper</span>
<span class="m">├──</span><span class="b">StaticBody3D</span> <span class="g">Anchor</span> <span class="m">(at pivot)</span>
<span class="m">├──</span><span class="b">RigidBody3D</span> <span class="g">Paddle</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">CollisionShape3D</span> <span class="m">(box, offset so pivot at end)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">MeshInstance3D</span> <span class="m">(rubber material)</span>
<span class="m">└──</span><span class="b">HingeJoint3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; node_a = Anchor</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; node_b = Paddle</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; axis = Y (up through pivot)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; limits: -30° … +33°</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; FLAG_ENABLE_MOTOR = on</span></div>
  </div>
</div>
` },

{ c: 7, t: "Flippers II: Implementation", html: `
<h2>Flipper drive code</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Mirror pairs: right flipper = left + <code>scale.x = -1</code> is <b>forbidden</b> (physics hates negative scale). Build both explicitly, mirrored limits.</li>
      <li>Drive by flipping <code>PARAM_MOTOR_TARGET_VELOCITY</code> sign/magnitude; limits clamp travel.</li>
      <li>Ball spin reality: paddle angular velocity × contact radius = outgoing speed. Faster motor = stronger shots. That's your difficulty knob.</li>
    </ul>
  </div>
  <div>
<pre data-file="flipper.gd" data-lang="gdscript"><code>extends Node3D  # Flipper rig root

@export var action := "flip_right"
@export var up_speed := 24.0     # rad/s strike
@export var down_speed := -8.0   # relaxed return
@export var max_torque := 120.0

@onready var joint: HingeJoint3D = $HingeJoint3D

func _ready() -> void:
	joint.set_flag(Joint3D.FLAG_ENABLE_MOTOR, true)
	joint.set_param(
		HingeJoint3D.PARAM_MOTOR_MAX_TORQUE, max_torque)

func _physics_process(_d: float) -> void:
	var target := down_speed
	if Input.is_action_pressed(action):
		target = up_speed
	joint.set_param(
		HingeJoint3D.PARAM_MOTOR_TARGET_VELOCITY, target)</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Left/right flippers rotate in <em>opposite signs</em>. Parameterize the mirror (limit signs, velocities) once, or your left flipper will cheerfully sweep the ball into the drain.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Flippers III: Tuning", html: `
<h2>Flipper feel — the tuning ritual</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Symptoms → dials:</b>
        <ul>
          <li>Weak shots → raise <code>up_speed</code> or <code>max_torque</code></li>
          <li>Ball flies off table → cap ball speed (slide 5) or lower paddle bounce</li>
          <li>Flippers "float" → raise down_speed magnitude slightly</li>
          <li>Ball squeezes through flipper gap → widen paddle shape or close the gap geometry</li>
        </ul></li>
      <li>Jitter at rest → enable limits' <code>solver_priority</code>, raise paddle <code>angular_damp</code>.</li>
      <li><b>Trap-and-aim</b> (holding the ball): achievable when flipper friction ~0.6 and the upper limit is firm.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Tuning table (final values shipped):</span>
up_speed        24 rad/s   <span class="dim">≈ 0.05 s full sweep</span>
down_speed      -8 rad/s
max_torque      120 N·m
limits          -30° … +33°
paddle mass     2.5 kg     <span class="dim">heavier than ball = authority</span>
ball max speed  12 m/s
<span class="err">note: values assume 1 m-long table scale ×10</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Print a tuning card like this for every physics game. Future-you (and teammates) will tune <em>numbers</em>, not archaeology.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Bumpers I: Area3D Triggers", html: `
<h2>Bumpers — Area3D + impulse</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Bumper = visual cylinder + <code>Area3D</code> (slightly larger than the art) listening for <code>body_entered</code>.</li>
      <li>On ball entry: <b>impulse along the normal away from the bumper axis</b> + score + light/sound burst.</li>
      <li>Impulse at contact point, not center → realistic spin (apply at ball position).</li>
      <li><code>apply_impulse(impulse, Vector3.ZERO)</code> — offset is <em>relative to body center</em> in global orientation.</li>
      <li>Debounce with a per-bumper cooldown (0.1 s) — the ball may re-enter same tick cluster.</li>
    </ul>
  </div>
  <div>
<pre data-file="bumper.gd" data-lang="gdscript"><code>class_name Bumper
extends Area3D

@export var kick := 6.0        # impulse magnitude
@export var points := 100
@export var cooldown := 0.1

var _last_hit := -1.0

func _ready() -> void:
	body_entered.connect(_on_body)

func _on_body(body: Node3D) -> void:
	if not body is RigidBody3D:
		return
	var now := Time.get_ticks_msec() / 1000.0
	if now - _last_hit &lt; cooldown:
		return
	_last_hit = now

	# Push away from bumper center, along the table:
	var away := body.global_position - global_position
	away.y = 0.0
	away = away.normalized()

	body.apply_impulse(away * kick, Vector3.ZERO)
	GameEvents.add_score(points)
	_pop()  # scale tween + light flash + sfx</code></pre>
  </div>
</div>
` },

{ c: 7, t: "Bumpers II: Slingshots & Pop Variety", html: `
<h2>Slingshots, spinners, drop targets</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Slingshot</b> = angled kicker: impulse along the <em>face normal</em>, not radial — sharp horizontal snaps like real tables.</li>
      <li><b>Spinner</b>: hinged thin plate; score per revolution (<code>angular_velocity</code> accumulation).</li>
      <li><b>Drop target</b>: static box that becomes non-colliding + sinks on hit; group of 5 → bonus + reset tween.</li>
      <li>All three reuse the bumper pattern: sensor + impulse/event + feedback. Physics vocabulary, not physics complexity.</li>
    </ul>
  </div>
  <div>
<pre data-file="drop_target.gd" data-lang="gdscript"><code>extends StaticBody3D

signal dropped

var _down := false

func _ready() -> void:
	# Custom hit detection: an Area3D child sees the ball
	# (static bodies don't get body_entered from pass-throughs)
	%Sensor.body_entered.connect(_hit)

func _hit(ball: Node3D) -> void:
	if _down or not ball is RigidBody3D:
		return
	_down = true
	dropped.emit()
	# Sink &amp; disable — deferred, physics-safe:
	set_collision_layer_value(1, false)
	var tw := create_tween()
	tw.tween_property(self, "position:y", -0.12, 0.12)

func reset_target() -> void:
	_down = false
	set_collision_layer_value(1, true)
	create_tween().tween_property(
		self, "position:y", 0.0, 0.2)</code></pre>
  </div>
</div>
` },

{ c: 7, t: "Plunger & One-Way Gate", html: `
<h2>The plunger launch</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Simplest robust design:</b> ball rests in the lane; hold <code>launch</code> to charge; release → <code>apply_impulse</code> along the lane.</li>
      <li>Charge = clamped hold time; give audio pitch feedback during charge.</li>
      <li><b>One-way gate</b> at the lane top: thin StaticBody rotated ~45°, collides from below only via <b>collision exceptions</b> — add exception when ball moves upward, remove after pass.</li>
      <li>Alternative: <code>AnimatableBody3D</code> gate animated to open on approach. (Heavier; exceptions are cleaner.)</li>
    </ul>
  </div>
  <div>
<pre data-file="plunger.gd" data-lang="gdscript"><code>extends Node3D

@export var max_power := 9.0
@export var charge_time := 1.2

var _held := 0.0

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("launch"):
		_held = 0.0
	elif event.is_action_released("launch"):
		_fire()

func _process(delta: float) -> void:
	if Input.is_action_pressed("launch"):
		_held = minf(_held + delta, charge_time)
		%ChargeAudio.pitch_scale = 0.6 + _held

func _fire() -> void:
	var power := max_power * (_held / charge_time)
	var ball: RigidBody3D = %WaitingBall
	var lane_dir := (%LaneTop.global_position \
		- %LaneBottom.global_position).normalized()
	ball.apply_central_impulse(lane_dir * power)
	_held = 0.0</code></pre>
  </div>
</div>
` },

{ c: 7, t: "Sewer Hazard", html: `
<h2>The drain — hazards that end runs</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Sewer</b> = Area3D at the drain mouth. <code>body_entered</code> → ball lost sequence.</li>
      <li>Sequence: disable ball physics (<code>freeze</code>), suck-down tween (scale + spin + position), splash SFX, then <code>balls -= 1</code> logic.</li>
      <li><b>Ball-save grace</b> (3 s after launch): respawn instead of punish — pinball UX 101.</li>
      <li>Also the natural hook for <b>multiball</b>: 3 balls active; drain only ends when the LAST ball falls.</li>
    </ul>
  </div>
  <div>
<pre data-file="sewer.gd" data-lang="gdscript"><code>extends Area3D

@export var ball_save_window := 3.0
var _launch_time := 0.0
var _active_balls := 1

func _ready() -> void:
	body_entered.connect(_on_ball)
	GameEvents.ball_launched.connect(
		func(): _launch_time = Time.get_ticks_msec() / 1000.0)

func _on_ball(ball: Node3D) -> void:
	if not ball is RigidBody3D:
		return
	ball.freeze = true          # physics hands-off
	_suck_down(ball)

func _suck_down(ball: Node3D) -> void:
	var tw := create_tween().set_parallel(true)
	tw.tween_property(ball, "scale", Vector3.ZERO, 0.5)\
		.set_ease(Tween.EASE_IN)
	tw.tween_property(ball, "position:y",
		position.y - 1.0, 0.5)
	tw.chain().tween_callback(func(): _resolve_loss(ball))

func _resolve_loss(ball: Node3D) -> void:
	var saved := Time.get_ticks_msec() / 1000.0 \
		- _launch_time &lt; ball_save_window
	ball.queue_free()
	if saved:
		_respawn_ball()
	else:
		GameEvents.ball_lost.emit()</code></pre>
  </div>
</div>
` },

{ c: 7, t: "Contact Sounds", html: `
<h2>Impact audio from contact data</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>With <code>contact_monitor</code> + <code>max_contacts_reported</code>, the ball reports <code>body_entered</code> AND per-tick contacts via <code>PhysicsDirectBodyState3D.get_contact_*</code>.</li>
      <li>Volume = f(impact speed): read <code>linear_velocity</code> at contact; map to dB.</li>
      <li>One <code>AudioStreamPlayer3D</code> on the ball, random pitch — all impacts "come from the ball".</li>
      <li>Throttle: skip if &lt; 0.5 m/s (resting noise) and min 60 ms between plays.</li>
    </ul>
  </div>
  <div>
<pre data-file="ball_audio.gd" data-lang="gdscript"><code>extends RigidBody3D

const MIN_SPEED := 0.8
var _last_play := -1.0

func _ready() -> void:
	contact_monitor = true
	max_contacts_reported = 4
	body_entered.connect(_on_body)

func _on_body(_b: Node) -> void:
	var speed := linear_velocity.length()
	if speed &lt; MIN_SPEED:
		return
	var now := Time.get_ticks_msec() / 1000.0
	if now - _last_play &lt; 0.06:
		return
	_last_play = now

	# Map 0.8…12 m/s → -24…0 dB, and pitch a little:
	var t := remap(speed, 0.8, 12.0, 0.0, 1.0)
	%Sfx.volume_db = linear_to_db(lerpf(0.05, 1.0, t))
	%Sfx.pitch_scale = randf_range(0.9, 1.1)
	%Sfx.play()</code></pre>
  </div>
</div>
` },

{ c: 7, t: "Score & Combo System", html: `
<h2>Scoring — events, not flags</h2>
<div class="two">
  <div>
<pre data-file="pinball_events.gd" data-lang="gdscript"><code># Autoload: PinballEvents
extends Node

signal scored(points: int, why: StringName)
signal combo_advanced(multiplier: int)
signal ball_lost
signal ball_launched

var score := 0
var combo := 1
var _combo_timer := 0.0
const COMBO_WINDOW := 3.0   # s since last scoring hit

func add_score(points: int, _why := &amp;"") -> void:
	score += points * combo
	scored.emit(points * combo, _why)
	combo_advanced.emit(combo)
	_combo_timer = COMBO_WINDOW

func _process(delta: float) -> void:
	if _combo_timer &gt; 0.0:
		_combo_timer -= delta
		if _combo_timer &lt;= 0.0 and combo &gt; 1:
			combo = 1
			combo_advanced.emit(combo)</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li>Combo = scoring within 3 s chains multiplier (cap ×8). One timer in one place.</li>
      <li>Every device calls <code>add_score(points, &amp;"bumper")</code> — the <em>why</em> powers debug analytics &amp; floating labels.</li>
      <li>Bumpers ramp combo; drains reset it. Player story: "keep the ball moving".</li>
      <li>HUD: score with tweened count-up, combo badge pulse on <code>combo_advanced</code>.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Score inflation is designed, not emergent: pick a target end-game score (say 250k) and back-compute per-device points. Numbers your players can grow into.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Physics Tick & Determinism", html: `
<h2>Tick rate, determinism &amp; replays</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Physics runs at a fixed <b>60 Hz</b> by default (<code>physics/common/physics_ticks_per_second</code>). Same inputs + same dt = same simulation, tick-for-tick.</li>
      <li><b>Raising to 120</b> halves per-tick motion (better tunneling margins, stiffer joints) at ~2× solver cost. Pinball genuinely benefits.</li>
      <li><b>Determinism caveats:</b> float order-of-operations is stable per platform/build, but not guaranteed <em>across</em> platforms. Cross-machine replays need custom rollback (Ch 9 adjacent).</li>
      <li><b>Interpolation:</b> 4.4 adds 3D physics interpolation — smooth rendering between ticks for fast bodies without per-frame hacks.</li>
    </ul>
  </div>
  <div>
<pre data-file="project_settings.ini" data-lang="text"><code># Project Settings → Physics
[physics]
common/physics_ticks_per_second=120
common/physics_interpolation=true   # 4.4+

# Debug during dev:
common/max_physics_steps_per_frame=8
# (spiral-of-death guard when frames stall)</code></pre>
    <div class="callout ver"><b>◷ Version Note</b><p><b>4.4:</b> enable <code>physics/common/physics_interpolation</code> and move rigid bodies purely in physics; rendering smooths automatically. Pre-4.4 games hand-lerp in <code>_process</code>.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Jolt vs GodotPhysics", html: `
<h2>Physics engines: GodotPhysics vs Jolt</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Godot 4.0–4.3 default: <b>GodotPhysics3D</b> — fully in-house, predictable, matures each release.</li>
      <li><b>4.4:</b> <b>Jolt Physics</b> ships built-in (Project Settings → Physics → 3D → Physics Engine). Faster solving, better CCD, more stable stacks — a drop-in for most projects.</li>
      <li>Differences that matter for pinball: Jolt's joint/CCD behavior differs in the details; a tuned GodotPhysics table may need a re-tune pass.</li>
      <li>Pick per project, commit, and note it in the tuning card.</li>
    </ul>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th></th><th>GodotPhysics3D</th><th>Jolt (4.4+)</th></tr>
      <tr><td>Maturity in Godot</td><td>4.0+</td><td>4.4+ (option)</td></tr>
      <tr><td>Performance</td><td>good</td><td>excellent (multithreaded)</td></tr>
      <tr><td>Joint stability</td><td>adequate</td><td>notably better</td></tr>
      <tr><td>Feature parity</td><td>reference</td><td>a few params unsupported</td></tr>
    </table></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Evaluate both in week one of any physics-heavy project with your worst-case scene (50 stacked boxes + your flippers). Switching late means re-tuning everything.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Physics Debugging Toolkit", html: `
<h2>Debugging physics like a pro</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Visible Collision Shapes</b> (Debug menu) — shapes overlay, colored by body type.</li>
      <li><b>Visible Collision Bboxes / Contacts** — broadphase &amp; contact point inspection.</li>
      <li>Runtime queries: <code>PhysicsServer3D.space_get_direct_state(get_viewport().find_world_3d().space)</code> → <code>intersect_ray/shape</code> for custom instrumentation.</li>
      <li><b>Slow-mo:</b> <code>Engine.time_scale = 0.2</code> — watch one flipper hit in detail.</li>
      <li>Print from <code>_integrate_forces</code> to trace per-tick velocity evolution.</li>
    </ul>
  </div>
  <div>
<pre data-file="physics_probe.gd" data-lang="gdscript"><code># On-demand world probe (no nodes needed)
extends Node

func probe(pos: Vector3) -> void:
	var space := get_viewport().find_world_3d()\
		.direct_space_state
	var q := PhysicsRayQueryParameters3D.create(
		pos + Vector3.UP * 2.0, pos)
	q.collide_with_areas = true
	var hits := space.intersect_ray(q)
	print(hits)  # {position, normal, collider, rid…}</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Direct space queries are valid only inside <code>_physics_process</code> — from <code>_process</code>, the space may be mid-solve and results are undefined.</p></div>
  </div>
</div>
` },

{ c: 7, t: "Camera & Presentation", html: `
<h2>Camera framing the table</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Classic view:</b> elevated behind the flippers, tilted to match playfield — the brain reads depth from this familiar angle.</li>
      <li>Optional "nudge cam": tiny camera impulse when the player nudges (adds life; cap displacement).</li>
      <li>Follow-cam mode (ball-centric) is a fun accessibility option: <code>Camera3D</code> lerps above the ball with lead.</li>
      <li>Lighting: 2–3 fixed OmniLights + emissive bumper materials + glow post → arcade glow without dynamic light spam.</li>
    </ul>
  </div>
  <div>
<pre data-file="ball_cam.gd" data-lang="gdscript"><code># Optional follow camera (accessibility mode)
extends Camera3D

@export var height := 1.2
@export var lead := 0.4
@export var stiffness := 6.0

func _physics_process(delta: float) -> void:
	var ball := get_tree().get_first_node_in_group("ball") \
		as Node3D
	if not ball:
		return
	var target := ball.global_position \
		+ ball.velocity * lead + Vector3.UP * height
	var k := 1.0 - exp(-stiffness * delta)
	global_position = global_position.lerp(target, k)
	look_at(ball.global_position, Vector3.UP)</code></pre>
  </div>
</div>
` },

{ c: 7, t: "Chapter 07 Pitfalls", html: `
<h2>Chapter 07 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Teleporting rigid bodies</b><p>Setting <code>position</code> on a simulating RigidBody mid-flight corrupts its state (ghost contacts, energy from nowhere). Move via forces/impulses; or freeze→move→unfreeze.</p></div>
    <div class="callout pit"><b>⚠ Scaled physics parents</b><p>Never place physics bodies under non-uniformly scaled parents — shapes cook with skew, contacts go insane. Scale the <em>shapes</em>/meshes, not the ancestry.</p></div>
    <div class="callout pit"><b>⚠ Joint node_a/b confusion</b><p>Joints live OUTSIDE both bodies (or as a child of neither, or carefully owned) — node paths resolve at ready; reparenting silently breaks them. Verify with visible joints debug.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Contacts not firing</b><p><code>contact_monitor</code> off or <code>max_contacts_reported = 0</code> (default!) = no <code>body_entered</code>, no contact data. The #1 rigid body support question, every week, forever.</p></div>
    <div class="callout pit"><b>⚠ Fighting the solver</b><p>Setting <code>linear_velocity</code> every tick to "help" physics produces jitter — you're re-implementing the integrator worse. Express intent as forces; save velocity sets for one-off events (launch).</p></div>
  </div>
</div>
` },

{ c: 7, t: "Chapter 07 Exercises", html: `
<h2>Exercises — Pinball</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 7.1 — Bounce lab</b><p>Ramp scene: drop the ball from 1 m onto a test material. Measure rebound heights for bounce 0.2/0.5/0.9. Verify against physics expectation (h' ≈ h·bounce²).</p></div>
  <div class="callout ex"><b>✎ Ex 7.2 — Flipper mastery</b><p>Implement a "trap": hold the ball still on a raised flipper for 1 s (detect via contact + low speed). Reward with bonus points. This tests your friction/limit tuning deeply.</p></div>
  <div class="callout ex"><b>✎ Ex 7.3 — Multiball</b><p>Three balls alive; drain only ends the run on the last one. Manage: ball counting, per-ball sewer debounce, HUD indicator, spawn sequencing.</p></div>
  <div class="callout ex"><b>✎ Ex 7.4 — Jolt bake-off</b><p>Switch the physics engine to Jolt (4.4+). Re-tune flipper torque until the skill shots land identically. Document the delta — a real production migration memo.</p></div>
</div>
` },

{ c: 7, t: "Chapter 07 Recap", html: `
<h2>Chapter 07 — recap</h2>
<div class="two">
  <div>
    <h3>Physics mastery delivered</h3>
    <ul class="pts">
      <li>RigidBody3D force/impulse/integrate model.</li>
      <li>PhysicsMaterial combining — instrumented tuning.</li>
      <li>Shape strategy: primitives &gt; convex &gt; trimesh.</li>
      <li>HingeJoint3D motorized flippers + feel tuning.</li>
      <li>Area3D bumpers/slings/drop targets/sewer.</li>
      <li>CCD, speed caps, contact audio, tick-rate choices.</li>
      <li>GodotPhysics vs Jolt decision framework.</li>
    </ul>
  </div>
  <div>
    <h3>Insight to carry forward</h3>
    <ul class="pts">
      <li>Physics games are <b>tuned systems</b>, not simulation correctness — keep dials explicit and documented.</li>
      <li>Player agency enters through tiny, well-defined interfaces (impulses, motors) — chaos does the rest.</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Chapter 08 SubRacer</b>: a full 3D vehicle-ish sim — sensors, signal-driven controllers, weapons, power-ups, and gorgeous underwater volumetrics.</p></div>
  </div>
</div>
` }

);
