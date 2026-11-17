/* Chapter 12 — Open-Source Action Platformer (26 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 12, t: "Chapter 12 — Action Platformer", cover: true, html: `
<div class="cov-part">Part III · Advanced Systems &amp; Projects</div>
<div class="cov-n">12</div>
<h1>Open-Source Action Platformer</h1>
<p class="cov-sub">A "Yo Frankie!"-tribute 3D platformer built on CC-BY/MIT open assets: modular scene inheritance vs composition, hierarchical state machines, multi-level streaming, local split-screen with SubViewportContainer, and advanced physics interactions.</p>
<div class="chips">
  <span class="tag">CC-BY / MIT assets</span><span class="tag">Scene inheritance</span>
  <span class="tag">Hierarchical FSM</span><span class="tag">Level streaming</span>
  <span class="tag">Split-screen</span><span class="tag">Physics interactions</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 12, t: "The Yo Frankie! Legacy", html: `
<h2>Standing on open shoulders</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Yo Frankie!</b> (2008): the Blender Foundation's open movie <em>game</em> — built with Blender's then-game-engine to prove open content pipelines. Its assets (Frankie the flying squirrel, Proog, the island) ship under <b>CC-BY</b>.</li>
      <li>This chapter's tribute uses <b>open assets end-to-end</b>: CC0/CC-BY characters &amp; props (BlenderKit, Kenney, Poly Pizza, Quaternius), MIT-licensed tool code — the professional reality of solo/small-team production.</li>
      <li><b>Engineering challenge:</b> heterogeneous assets, multiple levels, two players on one couch, deep mechanics. Everything from Parts I–III converges here.</li>
    </ul>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>License</th><th>Can sell?</th><th>Must credit?</th><th>Share changes?</th></tr>
      <tr><td>CC0</td><td>yes</td><td>no</td><td>no</td></tr>
      <tr><td>CC-BY</td><td>yes</td><td><b>yes — named</b></td><td>no</td></tr>
      <tr><td>CC-BY-SA</td><td>yes</td><td>yes</td><td><b>derivatives share alike</b></td></tr>
      <tr><td>MIT</td><td>yes</td><td>keep notice</td><td>no</td></tr>
    </table></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>CC-BY-SA assets can virally require your <em>asset derivatives</em> be shared alike; some studios ban it outright. Track licenses per file from minute one — an <code>AUTHORS.md</code> + <code>LICENSES/</code> folder is 10 minutes of setup.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Project Architecture", html: `
<h2>Architecture — the full-grown tree</h2>
<div class="two">
  <div>
    <div class="tree"><span class="g">platformer/</span>
<span class="m">├──</span><span class="b">autoload/</span> <span class="m">Events · Save · Audio</span>
<span class="m">├──</span><span class="b">player/</span> <span class="m">frankie.tscn + controller</span>
<span class="m">├──</span><span class="b">enemies/</span> <span class="m">base + variants</span>
<span class="m">├──</span><span class="b">levels/</span> <span class="m">hub · forest · cave · boss</span>
<span class="m">├──</span><span class="b">systems/</span> <span class="m">hfsm/ interactions/ camera/</span>
<span class="m">├──</span><span class="b">ui/</span> <span class="m">menus hud splitscreen</span>
<span class="m">└──</span><span class="b">assets/</span> <span class="m">models/ textures/ audio/ (CC-*)</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Autoloads (3):</b> <code>Events</code> (signal bus), <code>Save</code> (ConfigFile), <code>Audio</code> (bus director) — nothing else is global.</li>
      <li><b>levels/ = data-driven:</b> each level scene follows a contract (spawn markers, exit gate, hazard layers) so streaming &amp; the HFSM AI treat them uniformly.</li>
      <li><b>systems/ = reusable, game-agnostic</b> — HFSM, interactables, camera rigs. The folder you copy to your next game.</li>
      <li>Player &amp; enemies share the Health/Buffs components from Ch 6/8.</li>
    </ul>
  </div>
</div>
` },

{ c: 12, t: "Asset Pipeline at Scale", html: `
<h2>Open-asset pipeline discipline</h2>
<div class="two">
  <div>
    <ol class="steps">
      <li><b>Curate:</b> one source store per category (characters: Quaternius; props: Kenney). Style consistency is survival.</li>
      <li><b>Normalize:</b> batch in Blender — scale to meters, origin at feet, +Z? no: <b>−Z forward</b>, single material per mesh, sensible names (<code>frankie_body</code> not <code>Cube.017</code>).</li>
      <li><b>Rename &amp; re-license:</b> prefix files with the pack (<code>kenney_rock.glb</code>), record author/source/license in <code>AUTHORS.md</code>.</li>
      <li><b>Rig uniformly:</b> retarget through SkeletonProfileHumanoid (Ch 10) so ONE animation library drives every creature.</li>
      <li>Extract materials on import (Ch 4) for palette unification.</li>
    </ol>
  </div>
  <div>
<pre data-file="AUTHORS.md" data-lang="text"><code># Assets &amp; Attribution

| File | Author | Source | License |
|------|--------|--------|---------|
| frankie.glb | Blender Fdn | Yo Frankie! | CC-BY 3.0 |
| kenney_*.glb | Kenney | kenney.nl | CC0 |
| quaternius_*.glb | Quaternius | quaternius.com | CC0 |
| grass_tile.png | Poly Pizza asset | ... | CC-BY (author X) |

## Notes
- CC-BY items credited in-game: Options ▸ Credits
- Animations retargeted via SkeletonProfileHumanoid</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Automate the table: a small @tool script scans <code>assets/</code> for <code>.license.txt</code> sidecars and regenerates AUTHORS.md — attribution stays true as content churns.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Scene Inheritance vs Composition", html: `
<h2>The two reuse tools — finally, together</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th></th><th>Inheritance</th><th>Composition</th></tr>
      <tr><td>Meaning</td><td>child scene <em>is a variant of</em> parent</td><td>scene <em>contains</em> other scenes</td></tr>
      <tr><td>Edits flow</td><td>parent → children (with overrides)</td><td>instances stay sealed</td></tr>
      <tr><td>Best at</td><td>data-variant families (enemy types)</td><td>capabilities &amp; props (health, camera)</td></tr>
      <tr><td>Danger</td><td>fragile parent refactors</td><td>over-fragmentation</td></tr>
    </table></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Rule of thumb:</b> variants of one <em>design</em> → inheritance; assembly of <em>capabilities</em> → composition.</li>
      <li>Enemies this chapter: <code>enemy_base.tscn</code> (rig + HFSM + Health) → inherit <code>enemy_beetle.tscn</code> (stats + colors + clips), <code>enemy_bird.tscn</code> (flying flag + clips).</li>
      <li>Overridden properties show <b>green</b> in the inspector; the parent remains the single source of truth for everything else.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Cap inheritance depth at 1 (base → variant). Two+ levels of scene inheritance makes override archaeology your full-time job.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Modular Scene Design", html: `
<h2>enemy_base — the inherited chassis</h2>
<div class="two">
  <div>
    <div class="tree"><span class="b">CharacterBody3D</span> <span class="g">enemy_base</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span>
<span class="m">├──</span><span class="y">@rig_generic.glb</span> <span class="m">(retargeted)</span>
<span class="m">├──</span><span class="b">AnimationTree</span> <span class="m">+ Player</span>
<span class="m">├──</span><span class="b">Node</span> <span class="g">HFSM</span> <span class="m">(states as children)</span>
<span class="m">├──</span><span class="b">Node</span> <span class="g">Health</span> · <span class="g">Drops</span>
<span class="m">└──</span><span class="b">Area3D</span> <span class="g">Hitbox</span>

<span class="m">beetle.tscn (inherited):</span>
<span class="m">· speed = 2.0 → </span><span class="y">3.5</span> <span class="m">(override)</span>
<span class="m">· color band material</span>
<span class="m">· + PatrolGround state</span>

<span class="m">bird.tscn (inherited): flying=true</span></div>
  </div>
  <div>
    <ul class="pts">
      <li>The base owns the <b>contract</b>: exported stats, signals (<code>died</code>, <code>hit</code>), state set.</li>
      <li>Variants override values &amp; swap/add <b>state nodes</b> — never rewire the chassis.</li>
      <li>Level scripts treat enemies via the base contract (<code>take_damage</code>, groups) — variant-agnostic.</li>
      <li>New enemy designer workflow: duplicate scene → New Inherited → adjust 5 exports → done.</li>
    </ul>
    <div class="callout note"><b>ℹ Note</b><p>Scripts also inherit: <code>enemy_beetle.gd extends "res://enemies/enemy_base.gd"</code> — behavior deltas in ~20 lines each.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Hierarchical FSM I: Why", html: `
<h2>From FSM to HFSM</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Flat FSMs rot past ~8 states: cross-products like "attacking-while-airborne-stunned" explode into spaghetti arrows.</li>
      <li><b>HFSM</b>: states contain sub-states. Parent handles <em>categories</em> (Alive, Dead); children handle <em>specifics</em> (Patrol/Chase/Attack).</li>
      <li>Transitions become local: any Alive-state can react to "took fatal damage" via the parent's transition to Dead — declared once.</li>
      <li>Extra power for free: parent-level enter/exit hooks (exit Alive → disable hitboxes, play death).</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">Enemy HFSM (states as nodes)</span>
<span class="g">Root</span>
<span class="m">├──</span><span class="y">Alive</span> <span class="m">← parent handles OnDamaged</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="g">Patrol</span> <span class="m">(children: Walk, Idle, Scan)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="g">Chase</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp; └──</span><span class="g">Attack</span> <span class="m">(Windup, Strike, Recover)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="g">Stunned</span>
<span class="m">└──</span><span class="y">Dead</span>

<span class="m">Global rule: any state → Dead on hp&lt;=0</span>
<span class="m">handled ONCE at Alive/Root level.</span></div>
  </div>
</div>
` },

{ c: 12, t: "Hierarchical FSM II: Node Design", html: `
<h2>HFSM as nodes — the pattern</h2>
<div class="twoR">
  <div>
<pre data-file="state.gd" data-lang="gdscript"><code>class_name HState
extends Node

signal transitioned(to: StringName)

@export var initial_state: NodePath

var fsm: HStateMachine
var active := false

func enter(_prev: StringName) -> void:
	active = true
	for c in get_children():
		if c is HState and c.name == get_node(
				initial_state).name:
			c.enter(&amp;"")
			break

func exit() -> void:
	active = false

func tick(delta: float, actor: Node) -> void:
	for c in get_children():
		if c is HState and c.active:
			c.tick(delta, actor)  # depth-first
	_step(delta, actor)

func _step(_d: float, _actor: Node) -> void:
	pass  # override in leaves</code></pre>
  </div>
  <div>
<pre data-file="state_machine.gd" data-lang="gdscript"><code>class_name HStateMachine
extends Node

@export_node_path(Node) var actor_path
@onready var actor: Node = get_node(actor_path)

var current: HState
var _states: Dictionary = {}  # name → HState

func _ready() -> void:
	for c in get_children():
		if c is HState:
			_states[StringName(c.name)] = c
			c.fsm = self
			c.transitioned.connect(travel)
	current = get_child(0) as HState
	current.enter(&amp;"")

func travel(to: StringName) -> void:
	if not _states.has(to):
		push_warning("no state %s" % to)
		return
	current.exit()
	current = _states[to]
	current.enter(StringName(
		current.name))  # prev unknown

func _physics_process(delta: float) -> void:
	current.tick(delta, actor)</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>States = data + two hooks (enter/tick); transitions = signals upward. The machine never references gameplay classes — it drives whatever <code>actor</code> it's attached to.</p></div>
  </div>
</div>
` },

{ c: 12, t: "HFSM III: Concrete States", html: `
<h2>Writing the states</h2>
<div class="twoR">
  <div>
<pre data-file="enemy_states.gd" data-lang="gdscript"><code># ---- leaf: patrol walk ----------------
extends HState

@export var speed := 2.0

func _step(d: float, actor: Node) -> void:
	var e := actor as EnemyBase
	e.velocity.x = e._patrol_dir * speed
	e.velocity.z = 0.0
	e.move_and_slide()
	if e.is_on_wall():
		e._patrol_dir *= -1.0   # bounce patrol
	if e._can_see_player():
		transitioned.emit(&amp;"Chase")

# ---- parent: Alive --------------------
extends HState

func enter(prev: StringName) -> void:
	super(prev)
	actor.health.died.connect(
		func(): transitioned.emit(&amp;"Dead"))

# ---- Chase → Attack child -------------
extends HState

func _step(d: float, actor: Node) -> void:
	var e := actor as EnemyBase
	if e._player_distance() &gt; e.attack_range:
		e._steer_to_player(e.chase_speed, d)
	else:
		transitioned.emit(&amp;"Attack")</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li>Each state = 5–20 lines. Testability scales; debuggability scales (print <code>current</code>).</li>
      <li><b>Shared transitions</b> (damage → Dead) attach at the <em>parent</em> — declared once, inherited by all children.</li>
      <li>Variant enemies reuse states wholesale: beetle's Patrol = bird's Patrol with different exports.</li>
      <li>Add a <b>debug overlay</b> (Label3D above head showing current path) — you will use it every day.</li>
    </ul>
    <div class="callout note"><b>ℹ Note</b><p>The same HFSM skeleton runs the PLAYER controller (Ground/Air/Attack/WallSlide) — one pattern, both sides of combat.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Player Controller Advanced", html: `
<h2>Frankie — a platformer controller with opinions</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Ch 5's core + platformer-grade additions:
        <ul>
          <li><b>Slope handling:</b> <code>floor_max_angle</code> 50°; steep = slide state</li>
          <li><b>Momentum:</b> accel differs run vs turn (turn = 2× accel — snappy but weighty)</li>
          <li><b>Glide</b> (flying squirrel!): hold jump while falling → capped fall speed + forward drift</li>
          <li><b>Wall slide/wall jump</b>: wall normal memory, coyote per wall</li>
        </ul></li>
      <li>All states in the player HFSM; controller file stays a thin physics adapter.</li>
    </ul>
  </div>
  <div>
<pre data-file="glide.gd" data-lang="gdscript"><code># Player state: Glide (Frankie's signature)
extends HState

const GLIDE_FALL := 1.5     # capped fall speed
const GLIDE_DRIFT := 5.0    # forward push

func enter(_p: StringName) -> void:
	actor.velocity.y = minf(actor.velocity.y, 0.0)
	actor.anim.travel(&amp;"glide")

func _step(delta: float, actor: Node) -> void:
	var p := actor as Player
	if not p._jump_held or p.is_on_floor():
		transitioned.emit(&amp;"Ground")
		return
	# Horizontal authority mid-air:
	var dir := p._cam_relative_input()
	p.velocity.x = move_toward(p.velocity.x,
		dir.x * GLIDE_DRIFT, 10.0 * delta)
	p.velocity.z = move_toward(p.velocity.z,
		dir.z * GLIDE_DRIFT, 10.0 * delta)
	p.velocity.y = move_toward(p.velocity.y,
		-GLIDE_FALL, 12.0 * delta)  # soft floor
	p.move_and_slide()</code></pre>
  </div>
</div>
` },

{ c: 12, t: "Combat System", html: `
<h2>Combat — hitboxes, hurtboxes, hitstop</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Vocabulary:</b> hurtbox = where you CAN be hit (always on); hitbox = active only during attack windows.</li>
      <li>Layers: <code>player_hit</code> vs <code>enemy_body</code> and mirrored — table from Ch 6 extended, never violated.</li>
      <li>Attack windows driven by <b>animation method-call tracks</b> (Ch 10): <code>hitbox_on()</code>/<code>hitbox_off()</code>.</li>
      <li><b>Hitstop</b> 60 ms on connect + camera micro-shake + flash — the "juice triangle".</li>
      <li>Knockback: <code>velocity = dir * power</code> + brief Stunned HFSM state on the receiver.</li>
    </ul>
  </div>
  <div>
<pre data-file="attack.gd" data-lang="gdscript"><code># On enemy_base (or player) — driven by anim tracks:
extends CharacterBody3D

func hitbox_on() -> void:
	%AttackHitbox.monitoring = true

func hitbox_off() -> void:
	%AttackHitbox.set_deferred("monitoring", false)

# Area3D hitbox child:
func _on_hit(body: Node3D) -> void:
	if body == self or not body.has_method(
			"take_damage"):
		return
	var from := global_position
	var to := body.global_position
	body.take_damage(damage)
	if body is CharacterBody3D:
		var kb := (to - from).normalized() \
			* knockback
		kb.y = 2.0
		body.velocity = kb
	Engine.time_scale = 0.05
	await get_tree().create_timer(0.06, true,
		false, true).timeout   # ignore time_scale!
	Engine.time_scale = 1.0</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Hitstop via <code>Engine.time_scale</code> + a normal timer = the restore never fires (timer is frozen too). Use <code>create_timer(…, ignore_time_scale=true)</code> — arg 4 — as shown.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Interactions & Physics Toys", html: `
<h2>Advanced physics interactions</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Moving platforms:</b> <code>AnimatableBody3D</code> (kinematic mover) — riders inherit velocity via <code>get_platform_velocity()</code> (built into CharacterBody3D).</li>
      <li><b>Push physics:</b> player CharacterBody3D pushes RigidBody crates — set <code>platform_on_leave = VELOCITY</code> and mass ratio in <code>move_and_slide</code> collisions.</li>
      <li><b>Swing ropes:</b> chain of RigidBody links + PinJoints; grab via BoneAttachment-equivalent + <code>joint</code> on demand.</li>
      <li><b>Levers/doors:</b> interact (below) → <code>AnimatableBody3D</code> tween — physics-correct animated motion.</li>
    </ul>
  </div>
  <div>
<pre data-file="platform_rider.gd" data-lang="gdscript"><code># Moving platform (kinematic, moves in _physics_process):
extends AnimatableBody3D

@export var to := Vector3(6, 0, 0)
@export var duration := 4.0
var _t := 0.0

func _physics_process(delta: float) -> void:
	_t = fmod(_t + delta, duration * 2.0)
	var half := duration
	var ping := _t &lt; half
	var k := (_t if ping else 2.0 * half - _t) / half
	k = k * k * (3.0 - 2.0 * k)   # smoothstep
	position = (to * k) + Vector3.ZERO - to * 0.0

# On the PLAYER (riders inherit via platform velocity):
func _physics_process(delta: float) -> void:
	velocity += get_platform_velocity() * delta * 0.0
	# Actually: move_and_slide already adds platform
	# motion — but carrying ACROSS gaps needs:
	if get_platform():
		_coyote_from_platform = 0.15</code></pre>
    <div class="callout note"><b>ℹ Note</b><p><code>AnimatableBody3D</code> = StaticBody3D that reports its motion to the solver. Animated doors/platforms should be Animatable, never hand-transformed StaticBodies (riders jitter).</p></div>
  </div>
</div>
` },

{ c: 12, t: "Interaction System", html: `
<h2>Interactables — one verb, many targets</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Contract:</b> any node in group <code>interactable</code> implementing <code>interact(player)</code> + <code>prompt() → String</code>.</li>
      <li>Player runs a short RayCast3D; nearest interactable within 2.5 m shows prompt (<code>unproject_position</code> to screen, Ch 8).</li>
      <li>Levers, chests, NPCs, save shrines — all the same interface. Dialogue = just another interactable with a longer callback.</li>
      <li>Prompt UI = one Label that follows targets — zero per-object UI scenes.</li>
    </ul>
  </div>
  <div>
<pre data-file="interactable.gd" data-lang="gdscript"><code># player/interactor.gd
extends RayCast3D

var _target: Node3D = null

func _physics_process(_d: float) -> void:
	force_raycast_update()
	var col := get_collider()
	_target = col if col and col.is_in_group(
		"interactable") else null
	Events.interact_target.emit(
		_target)  # HUD shows/hides prompt

func try_interact() -> void:
	if _target and _target.has_method("interact"):
		_target.interact(owner)

# res://levels/lever.gd
func interact(_player: Node) -> void:
	_rotate_handle()
	Events.door_toggled.emit(door_id)

func prompt() -> String:
	return "Pull lever"</code></pre>
  </div>
</div>
` },

{ c: 12, t: "Level Streaming I: Model", html: `
<h2>Multi-level streaming — the model</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Levels as compartments:</b> hub + gated levels; the player &amp; UI persist; level scenes swap inside a <code>LevelRoot</code>.</li>
      <li>Two mechanisms:
        <ul>
          <li><b>change_scene_to_file</b> — blunt; rebuilds everything (menus → game).</li>
          <li><b>Manual load/unload under LevelRoot</b> — surgical; keeps autoloads, players, music (our choice).</li>
        </ul></li>
      <li><b>Async load</b> (<code>ResourceLoader.load_threaded_*</code>) + a brief fade = seamless-feeling swaps even for heavy levels.</li>
      <li>Every level implements the contract: <code>spawn_points</code>, <code>exit_gate</code>, <code>on_level_ready</code> signal.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Hub scene</b>player persists, selects level</div>
      <div class="arr">↓ fade + threaded load</div>
      <div class="fbox acc"><b>LevelRoot.swap(path)</b>free old → add new</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Level ready</b>place player at spawn, resume</div>
    </div>
    <div class="callout bp"><b>✓ Best Practice</b><p>One "level contract" script class (<code>class_name Level extends Node3D</code> with required exports) — the streaming system and gameplay never special-case a level again.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Level Streaming II: Implementation", html: `
<h2>Streaming code</h2>
<pre data-file="level_root.gd" data-lang="gdscript"><code>class_name LevelRoot
extends Node3D

signal level_ready(level: Level)

var current: Level = null
var _busy := false

func swap(level_path: String, spawn: StringName = &amp;"a") -> void:
	if _busy:
		return
	_busy = true
	Events.request_fade.emit(0.3)          # screen fades
	await Events.fade_done

	# --- unload ---
	if current:
		current.queue_free()               # contracts handle cleanup
		await get_tree().process_frame
		await get_tree().process_frame     # let tree settle

	# --- async load (no hitch on big scenes) ---
	var err := ResourceLoader.load_threaded_request(level_path)
	if err != OK:
		push_error("load failed: %s" % level_path)
		_busy = false
		return
	var packed: PackedScene
	while true:
		var progress := []
		var status := ResourceLoader.load_threaded_get_status(
			level_path, progress)
		if status == ResourceLoader.THREAD_LOAD_LOADED:
			packed = ResourceLoader.load_threaded_get(level_path)
			break
		if status in [ResourceLoader.THREAD_LOAD_FAILED,
				ResourceLoader.THREAD_LOAD_INVALID_RESOURCE]:
			push_error("threaded load failed")
			_busy = false
			return
		await get_tree().process_frame

	current = packed.instantiate()
	add_child(current)
	var player := %Frankie as Player
	player.global_transform = current.spawn_transform(spawn)
	level_ready.emit(current)
	Events.request_fade.emit(0.0)          # fade back in
	_busy = false</code></pre>
<div class="callout perf"><b>⚡ Performance</b><p>Threaded loading keeps the main loop at 60 fps during swaps — the progress array also feeds a real loading bar if you ship one.</p></div>
` },

{ c: 12, t: "Persistence: Save System", html: `
<h2>Save data with ConfigFile</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>user://</code> = per-player writable dir (Windows: <code>%APPDATA%/Godot/app_userdata/…</code>); never write into <code>res://</code> (read-only in exports).</li>
      <li><b>ConfigFile</b>: INI sections — human-readable saves, trivially versioned (add sections, don't rename).</li>
      <li>Save <b>facts, not objects</b>: level unlocked, position, collected-ids (not node references!).</li>
      <li>Autoload <code>Save</code> owns file I/O; gameplay speaks in dictionaries via signals.</li>
      <li><code>get_user_data_dir()</code> for debugging; 3 slots + autosave for players.</li>
    </ul>
  </div>
  <div>
<pre data-file="save.gd" data-lang="gdscript"><code># autoload/save.gd
extends Node

const PATH := "user://save.ini"

var data := ConfigFile.new()

func _ready() -> void:
	var err := data.load(PATH)
	if err != OK:
		data.set_value("meta", "version", 1)

func write() -> void:
	data.save(PATH)

func save_checkpoint(level: String, at: Vector3,
		collected: Array) -> void:
	data.set_value("progress", "level", level)
	data.set_value("progress", "pos",
		[ at.x, at.y, at.z ])
	data.set_value("progress", "collected",
		collected)
	write()

func load_checkpoint() -> Dictionary:
	return {
		"level": data.get_value(
			"progress", "level", "hub"),
		"pos": data.get_value(
			"progress", "pos", [0, 1, 0]),
		"collected": data.get_value(
			"progress", "collected", []),
	}</code></pre>
  </div>
</div>
` },

{ c: 12, t: "Split-Screen I: Model", html: `
<h2>Local split-screen — the viewport stack</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>One world, many views:</b> <code>SubViewportContainer</code> (Control, fills screen, 2 cells) → two <code>SubViewport</code>s sharing <b>one World3D</b>.</li>
      <li>Each viewport: own <code>Camera3D</code> following its player; <code>audio_listener_enable_3d = true</code> for its listener.</li>
      <li><b>Shared world</b> = both players interact with the same physics — no netcode, same Ch 3 servers doing the work.</li>
      <li>Vertical or horizontal split via container layout (HBox with 50/50 or one container stretch).</li>
      <li>UI per player: HUD <b>inside each SubViewport</b> (a CanvasLayer child of the viewport) — automatic per-view rendering.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">SubViewportContainer</span> <span class="g">Split</span>
<span class="m">├──</span><span class="b">SubViewport</span> <span class="g">P1View</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">Camera3D</span> <span class="m">(own world=false → main)</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">CanvasLayer</span> <span class="g">P1HUD</span>
<span class="m">└──</span><span class="b">SubViewport</span> <span class="g">P2View</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">Camera3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">CanvasLayer</span> <span class="g">P2HUD</span>

<span class="m">container.stretch = true</span>
<span class="m">viewport.size follows container cells</span>
<span class="m">world_3d = null → use_main_world (shared!)</span></div>
    <div class="callout note"><b>ℹ Note</b><p>Single-player mode = hide P2View, one viewport expands. Same scene serves both — no alternate camera stack to maintain.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Split-Screen II: Implementation", html: `
<h2>Split-screen details that bite</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Input per player:</b> duplicate input actions with suffixes (<code>p1_jump</code>, <code>p2_jump</code>); controllers map by device index — <code>InputEventJoypadMotion.device</code> filtering in a remap layer.</li>
      <li><b>Listener count:</b> exactly one audio listener per viewport or 3D audio doubles.</li>
      <li><b>Dynamic split</b> (optional flourish): rotate split line when players align vertically — a shader on the container; scope carefully!</li>
      <li><b>Mouse UI:</b> menus shared on the main viewport; gameplay cursors avoided in split (gamepad-first there).</li>
    </ul>
  </div>
  <div>
<pre data-file="split_screen.gd" data-lang="gdscript"><code>extends SubViewportContainer  # ui/split.tscn

@export var p1: Player
@export var p2: Player

func _ready() -> void:
	%P1View.audio_listener_enable_3d = true
	%P2View.audio_listener_enable_3d = true
	Events.players_changed.connect(_layout)

func _layout(count: int) -> void:
	%P2View.visible = count &gt; 1
	%P1HUD.set_player(p1)
	if count &gt; 1:
		%P2HUD.set_player(p2)

func _process(_d: float) -> void:
	# Viewports size to their cell automatically
	# when stretch=true — only keep aspect sane:
	for v in [%P1View, %P2View]:
		if v.visible:
			v.size = v.get_parent_area_size()

# Camera rigs follow their player (Ch 5 pattern);
# p1.camera.current is meaningless here —
# each SubViewport uses ITS OWN child camera.</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p><code>Camera3D.current</code> logic fights per-viewport cameras. In split-screen, the child camera of each viewport wins by construction — remove make_current toggling.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Cameras & Game Feel", html: `
<h2>Two-player cameras &amp; the juice checklist</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Independent rigs</b> (default): each camera follows its player; simple, readable, rooms-sized levels.</li>
      <li><b>Shared "party cam":</b> one midpoint camera, dynamic zoom = distance between players (framing rect) — cooperative intimacy; clamp zoom max/min per level.</li>
      <li>When players over-separate: soft wall or camera split — a design decision, communicated loudly in tutorial text.</li>
      <li><b>Juice pass checklist:</b> land squash · dust puffs · hitstop · knockback arcs · glide trail · coin starburst · ledge-grab anticipation · death ragdoll + slow-mo 0.5 s.</li>
    </ul>
  </div>
  <div>
<pre data-file="party_cam.gd" data-lang="gdscript"><code>extends Camera3D  # shared mode

@export var p1: Node3D
@export var p2: Node3D
@export var min_fov := 55.0
@export var max_fov := 80.0
@export var height := 6.0

func _physics_process(delta: float) -> void:
	var mid := (p1.global_position
		+ p2.global_position) * 0.5
	var spread := p1.global_position.\
		distance_to(p2.global_position)
	var target_fov := clampf(
		remap(spread, 6.0, 30.0,
			min_fov, max_fov),
		min_fov, max_fov)
	fov = lerpf(fov, target_fov, 4.0 * delta)
	var want := mid + Vector3(0, height,
		spread * 0.35 + 6.0)
	global_position = global_position.\
		lerp(want, 1.0 - exp(-6.0 * delta))
	look_at(mid, Vector3.UP)</code></pre>
  </div>
</div>
` },

{ c: 12, t: "UI & Menus", html: `
<h2>Menus as scenes — the flow graph</h2>
<div class="two">
  <div>
    <div class="tree"><span class="g">ui/</span>
<span class="m">├──</span><span class="g">main_menu.tscn</span> <span class="m">→ hub</span>
<span class="m">├──</span><span class="g">pause.tscn</span> <span class="m">(CanvasLayer, pausable=false)</span>
<span class="m">├──</span><span class="g">hud.tscn</span> <span class="m">(in split viewports)</span>
<span class="m">├──</span><span class="g">level_select.tscn</span>
<span class="m">└──</span><span class="g">credits.tscn</span> <span class="m">← generated from AUTHORS.md</span>

<span class="m">Rules:</span>
<span class="m">· process_mode = ALWAYS on pause UI</span>
<span class="m">· every button focusable (gamepad!)</span>
<span class="m">· transitions = fade via Events bus</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Pause = show a layer, not change_scene:</b> gameplay tree freezes; ALWAYS-mode UI keeps breathing.</li>
      <li><b>Focus chains</b> (neighbor paths) — menus fully gamepad-navigable; keyboard trap = broken UI.</li>
      <li><b>Credits generated from AUTHORS.md</b> — license compliance automated (slide 3's pipeline paying off).</li>
      <li>Settings: fullscreen, vsync, split direction, volume buses — persisted via the Save autoload.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>One <code>ui_manager</code> autoload that only stacks show/hides layers — state-machine-lite for screens. Menus calling <code>change_scene</code> ad hoc becomes unmaintainable by menu #5.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Performance & Shipping", html: `
<h2>Shipping the tribute</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Rendering budget:</b> Forward+ hub, baked GI in cave, visibility ranges on dressing, LOD1 on hero meshes, multimesh flora.</li>
      <li><b>Physics budget:</b> player HFSM ticks; enemies tick <b>LOD'd AI</b> (full at 25 m, patrol-only beyond, frozen at 60 m).</li>
      <li><b>Two-player cost:</b> split ≈ 2× draw calls (two viewports) — halve per-view load via the above, still 60 fps on mid GPU.</li>
      <li><b>Exports:</b> Windows/Linux/macOS desktop presets; embed PCKs; debug symbols separate. (Full pipeline: Ch 14.)</li>
      <li><b>License gate before release:</b> AUTHORS.md rendered in credits; CC-BY music attributed; code under your MIT LICENSE.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Release checklist (pre-export):</span>
☑ ERRORS in output: 0 (warnings reviewed)
☑ AI LOD verified @ 60fps split, 40 enemies
☑ Save round-trip: slot1 → wipe → load
☑ Menu-only gamepad run (no mouse) completes
☑ Credits render AUTHORS.md fully
☑ Export presets: embed pck ✔, no debug ✔
<span class="err">□ itchio page: CC-BY attributions pasted</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Turn this checklist into a <code>tools/release_check.md</code> and run it verbatim per release. Release quality is a habit, not an event.</p></div>
  </div>
</div>
` },

{ c: 12, t: "Chapter 12 Pitfalls", html: `
<h2>Chapter 12 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Inheritance override drift</b><p>Renaming a node in enemy_base breaks every variant's override links (they point by path). Audit variants after ANY parent rename — the editor shows dangling overrides in red.</p></div>
    <div class="callout pit"><b>⚠ Streaming + autoloads holding scene refs</b><p>Autoloads caching level nodes must clear them on swap — stale references are the #1 "second level breaks" bug.</p></div>
    <div class="callout pit"><b>⚠ Split-screen audio stacking</b><p>Two listeners both "hearing" the same AudioStreamPlayer3D → doubled volume/phasing. Exactly one listener per viewport, one shared world.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Physics bodies under streamed parents</b><p>queue_free on a level while bodies solve = safe, but freeing DURING a physics callback (from a hazard) can crash — defer frees triggered inside contacts.</p></div>
    <div class="callout pit"><b>⚠ Open-asset style clash</b><p>Five asset packs = five art directions. Budget a "palette pass": unify via shared materials + tonemap + fog before blaming "bad assets".</p></div>
  </div>
</div>
` },

{ c: 12, t: "Chapter 12 Exercises", html: `
<h2>Exercises — Action platformer</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 12.1 — Variant factory</b><p>Build enemy_base + 3 inherited variants (stats only). Add a fourth via <em>scene inheritance alone</em> — zero code changes. If you can't, refactor the contract until you can.</p></div>
  <div class="callout ex"><b>✎ Ex 12.2 — HFSM port</b><p>Rebuild Ch 6's grime FSM as a node HFSM. Compare line counts, testability, and adding "Stunned". Write a 5-sentence verdict on when each scale wins.</p></div>
  <div class="callout ex"><b>✎ Ex 12.3 — Seamless world</b><p>Two levels + a gate: threaded-load swap under a 0.3 s fade with player persisted. Measure: peak frame time during swap &lt; 50 ms.</p></div>
  <div class="callout ex"><b>✎ Ex 12.4 — Couch co-op run</b><p>Full split-screen with shared party cam + dynamic zoom; then independent cams. Playtest both with a friend; record which they preferred and why.</p></div>
  <div class="callout ex"><b>✎ Ex 12.5 — Ship it</b><p>Export two desktop builds, write the itch page with full attribution from AUTHORS.md, and send it to one friend. Their playthrough IS the final exam of Part III.</p></div>
</div>
` },

{ c: 12, t: "Chapter 12 Recap · Part III Complete", html: `
<h2>Chapter 12 recap — Part III complete</h2>
<div class="two">
  <div>
    <h3>Capstone systems delivered</h3>
    <ul class="pts">
      <li>Open-asset pipeline: licenses, normalization, automated attribution.</li>
      <li>Scene inheritance vs composition — applied, not theorized.</li>
      <li>Node-based hierarchical FSM (player AND enemies).</li>
      <li>Threaded level streaming with a level contract.</li>
      <li>Combat (hitboxes/hitstop), physics toys, interactables.</li>
      <li>Split-screen viewport stack; party cam; ConfigFile saves.</li>
      <li>Release checklist discipline.</li>
    </ul>
  </div>
  <div>
    <h3>You have now built</h3>
    <ul class="pts">
      <li>✅ 6 complete games across every major 3D genre</li>
      <li>✅ Networking, animation, architecture at production depth</li>
      <li>✅ A personal library: HFSM, pools, event buses, sensors, cameras</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Part IV</b> — the engine reference: materials &amp; GDShader internals, GI systems, servers, profiling playbook, and the appendix for shipping &amp; community.</p></div>
  </div>
</div>
` }

);
