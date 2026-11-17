/* Chapter 04 — Godot Editor & Asset Pipeline (22 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 4, t: "Chapter 04 — Editor & Asset Pipeline", cover: true, html: `
<div class="cov-part">Part I · Foundations &amp; Quickstart</div>
<div class="cov-n">04</div>
<h1>The Godot Editor &amp; Asset Pipeline</h1>
<p class="cov-sub">Master the tool you'll live in: docks and viewports, transform gizmos and snapping, the import system, glTF/Blender workflows, project settings, and editor customization.</p>
<div class="chips">
  <span class="tag">Editor interface</span><span class="tag">3D navigation</span>
  <span class="tag">Gizmos &amp; snapping</span><span class="tag">.glb / .gltf import</span>
  <span class="tag">Blender workflow</span><span class="tag">Project Settings</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 4, t: "Editor Anatomy", html: `
<h2>The editor at a glance</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Scene dock</b> (left): node tree of the open scene — add/reparent/instance nodes here. The <em>Remote</em> tab shows the running game's tree.</li>
      <li><b>FileSystem dock</b> (left-bottom): <code>res://</code> files, drag-drop imports, favorites &amp; filters.</li>
      <li><b>Inspector</b> (right): selected object's properties &amp; resources; also the <b>Import</b> dock when a file is selected, and <b>Node</b> dock (signals &amp; groups).</li>
      <li><b>Viewport center</b>: 2D / 3D / Script / AssetLib workspaces via top tabs.</li>
      <li><b>Bottom panel</b>: Output, Debugger, Audio, Animation, Shader editor…</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">┌────────────┬──────────────┬─────────┐</span>
<span class="m">│</span> <span class="b">Scene</span>      │              │ <span class="b">Inspector</span> <span class="m">│</span>
<span class="m">│</span> <span class="m">(tree)</span>     │   <span class="g">Viewport</span>    │ <span class="m">(props/</span>   <span class="m">│</span>
<span class="m">│</span>            │   <span class="m">2D·3D·Script</span> │ <span class="m">import/</span>   <span class="m">│</span>
<span class="m">├────────────┤              │ <span class="m">node)</span>     <span class="m">│</span>
<span class="m">│</span> <span class="b">FileSystem</span> │              │           <span class="m">│</span>
<span class="m">│</span> <span class="m">(res://)</span>   ├──────────────┴───────────┤</span>
<span class="m">│</span>            │ <span class="b">Output · Debugger · Animation</span> <span class="m">│</span>
<span class="m">└────────────┴───────────────────────────┘</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p><span class="kbd">Ctrl+Shift+O</span> quick-opens scenes, <span class="kbd">Ctrl+Shift+A</span> quick-opens/adds nodes by typing — you'll never browse docks slowly again.</p></div>
  </div>
</div>
` },

{ c: 4, t: "3D Viewport Navigation Deep Dive", html: `
<h2>3D navigation — make it automatic</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Action</th><th>Default</th><th>Notes</th></tr>
  <tr><td>Orbit</td><td>MMB drag</td><td>around view focus point</td></tr>
  <tr><td>Pan</td><td>Shift+MMB</td><td>screen-space slide</td></tr>
  <tr><td>Zoom</td><td>Wheel</td><td>dolly toward focus</td></tr>
  <tr><td>Fly mode</td><td>RMB hold + WASDQE</td><td>Shift = sprint; scroll = base speed</td></tr>
  <tr><td>Focus</td><td><span class="kbd">F</span></td><td>re-center on selection</td></tr>
  <tr><td>Ortho views</td><td>Numpad 1/3/7</td><td>+<span class="kbd">5</span> toggles perspective/ortho</td></tr>
  <tr><td>Maximize</td><td><span class="kbd">Shift+Space</span></td><td>one-viewport zen mode</td></tr>
  <tr><td>4-view split</td><td><span class="kbd">Ctrl+Space</span> / toolbar</td><td>modeling-style quad layout</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Editor Settings → Editors → 3D → <b>Navigation Scheme</b> supports Maya-style (Alt+LMB) and Modo-style schemes. Match your DCC (Blender/Maya) to stop your hands from fighting two muscle memories.</p></div>
  <div class="callout note"><b>ℹ Note</b><p>Emulate 3-button mouse (Editor Settings) enables Alt+LMB orbit on trackpads/laptops without MMB.</p></div>
</div>
` },

{ c: 4, t: "Transform Gizmos & Snapping", html: `
<h2>Gizmos, snapping &amp; precision</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Tools: <span class="kbd">W</span> move · <span class="kbd">E</span> rotate · <span class="kbd">R</span> scale — plus dedicated <b>Select</b> (Q) mode.</li>
      <li><b>Snapping while dragging:</b> <span class="kbd">Ctrl</span> grid-snap (move 0.1 m / rotate 15° / scale 10%), <span class="kbd">Shift</span> fine step (×0.1).</li>
      <li><b>Configure Snap…</b> dialog: change grid/rotation steps for level design (e.g. 1 m walls).</li>
      <li>Inspector fields accept math: type <code>2*1.5</code> or <code>90d</code> (degrees suffix!) into rotation fields.</li>
      <li>Axis locking: start dragging an axis, then hold other axes' keys… or click axis handle after starting drag (appears as colored highlight). Precise single-axis edits.</li>
    </ul>
  </div>
  <div>
    <h3>Every gizmo is a plugin</h3>
    <ul class="pts">
      <li>Lights show lines/cookies, cameras show frustum &amp; helper, joints show pivots — driven by <b>Node3DGizmoPlugin</b>s.</li>
      <li>Toolbar toggles: view grid, show origin, perspective label menu (wireframe, shading display modes…).</li>
      <li>Your own nodes can draw custom gizmos via <code>EditorNode3DGizmoPlugin</code> — power for tool-style addons (Ch 13).</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Rotating in the viewport edits <b>Euler order YXZ</b> — gimbal-adjacent weirdness appears when two axes near ±90°. For gameplay rotation, prefer <code>look_at()</code> or basis math over stacked Eulers.</p></div>
  </div>
</div>
` },

{ c: 4, t: "The Import Pipeline", html: `
<h2>How importing actually works</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li>Godot <b>does not load your source files directly</b> (except scripts/scenes). Textures, models, audio → imported to engine-optimized formats.</li>
      <li>For each source file: a visible <code>.import</code> metadata file + an optimized artifact under <code>.godot/imported/</code> (by MD5 path).</li>
      <li>Scenes reference the <em>source</em> path; at load, the engine maps to the artifact. That's why you <b>commit .import files and sources, never .godot/</b>.</li>
      <li>Changing a source file on disk auto-reimports (editor watches the FS). Changing import options requires <b>Reimport</b>.</li>
      <li>Import runs on threads — big projects import fast after first time.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>source.png</b>in your project folder</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Import dock settings</b>per-file &amp; presets (.import)</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>.godot/imported/*.ctex</b>GPU-ready compressed texture</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Texture2D resource</b>loaded via res://source.png</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>CI tip: <code>godot --headless --import</code> imports the whole project without opening a window — the first step of every automated build pipeline (Ch 14).</p></div>
  </div>
</div>
` },

{ c: 4, t: "Import Docks & Presets", html: `
<h2>Working with the Import dock</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Select a file in FileSystem → the Inspector becomes the <b>Import dock</b> for that type.</li>
      <li><b>Presets:</b> save option sets per type (e.g. "UI Lossless", "3D VRAM Compressed") — apply to selected or <b>all files of that type</b> in one click.</li>
      <li>Presets persist in <code>.godot/import_presets.cfg</code> (not versioned by default — document your presets for teammates, or commit the file deliberately).</li>
      <li>Per-file overrides stack on top of presets.</li>
      <li>Multi-select files → Reimport in bulk.</li>
    </ul>
  </div>
  <div>
    <h3>Critical texture options recap</h3>
    <table class="tbl">
      <tr><th>Option</th><th>Use</th></tr>
      <tr><td>Detect 3D/2D</td><td>3D: VRAM-compress + mips</td></tr>
      <tr><td>VRAM Compression</td><td>lossless / lossy / uncompressed</td></tr>
      <tr><td>Mipmaps</td><td>anti-shimmer at distance (keep on in 3D)</td></tr>
      <tr><td>Process → Fix Alpha Border</td><td>avoid halos on sprite edges</td></tr>
      <tr><td>Process → Premultiply Alpha</td><td>correct blending for some art</td></tr>
      <tr><td>SVG: Scale</td><td>rasterize size for crisp UI icons</td></tr>
    </table>
  </div>
</div>
` },

{ c: 4, t: "glTF: The Interchange Format", html: `
<h2>glTF — Godot's native 3D interchange</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>.glb</b> (binary, one file) / <b>.gltf</b> (JSON + buffers) — the "JPEG of 3D": meshes, skeletons, animations, materials (PBR, matches Godot's model!), cameras, lights.</li>
      <li>Full Khronos PBR mapping — metallic/roughness textures translate 1:1 into StandardMaterial3D / ORM.</li>
      <li>Supported everywhere: Blender, Maya, Substance, Mixamo converters, Poly Pizza, Kenney…</li>
      <li>Alternative formats: FBX (via ufbx importer), OBJ, Collada (.dae), glTF is <b>recommended</b>.</li>
      <li>Godot can also <b>export</b> scenes to glTF (Scene → Export…) — round-trips to Blender.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">scene.glb</span>
<span class="m">├──</span><span class="b">Node3D</span> <span class="g">Scene</span> <span class="m">(root)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="g">Body</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └─</span><span class="m">mesh + StandardMaterial3D</span>
<span class="m">├──</span><span class="b">Skeleton3D</span> <span class="g">Armature</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">BoneAttachment3D</span>…
<span class="m">├──</span><span class="b">AnimationPlayer</span> <span class="m">(clips)</span>
<span class="m">└──</span><span class="b">Camera3D</span> <span class="m">(optional)</span>

<span class="m"># Godot 4 glTF importer is a full
# implementation of the 2.0 spec
# + Khronos KHR extensions.</span></div>
  </div>
</div>
` },

{ c: 4, t: "Blender → Godot Workflow", html: `
<h2>Blender to Godot — the reliable pipeline</h2>
<ol class="steps">
  <li>In Blender: 1 unit = 1 m already. Model, rig, animate normally.</li>
  <li>File → Export → <b>glTF 2.0 (.glb)</b> directly into <code>res://assets/models/</code>.</li>
  <li>Export settings that matter: <em>+Y up</em> (default), include → <b>Animation</b>, <b>Skinning</b>; <em>Object Properties → Active Collection</em> for subsets.</li>
  <li>Godot auto-imports; drop the resulting scene into your level as an instance.</li>
  <li>Re-export from Blender → Godot auto-reimports and every instance updates.</li>
</ol>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>One <code>.blend</code> = one exportable asset collection. Keep a <code>to_godot</code> collection per file; export with "Active Collection" so WIP junk never lands in the engine.</p></div>
  <div class="callout note"><b>ℹ Note</b><p>Godot 4.x can import <code>.blend</code> files <em>directly</em> (it calls a bundled Blender on your PATH in the background). It's convenient for solo work but adds fragility (Blender version coupling) — explicit <code>.glb</code> exports are the team-safe default.</p></div>
</div>
` },

{ c: 4, t: "glTF Import Options", html: `
<h2>The glTF import dock, decoded</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Section</th><th>Key options</th><th>Guidance</th></tr>
  <tr><td>Nodes</td><td>Root type/name, import as Skeleton-only, meshes, skin weights (8 vs 4)</td><td>Keep root Node3D for levels; Skeleton-only for shared rigs (Ch 10)</td></tr>
  <tr><td>Meshes</td><td>Ensure Tangents, generate LODs, shadow meshes, lightmap UV2 unwrap</td><td>Enable LODs + shadow meshes for hero meshes; UV2 when using LightmapGI (Ch 5)</td></tr>
  <tr><td>Animation</td><td>Import animations, FPS, loop markers, baking</td><td>Uncheck to skip unused clips — smaller load</td></tr>
  <tr><td>Removal</td><td>Remove immutable tracks</td><td>On — prunes no-op tracks</td></tr>
  <tr><td>Materials</td><td>Keep on Reimport, custom root path, extraction into .material/.tres</td><td>Extract materials so artists can tune .tres files without re-export</td></tr>
  <tr><td>Retarget</td><td>BoneMap assignment</td><td>Ch 10's retargeting pipeline lives here</td></tr>
</table></div>
<div class="callout bp"><b>✓ Best Practice</b><p><b>Extract materials</b> on import (Materials → "Extract Materials"): Godot writes <code>.material/.tres</code> files and rewires the mesh. Now texture tweaks don't require Blender round-trips — the single biggest artist↔programmer friction reducer.</p></div>
` },

{ c: 4, t: "Imported Scenes: Edit & Extend", html: `
<h2>Working with imported scene data</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>An imported <code>.glb</code> is a <b>read-only scene</b> in the editor — you instance it, not edit it.</li>
      <li>To extend: instance it, add children (weapon mounts, Area3D hitboxes, scripts on children via <b>Editable Children</b> or on the instance root).</li>
      <li><b>Scene inheritance</b> (New Inherited Scene from the .glb) lets you <em>modify</em> the imported hierarchy while still receiving reimport updates — ideal for character variants.</li>
      <li>Ownership rule: nodes you add under an imported instance belong to <em>your</em> scene, not the import — reimport won't clobber them.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="y">@enemy_robot.glb</span> <span class="m">(imported)</span>
<span class="m">├──</span><span class="b">Skeleton3D</span> <span class="m">← don't touch</span>
<span class="m">├──</span><span class="b">AnimationPlayer</span> <span class="m">← clips from DCC</span>
<span class="m">└──</span><span class="m">…</span>

<span class="b">CharacterBody3D</span> <span class="g">Enemy</span> <span class="m">(yours)</span>
<span class="m">├──</span><span class="y">@enemy_robot.glb</span> <span class="m">← instanced</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">← yours</span>
<span class="m">├──</span><span class="b">Area3D</span> <span class="g">Hitbox</span> <span class="m">← yours</span>
<span class="m">└──</span><span class="b">Node</span> <span class="g">Health</span> <span class="m">← script component</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Never script the imported root directly. Wrap imports in a gameplay shell (as above) — reimports and DCC changes stay non-breaking.</p></div>
  </div>
</div>
` },

{ c: 4, t: "Project Settings", html: `
<h2>Project Settings — project.godot decoded</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Every setting maps to an INI key like <code>[physics]/3d/default_gravity</code> — editable in the UI or file; the UI wins for discoverability.</li>
      <li><b>Application:</b> name, main scene, window size/stretch, boot splash.</li>
      <li><b>Input Map:</b> actions → events. Always bind gameplay to <em>actions</em>, never raw keys (remapping &amp; controllers for free).</li>
      <li><b>Autoload:</b> singletons available in every scene (event bus, game state, scene switcher — Ch 8/11).</li>
      <li><b>Physics / Rendering / Layer Names:</b> engine tuning &amp; 3D layer naming (name your layers! Ch 6).</li>
      <li>Search bar filters 1000+ settings; "Advanced Settings" toggle reveals the rest.</li>
    </ul>
  </div>
  <div>
<pre data-file="project.godot" data-lang="text"><code>; (excerpt — it's plain INI)
[application]
config/name="Pumpkin Run"
run/main_scene="res://scenes/main.tscn"

[input]
jump={
"deadzone": 0.5,
"events": [Object(InputEventKey,"physical_keycode":32)]
}

[physics]
3d/default_gravity=9.8

[layer_names]
3d_physics/layer_1="world"
3d_physics/layer_3="player"
3d_physics/layer_5="enemies"</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Set up the Input Map <b>before</b> writing player code: <code>jump</code>, <code>move_left</code>… plus <code>device</code>-agnostic events. Retrofitting actions later touches every input call.</p></div>
  </div>
</div>
` },

{ c: 4, t: "Editor Settings & Customization", html: `
<h2>Editor Settings — make it yours</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Editor ≠ Project settings:</b> Editor Settings are per-machine (theme, keys, behavior) and never ship with the game.</li>
      <li>Themes: light/dark/high-contrast; accent color; syntax theme per language.</li>
      <li><b>Text Editor:</b> indent type/width, auto-brace, external editor (VS Code / Rider plug in via executables).</li>
      <li><b>Editors → 3D:</b> navigation scheme, invert zoom, wireframe display default.</li>
      <li><b>Feature Profiles</b> (Editor menu): lock away docks/nodes for students or teammates — a real classroom superpower.</li>
      <li>Everything lives in <code>editor_settings-4.x.tres</code> under <code>app_userdata/</code> — portable via export/import.</li>
    </ul>
  </div>
  <div>
    <h3>Command palette energy</h3>
    <ul class="pts">
      <li><span class="kbd">F1</span> — Search Help (classes &amp; methods).</li>
      <li><span class="kbd">Ctrl+Shift+O</span> — quick open scene.</li>
      <li><span class="kbd">Alt+Click</span> node property → focusing docs… or right-click any property → <b>Open Documentation</b>.</li>
      <li>Editor → <b>Command Palette</b> (4.2+): fuzzy-run any editor command — the fastest way to obscure actions.</li>
    </ul>
    <div class="callout ver"><b>◷ Version Note</b><p><b>4.4</b> adds the <b>embedded Game window</b>: run your game inside a viewport pane — no alt-tab. Toggle in Editor Settings → Editors → Run.</p></div>
  </div>
</div>
` },

{ c: 4, t: "@tool & Editor Plugins", html: `
<h2>Scripting the editor itself</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Adding <code>@tool</code> makes a script execute <b>inside the editor</b> — gizmos, custom previews, level generators.</li>
      <li>Guardrails: <code>Engine.is_editor_hint()</code> to skip game logic; injected <code>EditorPlugin</code>/<code>EditorInterface</code> access.</li>
      <li><b>EditorPlugin</b> (addons/<name>/plugin.cfg + script) adds docks, inspector panels, custom node types, import plugins.</li>
      <li>Ship plugins as folders under <code>addons/</code>; users enable them in Project Settings → Plugins.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>A <code>@tool</code> script with <code>print</code> spam or <code>queue_free</code> can wedge the editor. Test tool scripts in a scratch project first — a crashing editor takes your unsaved work with it.</p></div>
  </div>
  <div>
<pre data-file="spawn_marker.gd" data-lang="gdscript"><code>@tool
extends Node3D
# Draws a disc where enemies spawn — visible while editing.

func _process(_d: float) -> void:
	queue_redraw()

func _draw() -> void:  # Node3D._draw in 4.x
	if not Engine.is_editor_hint():
		return  # never in the shipped game
	draw_circle(Vector2.ZERO, 20.0,
		Color(1, 0.4, 0.2, 0.6))</code></pre>
    <div class="callout note"><b>ℹ Note</b><p>Chapter 13 returns to editor tooling: custom resources, inspector plugins, and the full EditorPlugin anatomy.</p></div>
  </div>
</div>
` },

{ c: 4, t: "Version Control & Collaboration", html: `
<h2>Godot + Git, without the pain</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Ignore:</b> <code>.godot/</code>, <code>export_credentials.cfg</code>, builds. <b>Commit:</b> everything else, including <code>.import</code> files.</li>
      <li><code>.tscn</code>/<code>.tres</code> are text — conflicts happen but are readable. Solve by keeping node edits to one file-section per person.</li>
      <li>Scene files reference assets by <b>UID</b> (4.x) — renaming/moving files doesn't break references (UIDs migrate automatically).</li>
      <li>Godot 4.x ships an optional built-in VCS plugin (Git) — bottom panel shows diffs; needs the git plugin + binary configured.</li>
      <li>Large binaries: consider Git LFS for .psd/.blend sources; exported artifacts stay out.</li>
    </ul>
  </div>
  <div>
<pre data-file=".gitignore" data-lang="text"><code># Godot 4
.godot/
*.translation
export_presets.cfg
builds/

# OS junk
.DS_Store
Thumbs.db</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>One person = one scene file per feature branch. Node-level conflicts merge fine when two people didn't restructure the same subtree — communicate ownership, not just commits.</p></div>
  </div>
</div>
` },

{ c: 4, t: "Command Line & Headless", html: `
<h2>The engine as a CLI tool</h2>
<div class="two">
  <div>
<pre data-file="terminal" data-lang="text"><code># Import all assets, no window (CI first step)
godot --headless --import --path &lt;project&gt;

# Run a scene from CLI
godot --path . res://scenes/main.tscn

# Export release builds (needs templates)
godot --headless --export-release "Windows Desktop" builds/game.exe

# Script-only tooling
godot --headless --script tools/validate.gd

# Fixtures/server build
godot --headless --path . --server</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><code>--headless</code>: no rendering, no audio device — deterministic and container-friendly.</li>
      <li><code>-s script.gd</code> runs a <code>SceneTree</code>-inheriting script — CI checks, asset linting, procedural generation.</li>
      <li><code>--resolution</code>, <code>--position</code>, <code>--rendering-driver</code> (vulkan/opengl3) aid testing matrices.</li>
      <li>Every automated pipeline you'll build (Ch 9's server, Ch 14's exports) starts with these flags.</li>
    </ul>
    <div class="callout ver"><b>◷ Version Note</b><p>Linux/macOS export from any host OS works in 4.3+ without Wine — the export pipeline normalizes paths itself. Cross-compiling is now boring, in the good way.</p></div>
  </div>
</div>
` },

{ c: 4, t: "Audio & Misc Importers", html: `
<h2>Beyond meshes & textures</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Type</th><th>Formats</th><th>Import notes</th></tr>
  <tr><td>Audio</td><td>WAV, OGG Vorbis, MP2/MP3</td><td>WAV = PCM/IMA-ADPCM (seekable, loops); OGG/MP3 = streamed (long music, loop from .import)</td></tr>
  <tr><td>Fonts</td><td>TTF, OTF, WOFF…</td><td>Antialiasing, subpixel, MSDF (crisp UI at any size), variable font support</td></tr>
  <tr><td>Video</td><td>Ogg Theora (.ogv)</td><td>limited codec — most teams convert or skip; use VideoStreamPlayer</td></tr>
  <tr><td>2D vector</td><td>SVG</td><td>rasterized at import with chosen scale; optional runtime <code>SVGTexture</code></td></tr>
  <tr><td>Translations</td><td>CSV / gettext .po</td><td>CSV columns per locale → auto-generated .translation files</td></tr>
  <tr><td>Shaders</td><td>.gdshader / .glsl</td><td>hot-reloaded; .res compiled at load</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>SFX = WAV (low latency, <code>loop</code> flag for hums), music = OGG (streamed, tiny memory). Set loop points in the WAV import dock — not by re-encoding the file.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p>MSDF fonts (import option) render pixel-perfect at every scale with a single texture — the secret behind crisp game UI typography.</p></div>
</div>
` },

{ c: 4, t: "Performance in the Editor Context", html: `
<h2>Editor behavior vs shipped game</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Debug builds: <b>asserts on, error checks on, editor-path code alive</b>. Release exports strip them — measure both.</li>
      <li>Running from editor adds the debug server overhead (small, but real on low-end).</li>
      <li>Editor FPS is meaningless for judging game FPS — use profiler sessions and release exports.</li>
      <li>Rendering debug overlays live in the viewport menu: wireframe, overdraw, shadow atlas — inspect <em>while playing</em>.</li>
    </ul>
  </div>
  <div>
    <h3>First-line profiler moves</h3>
    <ol class="steps">
      <li>Debugger → Profiler → Start; play 10 s; stop.</li>
      <li>Read <b>process time</b> per function (hot path) &amp; physics time.</li>
      <li>Monitor tab: FPS, draw calls (<code>TIME_FPS</code>, <code>RENDER_TOTAL_DRAW_CALLS</code>…).</li>
      <li>Only then optimize — measurements first, vibes never.</li>
    </ol>
    <div class="callout perf"><b>⚡ Performance</b><p>Chapter 13 dedicates a full module to profiling &amp; optimization. The habit starts now: <em>no optimization without a measurement.</em></p></div>
  </div>
</div>
` },

{ c: 4, t: "Chapter 04 Best Practices", html: `
<h2>Chapter 04 — best-practice digest</h2>
<div class="two">
  <div>
    <div class="callout bp"><b>✓ Pipeline</b><p>Source-of-truth DCC files (.blend/.psd) live <em>outside</em> the project (or LFS); only exports enter <code>res://</code>. Regenerate — never hand-edit imports.</p></div>
    <div class="callout bp"><b>✓ Naming</b><p>snake_case files &amp; nodes, PascalCase scripts/classes, ALL_CAPS constants. Godot's conventions are enforced socially, not syntactically — be the enforcer.</p></div>
    <div class="callout bp"><b>✓ Layers</b><p>Name physics layers in Project Settings on day one. <code>layer_3="player"</code> beats binary archaeology in week six.</p></div>
  </div>
  <div>
    <div class="callout bp"><b>✓ Inspector-first design</b><p>Expose tunables via <code>@export</code> and tune while the game runs (changes apply live to the running instance) — then transfer final values into defaults.</p></div>
    <div class="callout bp"><b>✓ Scenes as boundaries</b><p>If two people can edit it separately, it should be separate scenes. Boundaries = parallel happiness.</p></div>
    <div class="callout bp"><b>✓ Reproducibility</b><p>README documents: Godot version, presets used, Blender version, export checklist. Future-you is a different teammate.</p></div>
  </div>
</div>
` },

{ c: 4, t: "Chapter 04 Exercises", html: `
<h2>Exercises — Editor &amp; Pipeline</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 4.1 — Import presets</b><p>Create two texture presets: "UI Lossless" (no mips, lossless, filter nearest) and "3D Default" (VRAM compressed, mips). Apply to a test folder of 10 images; verify sizes in the FileSystem bottom bar.</p></div>
  <div class="callout ex"><b>✎ Ex 4.2 — Blender round-trip</b><p>Model a simple 3-object scene in Blender (named!), export GLB, instance it in Godot. Re-export after moving one object — confirm the instance updates. Extract materials to .tres and change one color without touching Blender.</p></div>
  <div class="callout ex"><b>✎ Ex 4.3 — Input map day-one</b><p>Define actions: move/jump/fire + gamepad events. Write a 10-line script printing actions via <code>Input.get_vector</code>. Remap "jump" to gamepad A and confirm zero code changes needed.</p></div>
  <div class="callout ex"><b>✎ Ex 4.4 — Headless import</b><p>Run <code>godot --headless --import</code> on your project from a terminal. Confirm .godot/imported populates. Time it. This is your CI foundation.</p></div>
</div>
` },

{ c: 4, t: "Chapter 04 Recap & Part I Wrap-Up", html: `
<h2>Chapter 04 recap — and Part I complete</h2>
<div class="two">
  <div>
    <h3>Editor &amp; pipeline fluency</h3>
    <ul class="pts">
      <li>Navigate/gizmo/snap at speed; customize schemes &amp; profiles.</li>
      <li>Explain the .import/.godot/imported split and set presets.</li>
      <li>Blender → GLB → Godot round-trip; extract materials.</li>
      <li>Project vs Editor settings; input maps; autoloads previewed.</li>
      <li>Git-friendly project hygiene; headless/CLI basics.</li>
    </ul>
  </div>
  <div>
    <h3>Part I checkpoint</h3>
    <ul class="pts">
      <li>✅ Godot philosophy, licensing, ecosystem</li>
      <li>✅ First scene: meshes, materials, UVs, scripts</li>
      <li>✅ 3D math, nodes, servers, signals, memory</li>
      <li>✅ Editor &amp; asset pipeline mastery</li>
    </ul>
    <div class="callout note"><b>ℹ Next</b><p><b>Part II</b> — four complete games. Chapter 5 <b>Pumpkin Run</b> starts with a full CSG/GridMap blockout and ends with lit, animated, audible gameplay.</p></div>
  </div>
</div>
` }

);
