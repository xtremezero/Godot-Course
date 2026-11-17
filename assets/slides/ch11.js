/* Chapter 11 — Flying Buddha (18 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 11, t: "Chapter 11 — Flying Buddha", cover: true, html: `
<div class="cov-part">Part III · Advanced Systems &amp; Projects</div>
<div class="cov-n">11</div>
<h1>Flying Buddha</h1>
<p class="cov-sub">A 3D memory &amp; matching game of floating statues — small on the surface, engineered deep: a signal-based game-state architecture, deterministic shuffling with Array.shuffle() and seeded RNG, and procedural grid layout in pure GDScript.</p>
<div class="chips">
  <span class="tag">Signal architecture</span><span class="tag">Game state machine</span>
  <span class="tag">Array.shuffle()</span><span class="tag">Seeded RNG</span>
  <span class="tag">Procedural grid</span><span class="tag">Tween polish</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 11, t: "Design & Architecture", html: `
<h2>Flying Buddha — tiny game, real architecture</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Gameplay:</b> a grid of face-down statues; flip two; match by symbol → stays revealed; else flips back; clear the board before the incense burns out.</li>
      <li><b>The lesson:</b> the whole game communicates through <b>one signal graph</b> — no node knows its siblings. Board emits facts; GameManager decides; UI/HUD/audio react.</li>
      <li><b>Scale:</b> ~300 lines total across 5 scripts. Readable end-to-end — the point.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">Signal graph (who talks to whom):</span>
<span class="b">Tile</span> <span class="m">── tile_flipped(tile) ──▶ </span><span class="b">GameManager</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;◀── reveal()/conceal() ──┘</span>
<span class="b">GameManager</span> <span class="m">── score_changed / moves_changed</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; board_cleared / time_left</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ──▶ </span><span class="b">HUD · Audio · FX</span>
<span class="b">Timer</span> <span class="m">── timeout ──▶ GameManager ── game_over</span></div>
  </div>
</div>
` },

{ c: 11, t: "Scene Layout", html: `
<h2>Scenes — five files</h2>
<div class="two">
  <div>
    <div class="tree"><span class="g">main.tscn</span>
<span class="m">├──</span><span class="b">Camera3D</span> <span class="m">(orbit rig)</span>
<span class="m">├──</span><span class="b">DirectionalLight3D</span> + <span class="b">WorldEnvironment</span>
<span class="m">├──</span><span class="y">@board.tscn</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="y">@tile.tscn</span> <span class="m">× N (runtime)</span>
<span class="m">├──</span><span class="b">Node</span> <span class="g">GameManager</span> <span class="m">(script)</span>
<span class="m">├──</span><span class="b">Timer</span> <span class="g">Incense</span>
<span class="m">└──</span><span class="b">CanvasLayer</span> <span class="g">HUD</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>tile.tscn</b> — one statue: mesh + symbol decal + flip animation. Knows nothing about the game.</li>
      <li><b>board.tscn</b> — grid container; creates tiles procedurally; owns layout math only.</li>
      <li><b>GameManager</b> — pure logic node (not even Node3D): state, scoring, match rules.</li>
      <li><b>HUD</b> — renders events; buttons emit intent upward.</li>
      <li>Each is independently testable — swap HUD for a print() and the game still runs.</li>
    </ul>
  </div>
</div>
` },

{ c: 11, t: "Game State Machine", html: `
<h2>GameManager — state as an enum, behavior as signals</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>States: <code>IDLE → SHOWING → CHECKING → RESOLVE</code> (match/no-match) → back; plus <code>WON</code>/<code>LOST</code>.</li>
      <li>Transitions are <b>guarded</b>: can't flip a third tile, can't flip during resolve — the state enum enforces correctness for free.</li>
      <li>Every mutation emits a signal — the UI is always a projection of state, never a participant.</li>
    </ul>
  </div>
  <div>
<pre data-file="game_manager.gd" data-lang="gdscript"><code>class_name GameManager
extends Node

signal state_changed(s: State)
signal score_changed(total: int)
signal moves_changed(n: int)
signal board_cleared
signal game_over(won: bool)

enum State { IDLE, SHOWING, CHECKING, RESOLVE, WON, LOST }

var state: State = State.IDLE : set = _set_state
var score := 0
var moves := 0
var _flipped: Array[Tile] = []

func on_tile_flipped(tile: Tile) -> void:
	if state != State.IDLE and state != State.SHOWING:
		return
	if tile.revealed:
		return
	tile.reveal()
	_flipped.append(tile)
	if _flipped.size() == 1:
		state = State.SHOWING
	elif _flipped.size() == 2:
		state = State.CHECKING
		moves += 1
		moves_changed.emit(moves)
		await _await_flip_in()
		_resolve_pair()

func _resolve_pair() -> void:
	state = State.RESOLVE
	var a := _flipped[0]
	var b := _flipped[1]
	_flipped.clear()
	if a.symbol_id == b.symbol_id:
		a.claim()
		b.claim()
		score += 100
		score_changed.emit(score)
		if _board_solved():
			board_cleared.emit()
			state = State.WON
			game_over.emit(true)
			return
		state = State.IDLE
	else:
		await get_tree().create_timer(0.9).timeout
		a.conceal()
		b.conceal()
		state = State.IDLE</code></pre>
  </div>
</div>
` },

{ c: 11, t: "The Tile Scene", html: `
<h2>Tile — a self-contained little machine</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>symbol_id: int</code> — the ONLY game data it holds. Visual symbol is derived (mesh/material by id).</li>
      <li>API: <code>reveal() / conceal() / claim()</code> — each a Tween choreography, each safe to call once.</li>
      <li>Emits <code>flipped</code> on click; GameManager calls back the visual verbs. Perfect decoupling.</li>
      <li>Hover feedback via <code>mouse_entered/exited</code> (Area3D or StaticBody3D input events).</li>
    </ul>
  </div>
  <div>
<pre data-file="tile.gd" data-lang="gdscript"><code>class_name Tile
extends Node3D

signal flipped(tile: Tile)

@export var symbol_id := 0 : set = _set_symbol

var revealed := false
var claimed := false

@onready var symbol: MeshInstance3D = $Symbol

func _ready() -> void:
	rotation.x = PI / 2   # start face-down

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("click"):
		var cam := get_viewport().get_camera_3d()
		var from := cam.project_ray_origin(
			get_viewport().get_mouse_position())
		var hit := %PickShape.intersects_ray(from,
			cam.project_ray_normal(from) * 20.0)
		if hit and not revealed and not claimed:
			flipped.emit(self)

func reveal() -> void:
	revealed = true
	create_tween()\
		.tween_property(self, "rotation:x", 0.0, 0.35)\
		.set_trans(Tween.TRANS_BACK)\
		.set_ease(Tween.EASE_OUT)

func conceal() -> void:
	revealed = false
	create_tween()\
		.tween_property(self, "rotation:x", PI / 2, 0.3)

func claim() -> void:
	claimed = true
	var tw := create_tween().set_parallel(true)
	tw.tween_property(self, "position:y",
		position.y + 0.6, 0.5)
	tw.tween_property(symbol, "transparency",
		1.0, 0.5)

func _set_symbol(v: int) -> void:
	symbol_id = v
	if symbol:
		symbol.material_override = \
			Symbols.material_for(v)</code></pre>
  </div>
</div>
` },

{ c: 11, t: "Seeded Determinism", html: `
<h2>Shuffling — Array.shuffle() vs RandomNumberGenerator</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>array.shuffle()</code> uses the <b>global</b> RNG — convenient, but not reproducible.</li>
      <li><code>RandomNumberGenerator</code> = your own stream: <code>rng.seed = 42</code> → identical shuffle on every run, every machine.</li>
      <li><b>Why care:</b> daily challenges ("seed = today"), bug reproduction ("happens on seed 7734"), replay verification, and multiplayer board sync (send the seed, not the board).</li>
      <li>Rule: <b>gameplay randomness = seeded rng; cosmetic randomness = global randf.</b></li>
    </ul>
  </div>
  <div>
<pre data-file="shuffle.gd" data-lang="gdscript"><code>extends Board

var rng := RandomNumberGenerator.new()

func _ready() -> void:
	rng.seed = GameEvents.daily_seed()  # or 42

func build_deck(pairs: int) -> Array[int]:
	# N symbol ids, each exactly twice:
	var deck: Array[int] = []
	for i in pairs:
		deck.append(i)
		deck.append(i)
	# Seeded Fisher–Yates — what shuffle() does,
	# but on OUR stream:
	for i in range(deck.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		@warning_ignore("integer_division")
		var t := deck[i]
		deck[i] = deck[j]
		deck[j] = t
	return deck

# Or per-call cosmetic noise (unseeded is fine):
# pitch = randf_range(0.9, 1.1)</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Log the seed at board build ("seed 7734, pairs 8"). One line today saves a reproduction session tomorrow.</p></div>
  </div>
</div>
` },

{ c: 11, t: "Procedural Grid Layout", html: `
<h2>Grid math — the layout loop</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Board = <b>rows × cols</b> of tiles. Center the grid at origin: offset each tile by <code>(col − (cols−1)/2) · spacing</code>.</li>
      <li>Aspect-aware sizing: choose cols/rows from tile count; keep tiles ≥ 1.2 m apart for comfortable ray picking.</li>
      <li>Instantiate → set symbol from shuffled deck → connect <code>flipped</code> → add. <b>Configure before add_child</b> (Ch 6 law).</li>
      <li>Same loop drives difficulty: 4×4 → 6×5 → 8×6 (bigger grid, tighter timer).</li>
    </ul>
  </div>
  <div>
<pre data-file="board.gd" data-lang="gdscript"><code>class_name Board
extends Node3D

const TILE := preload("res://board/tile.tscn")
const SPACING := 1.35

@export var cols := 4
@export var rows := 4

func build(seed_value: int) -> void:
	for c in cols:
		for r in rows:
			var i := r * cols + c
			var tile := TILE.instantiate()
			# deck deals symbols in grid order:
			tile.symbol_id = _deck[i]
			# centered position on the XZ plane:
			tile.position = Vector3(
				(c - (cols - 1) * 0.5) * SPACING, 0,
				(r - (rows - 1) * 0.5) * SPACING)
			tile.flipped.connect(
				%GameManager.on_tile_flipped)
			add_child(tile)          # now _ready fires
	# staggered entrance choreography (slide 14)
	_entrance()

func _board_solved() -> bool:
	for t in get_children():
		if t is Tile and not t.claimed:
			return false
	return true</code></pre>
  </div>
</div>
` },

{ c: 11, t: "Matching Logic Edge Cases", html: `
<h2>Rules &amp; their traps</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Double-click one tile:</b> guard <code>tile.revealed</code> (as in GameManager).</li>
      <li><b>Third flip during check:</b> state machine rejects (state ≠ IDLE/SHOWING).</li>
      <li><b>Timer death mid-pair:</b> game_over wins — guard transitions with <code>if state in [WON, LOST]: return</code>.</li>
      <li><b>Restart:</b> rebuild board with a NEW seed; GameManager resets score/moves/state; HUD listens to the same signals — zero special-casing.</li>
      <li>Difficulty variants: match-3 tiles, "curse" pairs that swap positions… all data + GameManager deltas, not rewrites.</li>
    </ul>
  </div>
  <div>
<pre data-file="edge_cases.gd" data-lang="gdscript"><code># Guards concentrated in ONE place — GameManager:

func on_tile_flipped(tile: Tile) -> void:
	if state in [State.WON, State.LOST]:
		return                    # game done
	if state in [State.CHECKING, State.RESOLVE]:
		return                    # pair in flight
	if tile.revealed or tile.claimed:
		return                    # invalid target
	# … proceed

func _on_incense_timeout() -> void:
	if state in [State.WON, State.LOST]:
		return
	state = State.LOST
	game_over.emit(false)

func restart() -> void:
	score = 0; moves = 0; _flipped.clear()
	score_changed.emit(score)
	moves_changed.emit(moves)
	state = State.IDLE
	%Board.rebuild(rng.randi())   # fresh seed</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>All guards at the top of handlers, one exit path each. The function reads like the rules card of the game.</p></div>
  </div>
</div>
` },

{ c: 11, t: "Tween Choreography I", html: `
<h2>Tweens — the animation system of small games</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>create_tween()</code> returns a Tween — sequence of steps animating <b>any property</b> (ours: rotations, positions, materials, canvas items).</li>
      <li>Chaining: default sequential; <code>set_parallel(true)</code> (or <code>.parallel()</code> per-step) for simultaneity.</li>
      <li><b>Transitions/eases</b> sell physics: BACK overshoot, ELASTIC wobble, SINE breathing.</li>
      <li>Callbacks &amp; intervals: <code>tween_callback(fn)</code>, <code>tween_interval(0.4)</code> — cutscene sequencing without timers.</li>
      <li>Tweens die with their bound node — no leak management.</li>
    </ul>
  </div>
  <div>
<pre data-file="tween_lab.gd" data-lang="gdscript"><code># The reveal choreography, annotated:
var tw := create_tween()

tw.tween_property(self, "scale", Vector3(1.06, 1.06, 1.06), 0.12)\
	.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
tw.parallel()\
	.tween_property(self, "rotation:x", 0.0, 0.35)\
	.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
tw.parallel()\
	.tween_property($Glow, "energy", 2.0, 0.35)
tw.chain().tween_interval(0.05)
tw.tween_callback($Chime.play)

# A no-match "shake head":
var shake := create_tween().set_loops(3)
shake.tween_property(self, "rotation:z", 0.08, 0.06)
shake.tween_property(self, "rotation:z", -0.08, 0.12)
shake.tween_property(self, "rotation:z", 0.0, 0.06)</code></pre>
  </div>
</div>
` },

{ c: 11, t: "Tween Choreography II", html: `
<h2>Board entrance &amp; win celebration</h2>
<div class="two">
  <div>
<pre data-file="board_fx.gd" data-lang="gdscript"><code>extends Board

func _entrance() -> void:
	# Tiles cascade in, index-staggered:
	var tw := create_tween()
	for t in get_children():
		var delay := 0.04 * t.get_index()
		t.position.y = 3.0            # start high
		t.scale = Vector3.ZERO
		tw.parallel().tween_property(
			t, "position:y", 0.0, 0.5)\
			.set_delay(delay)\
			.set_trans(Tween.TRANS_BOUNCE)\
			.set_ease(Tween.EASE_OUT)
		tw.parallel().tween_property(
			t, "scale", Vector3.ONE, 0.3)\
			.set_delay(delay)

func _celebrate() -> void:
	# Claimed tiles orbit upward in a spiral:
	var tw := create_tween()
	for t in get_children():
		var i := t.get_index()
		var target := Vector3(
			cos(i * 0.7) * 4.0, 3.0 + i * 0.1,
			sin(i * 0.7) * 4.0)
		tw.parallel().tween_property(
			t, "position", target, 1.2)\
			.set_trans(Tween.TRANS_CUBIC)\
			.set_ease(Tween.EASE_IN_OUT)
		tw.parallel().tween_property(
			t, "rotation:y", TAU * 2.0, 1.2)</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>Stagger by index</b> = cascades; by distance from a point = ripples. Both are one line of set_delay math.</li>
      <li>Parallel + delay per-tile composes "many things, one timeline".</li>
      <li>Celebrations reuse the same tiles — no extra scenes spawned.</li>
    </ul>
    <div class="callout perf"><b>⚡ Performance</b><p>50 tweens ≈ free. 50 AnimationPlayers ≈ not. For discrete UI/prop motion, tweens are the right-sized tool.</p></div>
  </div>
</div>
` },

{ c: 11, t: "Camera & Picking", html: `
<h2>Orbit camera &amp; ray picking</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Orbit rig:</b> pivot rotates (drag), camera dollies (wheel) — the board-game camera staple.</li>
      <li><b>Picking 3D tiles from mouse:</b> <code>camera.project_ray_origin/normal</code> + <b>PhysicsRayQueryParameters3D</b> intersect in <code>_physics_process</code> (space-safe timing).</li>
      <li>Simpler alternative: put an <code>Area3D</code> per tile + <code>input_event</code> signal (camera does the math for you).</li>
      <li>Hover highlight = input pickable + <code>mouse_entered</code> — pure scene signals, no ray code at all.</li>
    </ul>
  </div>
  <div>
<pre data-file="orbit_camera.gd" data-lang="gdscript"><code>extends Camera3D

@export var radius := 9.0
@export var min_r := 6.0
@export var max_r := 14.0
@export var pitch := 0.9   # radians above horizon

var _yaw := 0.0

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion \
			and event.button_mask &gt; 0:
		_yaw -= event.relative.x * 0.005
	elif event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			radius = maxf(radius - 0.6, min_r)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			radius = minf(radius + 0.6, max_r)

func _process(_d: float) -> void:
	global_position = Vector3(
		cos(_yaw) * cos(pitch),
		sin(pitch),
		sin(_yaw) * cos(pitch)) * radius
	look_at(Vector3.ZERO, Vector3.UP)</code></pre>
  </div>
</div>
` },

{ c: 11, t: "Presentation & Audio", html: `
<h2>Serene presentation in ten decisions</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Palette:</b> 3 colors — stone gray, jade, gold accent. Consistency &gt; richness at this scope.</li>
      <li><b>Light:</b> one warm Directional + one cool fill; <b>LightmapGI</b> not needed — small static scene, ambient sky does it.</li>
      <li><b>Materials:</b> stone = roughness 0.9; symbols = emission + glow threshold 1.1 (they "float").</li>
      <li><b>DOF</b> slight on background (CameraAttributesPractical) → meditative depth.</li>
      <li><b>Audio:</b> chime on reveal (pitch by symbol_id), gong on match, wind ambience. All via the bus graph from Ch 5.</li>
    </ul>
  </div>
  <div>
<pre data-file="audio_map.gd" data-lang="gdscript"><code># Audio reacts to the SAME signals as visuals:
extends Node  # AudioDirector

func _ready() -> void:
	GameEvents.pair_matched.connect(
		func(sym: int):
			var s := $Gong as AudioStreamPlayer
			# Each symbol chimes in its own key:
			s.pitch_scale = \
				pow(2.0, float(sym % 12) / 12.0)
			s.play())
	GameEvents.pair_failed.connect(
		func(): $MutedThud.play())
	GameEvents.board_cleared.connect(
		func(): $Fanfare.play())</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>AudioDirector/HUD/FX as sibling subscribers is the chapter's thesis: <b>add features by subscribing, not by editing the game logic</b>.</p></div>
  </div>
</div>
` },

{ c: 11, t: "Timer & Difficulty", html: `
<h2>The incense timer &amp; difficulty as data</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Level</th><th>Grid</th><th>Pairs</th><th>Time</th><th>Peek?</th></tr>
      <tr><td>Novice</td><td>4×4</td><td>8</td><td>120 s</td><td>2 s intro flash</td></tr>
      <tr><td>Adept</td><td>6×4</td><td>12</td><td>110 s</td><td>none</td></tr>
      <tr><td>Master</td><td>6×5</td><td>15</td><td>90 s</td><td>none</td></tr>
      <tr><td>Enlightened</td><td>8×6</td><td>24</td><td>150 s</td><td>none</td></tr>
    </table></div>
    <ul class="pts">
      <li>Difficulty = one Dictionary table; Board + Timer consume it.</li>
      <li>Score: +100 match, −10 timeout miss, time bonus on clear.</li>
    </ul>
  </div>
  <div>
<pre data-file="difficulty.gd" data-lang="gdscript"><code>const LEVELS := [
	{"cols": 4, "rows": 4, "time": 120.0, "flash": true},
	{"cols": 6, "rows": 4, "time": 110.0, "flash": false},
	{"cols": 6, "rows": 5, "time":  90.0, "flash": false},
	{"cols": 8, "rows": 6, "time": 150.0, "flash": false},
]

func start_level(n: int) -> void:
	var lv := LEVELS[mini(n, LEVELS.size() - 1)]
	%Board.build(lv.cols, lv.rows, _next_seed())
	%Incense.wait_time = lv.time
	%Incense.start()
	if lv.flash:
		_intro_flash()   # reveal-all for 2 s</code></pre>
    <div class="callout note"><b>ℹ Note</b><p>Pairs must be even-count-friendly: cols×rows must be even — add a data validation assert and fail loudly at design time.</p></div>
  </div>
</div>
` },

{ c: 11, t: "Testing & Extending", html: `
<h2>Testing a signal-architected game</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Determinism = testability:</b> fixed seed → scripted click sequence → assert final score. A headless integration test with zero UI.</li>
      <li><b>Signal spies:</b> connect lambdas that append to arrays; assert emissions + payloads after actions.</li>
      <li>Extension menu (each ~1 hour because of the architecture):
        <ul>
          <li>Cosmic mode — 3-of-a-kind matches</li>
          <li>Wild symbols — match anything once</li>
          <li>Daily seed share (<code>user://…?seed=7734</code>)</li>
        </ul></li>
    </ul>
  </div>
  <div>
<pre data-file="test_board.gd" data-lang="gdscript"><code># res://tests/test_board.gd  (GUT or bare asserts)
extends Node

func test_full_match_cycle() -> void:
	var gm := GameManager.new()
	var emissions: Array = []
	gm.score_changed.connect(
		func(v): emissions.append(v))

	# Two tiles, same symbol:
	var a := Tile.new(); a.symbol_id = 3
	var b := Tile.new(); b.symbol_id = 3
	gm.on_tile_flipped(a)
	gm.on_tile_flipped(b)
	assert(emissions == [100])
	assert(gm.state == GameManager.State.IDLE)</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Write one such test per rule. When "the third flip crashes" arrives as a bug report, it becomes a regression test forever.</p></div>
  </div>
</div>
` },

{ c: 11, t: "Chapter 11 Pitfalls & Recap", html: `
<h2>Chapter 11 — pitfalls &amp; recap</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Tween on freed tiles</b><p>Restart during a conceal tween → tween target gone. Guard: kill tweens (<code>kill()</code> stored handles) or check <code>is_instance_valid</code> in callbacks.</p></div>
    <div class="callout pit"><b>⚠ await in state machine</b><p><code>await</code> suspends; a timeout/game-over during it still resumes the old flow. Re-check state after every await (as GameManager does).</p></div>
    <div class="callout pit"><b>⚠ Global RNG in gameplay</b><p>Unseeded shuffles make bug reports unreproducible. Seed everything that decides outcomes.</p></div>
  </div>
  <div>
    <h3>Recap</h3>
    <ul class="pts">
      <li>Signal graph as the WHOLE architecture: emitters of facts, one decider, many subscribers.</li>
      <li>Enum state machine with top guards = rules you can read.</li>
      <li>Seeded RandomNumberGenerator; shuffle on your own stream.</li>
      <li>Procedural grid: centered spacing math, configure-before-add.</li>
      <li>Tween choreography: stagger, parallel, trans/ease vocabulary.</li>
      <li>Difficulty as data; tests as first-class artifacts.</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Chapter 12</b> — the capstone: an open-source action platformer with HFSM AI, scene inheritance, level streaming, and split-screen.</p></div>
  </div>
</div>
` }

);
