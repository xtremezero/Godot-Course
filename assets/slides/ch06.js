/* Chapter 06 — Tube Cleaner (26 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 6, t: "Chapter 06 — Tube Cleaner", cover: true, html: `
<div class="cov-part">Part II · Beginner &amp; Intermediate Tutorials</div>
<div class="cov-n">06</div>
<h1>Tube Cleaner</h1>
<p class="cov-sub">A vertical-scrolling turret defense. Master runtime scene instancing, mouse aiming with input mapping, hitscan (RayCast3D) and projectile shooting, enemy state machines, wave spawning — and object pooling for the first time.</p>
<div class="chips">
  <span class="tag">PackedScene instancing</span><span class="tag">Turret aiming</span>
  <span class="tag">RayCast3D hitscan</span><span class="tag">Projectiles</span>
  <span class="tag">Enemy FSM</span><span class="tag">Spawning waves</span><span class="tag">Object pooling</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 6, t: "Design & Architecture", html: `
<h2>Tube Cleaner — design &amp; scene plan</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Fantasy:</b> you're a cleaning drone stuck inside a giant vertical tube; grime-creatures rise; blast them before they reach the top.</li>
      <li><b>Core loop:</b> aim (mouse) → shoot (hitscan + projectile weapon) → enemies spawn in waves → survive &amp; score.</li>
      <li><b>New engineering:</b> everything happens at runtime — instancing, pooling, layer discipline, enemy FSM.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">Main</span>
<span class="m">├──</span><span class="y">@tube.tscn</span> <span class="m">(cylinder walls, scroll)</span>
<span class="m">├──</span><span class="y">@turret.tscn</span> <span class="m">player-owned</span>
<span class="m">├──</span><span class="b">Node3D</span> <span class="g">ScrollRoot</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">EnemySpawner</span> <span class="m">(script)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="g">enemies… (runtime)</span>
<span class="m">├──</span><span class="b">Node</span> <span class="g">ProjectilePool</span>
<span class="m">└──</span><span class="b">CanvasLayer</span> <span class="g">HUD</span></div>
  </div>
</div>
` },

{ c: 6, t: "PackedScene Theory", html: `
<h2>PackedScene — instantiation mechanics</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>A <code>PackedScene</code> is a <b>scene file as data</b> — the serialized tree ready to clone.</li>
      <li>Three load flavors:
        <ul>
          <li><code>preload("res://x.tscn")</code> — compile-time, cached, path checked at parse</li>
          <li><code>load("res://x.tscn")</code> — runtime</li>
          <li><code>ResourceLoader.load_threaded_*</code> — async, for hitches (Ch 12)</li>
        </ul></li>
      <li><code>instantiate()</code> returns the root <code>Node</code> — <b>not in the tree yet</b>; configure it, then <code>add_child()</code>.</li>
      <li>Instancing clones the serialized state; scripts' member defaults re-run. Costs ~tens of µs for small scenes.</li>
    </ul>
  </div>
  <div>
<pre data-file="spawn_basics.gd" data-lang="gdscript"><code>extends Node

const GRIME := preload("res://enemies/grime.tscn")

func spawn_grime(at: Vector3) -> void:
	var mob := GRIME.instantiate()  # Node, NOT in tree
	mob.position = at              # configure *before* add
	add_child(mob)                 # _init/_enter_tree/_ready run

# A more flexible, Inspector-friendly variant:
@export var scene: PackedScene    # drag any enemy in!

func spawn(scene_ref: PackedScene, at: Transform3D) -> Node:
	var n := scene_ref.instantiate()
	n.global_transform = at
	add_child(n)
	return n</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p><code>preload</code> references inside the script that spawns them (tight coupling by design); <code>@export PackedScene</code> when designers should choose the content (loose coupling by design).</p></div>
  </div>
</div>
` },

{ c: 6, t: "Spawning at Runtime", html: `
<h2>Spawn points &amp; runtime population</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Place <b>Marker3D</b> children where enemies should appear — invisible transform holders, the standard "spawn point" node.</li>
      <li>Spawner script: pick marker (random / weighted), instantiate, add to <code>ScrollRoot</code> so it scrolls with the tube.</li>
      <li>Named groups (<code>add_to_group("enemies")</code> in enemy <code>_ready</code>) let the spawner/HUD count without references.</li>
      <li><b>Configure before add_child:</b> position/state changes after <code>add_child</code> cause a visible first-frame "pop" at the origin.</li>
    </ul>
  </div>
  <div>
<pre data-file="spawner.gd" data-lang="gdscript"><code>class_name EnemySpawner
extends Node3D

@export var grime_scene: PackedScene
@export_range(0.1, 10.0, 0.1) var interval := 2.0
@export var per_wave := 3

@onready var _markers: Array[Marker3D] = []
@onready var _timer: Timer = $Timer

func _ready() -> void:
	for c in get_children():
		if c is Marker3D:
			_markers.append(c)
	_timer.wait_time = interval
	_timer.timeout.connect(_on_wave)
	_timer.start()

func _on_wave() -> void:
	for i in per_wave:
		var m := _markers.pick_random()
		var mob := grime_scene.instantiate()
		mob.global_position = m.global_position
		%ScrollRoot.add_child(mob)</code></pre>
  </div>
</div>
` },

{ c: 6, t: "Turret Scene & Aim Input", html: `
<h2>The turret — hierarchy &amp; input</h2>
<div class="two">
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">Turret</span>
<span class="m">├──</span><span class="b">Node3D</span> <span class="g">Yaw</span> <span class="m">← mouse X</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">Node3D</span> <span class="g">Pitch</span> <span class="m">← mouse Y</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──</span><span class="b">MeshInstance3D</span> <span class="g">Barrel</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──</span><span class="b">Marker3D</span> <span class="g">Muzzle</span>
<span class="m">├──</span><span class="b">RayCast3D</span> <span class="g">Hitscan</span> <span class="m">← to_muzzle dir</span>
<span class="m">├──</span><span class="b">AudioStreamPlayer3D</span> <span class="g">ShotSfx</span>
<span class="m">└──</span><span class="b">GPUParticles3D</span> <span class="g">MuzzleFlash</span>

<span class="m"># Yaw/Pitch split = no gimbal weirdness</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Two-axis rig:</b> yaw node rotates on Y; nested pitch node rotates on X. Classic FPS/turret skeleton — reuse everywhere.</li>
      <li>Aim input via <code>_unhandled_input</code> mouse motion (relative), or <code>InputEventMouseMotion</code> accumulators for smoothing.</li>
      <li>Capture the mouse for a game feel: <code>Input.mouse_mode = MOUSE_MODE_CAPTURED</code>; ESC releases.</li>
      <li>Raw mouse deltas are in pixels — multiply by a sensitivity <em>radians/px</em>.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Rotating one node's <code>rotation.y</code> AND <code>rotation.x</code> together gives gimbal flips past ±90° pitch. The nested yaw/pitch rig makes this impossible.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Aiming Implementation", html: `
<h2>Aim math &amp; clamping</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Mouse X → yaw (negated), mouse Y → pitch; clamp pitch to −80°…80° so the barrel never flips.</li>
      <li><b>Smoothing:</b> lerp current toward target rotation — or ship raw for twitchy shooters. Both valid; be deliberate.</li>
      <li>Mouse capture belongs in <code>_unhandled_input</code>; consume clicks so UI never also fires the gun.</li>
    </ul>
  </div>
  <div>
<pre data-file="turret_aim.gd" data-lang="gdscript"><code>extends Node3D  # Turret root

@export var sensitivity := 0.0025   # rad per pixel
@export var pitch_clamp := deg_to_rad(80.0)
@export var smoothing := 18.0       # 0 = raw

@onready var yaw: Node3D = $Yaw
@onready var pitch: Node3D = $Yaw/Pitch

var _target_yaw := 0.0
var _target_pitch := 0.0

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_target_yaw   -= event.relative.x * sensitivity
		_target_pitch -= event.relative.y * sensitivity
		_target_pitch = clampf(_target_pitch,
			-pitch_clamp, pitch_clamp)
	elif event is InputEventKey \
			and event.pressed and event.keycode == KEY_ESCAPE:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _process(delta: float) -> void:
	var k := 1.0 - exp(-smoothing * delta)
	yaw.rotation.y = lerpf(yaw.rotation.y, _target_yaw, k)
	pitch.rotation.x = lerpf(pitch.rotation.x,
		_target_pitch, k)</code></pre>
  </div>
</div>
` },

{ c: 6, t: "Vertical Scrolling Mechanics", html: `
<h2>The scrolling world</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>World moves, player doesn't:</b> translate <code>ScrollRoot</code> downward (enemies approach the turret). Simpler physics, no floating-point drift at km 200.</li>
      <li><b>Loop illusion:</b> two tube-wall segments (length L); whichever passes behind the camera teleports +2L — infinite tube, 2 meshes.</li>
      <li>Speed ramps with wave number — difficulty as data.</li>
      <li>Treadmill credits: UI counter "depth (m)" = <code>scroll_speed * elapsed</code>.</li>
    </ul>
  </div>
  <div>
<pre data-file="scroll.gd" data-lang="gdscript"><code>extends Node3D  # ScrollRoot

@export var speed := 3.0         # m/s, ramps per wave
@export var segment_len := 40.0

@onready var _seg_a: MeshInstance3D = $TubeA
@onready var _seg_b: MeshInstance3D = $TubeB

func _process(delta: float) -> void:
	position.y -= speed * delta    # world falls
	# Recycle segments: whichever dropped one length
	# below the other jumps back above it.
	for seg in [_seg_a, _seg_b]:
		if seg.global_position.y &lt; position.y - segment_len:
			seg.position.y += segment_len * 2.0

func set_wave(n: int) -> void:
	speed = 3.0 + 0.4 * n          # gentle ramp</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Keep the <b>action near origin</b> and move the world — beyond a few km, float32 precision makes shadows/jitter visible. Classic endless-runner engineering.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Shooting: Hitscan vs Projectile", html: `
<h2>Two weapons, two philosophies</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th></th><th>Hitscan (RayCast3D)</th><th>Projectile (RigidBody/Area)</th></tr>
  <tr><td>Feedback</td><td>instant line</td><td>dodgeable object</td></tr>
  <tr><td>Cost</td><td>1 ray query</td><td>physics body per shot (pool!)</td></tr>
  <tr><td>Skill expression</td><td>aim only</td><td>aim + lead + travel time</td></tr>
  <tr><td>Determinism</td><td>perfect</td><td>tunneling risk (CCD!)</td></tr>
  <tr><td>Best for</td><td>lasers, snipers</td><td>rockets, plasma, mortars</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Ship both (as this game does): instant laser on LMB, plasma bolt on RMB. Players self-select, and you learn both systems.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p>Fast projectiles tunnel through thin walls between ticks. Fixes: <code>continuous_cd</code> on RigidBody3D, motion-swept Area3D, or manual ray-from-old-to-new-position per physics tick.</p></div>
</div>
` },

{ c: 6, t: "Hitscan: RayCast3D", html: `
<h2>Laser — the RayCast3D weapon</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>RayCast3D</code> node: set <code>target_position</code> (local space!), collision mask to enemies+world, <code>force_raycast_update()</code> for same-frame truth.</li>
      <li>On fire: update ray, check <code>is_colliding()</code> → <code>get_collider()</code> + <code>get_collision_point()</code>.</li>
      <li>Draw the beam: an <code>ImmediateMesh</code> line or a stretched thin cylinder + emissive material; fade via tween.</li>
      <li>Apply damage through the collider's <code>Health</code> component — no <code>if body is Grime</code> chains.</li>
    </ul>
  </div>
  <div>
<pre data-file="laser.gd" data-lang="gdscript"><code>extends Node3D  # on Turret

@export var damage := 8
@export var beam_mesh: MeshInstance3D
@onready var ray: RayCast3D = $Hitscan

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton \
			and event.pressed \
			and event.button_index == MOUSE_BUTTON_LEFT:
		_fire()

func _fire() -> void:
	ray.force_raycast_update()
	if ray.is_colliding():
		var hit := ray.get_collider()
		var point := ray.get_collision_point()
		_draw_beam(%Muzzle.global_position, point)
		if hit.has_method("take_damage"):
			hit.take_damage(damage)   # duck-typed damage

func _draw_beam(from: Vector3, to: Vector3) -> void:
	var mid := (from + to) * 0.5
	beam_mesh.global_position = mid
	beam_mesh.look_at(to, Vector3.UP)
	beam_mesh.scale.z = from.distance_to(to)
	# then a quick alpha-out tween…</code></pre>
  </div>
</div>
` },

{ c: 6, t: "Projectile Scene & Physics", html: `
<h2>Plasma bolt — projectile design</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Area3D-based projectile</b> (not RigidBody3D): we don't need bounces/gravity — a sensor flying a straight line is cheaper and deterministic.</li>
      <li>Move it yourself in <code>_physics_process</code>: <code>global_position += dir * speed * delta</code>.</li>
      <li>Detect via <code>body_entered</code>; layers: projectile masks enemies + world.</li>
      <li>Lifetime cap (<code>Timer</code> or distance) → release back to the pool (next slides).</li>
      <li><b>Spawn transform:</b> muzzle's global transform — inherits aim instantly.</li>
    </ul>
  </div>
  <div>
<pre data-file="plasma_bolt.gd" data-lang="gdscript"><code>class_name PlasmaBolt
extends Area3D

const SPEED := 30.0
var damage := 12
var _dir := Vector3.FORWARD
var _life := 2.0

func fire(from: Transform3D, dmg: int) -> void:
	global_transform = from
	damage = dmg
	# Marker3D faces -Z → forward = muzzle -Z:
	_dir = -from.basis.z
	_life = 2.0
	set_physics_process(true)

func _physics_process(delta: float) -> void:
	global_position += _dir * SPEED * delta
	_life -= delta
	if _life &lt;= 0.0:
		_release()

func _on_body_entered(body: Node3D) -> void:
	if body.has_method("take_damage"):
		body.take_damage(damage)
	_release()

func _release() -> void:
	# Hand me back to the pool (next slide):
	%ProjectilePool.release(self)</code></pre>
  </div>
</div>
` },

{ c: 6, t: "Object Pooling", html: `
<h2>Object pooling — stop allocating in combat</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Spawning + <code>queue_free</code> per shot = instantiation churn, GC spikes, first-frame hitches.</li>
      <li><b>Pool:</b> pre-create N instances, hide the spares; <b>acquire</b> = show + configure; <b>release</b> = hide + store.</li>
      <li>Instances stay in the tree (hidden, physics off) — <code>set_physics_process(false)</code>, <code>monitoring = false</code>.</li>
      <li>Grow-on-demand: pool empties → instantiate one more and log it (that's your sizing telemetry).</li>
    </ul>
  </div>
  <div>
<pre data-file="pool.gd" data-lang="gdscript"><code>class_name ProjectilePool
extends Node

@export var scene: PackedScene
@export var prewarm := 24

var _idle: Array[Node] = []      # available
var _busy := 0                   # in flight

func _ready() -> void:
	for i in prewarm:
		_stash(_new_one())

func acquire() -> Node:
	var n := _idle.pop_back() if not _idle.is_empty() \
			else _new_one()      # grow + telemetry
	_busy += 1
	n.show()
	n.process_mode = PROCESS_MODE_INHERIT
	n.set_physics_process(true)
	return n

func release(n: Node) -> void:
	_busy -= 1
	_stash(n)

func _stash(n: Node) -> void:
	n.hide()
	n.process_mode = PROCESS_MODE_DISABLED
	_idle.append(n)

func _new_one() -> Node:
	var n := scene.instantiate()
	add_child(n)
	return n</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>Pools turn "allocate mid-fight" into "recycle". Same trick for enemies, particles, floating damage numbers — anything that dies en masse.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Enemy State Machines", html: `
<h2>Enemies — enum FSM</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>States: <code>SPAWN</code> (scale in, invulnerable) → <code>RISE</code> (approach) → <code>ATTACK</code> (latched, drains HP) → <code>DIE</code>.</li>
      <li>An <code>enum</code> + <code>match</code> per-tick = the honest FSM. No framework needed until states exceed ~6 (then Ch 12's HFSM).</li>
      <li>Transitions emit signals: <code>died(points)</code> → spawner/HUD react; state changes drive the AnimationPlayer directly.</li>
      <li>Shared <b>Health</b> component (Ch 3) — one script, every enemy.</li>
    </ul>
  </div>
  <div>
<pre data-file="grime.gd" data-lang="gdscript"><code>class_name Grime
extends CharacterBody3D

signal died(points: int)

enum State { SPAWN, RISE, ATTACK, DIE }

@export var rise_speed := 2.5
@export var points := 15

var state := State.SPAWN
var _t := 0.0

func _physics_process(delta: float) -> void:
	_t += delta
	match state:
		State.SPAWN:
			scale = scale.lerp(Vector3.ONE, 6.0 * delta)
			if _t &gt; 0.4: _set(State.RISE)
		State.RISE:
			velocity.y = rise_speed
			# wobble on XZ:
			velocity.x = sin(_t * 3.0) * 0.8
			move_and_slide()
			if global_position.y &gt; %Turret.global_position.y - 1.0:
				_set(State.ATTACK)
		State.ATTACK:
			GameEvents.player_hurt.emit(4 * delta)
		State.DIE:
			pass  # handled by tween + release

func take_damage(dmg: int) -> void:  # duck-typed API
	$Health.take_hit(dmg)  # emits died on zero

func _set(next: State) -> void:
	state = next
	$Anim.play(State.keys()[next].to_lower())</code></pre>
  </div>
</div>
` },

{ c: 6, t: "Wave Logic & Difficulty", html: `
<h2>Waves — data-driven difficulty</h2>
<div class="two">
  <div>
<pre data-file="waves.gd" data-lang="gdscript"><code>class_name WaveDirector
extends Node

const WAVES: Array[Dictionary] = [
	{ "grime": 3,  "interval": 2.0, "hp": 20 },
	{ "grime": 5,  "interval": 1.6, "hp": 28 },
	{ "grime": 7,  "interval": 1.2, "hp": 36 },
	{ "grime": 10, "interval": 0.9, "hp": 44 },
]

var wave := -1 : set = _start_wave

func _start_wave(_v: int) -> void:
	wave += 1
	if wave &gt;= WAVES.size():
		GameEvents.game_over.emit(true)  # survived!
		return
	var w := WAVES[wave]
	%Spawner.configure(w.grime, w.interval)
	%Scroll.set_wave(wave)
	Grime.base_hp = w.hp
	%HUD.announce("WAVE %d" % (wave + 1))

# next wave when get_tree().get_nodes_in_group(
#     "enemies").is_empty() AND spawner drained</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li>Difficulty as a <b>table</b>, not scattered ifs — designers tune numbers, not code.</li>
      <li>Wave advance condition: enemies cleared + spawner empty → <code>WaveDirector.wave += 1</code>.</li>
      <li>Escalation axes used: count, rate, HP, scroll speed. (Unused: enemy types — exercise!)</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Expose wave tables as <code>Array[Dictionary]</code> exports or a <code>.tres</code> custom resource so balancing happens in the Inspector during playtests.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Health & Damage Flow", html: `
<h2>Damage plumbing — signals all the way</h2>
<div class="flow">
  <div class="fbox"><b>Weapon</b>hit / body_entered</div>
  <div class="arr">→</div>
  <div class="fbox"><b>Health.take_hit()</b>component on enemy/player</div>
  <div class="arr">→</div>
  <div class="fbox"><b>health_changed / died</b>signals</div>
  <div class="arr">→</div>
  <div class="fbox acc"><b>HUD · spawner · audio</b>subscribers react</div>
</div>
<div class="two">
  <div>
<pre data-file="health_component.gd" data-lang="gdscript"><code>class_name Health
extends Node       # child of the body it protects

signal health_changed(cur: int, max: int)
signal died

@export var max_health := 30
var current := 30
var invulnerable := false

func _ready() -> void:
	current = max_health

func take_hit(amount: int) -> void:
	if invulnerable: return
	current = maxi(current - amount, 0)
	health_changed.emit(current, max_health)
	if current == 0:
		died.emit()
		get_parent().queue_free()</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li>Weapons <b>never</b> know enemy types — they call <code>take_damage</code> / <code>Health.take_hit</code>.</li>
      <li>Death belongs to the entity; <em>reactions</em> to death belong to subscribers (score, drop loot, sound).</li>
      <li>Player HP lives in <code>GameEvents</code> (or a player autoload); HUD renders, never computes.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Double-kills: two bolts in one frame → <code>died</code> twice → double points. Guard: <code>if current == 0: return</code> at the top of <code>take_hit</code>.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Collision Layers & Masks", html: `
<h2>Layers &amp; masks — the 32-channel discipline</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Each body has a 32-bit <b>layer</b> ("what I am") and <b>mask</b> ("what I scan for"). A detects B when <code>B.layer &amp; A.mask</code>.</li>
      <li><b>Name layers in Project Settings</b> — Layer Names → 3D Physics. This slide's map:
        <ul>
          <li>1 <code>world</code> · 2 <code>player</code> · 3 <code>enemies</code></li>
          <li>4 <code>player_projectiles</code> · 5 <code>enemy_bodies</code></li>
        </ul></li>
      <li>Turret hitscan ray: mask = enemies+world. Plasma bolt (Area3D): mask = enemies+world, layer = none needed.</li>
      <li>Enemies moving with <code>move_and_slide</code>: mask = world (they don't collide with each other → free perf + no clumping).</li>
    </ul>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Object</th><th>Layer</th><th>Mask</th></tr>
      <tr><td>Turret RayCast</td><td>—</td><td>world, enemies</td></tr>
      <tr><td>Plasma bolt (Area)</td><td>—</td><td>world, enemies</td></tr>
      <tr><td>Grime (CharacterBody)</td><td>enemies</td><td>world</td></tr>
      <tr><td>Tube walls (Static)</td><td>world</td><td>—</td></tr>
      <tr><td>Seed pickups (Ch5 Area)</td><td>—</td><td>player</td></tr>
    </table></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Draw this table on paper for every project before touching masks. Most "my raycast ignores the wall" bugs are a mask typo.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Impacts & Feedback", html: `
<h2>Impact juice — hitstop, flashes, shake</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Enemy flash:</b> duplicate material on hit (make unique!), tween <code>albedo_color → white</code> and back.</li>
      <li><b>Hitstop:</b> <code>Engine.time_scale = 0.05</code> for 60 ms on kills — perceived weight.</li>
      <li><b>Camera shake:</b> random offset via noise (FastNoiseLite) decaying over 0.2 s — trauma model (shake = trauma²).</li>
      <li><b>Death burst:</b> pooled GPUParticles3D + a brief OmniLight3D flash.</li>
    </ul>
  </div>
  <div>
<pre data-file="camera_shake.gd" data-lang="gdscript"><code>extends Camera3D  # on the turret rig

var _trauma := 0.0
var _noise := FastNoiseLite.new()
var _t := 0.0

func add_trauma(amount: float) -> void:
	_trauma = minf(_trauma + amount, 1.0)

func _process(delta: float) -> void:
	_trauma = maxf(_trauma - 1.5 * delta, 0.0)
	_t += delta * 30.0
	var shake := _trauma * _trauma   # trauma² curve
	h_offset = _noise.get_noise_2d(_t, 0) * shake * 0.4
	v_offset = _noise.get_noise_2d(0, _t) * shake * 0.4

# Usage: %Camera.add_trauma(0.3) on each enemy death</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Shake the camera via <code>h_offset/v_offset</code> (or a dedicated shake node), never by mutating the follow transform — your follow logic stays clean.</p></div>
  </div>
</div>
` },

{ c: 6, t: "HUD: Health & Score", html: `
<h2>Control nodes — first real UI</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>Control</code> = base of all UI: <b>anchors</b> pin it to the screen/parent edges; <b>containers</b> lay children out automatically.</li>
      <li>HUD stack: <code>CanvasLayer → Control (full rect)</code> → <code>TextureProgressBar</code> (HP), <code>Label</code> (score), <code>Label</code> (wave banner).</li>
      <li><b>Anchors preset</b> per element (Top Left, Center…); containers (<code>HBoxContainer</code>, <code>MarginContainer</code>) for grouping.</li>
      <li>Keep UI dumb: subscribe to signals, render values, emit button clicks upward.</li>
    </ul>
  </div>
  <div>
<pre data-file="hud.gd" data-lang="gdscript"><code>extends CanvasLayer

func _ready() -> void:
	GameEvents.score_changed.connect(
		func(t): %Score.text = "%06d" % t)
	GameEvents.player_hurt.connect(_on_hurt)
	GameEvents.player_hp.connect(
		func(hp, mx): %HpBar.value = 100.0 * hp / mx)

func _on_hurt(_amount: float) -> void:
	# Red vignette pulse on damage:
	var tw := create_tween()
	tw.tween_property(%DamageVignette, "modulate:a",
		0.6, 0.05).from(0.0)
	tw.tween_property(%DamageVignette, "modulate:a",
		0.0, 0.45)</code></pre>
    <div class="callout note"><b>ℹ Note</b><p>UI theming (fonts, styles, <code>Theme</code> resources) gets its proper deep-dive across Ch 8's HUD and Ch 13's reference.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Game Over & Restart", html: `
<h2>Restart correctness</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>get_tree().reload_current_scene()</code> — fresh scene, cheap and correct for this scale.</li>
      <li><b>Reset the singletons:</b> autoloads survive reloads — explicitly zero <code>GameEvents.score</code>, heal player HP, reset <code>state</code>.</li>
      <li><b>Release the mouse</b> and pause appropriately on the death screen.</li>
      <li>Wave banner tween + retry button with keyboard focus (<span class="kbd">Enter</span> restarts).</li>
    </ul>
  </div>
  <div>
<pre data-file="restart.gd" data-lang="gdscript"><code>extends Control  # DeathScreen

func _ready() -> void:
	GameEvents.game_over.connect(_show)
	%Retry.pressed.connect(_retry)

func _show(_won: bool) -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	%Retry.grab_focus()      # Enter/Space works

func _retry() -> void:
	GameEvents.reset()       # score, hp, wave state
	get_tree().reload_current_scene()

# GameEvents.reset():
#   score = 0; state = PLAYING
#   player_hp = max_hp; wave = -1</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Autoload state is the #1 source of "second run is broken". A <code>reset()</code> in the autoload (called before reload) is mandatory hygiene.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Testing & Tuning", html: `
<h2>Playtest like an engineer</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Tuning panel:</b> a debug CanvasLayer with sliders bound to <code>GameEvents</code> tunables (fire rate, speeds, HP) — tweak live during play.</li>
      <li><b>Cheat keys</b> in <code>OS.is_debug_build()</code>: K = kill all, W = next wave, G = god mode.</li>
      <li><b>Session metrics:</b> time-to-death, waves reached, shots/hit-rate — print at game over. Balance from data.</li>
      <li>Two-minute test loop: run, note one friction, fix one friction, repeat.</li>
    </ul>
  </div>
  <div>
<pre data-file="cheats.gd" data-lang="gdscript"><code>extends Node  # debug_tools.tscn (autoload-adjacent)

func _unhandled_key_input(event: InputEvent) -> void:
	if not OS.is_debug_build():
		return
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_K:
				for e in get_tree().get_nodes_in_group("enemies"):
					e.take_damage(999)
			KEY_W:
				WaveDirector.wave += 1
			KEY_G:
				%PlayerHealth.invulnerable = \
					not %PlayerHealth.invulnerable</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Debug tools are features. Budget an hour to build them; save ten hours using them. Strip them in release with <code>is_debug_build()</code> gates.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Performance Checklist", html: `
<h2>Tube Cleaner — performance checklist</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Projectiles pooled (prewarm 24, grows logged) ✔</li>
      <li>One shared material per enemy type; per-hit <em>duplicate</em> only for the 0.1 s flash window.</li>
      <li>Enemies ignore each other in masks — collision broadphase stays quiet.</li>
      <li>Beam = stretched primitive, not a per-frame CSG/mesh build.</li>
      <li>Scroll = 2 recycled segments, not infinite generation.</li>
      <li>HUD updates on signal, not per frame.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Debug overlay @ release-export, 100 grimes:</span>
FPS 121 <span class="dim">(8.3 ms)</span>  process 1.9 ms  physics 2.2 ms
<span class="dim">draw calls 240 · objects 612 · video mem 318 MB</span>
<span class="dim">pool: plasma 24/24 idle 0 · grows 1</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>Watch <code>Performance.OBJECT_COUNT</code> across waves — a leak shows as monotonic growth. Pools make this graph <em>flat</em>.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Chapter 06 Pitfalls", html: `
<h2>Chapter 06 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Instantiating but forgetting add_child</b><p><code>instantiate()</code> alone creates an orphan — no tree, no <code>_ready</code>, invisible. Orphan detectors (Debugger → Misc) catch these.</p></div>
    <div class="callout pit"><b>⚠ Modifying physics state in callbacks</b><p>Setting <code>monitoring</code>/<code>disabled</code> shapes inside <code>body_entered</code> errors out. Use <code>set_deferred("monitoring", false)</code>.</p></div>
    <div class="callout pit"><b>⚠ Ray masks left at default (everything)</b><p>Your laser hits your own muzzle flash particles'… nothing — but it WILL hit pickups, other projectiles, whatever's on layer 1. Set masks explicitly per emitter.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Pool objects still "alive"</b><p>A pooled bolt must fully neutralize: physics off, timers stopped, signals to world muted. Half-dead pooled objects cause ghost damage — the classic pooling bug.</p></div>
    <div class="callout pit"><b>⚠ Time scale leaks</b><p>Hitstop sets <code>Engine.time_scale = 0.05</code>… then an exception skips the restore. Use <code>await get_tree().create_timer(0.06, true, false, true)</code> (ignore_time_scale) or try/finally-style patterns.</p></div>
  </div>
</div>
` },

{ c: 6, t: "Chapter 06 Exercises", html: `
<h2>Exercises — Tube Cleaner</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 6.1 — Pool math</b><p>Fire rate 5/s, bolt lifetime 2 s → minimum pool size? Add burst mode (10/s for 0.5 s). Compute, then verify empirically via pool grow-logs.</p></div>
  <div class="callout ex"><b>✎ Ex 6.2 — Second enemy</b><p>A fast zig-zagger with 8 HP that drops XP. Constraint: reuse <code>Health</code> + FSM skeleton; only states added. No copy-pasted scripts.</p></div>
  <div class="callout ex"><b>✎ Ex 6.3 — Sweep test</b><p>Accelerate the bolt to 60 m/s through a 0.2 m wall. Observe tunneling. Fix with per-tick ray (old→new position) and verify.</p></div>
  <div class="callout ex"><b>✎ Ex 6.4 — Difficulty curve</b><p>Playtest 5 runs. Record waves reached. Adjust ONLY the WAVES table until median run ends on wave 3–4. Reflect: which single number moved the curve most?</p></div>
</div>
` },

{ c: 6, t: "Chapter 06 Recap", html: `
<h2>Chapter 06 — recap</h2>
<div class="two">
  <div>
    <h3>Systems delivered</h3>
    <ul class="pts">
      <li>PackedScene instancing &amp; spawn-point patterns.</li>
      <li>Yaw/pitch turret rig with mouse capture + smoothing.</li>
      <li>Scrolling world with recycled segments.</li>
      <li>Hitscan (RayCast3D) &amp; projectile (Area3D) weapons.</li>
      <li>Object pool with prewarm + growth telemetry.</li>
      <li>Enemy enum-FSM, wave director, signal-based damage.</li>
      <li>Layer/mask discipline; juice (hitstop, shake, flash).</li>
    </ul>
  </div>
  <div>
    <h3>Patterns banked</h3>
    <ul class="pts">
      <li>"Configure before add_child" &amp; pool neutralization.</li>
      <li>Duck-typed damage (<code>has_method</code>).</li>
      <li>Data tables for difficulty; debug tooling as features.</li>
      <li>Reset-the-autoload hygiene on restart.</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Chapter 07 Pinball</b>: surrender control to physics — rigid bodies, impulses, joints, and the art of tuning chaos.</p></div>
  </div>
</div>
` }

);
