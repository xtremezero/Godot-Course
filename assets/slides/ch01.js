/* Chapter 01 — Foreword (15 slides) */
window.CHAPTER_TITLES = {
  1: "Foreword", 2: "Quickstart", 3: "Introduction to 3D & Godot", 4: "Editor & Asset Pipeline",
  5: "Pumpkin Run", 6: "Tube Cleaner", 7: "Pinball", 8: "SubRacer",
  9: "High-Level Multiplayer", 10: "Character Animation & Retargeting", 11: "Flying Buddha",
  12: "Open-Source Action Platformer", 13: "The Godot 4 Engine Reference", 14: "Appendix",
};
window.CHAPTER_PARTS = {
  1: "Part I · Foundations & Quickstart", 2: "Part I · Foundations & Quickstart",
  3: "Part I · Foundations & Quickstart", 4: "Part I · Foundations & Quickstart",
  5: "Part II · Beginner & Intermediate Tutorials", 6: "Part II · Beginner & Intermediate Tutorials",
  7: "Part II · Beginner & Intermediate Tutorials", 8: "Part II · Beginner & Intermediate Tutorials",
  9: "Part III · Advanced Systems & Projects", 10: "Part III · Advanced Systems & Projects",
  11: "Part III · Advanced Systems & Projects", 12: "Part III · Advanced Systems & Projects",
  13: "Part IV · Reference & Appendix", 14: "Part IV · Reference & Appendix",
};
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 1, t: "Mastering Godot 4 — Title", first: true, html: `
<div class="logo-orb">
  <svg width="66" height="66" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <circle cx="32" cy="26" r="12" fill="#478cbf"/>
    <circle cx="27" cy="25" r="3" fill="#0b0f17"/><circle cx="37" cy="25" r="3" fill="#0b0f17"/>
    <path d="M20 36 Q32 46 44 36 L41 52 Q32 58 23 52 Z" fill="#8f5db7"/>
    <circle cx="32" cy="10" r="3.2" fill="#56d4dd"/><line x1="32" y1="13" x2="32" y2="18" stroke="#56d4dd" stroke-width="2"/>
  </svg>
</div>
<h1>Mastering Godot&nbsp;4</h1>
<div class="sub">An interactive, classroom-ready curriculum — from first 3D scene to multiplayer architecture, rendering internals &amp; production shipping.</div>
<div class="chips" style="justify-content:center; margin-top:22px">
  <span class="tag"><span id="deck-count">340+</span> slides</span>
  <span class="tag">14 chapters · 4 parts</span>
  <span class="tag p">6 complete game projects</span>
  <span class="tag g">GDScript · C# · GDShader</span>
</div>
<div class="cov-nav" style="margin-top:34px">→ / Space to begin &nbsp;·&nbsp; C for contents &nbsp;·&nbsp; ? for help</div>
` },

{ c: 1, t: "About This Curriculum", html: `
<h2>About this curriculum</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Who it's for:</b> students, self-taught devs, and teams adopting Godot 4.x — from first scene to shipping.</li>
      <li><b>Method:</b> concepts → engine internals → production code. Every chapter ends with exercises and a checklist.</li>
      <li><b>Version target:</b> Godot <b>4.2+</b>, with callouts where <b>4.3 / 4.4</b> change the picture (compute shaders, Jolt physics, embedded game window…).</li>
      <li><b>Code style:</b> statically typed, commented GDScript; C# and GDShader equivalents where they matter.</li>
      <li><b>Six capstone games:</b> Pumpkin Run, Tube Cleaner, Pinball, SubRacer, Flying Buddha, and an open-source action platformer.</li>
    </ul>
  </div>
  <div>
    <h3>How to read the callouts</h3>
    <div class="legend">
      <div class="callout bp"><b>✓ Best Practice</b><p>Battle-tested habits that keep projects healthy.</p></div>
      <div class="callout pit"><b>⚠ Common Pitfall</b><p>Mistakes that cost beginners hours — and how to avoid them.</p></div>
      <div class="callout perf"><b>⚡ Performance</b><p>Frame-budget thinking: what the engine actually does.</p></div>
      <div class="callout deep"><b>◉ Deep Dive</b><p>Internals for engineers who want the "why".</p></div>
      <div class="callout ver"><b>◷ Version Note</b><p>Behavior that differs across 4.x releases.</p></div>
      <div class="callout ex"><b>✎ Exercise</b><p>Hands-on practice to lock in each module.</p></div>
    </div>
  </div>
</div>
` },

