/* Chapter 02 — Quickstart (18 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 2, t: "Chapter 02 — Quickstart", cover: true, html: `
<div class="cov-part">Part I · Foundations &amp; Quickstart</div>
<div class="cov-n">02</div>
<h1>Quickstart</h1>
<p class="cov-sub">Your first 3D scene — a textured crate — in under an hour: nodes, transforms, materials, imported textures, and the ideas behind UV mapping that every later chapter builds on.</p>
<div class="chips">
  <span class="tag">First 3D scene</span><span class="tag">MeshInstance3D</span>
  <span class="tag">Importing textures &amp; 2D assets</span><span class="tag">UV &amp; texture mapping</span>
  <span class="tag">StandardMaterial3D</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 2, t: "What You'll Build", html: `
<h2>What you'll build</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>A spinning, textured <b>crate on a floor</b> — the "Hello World" of 3D.</li>
      <li>A <b>2D HUD overlay</b> (label + sprite) proving 2D and 3D coexist in one scene.</li>
      <li>Along the way: creating nodes, moving/rotating them, importing a texture, wiring it into a PBR material, and a first script.</li>
    </ul>
    <div class="callout note"><b>ℹ Note</b><p>Keep this project — Chapter 3 will dissect its nodes (mesh, instance, material) in engine-internals detail.</p></div>
  </div>
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">CrateScene</span> <span class="m">← scene root</span>
<span class="m">├──</span><span class="b">DirectionalLight3D</span> <span class="g">Sun</span>
<span class="m">├──</span><span class="b">WorldEnvironment</span> <span class="m">(sky, ambient)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="g">Floor</span> <span class="m">(PlaneMesh)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="g">Crate</span> <span class="m">(BoxMesh + material)</span>
<span class="m">│&nbsp;&nbsp;&nbsp; └──</span><span class="m">script: rotate in _process</span>
<span class="m">└──</span><span class="b">CanvasLayer</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">Label</span> <span class="g">Title</span> <span class="m">("Quickstart!")</span></div>
  </div>
</div>
` },

{ c: 2, t: "Creating the Scene — Node by Node", html: `
<h2>Node by node</h2>
<ol class="steps">
  <li><b>New scene</b> → root <code>Node3D</code>, rename <code>CrateScene</code>. Node3D is the bare 3D transform holder every 3D node descends from.</li>
  <li><span class="kbd">Ctrl+A</span> (Add Child Node) → <code>DirectionalLight3D</code>. Rotate it (−50° X, −30° Y) so light rakes across the floor.</li>
  <li>Add <code>WorldEnvironment</code> → create an <code>Environment</code> resource → <b>Background = Sky</b> → new <code>ProceduralSkyMaterial</code>. The 3D viewport now has a horizon.</li>
  <li>Add <code>MeshInstance3D</code> → set its <b>Mesh</b> to a new <code>BoxMesh</code>, size <code>(2, 2, 2)</code> — that's the crate. Duplicate it, swap the mesh to <code>PlaneMesh</code>, size <code>(20, 20)</code>, and name it <code>Floor</code>.</li>
  <li><span class="kbd">F6</span> runs the <em>current scene</em>; <span class="kbd">F5</span> runs the <em>main scene</em> (first pick when prompted — or set it in Project Settings).</li>
</ol>
<div class="callout pit"><b>⚠ Common Pitfall</b><p>A gray/empty viewport usually means: no light, no environment, or the camera is inside an object. Add the light and environment <em>first</em>, and press <span class="kbd">F</span> to focus selection when lost in space.</p></div>
` },

{ c: 2, t: "Moving in 3D: Transforms & Gizmos", html: `
<h2>Transforms &amp; gizmos</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Every 3D node has a <b>Transform</b>: Position + Rotation + Scale (stored as a 3×4 <code>Transform3D</code>: basis + origin).</li>
      <li>Gizmo modes: <span class="kbd">W</span> select/move · <span class="kbd">E</span> rotate · <span class="kbd">R</span> scale. Colored arrows/curves match axes: <b style="color:#ff6b6b">X red</b>, <b style="color:#7bd88f">Y green</b>, <b style="color:#56d4dd">Z blue</b>.</li>
      <li>Toggle <b>local/global space</b> with <span class="kbd">T</span>-menu or the toolbar — local gizmo rotates with the object; global stays axis-aligned.</li>
      <li><b>Snapping:</b> hold <span class="kbd">Ctrl</span> while dragging (grid steps), <span class="kbd">Shift</span> for finer movement.</li>
      <li>The <b>Inspector</b> shows exact numbers — type them for precision; the viewport is for eyeballing.</li>
    </ul>
  </div>
  <div>
    <h3>Navigate the viewport</h3>
    <table class="tbl">
      <tr><th>Action</th><th>Input</th></tr>
      <tr><td>Orbit view</td><td>Middle-mouse drag</td></tr>
      <tr><td>Pan</td><td>Shift + MMB</td></tr>
      <tr><td>Fly (FPS style)</td><td>Right-mouse + WASD/QE</td></tr>
      <tr><td>Zoom</td><td>Wheel / trackpad</td></tr>
      <tr><td>Focus selection</td><td><span class="kbd">F</span></td></tr>
      <tr><td>Top / front / side</td><td>Numpad <span class="kbd">7</span>/<span class="kbd">1</span>/<span class="kbd">3</span></td></tr>
    </table>
    <div class="callout bp"><b>✓ Best Practice</b><p>Learn <b>right-mouse fly mode</b> early — it's the fastest way to inspect a 3D level, and it mirrors how a game camera feels.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Camera & Environment", html: `
<h2>Seeing the world: camera &amp; environment</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>The <b>editor camera</b> is not the game camera. Add a <code>Camera3D</code> node, position it, then click <b>Preview</b> (bottom-left of the viewport) — the game view follows that camera.</li>
      <li><code>WorldEnvironment</code> holds the scene's <code>Environment</code> resource: sky, ambient light, fog, glow, tone mapping. It's the "post-processing rig" of your level.</li>
      <li><b>Field of View</b> (default 75°) shapes feel: 60–70° for a grounded third-person game, wider for FPS.</li>
      <li><code>keep_aspect</code>: Keep Height (default, 3D standard) vs Keep Width (pixel-art 2D).</li>
    </ul>
  </div>
  <div>
<pre data-file="camera_rig.gd" data-lang="gdscript"><code># A minimal orbiting preview camera
extends Camera3D

@export var radius := 8.0
@export var height := 3.0
@export var speed  := 0.4  # radians / second

func _process(delta: float) -> void:
	var t := Time.get_ticks_msec() / 1000.0 * speed
	# Circle the origin while looking at it.
	position = Vector3(cos(t) * radius, height, sin(t) * radius)
	look_at(Vector3.ZERO, Vector3.UP)</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Multiple cameras can coexist, but only one is <em>current</em>. If your view is wrong, check <code>current</code> — or call <code>make_current()</code>.</p></div>
  </div>
</div>
` },

{ c: 2, t: "F5 vs F6 & Scene Files", html: `
<h2>Running the game — F5, F6, and what's on disk</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><span class="kbd">F6</span> — run the <b>currently edited scene</b>. Perfect for iterating on a crate or a test level.</li>
      <li><span class="kbd">F5</span> — run the <b>main scene</b> defined in Project Settings (your real entry point).</li>
      <li>Saving (<span class="kbd">Ctrl+S</span>) writes <code>crate_scene.tscn</code> — a readable text file you can open in any editor and diff in Git.</li>
      <li>The editor <b>auto-saves on run</b> by default (Editor Settings → Auto Save on Run).</li>
    </ul>
  </div>
  <div>
<pre data-file="crate_scene.tscn" data-lang="text"><code>[node name="CrateScene" type="Node3D"]

[node name="Floor" type="MeshInstance3D" parent="."]
mesh = SubResource("PlaneMesh_f1")

[node name="Crate" type="MeshInstance3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0)
mesh = SubResource("BoxMesh_2")</code></pre>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Scenes serialize as INI-like text: nodes with <code>type</code>, <code>parent</code> paths, inline <code>SubResource</code> definitions and <code>ext_resource</code> references by UID. Understanding this format demystifies merge conflicts forever.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Importing Textures", html: `
<h2>Importing textures — the pipeline is automatic</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Drop a <code>.png</code> / <code>.jpg</code> / <code>.webp</code> into the FileSystem dock (or copy into the project folder). Godot <b>detects, imports, and caches</b> it — drag from FileSystem onto a material's Albedo slot. Done.</li>
      <li>Supported: PNG, JPEG, WebP, SVG, TGA, DDS, BMP, EXR/HDR (HDR), KTX/ETC2/ASTC.</li>
      <li><b>WebP is the sweet spot</b> for most game textures: smaller than PNG at similar quality, GPU-decodable.</li>
      <li>Each import produces a hidden optimized copy under <code>.godot/imported/</code> plus a visible <code>.png.import</code> metadata file — <b>commit the metadata, ignore the cache</b>.</li>
    </ul>
  </div>
  <div>
    <h3>Import dock (with texture selected)</h3>
    <ul class="pts">
      <li><b>Detect 3D / 2D:</b> 3D mode compresses to GPU formats &amp; enables mipmaps.</li>
      <li><b>VRAM Compression:</b> lossless (safe) vs lossy (smaller) vs uncompressed (UI).</li>
      <li><b>Generate Mipmaps:</b> keep ON in 3D — prevents shimmer at distance (perf + quality).</li>
      <li>Press <b>Reimport</b> after changing anything.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>If a texture looks fine in the FileSystem preview but broken on the mesh, the material is usually unshaded/UV-mismatched — not the import. Chapter's end covers UVs.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Importing 2D Assets & Sprite2D", html: `
<h2>2D assets in a 3D world (and pure 2D games)</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>2D rendering lives on a <b>canvas</b>: even inside a 3D scene, a <code>CanvasLayer</code> hosts <code>Sprite2D</code>, <code>Label</code>, and all <code>Control</code> UI.</li>
      <li>Add a <code>Sprite2D</code>, assign <b>Texture</b> — the import preset for 2D keeps pixels crisp and disables unneeded mipmaps.</li>
      <li>For pixel art: enable <b>Filter = Nearest</b> in the import settings <em>and</em> set default texture filters in Project Settings.</li>
      <li><code>Sprite2D</code> has <code>hframes/vframes</code> for sprite sheets; <code>AnimatedSprite2D</code> + <code>SpriteFrames</code> for frame animation without code.</li>
    </ul>
  </div>
  <div>
<pre data-file="hud.gd" data-lang="gdscript"><code># Title label that fades in, then a sprite pulse.
extends CanvasLayer

@onready var title: Label = %Title
@onready var logo: Sprite2D = %Logo

func _ready() -> void:
	# Tweens animate any property — see Ch 11.
	var tw := create_tween()
	tw.tween_property(title, "modulate:a", 1.0, 0.8)\
		.from(0.0)
	tw.set_loops()\
		.tween_property(logo, "scale", Vector2.ONE * 1.08, 0.6)\
		.set_trans(Tween.TRANS_SINE)\
		.set_ease(Tween.EASE_IN_OUT)\
		.tween_property(logo, "scale", Vector2.ONE, 0.6)</code></pre>
  </div>
</div>
` },

{ c: 2, t: "UV Space — The Core Idea", html: `
<h2>UV mapping: every surface is a flattened image</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>UV coordinates</b> map each mesh <b>vertex</b> to a point on a texture. <b>U = horizontal, V = vertical</b>, both normalized <b>0 → 1</b> — top-left is (0,0).</li>
      <li>A cube has 6 faces, so its default UVs place every face over the <b>same full texture</b> — that's why one image textures all sides of a BoxMesh identically.</li>
      <li>Values outside 0–1 <b>wrap or clamp</b> depending on the material's texture flags — the basis of tiling floors.</li>
      <li>UVs live in the <b>mesh</b>, not the material: same texture on differently-UV'd meshes looks different.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>3D mesh vertex</b><code>(x, y, z)</code> + <code>(u, v)</code> pair</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Texture lookup</b>pixel at <code>uv * texture_size</code></div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Surface color</b>fed into lighting as <b>albedo</b></div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Why "UV" and not "XY"? Because XYZ were taken by position; U and V were the next letters in early graphics literature. You now own a piece of trivia that survives interviews.</p></div>
  </div>
</div>
` },

{ c: 2, t: "UVs in Practice: Godot's Primitives", html: `
<h2>UVs on Godot's built-in meshes</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>BoxMesh / PlaneMesh / QuadMesh:</b> whole texture per face — ideal for crates, screens, posters.</li>
      <li><b>SphereMesh:</b> equirectangular wrap — texture's left edge meets its right edge at one seam.</li>
      <li><b>CylinderMesh, PrismMesh, CapsuleMesh, TorusMesh, TextMesh:</b> sensible cylindrical/planar defaults.</li>
      <li><b>Tiling:</b> on <code>PlaneMesh</code> set <code>subdivide_width/depth</code> or scale UVs via material's <b>UV1 Scale</b> (e.g. <code>(4, 4)</code>) to repeat a floor texture.</li>
      <li>Any <b>imported model</b> carries authored UVs from Blender — Chapter 4's territory.</li>
    </ul>
  </div>
  <div>
    <h3>Experiment: one texture, three behaviors</h3>
    <table class="tbl">
      <tr><th>Setup</th><th>Result</th></tr>
      <tr><td>BoxMesh, UV1 scale (1,1,1)</td><td>Same image on all 6 faces</td></tr>
      <tr><td>PlaneMesh 20×20, UV1 scale (4,4)</td><td>Floor tiles ×16</td></tr>
      <tr><td>SphereMesh, world map texture</td><td>A planet</td></tr>
    </table>
    <div class="callout bp"><b>✓ Best Practice</b><p>Author textures at <b>power-of-two</b> sizes (512, 1024…) where you can — mipmapping and compression behave best, though modern GPUs tolerate NPOT fine.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Wiring the Texture: StandardMaterial3D", html: `
<h2>From PNG to lit surface</h2>
<ol class="steps">
  <li>Select <code>Crate</code> → Inspector → <b>Material</b> → <b>New StandardMaterial3D</b> → click the sphere to open it.</li>
  <li><b>Albedo → Texture</b> → Quick Load (or drag from FileSystem) → <code>crate.png</code>. The crate is now textured.</li>
  <li>Drag the same <b>material resource</b> from the FileSystem if you saved one — materials are <b>shareable resources</b>; one edit updates every user.</li>
  <li>Nudge <b>Metallic = 0</b>, <b>Roughness ≈ 0.8</b> — crates are matte wood. Watch the preview sphere update live.</li>
</ol>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Save reused materials as <code>.tres</code> files (<code>assets/materials/</code>) instead of leaving them buried in nodes. Shared resources = global restyles + smaller scenes.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p><b>Albedo</b> is <em>base color with no lighting baked in</em>. Never put shadows/highlights into albedo textures for 3D — the PBR lighting model (Ch 3, 5) adds its own, and baked-in shading doubles up.</p></div>
</div>
` },

{ c: 2, t: "Material Playground", html: `
<h2>60 seconds of PBR intuition</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Roughness 0</b> → mirror-like reflections blur to nothing at <b>1</b> → chalk.</li>
      <li><b>Metallic 0</b> → dielectric (wood, plastic, paint); <b>1</b> → metal: albedo becomes tinted reflection.</li>
      <li><b>Emission</b> → self-illumination; enable <em>Emission → Operator: Add</em> and crank energy for glowing runes (picked up by glow post-FX, Ch 8).</li>
      <li><b>Shading Mode</b>: Per-Pixel (default) vs Per-Vertex for stylized/faceted looks.</li>
    </ul>
  </div>
  <div>
<pre data-file="crate.gd" data-lang="gdscript"><code># Spin the crate and gently breathe its emission.
extends MeshInstance3D

@export var spin_speed := 0.8  # rad/s

@onready var _mat: StandardMaterial3D = \
		get_active_material(0) as StandardMaterial3D

func _process(delta: float) -> void:
	rotate_y(spin_speed * delta)
	# Emission energy pulses between 0.6 and 1.4.
	var t := 0.5 + 0.5 * sin(Time.get_ticks_msec() / 300.0)
	if _mat:
		_mat.emission_energy_multiplier = 0.6 + 0.8 * t</code></pre>
    <div class="callout note"><b>ℹ Note</b><p><code>get_active_material(0)</code> = surface 0's override. Materials are <b>Resources</b> — mutating one instance affects every mesh sharing it.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Your First Script", html: `
<h2>The script that ties it together</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li>Attach a script with the scroll icon while <code>Crate</code> is selected → template creates <code>extends MeshInstance3D</code>.</li>
      <li>Scripts <b>extend a node class</b> — your script <em>is</em> the node, plus your code.</li>
      <li><code>_ready()</code> runs once after the node (and children) enter the tree; <code>_process(delta)</code> runs every frame.</li>
      <li><span class="kbd">Ctrl+Click</span> any method to jump to its docs; the editor's autocomplete (esp. with types) is excellent.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p><code>_process</code> is frame-rate dependent — always multiply motion by <code>delta</code>. 60&nbsp;FPS vs 144&nbsp;FPS must behave identically.</p></div>
  </div>
  <div>
<pre data-file="hello_crate.gd" data-lang="gdscript"><code>extends MeshInstance3D
# ^ the node type we extend. Everything below
#   extends MeshInstance3D: mesh, materials, transform...

const ROT_SPEED := 0.8      # rad/s — typed constant
var wobble := 0.0           # instance variable

func _ready() -> void:
	# Runs once, after children are ready.
	print("Crate alive at %s" % global_position)

func _process(delta: float) -> void:
	wobble += delta
	rotate_y(ROT_SPEED * delta)
	position.y = 1.0 + 0.15 * sin(wobble * 2.0)</code></pre>
  </div>
</div>
` },

{ c: 2, t: "Saving, Instancing, Reusing", html: `
<h2>Scenes are your prefabs</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Save <code>crate.tscn</code>, then <b>drag it from FileSystem into another scene</b> — it instances as one collapsible child (blue name = instance).</li>
      <li>Edits to the <b>original file propagate</b> to every instance; per-instance <b>overrides</b> (like position) survive.</li>
      <li><b>Editable Children</b> (right-click) lets you tweak inside an instance — overrides show in green in the Inspector.</li>
      <li>Chain: <code>crate_scene.tscn</code> → <code>level.tscn</code> → <code>main.tscn</code>. This is scene composition, and it's how every project in this curriculum is built.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Node3D</span> <span class="g">Level</span>
<span class="m">├──</span><span class="y">@crate_scene.tscn</span> <span class="m">(override: pos 3,1,0)</span>
<span class="m">├──</span><span class="y">@crate_scene.tscn</span> <span class="m">(override: pos 0,1,-4)</span>
<span class="m">└──</span><span class="y">@crate_scene.tscn</span> <span class="m">(scale 2× — a big crate)</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Anything you'll place more than twice becomes its own scene <em>immediately</em>. Retro-factoring copies into instances is pure pain.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Common Beginner Pitfalls", html: `
<h2>Pitfall roundup — the ones everyone hits</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ "My node reference is null"</b><p><code>@onready</code> runs <em>after</em> children are ready; direct member init runs before. Use <code>@onready var x = $Path</code>, and prefer <b>unique name (%)</b> accessors over brittle deep paths.</p></div>
    <div class="callout pit"><b>⚠ Editor script changes don't apply</b><p>Hot reload usually works, but renaming/removing nodes with live scripts can desync. Save, stop the game, reopen the scene if the Inspector looks wrong.</p></div>
    <div class="callout pit"><b>¶ Texture imports but looks blown out</b><p>An sRGB image assigned as albedo <em>without</em> proper import flags gets double-brightened. Keep <b>Detect 3D</b> on; Godot tags color textures as sRGB automatically.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ "Nothing changed!" after editing a shared resource</b><p>Materials/meshes are shared by default. If you wanted a <em>private</em> copy, use <b>Resource → Make Unique</b> in the Inspector's file menu.</p></div>
    <div class="callout pit"><b>⚠ Confusing editor camera with game camera</b><p>Editor view ≠ player view. Always add a <code>Camera3D</code> and hit Preview (or F6) before judging composition.</p></div>
    <div class="callout pit"><b>⚠ Project won't open on another machine</b><p>The <code>.godot/</code> cache is machine-generated. Ship the folder <em>without</em> it; Godot reimports on first open. That's also why CI runs <code>godot --headless --import</code>.</p></div>
  </div>
</div>
` },

{ c: 2, t: "Chapter 02 Exercises", html: `
<h2>Exercises — Quickstart</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 2.1 — Textured diorama</b><p>Floor + 5 crates + 1 light + environment. Constraint: use <b>exactly one</b> material for all crates, and vary only per-instance transforms. Then break it deliberately: what happens when one instance scales 3×?</p></div>
  <div class="callout ex"><b>✎ Ex 2.2 — UV tiling lab</b><p>One 512×512 checker texture. Make a plane look like: (a) a single huge tile, (b) a 8×8 tiled floor using <b>UV1 Scale</b>, (c) mirrored tiling (hint: negative scale). Screenshot each.</p></div>
  <div class="callout ex"><b>✎ Ex 2.3 — First composite</b><p>Extract the crate into <code>crate.tscn</code>, build <code>level.tscn</code> from 6 instances, and add a 2D title via <code>CanvasLayer</code>. Verify: edit <code>crate.tscn</code> → do all 6 instances update?</p></div>
  <div class="callout ex"><b>✎ Ex 2.4 — Read the .tscn</b><p>Open <code>level.tscn</code> in a text editor. Identify: nodes, a transform, an ext_resource reference. This literacy pays off in every merge conflict of your career.</p></div>
</div>
` },

{ c: 2, t: "Chapter 02 Recap", html: `
<h2>Chapter 02 — recap</h2>
<div class="two">
  <div>
    <h3>Muscle memory gained</h3>
    <ul class="pts">
      <li>Build a scene: light → environment → meshes → camera → script.</li>
      <li>Navigate &amp; manipulate: MMB orbit, RMB fly, W/E/R gizmos, snapping.</li>
      <li>Import a texture, wire albedo, tune roughness/metallic.</li>
      <li>Explain UVs and tile via UV1 scale.</li>
      <li>Save scenes, instance them, override per-instance.</li>
    </ul>
  </div>
  <div>
    <h3>Looking ahead</h3>
    <ul class="pts">
      <li><b>Ch 3</b> goes under the hood: what meshes <em>are</em> (vertex buffers), what materials <em>compute</em> (PBR), and how the engine executes your scene (MainLoop, servers).</li>
      <li>Every later chapter assumes this chapter's workflow. If any step felt shaky, redo Ex 2.1 now.</li>
    </ul>
  </div>
</div>
` }

);
