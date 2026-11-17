/* Chapter 08 — SubRacer (26 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 8, t: "Chapter 08 — SubRacer", cover: true, html: `
<div class="cov-part">Part II · Beginner &amp; Intermediate Tutorials</div>
<div class="cov-n">08</div>
<h1>SubRacer</h1>
<p class="cov-sub">A 6-DOF submarine racer/shooter through flooded cave systems: full 3D movement, sensor-driven awareness (Area3D + RayCast3D), signal-based controllers, torpedo weapons, power-ups — and an underwater showcase of WorldEnvironment, volumetric fog, and post-processing.</p>
<div class="chips">
  <span class="tag">Submarine controller</span><span class="tag">Sensors</span>
  <span class="tag">Signal controllers</span><span class="tag">Torpedoes</span>
  <span class="tag">Power-ups</span><span class="tag">Volumetric fog</span><span class="tag">Post-FX</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 8, t: "Design & Architecture", html: `
<h2>SubRacer — design &amp; scene plan</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Fantasy:</b> pilot a salvage sub through collapsing caverns; collect power cores, dodge mines, outduel rogue subs.</li>
      <li><b>Systems:</b> 6-DOF pilot, mine hazards + enemy subs, torpedo weapon with reload, power-ups (shield/boost/sonar), checkpoints/laps, oxygen pressure timer.</li>
      <li><b>Architecture theme:</b> the sub as a <b>signal-driven controller platform</b> — sensors emit, pilot/managers react. Zero cross-node reach-ins.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">CharacterBody3D</span> <span class="g">Sub</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(capsule)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="g">Hull</span>
<span class="m">├──</span><span class="b">Node3D</span> <span class="g">CameraRig</span> <span class="m">→ Camera3D</span>
<span class="m">├──</span><span class="b">RayCast3D</span> <span class="g">Sonar</span> <span class="m">(front)</span>
<span class="m">├──</span><span class="b">Area3D</span> <span class="g">Proximity</span> <span class="m">(mines)</span>
<span class="m">├──</span><span class="b">Marker3D</span> <span class="g">TorpedoTube</span>
<span class="m">├──</span><span class="b">Node</span> <span class="g">PowerCore</span> <span class="m">(buffs)</span>
<span class="m">└──</span><span class="b">AudioStreamPlayer3D</span> <span class="g">EngineHum</span></div>
  </div>
</div>
` },

{ c: 8, t: "Submarine Controller: Body Choice", html: `
<h2>CharacterBody3D vs RigidBody3D for the sub</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th></th><th>CharacterBody3D</th><th>RigidBody3D</th></tr>
      <tr><td>Control</td><td>direct velocity — crisp arcade</td><td>forces — weighty sim</td></tr>
      <tr><td>Collisions</td><td>slide/stop</td><td>push back, tumble</td></tr>
      <tr><td>Buoyancy/torque</td><td>manual</td><td>native</td></tr>
      <tr><td>Player predictability</td><td>high</td><td>low (chaotic)</td></tr>
      <tr><td>Best for</td><td><b>racer feel</b></td><td>drifty "heavy metal" feel</td></tr>
    </table></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>This chapter: CharacterBody3D</b> in <code>motion_mode = Floating</code> — no floor snapping, full 3D freedom, arcade handling. (Ch 7 gave you RigidBody; Ch 3 covered the trade.)</li>
      <li>Sub-shrine hybrid: CharacterBody3D for the player, RigidBody3D for debris/knocked mines — best of both.</li>
      <li>Movement model: <b>thrust + drag</b> in all three axes — that's ALL a submarine is.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Decide the body with one question: "does the player <em>drive</em> velocity (Character) or <em>influence</em> a simulation (Rigid)?" Wrong answers get rewritten from scratch later.</p></div>
  </div>
</div>
` },

{ c: 8, t: "Submarine Movement", html: `
<h2>6-DOF thrust &amp; hydrodynamic drag</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Thrust</b> from input (forward/back + strafe + rise) in the sub's local frame.</li>
      <li><b>Drag</b> = velocity × −k — makes water feel thick and speed self-limiting. Higher drag → responsive but slow; lower → drifty.</li>
      <li><b>Pitch/yaw/roll</b> via mouse/joystick → rotate the body; camera follows the rig.</li>
      <li><b>Speed clamp</b> as safety; boost power-up raises it temporarily.</li>
      <li>Engine audio pitch follows speed; particles trail at high thrust.</li>
    </ul>
  </div>
  <div>
<pre data-file="sub_controller.gd" data-lang="gdscript"><code>class_name Sub
extends CharacterBody3D

@export var thrust := 14.0        # m/s²
@export var drag := 1.6           # 1/s
@export var max_speed := 16.0
@export var turn_rate := 1.8      # rad/s

func _physics_process(delta: float) -> void:
	# 1) local-space wish vector from actions
	var input := Vector3(
		Input.get_axis("strafe_right", "strafe_left"),
		Input.get_axis("descend", "ascend"),
		Input.get_axis("move_forward", "move_back"))

	# 2) rotate: pitch (local X), yaw (local Y), roll (local Z)
	rotate_object_local(Vector3.RIGHT,
		-_look.y * turn_rate * delta)
	rotate_object_local(Vector3.UP,
		-_look.x * turn_rate * delta)
	if Input.is_action_pressed("roll_left"):
		rotate_object_local(Vector3.BACK, turn_rate * delta)

	# 3) accumulate: thrust (local→global) + drag
	var accel := transform.basis * input * thrust
	velocity += accel * delta
	velocity -= velocity * drag * delta   # hydro-drag
	velocity = velocity.limit_length(max_speed)

	move_and_slide()   # Floating mode: no floor bias

var _look := Vector2.ZERO  # fed by mouse motion (Ch 6 rig)</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Buoyancy & Depth", html: `
<h2>Buoyancy — the feel of "wet"</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Neutral trim: slight <b>positive buoyancy</b> (+Y when idle) — players forgive "slowly drifting up" far more than sinking.</li>
      <li><b>Depth pressure:</b> below a band, hull stress accumulates → alarm + damage; enforces the cave's vertical design.</li>
      <li><b>Surface boundary:</b> crossing the water plane exits water drag for air drag + wave bobbing — a 10-line StateMachine adds huge presence.</li>
      <li>Screen-space bubbles particles rise relative to depth — cheap, effective.</li>
    </ul>
  </div>
  <div>
<pre data-file="buoyancy.gd" data-lang="gdscript"><code># Inside Sub._physics_process (Character variant)
const BUOYANT_ACCEL := 0.4   # gentle upward bias
const DEEP_Y := -60.0        # stress floor

func _apply_water_physics(delta: float) -> void:
	var depth := -global_position.y
	if depth &gt; 0.5:                       # underwater
		velocity.y += BUOYANT_ACCEL * delta
		if global_position.y &lt; DEEP_Y:
			var stress := (-global_position.y - -DEEP_Y) * 0.02
			%Health.take_hit(int(stress * delta * 60.0))
			%HUD.set_alarm(true)
	else:                                  # breeched
		velocity.y -= 9.8 * delta          # gravity returns

# RigidBody variant (if you went Ch 7 style):
# func _integrate_forces(state) -> void:
#     state.apply_central_force(Vector3.UP * mass * 9.8 * trim)</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Camera & Mouse Look", html: `
<h2>Underwater camera rig</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Reuse Ch 6's yaw/pitch rig — here mounted on the sub with <b>roll inheritance</b>: camera inherits some hull roll for immersion (clamped ~25%).</li>
      <li><b>FOV kick</b> on boost (75 → 86 over 0.3 s) sells acceleration.</li>
      <li><b>Camera collision:</b> spring arm via RayCast3D behind the camera; pull in when the wall approaches.</li>
      <li><b>Water wobble:</b> tiny sine-based <code>h/v_offset</code> noise — only underwater.</li>
    </ul>
  </div>
  <div>
<pre data-file="sub_camera.gd" data-lang="gdscript"><code>extends Camera3D

@export var fov_boost := 86.0
@export var boost_speed := 5.0   # lerp rate
var _base_fov := 75.0

func _process(delta: float) -> void:
	# FOV follows speed (boost sells itself):
	var target := _base_fov + remap(
		%Sub.velocity.length(), 10.0, 16.0, 0.0, 11.0)
	fov = lerpf(fov, clampf(target, _base_fov,
		fov_boost), boost_speed * delta)

	# Underwater sway:
	var t := Time.get_ticks_msec() / 1000.0
	h_offset = sin(t * 0.7) * 0.004
	v_offset = sin(t * 1.1) * 0.003</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Sensors I: Area3D Proximity", html: `
<h2>Area3D as a sensor suite</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Proximity sphere</b> (Area3D, radius 6): emits <code>mine_nearby</code> with distance — HUD pings + geiger-style audio rate.</li>
      <li><b>Sonar cone</b> (Area3D + cone shape or scale-by-FOV spheres): detects collectibles/enemies → HUD markers.</li>
      <li>Sensors <b>only translate physics facts into signals</b> — no decisions. Controllers decide.</li>
      <li>Masks: proximity masks <code>mines</code> layer only — a sensor with a wrong mask is a sensor lying to you.</li>
    </ul>
  </div>
  <div>
<pre data-file="proximity_sensor.gd" data-lang="gdscript"><code>class_name ProximitySensor
extends Area3D

signal threat_detected(node: Node3D, dist: float)
signal threat_cleared

@onready var _geiger: AudioStreamPlayer3D = $Geiger

func _ready() -> void:
	body_entered.connect(_on_enter)
	body_exited.connect(_on_exit)

func _on_enter(body: Node3D) -> void:
	if body.is_in_group("mines"):
		var d := global_position.distance_to(
			body.global_position)
		threat_detected.emit(body, d)
		_geiger.play()

func _on_exit(body: Node3D) -> void:
	if body.is_in_group("mines"):
		threat_cleared.emit()

# HUD subscriber: ping marker alpha ∝ 1/dist,
# geiger pitch ∝ threat count.</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Sensors II: RayCast3D Sonar", html: `
<h2>RayCast3D — focused sensing</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Pulse sonar:</b> every 0.8 s, fire 1 ray forward (and optionally 4 slightly splayed) — <code>get_collider()</code> + distance = terrain/obstacle read.</li>
      <li>Uses: collision-avoidance assist, "wall ahead" audio cue, lock-on (target under reticle within range).</li>
      <li><b>Lock-on rule:</b> ray hits enemy-layer collider within 40 m and stays 0.4 s → locked; HUD reticle + torpedoes home (slide 12).</li>
      <li><code>RayCast3D.add_exception(self)</code> so the sub doesn't detect its own hull.</li>
    </ul>
  </div>
  <div>
<pre data-file="sonar.gd" data-lang="gdscript"><code>class_name Sonar
extends RayCast3D

signal lock_gained(target: Node3D)
signal lock_lost

@export var lock_range := 40.0
@export var lock_hold := 0.4

var locked: Node3D = null
var _hold := 0.0

func _ready() -> void:
	add_exception(get_parent())
	target_position = Vector3.FORWARD * lock_range

func _physics_process(delta: float) -> void:
	force_raycast_update()
	if is_colliding() and \
			get_collider().is_in_group("enemies"):
		if get_collider() == locked:
			_hold = lock_hold   # refresh
		elif _hold &gt; 0.0:
			_hold -= delta
			if _hold &lt;= 0.0 and locked == null:
				locked = get_collider()
				lock_gained.emit(locked)
	else:
		_hold = 0.0
		if locked:
			locked = null
			lock_lost.emit()</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Signal-Driven Controllers", html: `
<h2>The controller pattern — wiring the sub</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Controller</b> = one node that owns decisions; <b>sensors</b> provide facts; <b>actuators</b> (weapons, thrusters) expose commands.</li>
      <li>Data flow is one-directional: Sensor → signal → Controller → call → Actuator. No actuator ever reaches back.</li>
      <li>Benefits: swap sensors (ray → shape query) or actuators (torpedo → laser) without touching logic; unit-test the controller by faking signals.</li>
      <li>This scales directly into enemy AI (same sub architecture, different controller) and Ch 9's networked replication boundaries.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Sensors</b>RayCast sonar · Area proximity · Health events</div>
      <div class="arr">↓ signals</div>
      <div class="fbox acc"><b>SubController</b>decides: lock, fire, boost, retreat</div>
      <div class="arr">↓ calls</div>
      <div class="fbox"><b>Actuators</b>TorpedoTube · Thrusters · Shield</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>World</b>physics + GameEvents broadcast</div>
    </div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Write the controller <em>after</em> the signal contract: list every fact ("mine in 6 m") and command ("fire tube 1") as signal/method names first. The code then writes itself.</p></div>
  </div>
</div>
` },

{ c: 8, t: "Torpedoes I: Weapon Design", html: `
<h2>Torpedo design — from tube to boom</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Torpedo</b> = pooled Area3D projectile (Ch 6 pattern) + <b>propulsion</b> (accelerate toward velocity dir) + <b>homing option</b> (steer toward lock target with limited turn rate).</li>
      <li>Speed curve: launch slow (0.5 s) then sprint — reads great and prevents point-blank cheese.</li>
      <li>Ammo/reload: tubes hold 2; reload 3 s each; HUD shows tube states.</li>
      <li>Impact: explosion (pooled particles + light + shake) + AoE impulse to rigid debris.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Area3D</span> <span class="g">Torpedo</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(small sphere)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="m">+ emissive trail</span>
<span class="m">├──</span><span class="b">GPUParticles3D</span> <span class="g">Bubbles</span>
<span class="m">└──</span><span class="b">AudioStreamPlayer3D</span> <span class="m">motor loop</span>

<span class="m">States: STOWED → FIRED → CRUISE</span>
<span class="m">         → (HOMING) → IMPACT/EXPIRE</span></div>
  </div>
</div>
` },

{ c: 8, t: "Torpedoes II: Instancing & Homing", html: `
<h2>Torpedo implementation</h2>
<pre data-file="torpedo.gd" data-lang="gdscript"><code>class_name Torpedo
extends Area3D

@export var damage := 45
const SPRINT_SPEED := 22.0
const ACCEL := 30.0
const HOMING_TURN := 1.6   # rad/s steering budget

var target: Node3D = null   # from Sonar lock
var _t := 0.0

func fire(from: Transform3D, lock: Node3D) -> void:
	global_transform = from
	target = lock
	_t = 0.0
	set_physics_process(true)

func _physics_process(delta: float) -> void:
	_t += delta
	# 1) accelerate along current facing:
	var speed := minf(ACCEL * _t, SPRINT_SPEED)
	var dir := -global_transform.basis.z

	# 2) homing — steer within turn budget:
	if is_instance_valid(target):
		var want := global_position.direction_to(
			target.global_position)
		dir = dir.slerp(want,
			minf(HOMING_TURN * delta, 1.0))
		# face travel dir:
		look_at(global_position + dir, Vector3.UP)

	global_position += dir * speed * delta
	if _t &gt; 6.0:
		_detonate(false)   # expire quietly

func _on_body_entered(body: Node3D) -> void:
	if body == get_parent():  # safety: not the launcher
		return
	if body.has_method("take_damage"):
		body.take_damage(damage)
	_detonate(true)

func _detonate(hit: bool) -> void:
	if hit:
		var fx := %ExplosionPool.acquire()
		fx.global_position = global_position
		fx.detonate()
		%Camera.add_trauma(0.35)
	%TorpedoPool.release(self)</code></pre>
` },

{ c: 8, t: "Enemy Subs (Simple AI)", html: `
<h2>Enemy subs — controller reuse</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Enemy = <b>same architecture</b>: sensors (ray forward, area hearing), controller (3-state FSM: PATROL → CHASE → ATTACK), actuators (thrusters + own torpedo tube).</li>
      <li>PATROL: waypoints via <code>Curve3D</code> or NavigationAgent3D (caves love navmeshes).</li>
      <li>CHASE: steer toward player; BREAK OFF when too close (fights feel like duels, not leeches).</li>
      <li>ATTACK: within cone + range, fire with cooldown + inaccuracy spread.</li>
      <li>Reuse the player's Torpedo scene — enemy-colored trail via material swap on acquire.</li>
    </ul>
  </div>
  <div>
<pre data-file="enemy_sub.gd" data-lang="gdscript"><code>class_name EnemySub
extends CharacterBody3D

enum State { PATROL, CHASE, ATTACK }
var state := State.PATROL

@export var sight_range := 55.0
var _fire_cd := 0.0

func _physics_process(delta: float) -> void:
	match state:
		State.PATROL:
			_follow_waypoints(delta)
			if _can_see_player():
				state = State.CHASE
		State.CHASE:
			_steer_toward(%Player.global_position, delta)
			var d := global_position.distance_to(
				%Player.global_position)
			if d &gt; sight_range * 1.4:
				state = State.PATROL
			elif d &lt; 30.0:
				state = State.ATTACK
		State.ATTACK:
			_orbit_player(delta)
			_fire_cd -= delta
			if _fire_cd &lt;= 0.0 and _aim_error() &lt; 0.2:
				_fire_torpedo()
				_fire_cd = 2.8

func _can_see_player() -> bool:
	var fwd := -global_transform.basis.z
	var to_p := global_position.direction_to(
		%Player.global_position)
	return fwd.dot(to_p) &gt; 0.7 and \
		not %LoSRay.is_colliding()</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Power-Ups I: Pickup Design", html: `
<h2>Collectible power cores</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Pickup = <code>Area3D</code> + spin/bob + emissive material + <code>body_entered</code> → applies buff → frees (or pools!).</li>
      <li><b>Type via resource data</b> — one scene, N behaviors:
        <ul>
          <li><code>Shield</code> — 8 s, absorbs 2 hits</li>
          <li><code>Boost</code> — 5 s, +60% speed</li>
          <li><code>SonarPulse</code> — reveals map 10 s</li>
        </ul></li>
      <li>Rarity weights in the spawner; magnetic attraction within 3 m.</li>
    </ul>
  </div>
  <div>
<pre data-file="power_core.gd" data-lang="gdscript"><code>class_name PowerCore
extends Area3D

@export var buff: BuffData   # custom Resource

func _ready() -> void:
	body_entered.connect(_on_body)

func _physics_process(delta: float) -> void:
	# Magnet drift toward the sub when close:
	var sub := get_tree().get_first_node_in_group("sub") \
		as Node3D
	if sub:
		var d := global_position.distance_to(
			sub.global_position)
		if d &lt; 3.0:
			global_position = global_position.lerp(
				sub.global_position, 6.0 * delta)
	rotate_y(2.0 * delta)  # idle spin

func _on_body(body: Node3D) -> void:
	if body is Sub:
		body.apply_buff(buff)
		GameEvents.core_collected.emit(buff.name)
		queue_free()</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Power-Ups II: Buff System", html: `
<h2>BuffData &amp; timed effects</h2>
<div class="twoR">
  <div>
<pre data-file="buff_data.gd" data-lang="gdscript"><code>class_name BuffData
extends Resource

enum Kind { SHIELD, BOOST, SONAR }
@export var kind: Kind
@export var duration := 5.0
@export var power := 1.0      # multiplier / hits
@export var color: Color = Color.CYAN</code></pre>
<pre data-file="buff_component.gd" data-lang="gdscript"><code>class_name BuffComponent
extends Node

signal buff_started(kind: BuffData.Kind)
signal buff_ended(kind: BuffData.Kind)

var _active: Dictionary = {}  # kind → time left

func has(kind: BuffData.Kind) -> bool:
	return kind in _active

func strength(kind: BuffData.Kind) -> float:
	return 1.0  # look up power if stacked

func apply(buff: BuffData) -> void:
	_active[buff.kind] = buff.duration
	buff_started.emit(buff.kind)

func _process(delta: float) -> void:
	for kind in _active.keys():
		_active[kind] -= delta
		if _active[kind] &lt;= 0.0:
			_active.erase(kind)
			buff_ended.emit(kind)</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li>Buffs are <b>data + one manager</b> — new power-ups become .tres files, zero new scripts.</li>
      <li>Sub reads buffs: <code>max_speed *= 1.6 if buffs.has(BOOST)</code>; Shield intercepts <code>Health.take_hit</code>.</li>
      <li>HUD chips with radial timers per active buff (Control + tween).</li>
      <li>Stacking rule: refresh duration, never multiply — simpler to balance.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>This data-driven pattern (resource + manager + HUD subscriber) is the exact skeleton of full inventory systems in Ch 12 — learn it once, reuse forever.</p></div>
  </div>
</div>
` },

{ c: 8, t: "Underwater Rendering I: Environment", html: `
<h2>The underwater look — WorldEnvironment</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Two environments, one scene:</b> above-water <code>Environment</code> and underwater <code>Environment</code> — swap on surface crossing (tween 0.6 s between for a submerge moment).</li>
      <li>Underwater recipe:
        <ul>
          <li>Background: deep color / custom depth gradient sky</li>
          <li><b>Fog:</b> light exponential fog (density 0.02) even before volumetrics</li>
          <li>Ambient: cool blue-green, low energy</li>
          <li>Tonemap: Filmic + slight exposure drop</li>
        </ul></li>
      <li>Underwater detection drives the swap: player Y &lt; water plane (Area3D or simple check).</li>
    </ul>
  </div>
  <div>
<pre data-file="env_swap.gd" data-lang="gdscript"><code>extends WorldEnvironment

@export var air_env: Environment
@export var water_env: Environment
@export var cross_time := 0.6

func _ready() -> void:
	GameEvents.submerged.connect(
		func(u): _swap(u))

func _swap(under: bool) -> void:
	# Tween the fog/ambient via environment lerp:
	var tw := create_tween()
	var from := environment.duplicate()
	var to := (water_env if under else air_env)
	tw.tween_method(
		func(w: float):
			environment = from.lerp(to, w)
			# Resource.lerp blends member-wise
		, 0.0, 1.0, cross_time)</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Underwater Rendering II: Volumetric Fog", html: `
<h2>Volumetric fog — god rays in caves</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Forward+ <b>volumetric fog</b>: froxel grid (3D voxels over the view) — light shafts, murky depth, real participating media.</li>
      <li>Environment → Volumetric Fog: <code>density</code> (~0.02–0.06), <code>albedo</code> (water tint), <code>emission</code> (glow color).</li>
      <li><b>DirectionalLight3D</b> angled through cave holes + fog = god rays for free.</li>
      <li><b>FogVolume</b> nodes (4.3+): local fog regions — a murky silt cloud, a glowing vent, denser pockets inside one scene.</li>
      <li><code>GIinject</code> makes SDFGI/VoxelGI light the fog too.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">Underwater Environment recipe</span>
<span class="y">volumetric_fog_enabled</span> <span class="m">= true</span>
<span class="y">density</span> <span class="m">= 0.035</span>
<span class="y">albedo</span> <span class="m">= Color(0.2, 0.45, 0.5)</span>
<span class="y">emission</span> <span class="m">= Color(0, 0.02, 0.03)</span>
<span class="y">emission_energy</span> <span class="m">= 1.0</span>
<span class="y">anisotropy</span> <span class="m">= 0.6  </span><span class="m"># forward-scatter</span>
<span class="y">length/samples</span> <span class="m">= tuned to view dist</span>

<span class="m">+ FogVolume at cave mouth:</span>
<span class="m">&nbsp;&nbsp;density 0.4, size (8,4,8)</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>Volumetrics cost a compute pass — budget like SSAO. Mobile/Compatibility have no volumetric fog: fall back to classic exponential fog (detect <code>RenderingServer.get_current_renderer().name</code>… or keep both configured).</p></div>
  </div>
</div>
` },

{ c: 8, t: "Underwater Rendering III: Post", html: `
<h2>Post-processing — the drowning palette</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>DOF (CameraAttributesPractical):</b> near-DOF blur inches from the lens — instant "inside a medium" feeling.</li>
      <li><b>Color adjustments:</b> lift blacks slightly blue, drop saturation 15% underwater; restore on surface (part of the env swap tween).</li>
      <li><b>Glow:</b> mild, threshold ~1.1 — bioluminescence &amp; torpedo trails pop.</li>
      <li><b>Screen-space refraction fake:</b> a full-screen subtle sine wobble via a CanvasLayer shader layer in front of the 3D view (classic trick).</li>
      <li>Depth-based murk: <code>glow</code> + fog handle most; avoid over-stacking effects.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>3D scene</b>caves · sub · lights</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Volumetric fog pass</b>froxels · god rays</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Camera attributes</b>DOF · exposure</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Environment post</b>tonemap · glow · adjustments</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>2D wobble overlay</b>water distortion fake</div>
    </div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Post stacks multiply: enable ONE new effect per build and screenshot-compare. Effects are seasoning; a pile of them is soup.</p></div>
  </div>
</div>
` },

{ c: 8, t: "Cave Generation & Content", html: `
<h2>Level content at scale</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Caves:</b> sculpted CSG → converted meshes, or imported Blender kitbash; concave collision only where the sub can touch.</li>
      <li><b>Multimesh dressing:</b> thousands of rocks/coral via <code>MultiMeshInstance3D</code> + scatter script (Ch 13 deep dive) — one draw call per material.</li>
      <li><b>Point of interest nodes:</b> <code>Marker3D</code> children on a <code>LevelData</code> resource — spawns mines, cores, checkpoints from data.</li>
      <li><b>Checkpoints = Area3D gates</b>; race lap logic mirrors Ch 6's wave director (data table).</li>
    </ul>
  </div>
  <div>
<pre data-file="scatter.gd" data-lang="gdscript"><code># Scatter N instances across an XZ disc:
@tool
extends MultiMeshInstance3D

@export var count := 500
@export var radius := 120.0
@export var y_min := -50.0 : set = _respin
@export var y_max := -8.0   : set = _respin

func _ready() -> void:
	_respin(null)

func _respin(_v) -> void:
	if not multimesh:
		return
	var rng := RandomNumberGenerator.new()
	rng.seed = 42   # deterministic scatter!
	multimesh.instance_count = count
	for i in count:
		var t := Transform3D(Basis.from_euler(
			Vector3(rng.randf() * TAU, rng.randf() * TAU, 0)),
			Vector3(rng.randf_range(-radius, radius),
				rng.randf_range(y_min, y_max),
				rng.randf_range(-radius, radius)))
		multimesh.set_instance_transform(i, t)</code></pre>
  </div>
</div>
` },

{ c: 8, t: "HUD: Depth, Compass, Oxygen", html: `
<h2>Dashboards — diegetic HUD</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Depth gauge:</b> big mono font, −meters; red band when in stress depth.</li>
      <li><b>Compass:</b> a rotating <code>Control</code> (texture strip) whose <code>position.x</code> maps to yaw — targets drawn as markers via <code>unproject_position</code>.</li>
      <li><b>Oxygen/pressure bar</b> + tube reload pips + buff chips (slide 15).</li>
      <li><b>3D→2D projection:</b> <code>camera.unproject_position(world_pos)</code> for offscreen indicators (clamp to screen edge).</li>
      <li>All HUD listens to GameEvents/sub signals; zero polling.</li>
    </ul>
  </div>
  <div>
<pre data-file="target_marker.gd" data-lang="gdscript"><code>extends Control  # one per tracked target

@export var target_path: NodePath

func _process(_d: float) -> void:
	var target: Node3D = get_node(target_path)
	if not is_instance_valid(target):
		return
	var cam := get_viewport().get_camera_3d()
	if cam.is_position_behind(target.global_position):
		hide()
		return
	var screen := cam.unproject_position(
		target.global_position)
	# Clamp into a HUD-safe rect:
	var rect := get_viewport_rect().grow(-48.0)
	global_position = rect.absclip(screen).clamp(
		rect.position, rect.position + rect.size)
	show()</code></pre>
    <div class="callout note"><b>ℹ Note</b><p><code>is_position_behind</code> check first — unprojecting behind-camera points gives mirrored garbage coordinates.</p></div>
  </div>
</div>
` },

{ c: 8, t: "Audio Under Water", html: `
<h2>Underwater audio — buses &amp; filters</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Route <em>everything</em> through buses: Master → <b>UnderwaterBus</b> (LowPass filter ~800 Hz + slight reverb) → sub-buses (SFX, Ambience, Music).</li>
      <li>On submerge: tween the <b>LowPass cutoff</b> 20000 → 700 Hz over 0.8 s — the cheapest, most physical water transition in games.</li>
      <li><code>AudioServer</code> drives it from code; no per-sound changes ever.</li>
      <li>Positional engine hum = looped <code>AudioStreamPlayer3D</code> on the sub, pitch bound to thrust.</li>
    </ul>
  </div>
  <div>
<pre data-file="audio_duck.gd" data-lang="gdscript"><code>extends Node  # audio_director.tscn

@export var submerged_cutoff := 700.0
@export var surface_cutoff := 20000.0

var _lp: AudioEffectLowPassFilter

func _ready() -> void:
	var bus := AudioServer.get_bus_index("UnderwaterBus")
	_lp = AudioServer.get_bus_effect(bus, 0) \
		as AudioEffectLowPassFilter
	GameEvents.submerged.connect(_on_submerge)

func _on_submerge(under: bool) -> void:
	var target := submerged_cutoff if under \
			else surface_cutoff
	var tw := create_tween()
	tw.tween_method(func(hz: float):
		_lp.cutoff_hz = hz,
		_lp.cutoff_hz, target, 0.8)</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Game Loop & Progression", html: `
<h2>Race structure — laps, mines, bosses?</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Lap race + salvage objective:</b> 3 laps through checkpoint gates; each lap spawns more cores/mines (Ch 6 wave thinking, spatialized).</li>
      <li><b>Score vectors:</b> lap time, cores, kills — displayed on end screen with per-split breakdown.</li>
      <li><b>Difficulty knobs (data):</b> mine density, enemy count, oxygen drain, boost duration.</li>
      <li>State machine from Ch 5/6 generalizes: COUNTDOWN → RACING → FINISHED / SUNK.</li>
    </ul>
  </div>
  <div>
<pre data-file="race_flow.gd" data-lang="gdscript"><code>extends Node  # RaceDirector

enum Phase { COUNTDOWN, RACING, FINISHED, SUNK }
var phase := Phase.COUNTDOWN
var lap := 0

const LAPS := 3
@export var gates: Array[Area3D] = []

func _ready() -> void:
	GameEvents.sub_destroyed.connect(
		func(): _set_phase(Phase.SUNK))
	_start_countdown()

func _on_gate(body: Node3D, idx: int) -> void:
	if phase != Phase.RACING or body is not Sub:
		return
	if idx != _next_gate:
		return           # wrong gate — ignore
	_next_gate = (idx + 1) % gates.size()
	if _next_gate == 0:
		lap += 1
		GameEvents.lap_completed.emit(lap)
		if lap &gt;= LAPS:
			_set_phase(Phase.FINISHED)</code></pre>
  </div>
</div>
` },

{ c: 8, t: "Performance & Rendering Budget", html: `
<h2>SubRacer performance pass</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Volumetrics + DOF + glow = your GPU big three; profile each with one-feature toggles.</li>
      <li>Fog <code>length</code> cuts froxel depth: dense water = shorter fog length = <em>cheaper</em> (murk is a budget feature!).</li>
      <li>Multimesh scatter for flora (1 draw call per 500 rocks).</li>
      <li>Shadow-casting lights: 2 (sun through cave holes + sub headlight). Bumpers glow via emission, not lights.</li>
      <li><code>visibility_range</code> on dressing; cave occlusion via rooms/doors or just embrace fog culling.</li>
      <li>Physics: mines pooled as bodies; sub + 4 enemies only dynamic bodies.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Debug overlay @ 1440p, Forward+:</span>
FPS 89 <span class="dim">(11.2 ms)</span>
<span class="dim">volumetric: on  · dof: on  · glow: on</span>
<span class="dim">draw calls 310 · prims 1.2 M</span>
<span class="dim">toggle volumetrics off → FPS 129 (7.75 ms)</span>
<span class="err">decision: keep, budget is 60+ on target GPU</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>Every effect earns its seat by A/B measurement on the <em>target</em> machine, not your dev rig. Log both runs; commit the numbers in the PR.</p></div>
  </div>
</div>
` },

{ c: 8, t: "Chapter 08 Pitfalls", html: `
<h2>Chapter 08 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ 6-DOF disorientation</b><p>Full roll freedom loses players. Cap roll, add "auto-level" when idle, and inherit only partial roll to the camera — arcadelike beats realistic here.</p></div>
    <div class="callout pit"><b>⚠ Sensors on wrong thread moment</b><p><code>force_raycast_update()</code> from <code>_process</code> can query mid-solve spaces. Sensor work belongs in <code>_physics_process</code>.</p></div>
    <div class="callout pit"><b>⚠ Homing torpedoes orbiting targets</b><p>Turn budget &lt; required curvature → endless circles. Fix: increase turn rate near, or detonate on closest-approach when distance starts growing.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Environment lerp on shared resource</b><p>Tweening <code>environment</code> in place edits the shared resource — snapshots diverge across restarts. <code>duplicate()</code> before lerping (as the sample does).</p></div>
    <div class="callout pit"><b>⚠ Volumetrics on fallback renderers</b><p>Compatibility/Mobile silently drop volumetric fog — your "murky depth" becomes clear water. Feature-check and provide a classic-fog preset for those targets.</p></div>
    <div class="callout pit"><b>⚠ Buff stacking explosion</b><p>Pickups refreshing BOOST ×3 via naive multiplication → 4× speed clip-through. One active per kind, refresh duration (as implemented).</p></div>
  </div>
</div>
` },

{ c: 8, t: "Chapter 08 Exercises", html: `
<h2>Exercises — SubRacer</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 8.1 — Feel the water</b><p>Strip drag to 0.3 and max_speed to 30; play 5 minutes; restore. Write 3 sentences on what "wateriness" actually is in terms of accel/drag ratios.</p></div>
  <div class="callout ex"><b>✎ Ex 8.2 — Sensor dashboard</b><p>Add a debug panel plotting: sonar distance (graph), proximity events (dots), lock state (LED). Now tune lock_hold with data instead of vibes.</p></div>
  <div class="callout ex"><b>✎ Ex 8.3 — The submerge moment</b><p>Polish surface-crossing: env lerp + lowpass sweep + bubble burst + splash SFX + 0.3 s camera dip. Time it; aim &lt; 1.5 s total. This is game feel school.</p></div>
  <div class="callout ex"><b>✎ Ex 8.4 — Boss sub</b><p>One enemy with 3 attack patterns (spread, homing, ram) cycling by HP thresholds. Reuse EnemySub architecture; only the controller grows.</p></div>
</div>
` },

{ c: 8, t: "Chapter 08 Recap", html: `
<h2>Chapter 08 — recap · Part II complete</h2>
<div class="two">
  <div>
    <h3>Systems delivered</h3>
    <ul class="pts">
      <li>6-DOF CharacterBody3D sub: thrust/drag/buoyancy model.</li>
      <li>Sensor suite (Area3D proximity, RayCast sonar/lock) → signal contracts.</li>
      <li>Controller pattern; enemy AI reusing the platform.</li>
      <li>Pooled homing torpedoes; resource-driven buff/pickup system.</li>
      <li>Underwater rendering: env swap, volumetric fog + FogVolumes, post stack, DOF.</li>
      <li>Audio bus DSP (low-pass submerge), full HUD (depth/compass/markers).</li>
    </ul>
  </div>
  <div>
    <h3>Part II complete — you've shipped</h3>
    <ul class="pts">
      <li>✅ Pumpkin Run — movement, lighting, animation, audio</li>
      <li>✅ Tube Cleaner — instancing, weapons, pooling, waves</li>
      <li>✅ Pinball — rigid bodies, joints, impulses</li>
      <li>✅ SubRacer — 6-DOF, sensors, volumetrics, progression</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Part III</b>: high-level multiplayer (Ch 9), character animation &amp; retargeting (Ch 10), the signal-architecture pure-play Flying Buddha (Ch 11), and the open-source action platformer (Ch 12).</p></div>
  </div>
</div>
` }

);