{ c: 1, t: "Prerequisites & Tooling", html: `
<h2>Prerequisites &amp; tooling</h2>
<div class="two">
  <div>
    <h3>You should bring</h3>
    <ul class="pts">
      <li>Basic programming literacy (variables, functions, loops) — any language.</li>
      <li>High-school vector math helps for Chapter 3+ (we teach the rest as we go).</li>
      <li>A machine capable of Vulkan rendering (OpenGL 3.3 fallback exists — see Compatibility renderer).</li>
      <li>No art skills required — all projects use procedural or CC-licensed assets.</li>
    </ul>
  </div>
  <div>
    <h3>You will install</h3>
    <ul class="pts">
      <li><b>Godot 4.x</b> — the whole engine is a single ~100&nbsp;MB executable, no installer needed.</li>
      <li><b>Blender</b> (free) for asset authoring in Chapters 4–5, 10, 12.</li>
      <li>Optional: <b>.NET SDK</b> for C# modules; <b>Git</b> for version control workflows.</li>
    </ul>
    <div class="callout note"><b>ℹ Note</b><p>Two editor builds exist: <b>Standard</b> (GDScript) and <b>.NET</b> (adds C#). The .NET build runs everything the Standard build does — pick it if you'll use C# at all.</p></div>
  </div>
</div>
` },

{ c: 1, t: "The Godot Philosophy: Everything is a Scene", html: `
<h2>The Godot philosophy: everything is a scene</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li>A <b>scene</b> is a tree of <b>nodes</b> — Godot's only composition mechanism. Menus, players, projectiles, entire levels: all scenes.</li>
      <li>Scenes <b>compose and nest</b>: drop a saved scene into another and it becomes an editable instance.</li>
      <li><b>Composition over inheritance:</b> build capabilities from small cooperating nodes (a <code>Camera3D</code> + <code>AudioListener3D</code> + scripts) instead of deep class hierarchies.</li>
      <li>Scenes map 1:1 to files (<code>.tscn</code>), to script-owned architecture, and to multiplayer replication boundaries — mastering them is mastering Godot.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Design scenes around a single responsibility ("this scene is the player", "this scene is one bullet"), then combine. If a scene needs a flowchart to explain, split it.</p></div>
  </div>
  <div>
    <div class="tree"><span class="m"># A "Player" is itself a scene tree</span>
<span class="b">CharacterBody3D</span> <span class="g">Player</span>
<span class="m">├──</span><span class="b">CollisionShape3D</span> <span class="m">(capsule)</span>
<span class="m">├──</span><span class="b">MeshInstance3D</span> <span class="m">(pumpkin mesh)</span>
<span class="m">├──</span><span class="b">Camera3D</span> <span class="g">CameraRig</span>
<span class="m">│&nbsp;&nbsp;&nbsp; └──</span><span class="b">Camera3D</span>
<span class="m">├──</span><span class="b">AudioStreamPlayer3D</span> <span class="g">JumpSfx</span>
<span class="m">└──</span><span class="b">AnimationPlayer</span>

<span class="m"># Instances of it elsewhere:</span>
<span class="b">Node3D</span> <span class="g">Game</span>
<span class="m">├──</span><span class="y">@Player.tscn</span> <span class="m">← editable instance</span>
<span class="m">└──</span><span class="y">@level_blockout.tscn</span></div>
  </div>
</div>
` },

