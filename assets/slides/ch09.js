/* Chapter 09 — Godot High-Level Multiplayer (28 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 9, t: "Chapter 09 — High-Level Multiplayer", cover: true, html: `
<div class="cov-part">Part III · Advanced Systems &amp; Projects</div>
<div class="cov-n">09</div>
<h1>High-Level Multiplayer</h1>
<p class="cov-sub">Server/client architecture with ENetMultiplayerPeer, remote procedure calls via @rpc, authority models, and the replication trio: MultiplayerSpawner, MultiplayerSynchronizer — plus lobbies, latency, security, and dedicated servers.</p>
<div class="chips">
  <span class="tag">ENetMultiplayerPeer</span><span class="tag">Server/Client</span>
  <span class="tag">@rpc</span><span class="tag">Authority</span>
  <span class="tag">MultiplayerSpawner</span><span class="tag">MultiplayerSynchronizer</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 9, t: "Multiplayer Concepts", html: `
<h2>The vocabulary before the API</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Topologies:</b> dedicated server (authoritative), listen-server (host plays), full P2P (rare, cheat-prone). Godot's high-level API is <b>client-server</b> at heart.</li>
      <li><b>Peer:</b> every connected endpoint. The server itself is peer <b>1</b>; clients get unique IDs as they connect.</li>
      <li><b>Authority:</b> who owns a node's state. Default: the server. <b>Server-authoritative</b> = clients request, server decides.</li>
      <li><b>Replication:</b> how shared state spreads — RPCs (calls) vs synchronization (state pushes).</li>
      <li><b>Latency reality:</b> 30–150 ms RTT typical. Every design decision downstream must tolerate it.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox acc"><b>Server (peer 1)</b>authoritative simulation</div>
      <div class="arr">↕</div>
      <div class="fbox"><b>Client 1001</b>inputs → displays</div>
      <div class="arr">·</div>
      <div class="fbox"><b>Client 1002</b>inputs → displays</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Godot's high-level API abstracts the transport: ENet (default, UDP), WebSocket (TCP/TLS, web-friendly), or <b>WebRTC</b> (browser P2P). Game code stays identical — you swap the <code>MultiplayerPeer</code> implementation.</p></div>
  </div>
</div>
` },

{ c: 9, t: "The Multiplayer Stack", html: `
<h2>Godot's multiplayer layers</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li><b>SceneMultiplayer</b> (the <code>multiplayer</code> property on Node): manages peers, RPC routing, object replication, visibility.</li>
      <li><b>MultiplayerPeer</b> subclasses: <code>ENetMultiplayerPeer</code>, <code>WebSocketMultiplayerPeer</code>, <code>WebRTCMultiplayerPeer</code>, <code>OfflineMultiplayerPeer</code>.</li>
      <li><b>Replication helpers</b>: <code>MultiplayerSpawner</code>, <code>MultiplayerSynchronizer</code> — declarative nodes on top of the RPC layer.</li>
      <li>Every node has a multiplayer context: <code>get_multiplayer()</code>, authority, and RPC-capable scripts.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Your game</b>nodes · scripts · @rpc</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>SceneMultiplayer</b>routing · authority · visibility</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>MultiplayerPeer</b>ENet / WebSocket / WebRTC</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Network</b>UDP · TCP · DTLS/TLS</div>
    </div>
    <div class="callout note"><b>ℹ Note</b><p>Lower-level (<code>PacketPeer</code>, raw UDP) exists for custom protocols — out of scope. The high-level API is where 95% of games live.</p></div>
  </div>
</div>
` },

{ c: 9, t: "ENetMultiplayerPeer: Host & Join", html: `
<h2>Creating the connection</h2>
<div class="two">
  <div>
<pre data-file="net_manager.gd" data-lang="gdscript"><code># Autoload: Net (net_manager.gd)
extends Node

const PORT := 10567
const MAX_CLIENTS := 8

signal lobby_changed

func host() -> void:
	var peer := ENetMultiplayerPeer.new()
	var err := peer.create_server(PORT, MAX_CLIENTS)
	if err != OK:
		push_error("host failed: %s" % err)
		return
	# Optional bandwidth caps (bytes/s), 0 = unlimited:
	# peer.create_server(PORT, MAX_CLIENTS, 0, 0)
	multiplayer.multiplayer_peer = peer
	print("hosting as 1")

func join(address: String) -> void:
	if address.is_empty():
		return
	var peer := ENetMultiplayerPeer.new()
	# channels, in/out bandwidth optional args:
	peer.create_client(address, PORT)
	multiplayer.multiplayer_peer = peer

func leave() -> void:
	multiplayer.multiplayer_peer.close()
	multiplayer.multiplayer_peer = null</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>One line of essence:</b> assigning <code>multiplayer.multiplayer_peer</code> flips the whole game into networked mode.</li>
      <li>Server = <code>create_server(port, max_clients)</code>; everyone else = <code>create_client(ip, port)</code>.</li>
      <li>Port forward or use a tunnel for internet tests; LAN works out of the box.</li>
      <li><code>peer.close()</code> and nulling restores single-player mode cleanly.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Firewalls/NAT block unsolicited UDP. For public internet play you'll need UPnP (<code>UPNPDevice</code>), port forwarding, or a relay — design for it from day one.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Peer Lifecycle Signals", html: `
<h2>Connection events</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>multiplayer.peer_connected(id)</code> — server-side: a client joined.</li>
      <li><code>multiplayer.peer_disconnected(id)</code> — client left/timed out. <b>Clean up their objects here.</b></li>
      <li><code>multiplayer.connected_to_server</code> — client-side success.</li>
      <li><code>multiplayer.connection_failed</code> — client couldn't reach host.</li>
      <li><code>multiplayer.server_disconnected</code> — host vanished mid-game.</li>
      <li>IDs: server = 1; clients receive large random-ish ints. Treat as opaque.</li>
    </ul>
  </div>
  <div>
<pre data-file="net_signals.gd" data-lang="gdscript"><code>extends Node  # Net autoload

func _ready() -> void:
	multiplayer.peer_connected.connect(
		func(id): print("peer %d joined" % id))
	multiplayer.peer_disconnected.connect(
		func(id):
			print("peer %d left" % id)
			# Server-only cleanup of that peer's nodes:
			if multiplayer.is_server():
				_players.erase(id)
				if has_node("/root/Main/Players/%d" % id):
					get_node("/root/Main/Players/%d" % id)\
						.queue_free())
	multiplayer.connected_to_server.connect(
		func(): print("connected, my id = %d"
			% multiplayer.get_unique_id()))
	multiplayer.connection_failed.connect(_on_fail)
	multiplayer.server_disconnected.connect(
		func(): get_tree().quit())  # or return to menu</code></pre>
  </div>
</div>
` },

{ c: 9, t: "@rpc I: The Annotation", html: `
<h2>@rpc — remote procedure calls</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Mark a method <code>@rpc(...)</code> and it becomes callable across the network — same syntax, different receivers.</li>
      <li>Call forms: <code>rpc("m", args)</code> (everyone), <code>rpc_id(7, "m", args)</code> (one peer).</li>
      <li>Callable must exist identically on both ends — version mismatches desync.</li>
      <li><b>Modes</b> (who may call it) and <b>transfer</b> (reliability) are the two axes to master (next slide).</li>
    </ul>
  </div>
  <div>
<pre data-file="chat.gd" data-lang="gdscript"><code>extends Node  # ChatController

@rpc("any_peer", "call_local", "reliable")
func send_chat(text: String) -> void:
	# Runs on EVERY peer (call_local = including caller's)
	var sender := multiplayer.get_remote_sender_id()
	# Server relays (and could censor):
	if multiplayer.is_server():
		for id in multiplayer.get_peers():
			if id != sender:
				rpc_id(id, "send_chat", text)
	receive_chat_display(sender, text)

func receive_chat_display(sender: int, text: String) -> void:
	%ChatLog.append_line("%s: %s"
		% [Net.player_name(sender), text])

# Client-side call:
# rpc_id(1, "send_chat", "gg wp")
# → server executes → relays to all</code></pre>
  </div>
</div>
` },

{ c: 9, t: "@rpc II: Modes & Reliability", html: `
<h2>@rpc options decoded</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Option</th><th>Values</th><th>Meaning</th></tr>
  <tr><td>Call mode</td><td><code>authority</code> (default)</td><td>Only the node's authority may call it — anti-cheat backbone</td></tr>
  <tr><td></td><td><code>any_peer</code></td><td>Anyone may call — required for client→server requests</td></tr>
  <tr><td>Local call</td><td><code>call_local</code></td><td>Also run on the calling peer (host displays its own chat)</td></tr>
  <tr><td>Transfer</td><td><code>reliable</code> (default)</td><td>TCP-like: ordered, retried — chat, purchases, damage events</td></tr>
  <tr><td></td><td><code>unreliable</code></td><td>Fire-and-forget — cosmetics, position spam</td></tr>
  <tr><td></td><td><code>unreliable_ordered</code></td><td>Latest-wins per channel — inputs/state</td></tr>
  <tr><td>Channel</td><td>int arg</td><td>Parallel ordered streams (head on ch 1, hands on ch 2)</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Default mental model: <b>client asks</b> (<code>any_peer</code>, reliable) · <b>server broadcasts state</b> (synchronizer/unreliable). Never trust client-sent positions or damage amounts.</p></div>
  <div class="callout pit"><b>⚠ Common Pitfall</b><p><code>@rpc</code> methods with wrong signatures or renamed on one side = silent desyncs. Lock protocol versions; <code>multiplayer.object_configured</code> logs registration during development.</p></div>
</div>
` },

{ c: 9, t: "Authority Model", html: `
<h2>Authority — who owns truth</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Every node: <code>set_multiplayer_authority(id)</code>. Default authority = server (1).</li>
      <li>Classic pattern: <b>player node owned by its player</b> — client drives its avatar's input/simulation locally; synchronizer pushes its state to others.</li>
      <li><code>is_multiplayer_authority()</code> gates simulation code per node.</li>
      <li>Set authority in <code>_enter_tree</code> — BEFORE <code>_ready</code> runs anything replication-related.</li>
      <li>Cheat surface: client authority = client says. For competitive games, keep authority server-side and send inputs instead.</li>
    </ul>
  </div>
  <div>
<pre data-file="player_net.gd" data-lang="gdscript"><code>extends CharacterBody3D  # Player

func _enter_tree() -> void:
	# Scene spawned as "1", "1001", "1002"… by the
	# spawner (next slides). Claim ownership:
	set_multiplayer_authority(str(name).to_int())

func _ready() -> void:
	if is_multiplayer_authority():
		# Only MY machine drives camera + input:
		%Camera.current = true
		%InputEmitter.start()

func _physics_process(delta: float) -> void:
	if not is_multiplayer_authority():
		return   # other players = receive &amp; render
	# local simulation…
	move_and_slide()

@rpc("any_peer", "call_local", "reliable")
func request_respawn() -> void:
	# Only meaningful executed on the server:
	if multiplayer.is_server():
		_do_respawn(multiplayer.get_remote_sender_id())</code></pre>
  </div>
</div>
` },

{ c: 9, t: "MultiplayerSpawner I", html: `
<h2>MultiplayerSpawner — replicated spawning</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Node that <b>mirrors add/remove of children</b> under its spawn path to all peers.</li>
      <li>Server adds a child → spawner auto-instantiates the same scene on every client; remove → despawn replicated.</li>
      <li>Two modes:
        <ul>
          <li><b>Auto Spawn List</b> — PackedScenes (projects/enemies/bullets)</li>
          <li><b>Custom spawn function</b> — build whatever, return a Node</li>
        </ul></li>
      <li>Names matter: replicated nodes get the <b>same name</b> on all peers (how synchronizers find their targets).</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">Main</span> <span class="m">(all peers)</span>
<span class="m">├──</span><span class="b">Node3D</span> <span class="g">Players</span>
<span class="m">└──</span><span class="b">MultiplayerSpawner</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;spawn_path = ../Players</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;auto_spawn_list = [player.tscn]</span>

<span class="m">Server: Players.add_child(player_1001)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ clients spawn identical node</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; with name "1001"</span>

<span class="m">FREE path: child.queue_free()</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;→ spawner replicates removal</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Spawned scene roots get named by the spawner (<code>spawn_index</code> or your custom name). Rely on THAT name for netcode; never rename net-spawned nodes client-side.</p></div>
  </div>
</div>
` },

{ c: 9, t: "MultiplayerSpawner II", html: `
<h2>Spawner in practice</h2>
<div class="twoR">
  <div>
<pre data-file="main_net.gd" data-lang="gdscript"><code>extends Node3D  # Main — runs on ALL peers

const PLAYER_SCENE := preload("res://player/player.tscn")

func _ready() -> void:
	Net.player_joined.connect(_on_join)
	# MultiplayerSpawner handles the replication;
	# we only drive the SERVER side:

func _on_join(id: int) -> void:
	if not multiplayer.is_server():
		return
	var player := PLAYER_SCENE.instantiate()
	player.name = str(id)          # ← net identity!
	%Players.add_child(player)     # spawner mirrors it
	# Also a spawn position via spawn function? Next.

# Custom spawn (when you need logic):
func _configure_spawner() -> void:
	%PlayerSpawner.spawn_function = _spawn_player

func _spawn_player(data: Variant) -> Node:
	var p := PLAYER_SCENE.instantiate()
	p.name = str(data["id"])
	p.global_position = data["pos"]
	return p

# Server: %PlayerSpawner.spawn(
#     {"id": id, "pos": _random_spawn_point()})</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>auto_spawn_list</b> covers 90%: plain scene adds replicate.</li>
      <li><b>spawn_function</b> for data-driven spawns (position, team, loadout) — <code>spawn(data)</code> on the server, function runs on all peers.</li>
      <li>Despawning: free the node on the server — replication handles the rest. Never free net-spawned nodes from a pure client.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Spawning on client = one-way ticket to ghost nodes (exists locally, nowhere else). Gate every spawn behind <code>multiplayer.is_server()</code>.</p></div>
  </div>
</div>
` },

{ c: 9, t: "MultiplayerSynchronizer I", html: `
<h2>Synchronizer — state replication</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Node that <b>pushes selected properties</b> from the authority to everyone else — no manual RPC spam.</li>
      <li>Configure a <b>SceneReplicationConfig</b>: property paths (e.g. <code>position</code>, <code>:health</code>) + per-property <b>sync direction</b>.</li>
      <li><b>Delta sync:</b> only changed values go out (rounds float to 2 decimals by default — huge savings).</li>
      <li><b>Replication interval</b>: 30 Hz default — drop to 10–20 Hz for slow state; leave transforms tighter.</li>
      <li><code>root_path</code>: the node whose properties replicate (usually the parent).</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">CharacterBody3D</span> <span class="g">1001</span>
<span class="m">├──</span> <span class="m">…mesh, shapes…</span>
<span class="m">└──</span><span class="b">MultiplayerSynchronizer</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;root_path = ..</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;SceneReplicationConfig:</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;· position&nbsp;&nbsp;&nbsp;&nbsp; sync  ✓ delta ✓</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;· rotation:y&nbsp; sync  ✓ delta ✓</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;· :anim_state sync  ✓</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;· :health&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sync  ✓</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;· :input_dir&nbsp; watch-only (→server)</span>

<span class="m">Authority (that client) writes;</span>
<span class="m">everyone else receives &amp; renders.</span></div>
  </div>
</div>
` },

{ c: 9, t: "MultiplayerSynchronizer II", html: `
<h2>Synchronizer mechanics</h2>
<div class="twoR">
  <div>
<pre data-file="player_sync.gd" data-lang="gdscript"><code>extends CharacterBody3D

@export var anim_state := &amp;"idle" : set = _set_anim

func _set_anim(v: StringName) -> void:
	# Runs identically on every peer (state arrives
	# via synchronizer), so the setter can act global:
	anim_state = v
	if anim_state == &amp;"idle":
		$AnimationPlayer.play(&amp;"idle")

# Watch-only property → server reads inputs:
var input_dir := Vector2.ZERO

func _physics_process(delta: float) -> void:
	if is_multiplayer_authority():
		input_dir = Input.get_vector(
			"left", "right", "fwd", "back")
		# simulate…
	else:
		# non-authority: cosmetically extrapolate
		# (smoothing arrives next slides)
		pass

# Visibility: only replicate to interested peers:
func _on_stealth_area_entered() -> void:
	%Sync.public_visibility = false   # cloaked!</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>Sync direction</b> per property: authority→peers (state), or "watch" (peers report INTO authority — inputs).</li>
      <li><b>Visibility filters</b>: <code>public_visibility</code>, per-peer <code>set_visibility_for(peer, false)</code> — fog-of-war, instancing, stealth.</li>
      <li>Sync happens on the physics tick — align your sim accordingly.</li>
      <li>Every synchronized property is one less hand-rolled RPC. Audit weekly.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Replicate <b>transform + a small state enum</b>, not every internal variable. The less state you sync, the fewer desync bugs you debug.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Syncing Movement: Strategies", html: `
<h2>Movement sync — three tiers</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Strategy</th><th>How</th><th>Latency feel</th><th>Use for</th></tr>
  <tr><td><b>State sync</b> (simplest)</td><td>Synchronizer pushes transform @ 20–30 Hz; clients lerp</td><td>rubber-banding under lag</td><td>co-op, slow games</td></tr>
  <tr><td><b>Input sync</b> (server auth)</td><td>Clients send inputs; server simulates everyone</td><td>fair, authoritative</td><td>competitive-ish games</td></tr>
  <tr><td><b>Client prediction + reconciliation</b></td><td>Client simulates own inputs instantly; server corrects</td><td>tight + fair (hard)</td><td>shooters, platformers</td></tr>
</table></div>
<div class="twoR">
  <div class="callout note"><b>ℹ This chapter ships Tier 1</b><p>Player-authoritative avatars + state sync + interpolation — the right scope for learning the API. The reference section sketches Tiers 2–3.</p></div>
  <div>
<pre data-file="remote_interp.gd" data-lang="gdscript"><code># Non-authority smoothing for remote players:
func _process(delta: float) -> void:
	if is_multiplayer_authority():
		return
	# Chase the replicated transform:
	global_position = global_position.lerp(
		_net_target_pos,
		1.0 - exp(-12.0 * delta))
	rotation.y = lerpf(rotation.y,
		_net_target_yaw, 10.0 * delta)</code></pre>
  </div>
</div>
` },

{ c: 9, t: "Lobby System", html: `
<h2>Building the lobby flow</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>States: MENU → LOBBY (chat, player list, ready flags) → GAME → back.</li>
      <li>Lobby state = server-owned dictionary <code>{id: {name, ready}}</code>, broadcast via <code>sync_lobby</code> RPC on change.</li>
      <li><b>Start conditions:</b> all ready OR host forces. Countdown RPC, then spawn players via spawner.</li>
      <li>Everything the lobby does is Ch 6 patterns + RPC — nothing new mechanically.</li>
    </ul>
  </div>
  <div>
<pre data-file="lobby.gd" data-lang="gdscript"><code>extends Node  # Lobby (autoload)

var players := {}   # id → {name, ready}

@rpc("any_peer", "call_local", "reliable")
func register_player(info: Dictionary) -> void:
	if multiplayer.is_server():
		var id := multiplayer.get_remote_sender_id()
		players[id] = {"name": info["name"], "ready": false}
		sync_lobby.rpc(players)

@rpc("authority", "call_local", "reliable")
func sync_lobby(state: Dictionary) -> void:
	players = state
	GameEvents.lobby_updated.emit(state)

@rpc("any_peer", "call_local", "reliable")
func set_ready(v: bool) -> void:
	if multiplayer.is_server():
		var id := multiplayer.get_remote_sender_id()
		players[id]["ready"] = v
		sync_lobby.rpc(players)
		if players.size() &gt;= 2 and \
				all(p["ready"] for p in players.values()):
			start_game.rpc()

@rpc("authority", "call_local", "reliable")
func start_game() -> void:
	get_tree().change_scene_to_file(
		"res://scenes/game.tscn")</code></pre>
  </div>
</div>
` },

{ c: 9, t: "Testing Multiplayer", html: `
<h2>Testing without two machines</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Multiple instances:</b> run editor build + exported build side by side; or instance feature (debug tooling) with separate <code>user://</code> dirs via <code>--user-data-dir</code>… simplest: editor + one export.</li>
      <li><b>Loopback:</b> join <code>127.0.0.1</code> — catches 80% of flow bugs.</li>
      <li><b>Latency simulation:</b> <code>multiplayer.multiplayer_peer.set_peer_timeout</code>… real artifice: ENet's <code>host.simulate</code>? Godot doesn't ship a LagEmulator — use a proxy (Clumsy/toxiproxy) or a tiny <code>SceneMultiplayer</code> buffering shim.</li>
      <li><b>Determinism harness:</b> headless server + 2 headless scripted clients (CI smoke test).</li>
    </ul>
  </div>
  <div>
<pre data-file="test_harness.sh" data-lang="text"><code># CI smoke: headless server + 2 bot clients
godot --headless --path . --server &amp;
sleep 2
godot --headless --path . --script \
    res://tests/bot_client.gd -- --join 127.0.0.1 &amp;
godot --headless --path . --script \
    res://tests/bot_client.gd -- --join 127.0.0.1 &amp;
wait   # bots assert: connected, spawned, synced</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Automate the boring multiplayer checks (connect, spawn, sync, disconnect-cleanup) as headless bots. Manual two-window testing is for tuning, not regression.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Disconnects & Reconnection", html: `
<h2>When peers vanish</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Client leaves</b> (server view): <code>peer_disconnected(id)</code> → free their player node (spawner replicates removal), remove from lobby, broadcast.</li>
      <li><b>Server dies</b> (client view): <code>server_disconnected</code> → show "host left", return to menu. Host migration is DIY (harder than it looks — v2 feature).</li>
      <li><b>Timeouts:</b> ENet drops silent peers after ~seconds; tune via <code>set_peer_timeout</code>.</li>
      <li><b>Graceful vs crash</b>: identical code path — always clean by id, never assume goodbye packets.</li>
    </ul>
  </div>
  <div>
<pre data-file="cleanup.gd" data-lang="gdscript"><code>extends Node  # Main (server-relevant)

func _ready() -> void:
	multiplayer.peer_disconnected.connect(_on_drop)

func _on_drop(id: int) -> void:
	if not multiplayer.is_server():
		return
	var player := %Players.get_node_or_null(str(id))
	if player:
		player.queue_free()   # spawner despawns everywhere
	Lobby.players.erase(id)
	Lobby.sync_lobby.rpc(Lobby.players)
	GameEvents.player_left.emit(id)</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Leaked player nodes on disconnect = ghost players that "exist" client-side. The Remote scene-tree view during play catches them instantly — use it in every net test.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Security & Trust", html: `
<h2>Threat-modeling your netcode</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Clients are hostile.</b> Every RPC argument can be anything. Validate: types, ranges, cooldowns, ownership, distance ("speedhack" check), inventory existence.</li>
      <li><code>@rpc("authority")</code> = the engine refuses non-authority calls — free structural anti-cheat. Use it by default; open <code>any_peer</code> only with server-side validation.</li>
      <li><b>Transport:</b> ENet = unencrypted UDP. For secrecy: <b>WebSocket + TLS</b> (wss://), or ENet over DTLS via <code>ENetConnection</code>… simplest robust = WebSocketMultiplayerPeer with TLS options.</li>
      <li>Rate-limit client→server RPCs (token bucket per peer) — one client must not be able to flood the server.</li>
    </ul>
  </div>
  <div>
<pre data-file="validation.gd" data-lang="gdscript"><code>@rpc("any_peer", "reliable")
func request_fire(dir: Vector3) -> void:
	var id := multiplayer.get_remote_sender_id()
	# 1) ownership: firing THEIR avatar only
	if id != int(name): return
	# 2) rate limit
	if Time.get_ticks_msec() - _last_shot[id] &lt; 150:
		return   # + log strike
	# 3) sanity: unit vector-ish
	if dir.length() &gt; 1.1: dir = dir.normalized()
	# only NOW trust the request:
	_server_execute_fire(id, dir)</code></pre>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Real anti-cheat is layered: structural (authority RPCs) → semantic (validation) → statistical (impossible stats over time) → operational (reports, bans by <code>hashed_secret</code> / account). The first two layers are Godot API; the rest is your backend.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Bandwidth Budgeting", html: `
<h2>Bytes on the wire</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Rule of thumb: <b>&lt; 30 KB/s per client</b> down, far less up, keeps rural/DSL happy.</li>
      <li>Synchronizer delta math: transform @ 20 Hz ≈ (12 B + header) × 20 ≈ ~1 KB/s per player. 8 players ≈ 8 KB/s. Comfortable.</li>
      <li>Kill switches: replicate <code>anim_state</code> as a StringName int hash; pack bools into one int; drop to 10 Hz when idle.</li>
      <li>Measure: <code>multiplayer.multiplayer_peer.get_packet_peer…</code> simpler — <code>Performance</code> + the <b>Multiplayer monitor</b> in debugger (4.2+: RPC bandwidth graph!).</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Debugger → Network Profiler (per peer):</span>
peer 1001  in 1.2 KB/s   out 9.8 KB/s
peer 1002  in 0.9 KB/s   out 9.6 KB/s
<span class="dim">top RPC by bandwidth:</span>
  sync_position  62%   <span class="dim">→ drop 30→20 Hz?</span>
  chat           18%
  fire_event      6%
<span class="err">alert: out &gt; 40 KB/s to 1003 — visibility leak?</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>Server CPU scales with simulation, not with clients (mostly). Bandwidth scales linearly — visibility (interest management) is your superlinear savior at scale.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Dedicated Servers", html: `
<h2>Headless dedicated server builds</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Export preset → <b>dedicated server</b> platform (no rendering/audio) — tiny binary, runs on Linux VPS / containers.</li>
      <li>Detect server mode: <code>DisplayServer.get_name() == "headless"</code> or <code>--server</code> flag; skip visuals, UI, audio instantiation.</li>
      <li><b>Trim the export:</b> exclude UI/textures via export filters when shipping server-only.</li>
      <li>Container recipe: godot headless server + supervisor + your game .pck; expose the UDP port.</li>
    </ul>
  </div>
  <div>
<pre data-file="server_main.gd" data-lang="gdscript"><code>extends Node  # ServerMain — set as main scene
                  # for the dedicated export

func _ready() -> void:
	# Sanity: never run graphics paths headless
	assert(DisplayServer.get_name() == "headless")
	Net.host()
	print("dedicated server up on %d" % Net.PORT)
	# Autorun bots/simulation as needed…
	$MatchScheduler.start()</code></pre>
<pre data-file="Dockerfile" data-lang="text"><code>FROM debian:bookworm-slim
COPY server/ /game/
EXPOSE 10567/udp
ENTRYPOINT ["/game/subracer_server",
            "--headless", "--path", "/game"]</code></pre>
  </div>
</div>
` },

{ c: 9, t: "Latency Compensation", html: `
<h2>Interpolation &amp; prediction — the theory</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Render remote entities in the past:</b> buffer snapshots ~100 ms; interpolate between them — hides jitter, standard for 20–30 Hz state sync.</li>
      <li><b>Client prediction:</b> simulate own input immediately; when server state arrives, <em>reconcile</em>: replay unacknowledged inputs atop authoritative state.</li>
      <li><b>Lag compensation (server):</b> rewind hitboxes to the shooter's view time for hit validation ("shoot what you saw").</li>
      <li>Godot ships none of these built-in — but the synchronizer/spawner leave you clean seams to add them (reference chapter sketches an implementation).</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Client</b>input @ tick n → predict → render</div>
      <div class="arr">↓ send</div>
      <div class="fbox acc"><b>Server</b>validate → simulate → snapshot</div>
      <div class="arr">↓ state</div>
      <div class="fbox"><b>Client</b>reconcile → replay inputs n+1…</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Result</b>local = instant · world = fair</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Snapshot interpolation alone fixes 90% of perceived jank. Ship it first; prediction only where movement precision matters (your avatar, physical projectiles the player owns).</p></div>
  </div>
</div>
` },

{ c: 9, t: "Match State & Reset", html: `
<h2>Match lifecycle correctness</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Server owns match state</b> (scores, timer, wave) — clients render via RPC broadcast on change.</li>
      <li>Restart = server-side: reset vars → free net-spawned → respawn → broadcast "match_reset".</li>
      <li><b>Avoid scene reload on clients</b> in net games — <code>change_scene</code> desyncs spawner expectations; prefer in-scene state resets for matches.</li>
      <li>Lobby → game transition: one RPC-triggered scene change on ALL peers, with a stabilization beat (loading barrier) before spawning.</li>
    </ul>
  </div>
  <div>
<pre data-file="match.gd" data-lang="gdscript"><code>extends Node  # MatchDirector (server-authoritative)

var time_left := 300.0
var running := false

func _process(delta: float) -> void:
	if running and multiplayer.is_server():
		time_left = maxf(time_left - delta, 0.0)
		if Time.get_ticks_msec() - _last_bcast &gt; 500:
			_last_bcast = Time.get_ticks_msec()
			sync_timer.rpc(time_left)
			if time_left == 0.0:
				end_match()

@rpc("authority", "call_local", "reliable")
func sync_timer(t: float) -> void:
	%MatchTimer.text = "%02d:%02d" % [t / 60, int(t) % 60]

func end_match() -> void:
	running = false
	report_results.rpc(_compute_scores())

@rpc("authority", "call_local", "reliable")
func report_results(results: Dictionary) -> void:
	%ResultsScreen.show(results)</code></pre>
  </div>
</div>
` },

{ c: 9, t: "Debugging Multiplayer", html: `
<h2>The multiplayer debugger</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Debugger → <b>Network</b> panel (4.2+): bandwidth per RPC, per peer, live graphs. Non-negotiable during tuning.</li>
      <li><b>Remote scene tree</b> during play: confirm spawn replication &amp; symmetry across instances.</li>
      <li><code>multiplayer.get_remote_sender_id()</code> in every <code>any_peer</code> handler while developing — assert expectations loudly.</li>
      <li>Log synchronization: same log format on server + clients, correlate by timestamp + peer id.</li>
      <li>Unit-test replication: headless 2-bot harness asserting property equality after N ticks.</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">[server] peer 1001 connected</span>
<span class="dim">[server] spawned 1001 at (3,1,-4)</span>
<span class="err">[client 1001] RPC 'take_damage' called by</span>
<span class="err">   non-authority 1002 → BLOCKED ✓</span>
<span class="dim">[server] peer 1002 disconnected (timeout)</span>
<span class="err">[server] WARN: node 1002 had 3 children</span>
<span class="err">   outside spawner — manual cleanup engaged</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Prefix every network log with peer id + tick. "Why didn't I get the packet" becomes grep, not archaeology.</p></div>
  </div>
</div>
` },

{ c: 9, t: "WebSocket & Web Targets", html: `
<h2>Alternative transports</h2>
<div class="two">
  <div>
<pre data-file="ws_peer.gd" data-lang="gdscript"><code># Browser-friendly transport:
extends Node

func host_ws(tls: bool) -> void:
	var peer := WebSocketMultiplayerPeer.new()
	var err: Error
	if tls:
		# Production: real key/cert pair (X.509).
		var key := CryptoKey.new()
		key.load("res://certs/server.key")
		var cert := X509Certificate.new()
		cert.load("res://certs/server.crt")
		err = peer.create_server(10568,
			TLSOptions.server(key, cert))
	else:
		err = peer.create_server(10568)  # plaintext (dev)
	if err != OK:
		push_error("ws host failed: %s" % err)
		return
	multiplayer.multiplayer_peer = peer

func join_ws(url: String) -> void:
	var peer := WebSocketMultiplayerPeer.new()
	peer.create_client(url)   # wss://play.example.com
	multiplayer.multiplayer_peer = peer</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>WebSocket:</b> TCP semantics (reliable, ordered), TLS-native — the choice for web builds &amp; corporate networks; slightly laggier than ENet.</li>
      <li><b>WebRTC:</b> true P2P for browser games (with a signaling server you provide) — out of scope here, documented in engine docs.</li>
      <li>Same game code: only the peer class changes. Abstract it in your Net autoload from day one.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Web export + ENet = nothing works (browsers have no raw UDP). Design decision #1: which transports must your game support?</p></div>
  </div>
</div>
` },

{ c: 9, t: "Scaling Notes", html: `
<h2>Beyond 16 players</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Interest management:</b> synchronizer visibility per peer (distance/zone gates) — bandwidth grows with what's relevant, not what exists.</li>
      <li><b>Zones/rooms:</b> multiple spawner scopes — only players in a room replicate its children.</li>
      <li><b>Server sharding:</b> one process per match; a matchmaker routes. Godot scales "wide" (processes) not "deep" (10k players/socket).</li>
      <li>Profiling servers: headless + <code>--profiling</code>… use the monitor/Network panel via editor attach.</li>
    </ul>
  </div>
  <div>
<pre data-file="interest.gd" data-lang="gdscript"><code># Distance-based visibility via synchronizer API:
extends MultiplayerSynchronizer

const UPDATE_DIST := 60.0

func _process(_d: float) -> void:
	if not multiplayer.is_server():
		return
	for id in multiplayer.get_peers():
		var player := %Players.get_node(str(id))
		var near := player.global_position.distance_to(
			root_node.global_position) &lt; UPDATE_DIST
		set_visibility_for(id, near)</code></pre>
    <div class="callout note"><b>ℹ Note</b><p>Visibility + delta sync + 10–20 Hz state = a 32–64 player Godot game is realistic. Beyond that you're engineering a bespoke stack (and that's a fine ambition).</p></div>
  </div>
</div>
` },

{ c: 9, t: "Chapter 09 Pitfalls", html: `
<h2>Chapter 09 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ set_multiplayer_authority in _ready (too late)</b><p>Synchronizers configure at ready — authority set after = first sync burst goes to the wrong owner. Always <code>_enter_tree</code>.</p></div>
    <div class="callout pit"><b>⚠ Trusting client transforms</b><p>Player-authoritative position is trivially teleport-hacked. Co-op with friends: fine. Competitive: server sim + input sync.</p></div>
    <div class="callout pit"><b>⚠ RPC before connection established</b><p>Calling rpcs in the first frames after create_client races the handshake. Await <code>connected_to_server</code> (or multiplier poll) before talking.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Desynced spawn paths</b><p>Spawner mirrors by node path; moving <code>Players</code> at runtime on one peer only = replication silence. Keep net-critical paths static.</p></div>
    <div class="callout pit"><b>⚠ The infinite-relay loop</b><p>Server relays chat by calling the same <code>any_peer</code> RPC to clients; a client echoing it back = broadcast storm. Mark relay paths clearly; drop echo packets.</p></div>
  </div>
</div>
` },

{ c: 9, t: "Chapter 09 Exercises", html: `
<h2>Exercises — Multiplayer</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 9.1 — NetPong</b><p>Two-player pong: ENet host/join, spawner for paddles/ball, synchronizer for paddle Y (client auth) and ball (server auth). The "hello world" of netcode — build it in 2 hours.</p></div>
  <div class="callout ex"><b>✎ Ex 9.2 — Sabotage run</b><p>With your NetPong: pull the ethernet (or kill the client process). Verify: server cleans up, other client informed, no leaked nodes. Then implement 5 s reconnect grace.</p></div>
  <div class="callout ex"><b>✎ Ex 9.3 — Bandwidth diet</b><p>Instrument the Network debugger; log per-RPC KB/s. Halve total bandwidth without gameplay change (hint: intervals, delta, visibility).</p></div>
  <div class="callout ex"><b>✎ Ex 9.4 — Dedicated</b><p>Export a headless server build, run it on another machine (or container), join from 2 clients. Add a <code>--port</code> launch arg. You now run real infrastructure.</p></div>
</div>
` },

{ c: 9, t: "Chapter 09 Recap", html: `
<h2>Chapter 09 — recap</h2>
<div class="two">
  <div>
    <h3>Multiplayer toolkit delivered</h3>
    <ul class="pts">
      <li>ENet host/join; peer lifecycle &amp; cleanup.</li>
      <li>@rpc: modes, reliability, channels; validation discipline.</li>
      <li>Authority model; per-player ownership in _enter_tree.</li>
      <li>MultiplayerSpawner: auto list + custom functions.</li>
      <li>MultiplayerSynchronizer: config, delta, visibility.</li>
      <li>Movement sync tiers; lobby flow; disconnect handling.</li>
      <li>Security layers; bandwidth budgeting; headless servers.</li>
    </ul>
  </div>
  <div>
    <h3>Architecture instincts</h3>
    <ul class="pts">
      <li>Server decides; clients request &amp; render.</li>
      <li>Replicate minimal state; extrapolate the rest.</li>
      <li>Netcode correctness = cleanup correctness.</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Chapter 10</b> — 3D character animation: Skeleton3D, bone maps, retargeting, and the AnimationTree state machines that bring rigs (networked or not) to life.</p></div>
  </div>
</div>
` }

);