{ c: 1, t: "MIT License & What It Means for You", html: `
<h2>MIT license — freedom, explained</h2>
<ul class="pts">
  <li>Godot is <b>100% free, forever</b>, under the MIT license: use it commercially, ship consoles (via third-party ports), modify the engine — <b>no royalties, no revenue share, no seat fees</b>.</li>
  <li>You own your code, art, and exported games outright. Attribution of Godot in your credits is courteous, not legally required.</li>
  <li>Compare: Unity (per-seat licensing/fees), Unreal (5% royalty above threshold), Godot (nothing).</li>
  <li>The engine's own source is open — when behavior surprises you, <b>read the source</b> (<code>scene/</code>, <code>servers/</code>, <code>core/</code> in the GitHub repo).</li>
</ul>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Third-party <em>assets and plugins</em> carry their own licenses (CC-BY, MIT, asset-store EULAs). Track attributions in an <code>AUTHORS.md</code> from day one — Chapter 12 shows the workflow.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p>Godot is steward-led by the <b>Godot Foundation</b> (est. 2024) with funding from industry members and donations. You can compile the engine from source with SCons in one command — we cover that in the Appendix.</p></div>
</div>
` },

{ c: 1, t: "Godot vs Unity vs Unreal", html: `
<h2>Engine landscape — where Godot fits</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th></th><th>Godot 4</th><th>Unity 6</th><th>Unreal 5</th></tr>
  <tr><td>License / cost</td><td>MIT, $0</td><td>Per-seat subscription terms</td><td>Free until $1M, then 5%</td></tr>
  <tr><td>Editor size</td><td>~100 MB portable</td><td>Multi-GB install + Hub</td><td>~40 GB typical</td></tr>
  <tr><td>Primary language</td><td>GDScript, C#, C++ (GDExtension)</td><td>C#</td><td>C++ / Blueprints</td></tr>
  <tr><td>2D support</td><td><b>Dedicated 2D engine</b> (pixel units)</td><td>3D-plane workaround</td><td>Paper2D (limited)</td></tr>
  <tr><td>3D renderer</td><td>Vulkan Forward+ / Mobile, GL Compatibility</td><td>D3D/Vulkan/Metal</td><td>Nanite, Lumen</td></tr>
  <tr><td>Source access</td><td>Full, forkable</td><td>Reference only</td><td>Partial (no editor src)</td></tr>
  <tr><td>Best at</td><td>Indie 2D/3D, tools, education, rapid iteration</td><td>Mobile, AR/VR, mid-scale 3D</td><td>AAA fidelity, filmic 3D</td></tr>
</table></div>
<div class="callout note"><b>ℹ Note</b><p>This curriculum is engine-agnostic in concepts (transforms, PBR, networking) — the mental models transfer everywhere; the APIs you'll master here are Godot's.</p></div>
` },

{ c: 1, t: "A Brief History: 1.0 → 4.x", html: `
<h2>A brief history</h2>
<div class="flow">
  <div class="fbox"><b>2014 · 1.0</b>Open-sourced by Juan Linietsky &amp; Ariel Manzur after years as an in-house tool</div>
  <div class="arr">→</div>
  <div class="fbox"><b>2016 · 2.1</b>Steam release; first big community wave</div>
  <div class="arr">→</div>
  <div class="fbox"><b>2018 · 3.0</b>3D overhaul, C# support, VisualScript</div>
  <div class="arr">→</div>
  <div class="fbox"><b>2021 · 3.x</b>GDScript typed, Vulkan work begins</div>
  <div class="arr">→</div>
  <div class="fbox acc"><b>2023 · 4.0</b>Vulkan renderers, new GDScript, Physics &amp; multiplayer rewrite</div>
</div>
<div class="flow">
  <div class="fbox"><b>4.1 (2023)</b>MultiplayerSpawner/Synchronizer</div>
  <div class="arr">→</div>
  <div class="fbox"><b>4.2 (2023)</b>Animation retargeting, blend editor</div>
  <div class="arr">→</div>
  <div class="fbox"><b>4.3 (2024)</b>Compute shaders, typed dictionaries, Wine-free Linux export</div>
  <div class="arr">→</div>
  <div class="fbox acc"><b>4.4 (2025)</b>Jolt physics built-in, embedded game window, physics interpolation</div>
</div>
<div class="callout ver"><b>◷ Version Note</b><p>Godot 4.x is a clean break from 3.x (API, renderer, language). Old 3.x tutorials will mislead you: <code>onready var</code> → <code>@onready var</code>, <code>move_and_slide(velocity)</code> → set <code>velocity</code> then call <code>move_and_slide()</code>.</p></div>
` },

{ c: 1, t: "The Language & Scripting Ecosystem", html: `
<h2>Scripting: pick the right tool</h2>
<div class="three">
  <div class="fbox acc"><b>GDScript</b>Python-like, engine-integrated, hot-reloads, zero setup. 90% of this curriculum. Statically typable (and you should).</div>
  <div class="fbox"><b>C# / .NET</b>Full .NET 6/8 runtime, great tooling, AOT-ready for web/iOS via core libraries. Heavier export.</div>
  <div class="fbox"><b>C++ / GDExtension</b>Native performance without forking the engine. For math-heavy libs, consoles, or existing codebases.</div>
</div>
<div class="two" style="margin-top:12px">
  <div>
<pre data-file="compare.gd" data-lang="gdscript"><code># GDScript: concise, typed, engine-native
extends CharacterBody3D

@export var jump_velocity := 4.5

func _physics_process(delta: float) -> void:
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity
	move_and_slide()</code></pre>
  </div>
  <div>
<pre data-file="Compare.cs" data-lang="csharp"><code>// C#: same behavior, .NET idioms
using Godot;

public partial class Player : CharacterBody3D
{
    [Export] public float JumpVelocity { get; set; } = 4.5f;

    public override void _PhysicsProcess(double delta)
    {
        if (Input.IsActionJustPressed("jump") && IsOnFloor())
            Velocity = Velocity with { Y = JumpVelocity };
        MoveAndSlide();
    }
}</code></pre>
  </div>
</div>
<div class="callout bp"><b>✓ Best Practice</b><p>Start in GDScript even if you're a C# veteran — the docs, tutorials, and community answers assume it. Port performance-critical systems later; both languages interoperate in one project.</p></div>
` },

{ c: 1, t: "Rendering at a Glance (Preview)", html: `
<h2>Three renderers, one API — a preview</h2>
<div class="three">
  <div class="fbox acc"><b>Forward+</b>Vulkan desktop · clustering, SDFGI, volumetrics, compute. Maximum fidelity.</div>
  <div class="fbox"><b>Mobile</b>Vulkan/mobile GPUs · tuned for tile-based renderers.</div>
  <div class="fbox"><b>Compatibility</b>OpenGL 3.3 / WebGL2 · runs anywhere, powers the web export.</div>
</div>
<div class="two" style="margin-top:10px">
  <ul class="pts">
    <li>Your <b>game code doesn't change</b> — the same <code>Material</code>, <code>Light</code>, and <code>Environment</code> nodes work on all three; features degrade gracefully.</li>
    <li>Choose in <b>Project Settings → Rendering → Renderer → Rendering Method</b> (restarts the editor).</li>
    <li>Chapter 13 has the full feature matrix; Chapter 8 leans on Forward+ volumetric fog.</li>
  </ul>
  <div class="callout perf"><b>⚡ Performance</b><p>The renderer choice is the single highest-leverage performance decision in the project — it defines your lighting, post-FX, and target hardware envelope. Decide before building art, not after.</p></div>
</div>
` },

{ c: 1, t: "Community, Docs & Assets", html: `
<h2>The ecosystem you're joining</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>docs.godotengine.org</b> — the official manual &amp; class reference; version-switchable. This curriculum mirrors its structure.</li>
      <li><b>Q&amp;A (ask.godotengine.org)</b> — searchable answers; most beginner walls are already solved there.</li>
      <li><b>GitHub</b> — engine source, issue tracker, PRs. Reading issue threads is an education in itself.</li>
      <li><b>Asset Library</b> — one-click project templates, plugins (<code>addons/</code>), and demos from the editor's *AssetLib* tab.</li>
      <li><b>Forums, Discord, Reddit</b> — active daily help in English and dozens of languages.</li>
    </ul>
  </div>
  <div>
    <div class="callout bp"><b>✓ Best Practice</b><p>When stuck: 1) read the class reference entry (F1 in editor, or <b>Search Help</b>), 2) search the Q&amp;A, 3) reproduce in a blank project, 4) then ask — attaching a <em>minimal</em> reproduction project.</p></div>
    <div class="callout note"><b>ℹ Note</b><p>Godot's docs are CC-BY 3.0. The class reference even ships <em>inside</em> the editor — press <span class="kbd">F1</span> or Ctrl-click any symbol to jump straight to it.</p></div>
  </div>
</div>
` },

{ c: 1, t: "Downloading & First Launch", html: `
<h2>Getting the engine</h2>
<ol class="steps">
  <li>Visit <b>godotengine.org/download</b> → pick <b>Godot 4.x .NET</b> (or Standard) for your OS.</li>
  <li>Unzip anywhere — it's a portable executable. No install, no admin rights.</li>
  <li>First run → <b>Import</b> an existing project or <b>New Project</b> → choose an empty folder → Forward+ renderer → Create &amp; Edit.</li>
  <li>Download <b>export templates</b> (Editor → Manage Export Templates) — needed only when exporting builds, ~600 MB.</li>
</ol>
<div class="two">
  <div class="callout pit"><b>⚠ Common Pitfall</b><p>Export templates are <em>version-locked</em>: 4.2.1 templates won't export a 4.2.2 project (mismatch warning). Re-download after every engine upgrade.</p></div>
  <div class="callout ver"><b>◷ Version Note</b><p>Steam and itch.io also distribute Godot and keep it auto-updated — convenient, but pin your team to one exact version (e.g. 4.2.2) to avoid surprise template/project mismatches.</p></div>
</div>
` },

{ c: 1, t: "Project Structure & Version Control", html: `
<h2>Project anatomy</h2>
<div class="twoL">
  <div>
    <div class="tree"><span class="g">my_game/</span>
<span class="m">├──</span><span class="y">project.godot</span> <span class="m">← settings, autoloads, input map</span>
<span class="m">├──</span><span class="y">icon.svg</span>
<span class="m">├──</span><span class="b">scenes/</span>
<span class="m">│&nbsp;&nbsp;&nbsp; ├──</span><span class="g">player</span><span class="m">/ player.tscn player.gd</span>
<span class="m">│&nbsp;&nbsp;&nbsp; └──</span><span class="g">levels</span><span class="m">/ level_01.tscn</span>
<span class="m">├──</span><span class="b">scripts/</span> <span class="m">· </span><span class="b">assets/</span> <span class="m">(textures, meshes, audio)</span>
<span class="m">├──</span><span class="b">addons/</span> <span class="m">← plugins from the AssetLib</span>
<span class="m">└──</span><span class="r">.godot/</span> <span class="m">← generated cache: gitignore it</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><code>res://</code> is your project root — the whole folder is the game; paths like <code>res://scenes/player.tscn</code> are stable across platforms.</li>
      <li><code>project.godot</code> is a readable INI: settings, autoloads, input actions. Diff-friendly in code review.</li>
      <li><code>.tscn</code> scene files are <b>text</b> — merge conflicts are solvable by hand.</li>
    </ul>
<pre data-file=".gitignore" data-lang="text"><code># Godot 4 — generated cache &amp; local files
.godot/
*.translation
builds/
export_presets.cfg  # optional: machine-specific</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Organize by <b>feature</b> (<code>scenes/player/</code>), not by type (all scenes in one bin). Add <code>.godot/</code> to <code>.gitignore</code> immediately.</p></div>
  </div>
</div>
` },

{ c: 1, t: "Setting Up for This Course", html: `
<h2>Set up your workspace now</h2>
<ol class="steps">
  <li>Create a project <code>godot_course</code> (Forward+), and mirror the folder layout from the previous slide.</li>
  <li>Open <b>Editor → Editor Settings → Text Editor</b>: enable <em>Auto Brace Complete</em> and set indent type = Tabs (Godot's GDScript style) or Spaces — then never mix them.</li>
  <li>Set <b>Project → Project Settings → Version Control</b> to an editor of choice if desired; more importantly <code>git init</code> the folder yourself.</li>
  <li>Take the editor tour: <span class="kbd">F1</span> opens Search Help; <span class="kbd">Ctrl+Shift+O</span> quick-opens any scene; the <em>Remote</em> tab in the Scene dock inspects your <b>running</b> game — remember it exists.</li>
  <li>Pin the <b>class reference</b> (docs) in a browser tab; you will live there.</li>
</ol>
<div class="callout ex"><b>✎ Exercise 1.1</b><p>Create the project, add the folder skeleton, commit it to Git with a clean <code>.gitignore</code>. Screenshot your editor — you'll compare it to Chapter 4's tour.</p></div>
` },

{ c: 1, t: "Curriculum Map", html: `
<h2>The road ahead</h2>
<div class="two">
  <div>
    <h3>Part I — Foundations (Ch 1–4)</h3>
    <ul class="pts">
      <li>Philosophy, quickstart, 3D math, editor &amp; asset pipeline.</li>
    </ul>
    <h3>Part II — Tutorials (Ch 5–8)</h3>
    <ul class="pts">
      <li><b>Pumpkin Run</b> — movement, lighting, animation, audio.</li>
      <li><b>Tube Cleaner</b> — instancing, hitscan/projectiles, enemies.</li>
      <li><b>Pinball</b> — rigid-body physics, joints, impulses.</li>
      <li><b>SubRacer</b> — sensors, signals, volumetrics, HUD.</li>
    </ul>
  </div>
  <div>
    <h3>Part III — Advanced (Ch 9–12)</h3>
    <ul class="pts">
      <li>Multiplayer: ENet, RPCs, spawner/synchronizer.</li>
      <li>Skeletons, retargeting, AnimationTree.</li>
      <li><b>Flying Buddha</b> — signal-driven state architecture.</li>
      <li><b>Action platformer</b> — HFSM, streaming, split-screen.</li>
    </ul>
    <h3>Part IV — Reference (Ch 13–14)</h3>
    <ul class="pts">
      <li>Materials, shaders, GI, servers, profiling, API cheat sheets, glossary.</li>
    </ul>
  </div>
</div>
<div class="callout note"><b>ℹ Note</b><p>Each project chapter is self-contained: you can jump to Pinball if physics is your goal. Chapters 1–4 are assumed knowledge for everything after.</p></div>
` },

{ c: 1, t: "Chapter 01 Recap", html: `
<h2>Chapter 01 — recap &amp; checklist</h2>
<div class="two">
  <div>
    <h3>You should now be able to…</h3>
    <ul class="pts">
      <li>Explain "everything is a scene" and composition-over-inheritance.</li>
      <li>Choose between GDScript / C# / GDExtension and justify it.</li>
      <li>Name the three renderers and their audiences.</li>
      <li>Set up a version-controlled project with sane structure.</li>
      <li>Find authoritative answers: docs, F1 reference, Q&amp;A, GitHub.</li>
    </ul>
  </div>
  <div>
    <h3>Key terms introduced</h3>
    <dl class="def">
      <dt>Scene / Node</dt><dd>Composable tree of objects; a scene file instantiates as a subtree.</dd>
      <dt>res:// &amp; user://</dt><dd>Project-root virtual filesystem vs. per-user writable data (saves, settings).</dd>
      <dt>Export templates</dt><dd>Prebuilt engine binaries your game is packed against, per platform &amp; version.</dd>
      <dt>GDExtension</dt><dd>Native (C/C++) shared library loaded by a 4.x project at runtime.</dd>
    </dl>
  </div>
</div>
<div class="callout ex"><b>✎ Exercise 1.2</b><p>Write 3 sentences: which capstone project you're most excited about, and which engine features you already know you'll need for a personal game idea. Revisit this note after Chapter 12.</p></div>
` }

);
