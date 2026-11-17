/* Chapter 14 — Appendix (18 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 14, t: "Chapter 14 — Appendix", cover: true, html: `
<div class="cov-part">Part IV · Reference &amp; Appendix</div>
<div class="cov-n">14</div>
<h1>Appendix</h1>
<p class="cov-sub">Shipping infrastructure: installation &amp; export templates, per-platform export guides, code signing, headless deployment, documentation &amp; the issue tracker, the Godot Foundation, community &amp; the Asset Library — and a full engine glossary.</p>
<div class="chips">
  <span class="tag">Installation</span><span class="tag">Export templates</span>
  <span class="tag">Platform exports</span><span class="tag">Signing</span>
  <span class="tag">Docs &amp; issues</span><span class="tag">Foundation</span><span class="tag">Glossary</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 14, t: "Installation Deep Dive", html: `
<h2>Installing &amp; managing engine versions</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Distribution channels:</b> official site (portable zip), Steam, itch, Snap/Flatpak/AUR, and nightly builds from GitHub (made by the community: godotengine/godot-builds).</li>
      <li><b>Standard vs .NET:</b> .NET build = everything Standard does + C#/MSBuild tooling; requires the .NET SDK separately.</li>
      <li><b>Version manager habit:</b> keep engines in <code>Tools/godot-4.2.2/</code>, <code>Tools/godot-4.4.1/</code>… and pin each project in its README. Projects remember the last editor used — don't accidentally upgrade a live project.</li>
      <li><b>Building from source:</b> <code>scons platform=windows target=editor</code> — one command with Python+SCons installed; how you patch engine bugs or strip modules for tiny exports (<code>production=yes</code>).</li>
    </ul>
  </div>
  <div>
<pre data-file="terminal" data-lang="text"><code># Windows (portable, no install):
godot.exe                      # project manager
godot.exe --path . -e          # open editor
godot.exe -e res://main.tscn   # editor, jump to scene

# Version pinning inside team docs:
# engine: 4.2.2-stable (.NET)
# templates: 4.2.2-stable .NET + standard

# From source (advanced):
pip install scons
git clone https://github.com/godotengine/godot
cd godot &amp;&amp; git checkout 4.2.2-stable
scons platform=windows target=editor -j8</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Upgrade engine versions between projects, not during one. A mid-project minor bump risks: template mismatch, .tscn format drift, and behavior deltas — schedule it like a migration, because it is.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Export Templates", html: `
<h2>Export templates — the engine half of your build</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Your exported game = <b>template binary</b> (the engine, precompiled) + <b>your .pck</b> (scenes, scripts, assets).</li>
      <li>Install per exact version: Editor → Manage Export Templates → Download (or point at a manual <code>.tpz</code>).</li>
      <li><b>Debug vs Release templates:</b> debug = console window + dev asserts + slower; always ship release (+ separate console build if you want player logs on desktop).</li>
      <li>.NET projects export with .NET-specific templates; some platforms need extra steps (iOS AOT, web Brotli).</li>
      <li>Missing/mismatched templates = the #1 export "bug" — check first, always.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>game.pck</b>all res:// content packed</div>
      <div class="arr">+</div>
      <div class="fbox"><b>Template binary</b>engine runtime per platform</div>
      <div class="arr">=</div>
      <div class="fbox acc"><b>Shipped game</b>exe / app / apk / wasm…</div>
    </div>
    <div class="callout note"><b>ℹ Note</b><p>PCK can be embedded (single file) or external (patchable separately — small updates without re-downloading the engine half).</p></div>
  </div>
</div>
` },

{ c: 14, t: "Export I: Desktop", html: `
<h2>Desktop exports (Windows/macOS/Linux)</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Presets:</b> Project → Export → Add… → platform → set name/icon → Export Project (or Release Package for CI).</li>
      <li><b>Windows:</b> x86_64; console build optional; app icon (.ico) + file version info; code signing next slide.</li>
      <li><b>macOS:</b> .app zip or .dmg; <b>notarization required</b> for Gatekeeper (Apple ID, certificates); export format "app" for further signing.</li>
      <li><b>Linux:</b> x86_64 portable; also arm64; 4.3+ exports fine from any host OS.</li>
      <li>Embed PCKs for player simplicity; external PCK for live-service patching.</li>
    </ul>
  </div>
  <div>
<pre data-file="ci_export.sh" data-lang="text"><code># CI: export all desktop builds headless
godot --headless --import --path .

godot --headless --path . \
  --export-release "Windows Desktop" \
  builds/win/game.exe

godot --headless --path . \
  --export-release "Linux/X11" \
  builds/linux/game.x86_64

godot --headless --path . \
  --export-release "macOS" \
  builds/mac/Game.zip

# strip debug symbols for size:
strip builds/linux/game.x86_64</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Export presets live in <code>export_presets.cfg</code> — commit it (minus secrets via environment variables) so every teammate and CI exports identical builds.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Export II: Mobile & Web", html: `
<h2>Mobile &amp; web exports</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Android:</b> requires Android SDK + Java; a debug keystore for dev, upload/release keys for stores; export APK (sideload) or AAB (Play Store); permissions &amp; XR/AAR plugin blocks in the preset.</li>
      <li><b>iOS:</b> export Xcode project from any OS → build/sign on macOS Xcode; provisioning profiles, orientation/entitlements in preset; .NET needs AOT compilation flags.</li>
      <li><b>Web:</b> Compatibility renderer; output .wasm + .html + .pck (Brotli-compressed); SharedArrayBuffer headers (COOP/COEP) for threading; itch.io hosts Godot web builds trivially.</li>
      <li>Mobile renderer preset for phones; keep scenes lean (Ch 13 budget rules apply doubly).</li>
    </ul>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Platform</th><th>Build host needs</th><th>Store artifact</th></tr>
      <tr><td>Windows</td><td>—</td><td>.exe installer/zip</td></tr>
      <tr><td>macOS</td><td>macOS for signing</td><td>notarized .dmg</td></tr>
      <tr><td>Linux</td><td>any</td><td>AppImage/portable</td></tr>
      <tr><td>Android</td><td>SDK + JDK</td><td>.aab (Play)</td></tr>
      <tr><td>iOS</td><td>Xcode on macOS</td><td>.ipa via Xcode</td></tr>
      <tr><td>Web</td><td>any</td><td>wasm + pck bundle</td></tr>
    </table></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Web exports need correct HTTP headers or they silently fail to load — test on real hosting (or itch) not just a raw file server.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Signing & Security", html: `
<h2>Code signing — the adult paperwork</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Windows:</b> unsigned → SmartScreen warnings. Options: OV cert (cheaper), EV (instant reputation), Azure Trusted Signing (modern, subscription).</li>
      <li><b>macOS:</b> "Developer ID Application" cert signs; <b>notarytool</b> notarizes; staple the ticket — all from Xcode/CLI against your .app.</li>
      <li><b>Android:</b> Play App Signing; keep the upload key in a keystore you <b>back up forever</b> (losing it = losing your app identity).</li>
      <li><b>iOS:</b> automatic vs manual signing; distribution certs through Apple Developer portal.</li>
      <li>Secrets never in the repo — CI secret variables; export presets read them via environment substitution.</li>
    </ul>
  </div>
  <div>
<pre data-file="signing.sh" data-lang="text"><code># macOS notarize (from a Mac with Xcode):
codesign --force --options runtime \
  --sign "Developer ID Application: STUDIO" \
  --entitlements ent.plist Game.app

xcrun notarytool submit Game.zip \
  --apple-id $APPLE_ID --team-id $TEAM \
  --password $APP_PASS --wait

xcrun stapler staple Game.app

# Windows (signtool + Azure Trusted Signing
# or a purchased cert):
signtool sign /fd SHA256 /tr &lt;ts-url&gt; \
  /td SHA256 game.exe</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Build a <code>tools/release.sh</code> that exports + signs + zips + checksums. Manual signing invites the one-off that ships a broken build.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Headless & Server Deployment", html: `
<h2>Headless everywhere</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Headless export preset</b> (any OS): no rendering/audio — dedicated servers, CI, bots (Ch 9).</li>
      <li><b>Server hygiene:</b> run under a supervisor (systemd/container), log to files (<code>--log-file</code>), watchdog restart, UDP/TCP port mapping.</li>
      <li><b>Steam/Epic dedicated servers:</b> same headless build + SDK layer (via GDExtension ports like GodotSteam).</li>
      <li><b>Automation:</b> <code>--script</code> scenes run pipelines (asset validation, translation lint, automated playtests).</li>
      <li>Containers: Debian-slim + your server build = ~120 MB image.</li>
    </ul>
  </div>
  <div>
<pre data-file="systemd" data-lang="text"><code># /etc/systemd/system/subracer.service
[Unit]
Description=SubRacer dedicated
After=network.target

[Service]
User=games
WorkingDirectory=/srv/subracer
ExecStart=/srv/subracer/server.x86_64 \
  --headless --path /srv/subracer \
  -- --port 10567 --max-clients 12
Restart=always
RestartSec=5
StandardOutput=append:/var/log/subracer.log

[Install]
WantedBy=multi-user.target</code></pre>
  </div>
</div>
` },

{ c: 14, t: "Documentation", html: `
<h2>The documentation universe</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>docs.godotengine.org</b> — versions 3.x→latest; "Getting Started", step-by-step tutorials, and the <b>class reference</b> (also in-editor: <span class="kbd">F1</span>).</li>
      <li><b>Reading classes like a pro:</b> inherited members collapsed → click through; Properties/Methods/Signals with default values and themed notes.</li>
      <li><b>Proposing docs edits</b>: every doc page links "Edit on GitHub" — typos and clarifications are genuinely welcome first contributions.</li>
      <li><b>ask.godotengine.org</b> — searchable Q&amp;A archive; most beginner traps have 3 answered threads.</li>
      <li><b>Blog &amp; release notes</b> — read minor-version notes; 4.x minors ship real features you'll want.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Class reference</b>API truth (F1)</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Tutorials</b>recipes &amp; workflows</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Q&amp;A / forum</b>solved history</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>GitHub issues</b>known bugs, PRs, RFCs</div>
    </div>
    <div class="callout bp"><b>✓ Best Practice</b><p>When docs + reality disagree, you've found either a version difference or a bug — check the GitHub issue search; if truly new, file it with a minimal repro (next slide). That's how the engine gets better.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Issue Tracker & Contributing", html: `
<h2>Bugs: reporting &amp; fixing upstream</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Search first:</b> godotengine/godot issues — thousands of answered reports; add a 👍 to confirmed ones rather than duplicates.</li>
      <li><b>A good report:</b> exact version (e.g. 4.2.2-stable), OS/GPU, minimal repro project attached, expected vs actual, console errors verbatim.</li>
      <li><b>Avoiding "not a bug" closures:</b> repro must be <em>minimal</em> — strip assets until the bug is naked; if it vanishes, you found your cause.</li>
      <li><b>Contributing code:</b> the contributing guide (style: clang-format/Tabs) + a PR referencing the issue; engine PRs welcome but review takes patience — documentation PRs merge fastest and are the perfect first contribution.</li>
      <li><b>Workarounds culture:</b> pin the issue in your project notes; engine fixes land on minors — your workaround becomes an upgrade chore.</li>
    </ul>
  </div>
  <div>
<pre data-file="repro_template.md" data-lang="text"><code>### Godot version
4.2.2-stable (official, Vulkan)

### System
Windows 11 · RTX 3060 · driver 552.44

### Issue
Area3D.body_entered fires twice when the
body is freed in the same frame as contact.

### Steps
1. Open repro project (attached)
2. Run "res://repro.tscn"
3. Observe console: "hit" printed ×2

### Expected
One body_entered emission per body.

### Minimal repro project
repro_double_body_entered.zip (2 KB)</code></pre>
  </div>
</div>
` },

{ c: 14, t: "The Godot Foundation", html: `
<h2>Who owns Godot — governance</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Godot began as proprietary in-house tech (Juan Linietsky &amp; Ariel Manzur), MIT-licensed and open-sourced in 2014; adopted by a worldwide community.</li>
      <li>The <b>Godot Foundation</b> (established 2024, Netherlands) is the legal steward: holds trademarks/domain, manages donations, employs core maintainers, shields contributors legally.</li>
      <li>Funded by <b>individual donations</b> (Patreon/GitHub Sponsors) and <b>corporate memberships</b> — no single owner, no license rug-pulls possible (MIT is irrevocable in practice by design).</li>
      <li>Leadership: project lead + maintainer teams per area (rendering, GDScript, physics…); decisions in public (GitHub, dev meetings, Godot proposals repo).</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Community</b>contributors · testers · docs authors</div>
      <div class="arr">↑</div>
      <div class="fbox"><b>Maintainer teams</b>area ownership</div>
      <div class="arr">↑</div>
      <div class="fbox acc"><b>Godot Foundation</b>stewardship · funding · trademarks</div>
    </div>
    <div class="callout note"><b>ℹ Why it matters to you</b><p>Your commercial game's foundation can't be acquired, repriced, or discontinued out from under you. That certainty is a genuine business feature of choosing Godot.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Community Resources", html: `
<h2>Where the community lives</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Place</th><th>Vibe</th></tr>
      <tr><td>docs (official)</td><td>truth</td></tr>
      <tr><td>ask.godotengine.org</td><td>Q&amp;A archive</td></tr>
      <tr><td>forum.godotengine.org</td><td>long-form help/showcase</td></tr>
      <tr><td>GitHub (engine)</td><td>bugs &amp; PRs</td></tr>
      <tr><td>Discord · IRC · Matrix · Reddit</td><td>chat, quick help</td></tr>
      <tr><td>YouTube: Godot official + community tutors</td><td>tutorials, devlogs</td></tr>
      <tr><td>GodotCon / meetups / GDC booth</td><td>IRL, talks</td></tr>
    </table></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Etiquette that gets answers:</b> exact version, minimal repro, what you tried, formatted code. "It doesn't work" posts don't get solved.</li>
      <li><b>Give back:</b> answer one question for each you ask (you learn more answering); upload your jam games with source — the asset ecosystem feeds on shared work like Chapter 12's.</li>
      <li><b>Contribution ladder:</b> docs typo → issue triage → demo project → engine PR. Everyone starts at rung one.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Follow the release blog + one tutorial creator you trust. Godot 4.x moves fast; knowledge from 2023 tutorials slowly rots — check dates on everything.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Asset Library", html: `
<h2>The Asset Library (addons)</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Editor → AssetLib tab:</b> searchable registry of plugins, demo projects, and tools — installs straight into <code>addons/</code>.</li>
      <li><b>Plugin anatomy:</b> <code>plugin.cfg</code> + scripts (Ch 13); enable in Project Settings → Plugins; remove by deleting the folder.</li>
      <li><b>Vetting:</b> check license, last-update date vs your engine version, issue tracker of the repo, and code review if closed-source risk matters. Plugins run with full project privileges.</li>
      <li><b>Star projects:</b> GUT (tests), Phantom Camera (cinematics), Dialogue Manager, Gemini/BehaviorTree tooling, Steam/GodotSteam ports, and this course's patterns — browse by category monthly; the ecosystem compounds.</li>
      <li><b>Publish your own:</b> a good plugin = narrow scope + docs + version compatibility table. Ship it.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="g">project/</span>
<span class="m">└──</span><span class="b">addons/</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;└──</span><span class="g">phantom_camera/</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="y">plugin.cfg</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="m">scripts/ icons/ …</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="m">enabled in Project Settings</span>

<span class="m">plugin.cfg fields that matter:</span>
<span class="m">· name, description, author, version</span>
<span class="m">· script → EditorPlugin subclass</span>
<span class="m">· min/max Godot version (compat!)</span></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Plugins are code — a stale abandoned addon can block YOUR engine upgrade. Prefer actively-maintained addons for anything load-bearing; wrap them behind your own interfaces so they're replaceable.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Learning Path Forward", html: `
<h2>After this curriculum — your next 6 months</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Month 1–2:</b> remake ONE chapter game in a genre you love, no tutorial. Expect to reference Chapters 3/13 constantly — that's the system working.</li>
      <li><b>Month 3–4:</b> ship a 1–2 week scoped game publicly (itch jam!). Scope discipline is the skill jams beat into you.</li>
      <li><b>Month 5–6:</b> your "real" project — with the architecture habits from Part III (event bus, pools, HFSM, data-driven content) from day one.</li>
      <li><b>Depth electives:</b> GDExtension C++, console porting, procedural generation, shader art — Chapter 13 is the springboard for all four.</li>
    </ul>
  </div>
  <div>
    <div class="callout ex"><b>✎ Final exercise 14.1</b><p>Write your post-curriculum plan: one remake (which chapter?), one jam date (when?), one project pitch (3 sentences + feature list capped at six systems). Pin it above your desk.</p></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Keep a dev journal per project: decisions, bugs, tuning values (your Ch 7 cards!). Six months of journals is a portfolio of engineering growth — and interview gold.</p></div>
  </div>
</div>
` },

{ c: 14, t: "Glossary I: A–F", html: `
<h2>Glossary A–F</h2>
<dl class="def">
  <dt>Albedo</dt><dd>PBR base color input; unlit surface color without shadows or highlights baked in.</dd>
  <dt>API version / compatibility</dt><dd>Godot minor versions (4.x) keep compatibility; major versions (3→4) break it.</dd>
  <dt>Area3D</dt><dd>Sensor region detecting overlaps (bodies/areas) without physical response.</dd>
  <dt>AOT</dt><dd>Ahead-of-time compilation — required for C# on iOS/web targets.</dd>
  <dt>Autoload</dt><dd>Scene/script registered in Project Settings to load before everything and persist across scene changes.</dd>
  <dt>Basis</dt><dd>3×3 matrix holding rotation+scale; columns are the object's local axes.</dd>
  <dt>BlendSpace</dt><dd>AnimationTree node interpolating clips by position on a 1D/2D parameter plane.</dd>
  <dt>BoneMap / SkeletonProfile</dt><dd>Retargeting resources mapping bone names and rest poses between rigs.</dd>
  <dt>CCD</dt><dd>Continuous collision detection — swept collision preventing fast bodies from tunneling.</dd>
  <dt>CharacterBody3D</dt><dd>Kinematic body you move via velocity + move_and_slide(); floors/slopes handled for you.</dd>
  <dt>Callable</dt><dd>First-class function reference (object + method) used for signals, binds, RPCs.</dd>
  <dt>CSG</dt><dd>Constructive solid geometry — boolean-combined primitives for rapid level blockout.</dd>
  <dt>Delta</dt><dd>Seconds since last frame/tick; multiply all motion by it.</dd>
  <dt>Draw call</dt><dd>One CPU submission of geometry+material to the GPU; the main CPU-side rendering cost.</dd>
  <dt>ENet</dt><dd>Reliable-UDP networking library behind Godot's default MultiplayerPeer.</dd>
  <dt>Export template</dt><dd>Precompiled engine binary your .pck packs against, per version and platform.</dd>
  <dt>Feature tag</dt><dd>Platform/build identifiers ("windows", "web", "debug") queryable via OS.has_feature().</dd>
  <dt>Forward+</dt><dd>Godot's Vulkan desktop renderer with clustered lighting and advanced GI.</dd>
</dl>
` },

{ c: 14, t: "Glossary II: G–P", html: `
<h2>Glossary G–P</h2>
<dl class="def">
  <dt>GDExtension</dt><dd>Native shared-library interface for C/C++ (and Rust etc.) code loaded by a 4.x project.</dd>
  <dt>GDShader</dt><dd>Godot's shading language; .gdshader files define vertex/fragment/light behavior.</dd>
  <dt>GI (Global Illumination)</dt><dd>Indirect bounced light; Godot options: LightmapGI (baked), VoxelGI, SDFGI (real-time).</dd>
  <dt>glTF / GLB</dt><dd>Khronos 3D interchange format; Godot's recommended mesh/animation pipeline.</dd>
  <dt>GridMap</dt><dd>Grid-snapped modular level painting driven by a MeshLibrary.</dd>
  <dt>Group</dt><dd>Tag-based node collection with mass operations (call_group, queries).</dd>
  <dt>HFSM</dt><dd>Hierarchical finite state machine — states nested in states sharing transitions.</dd>
  <dt>HingeJoint3D</dt><dd>Physics joint constraining two bodies to rotate around one axis; motorized flippers.</dd>
  <dt>HUD</dt><dd>Heads-up display; CanvasLayer-hosted Control UI over the 3D view.</dd>
  <dt>Instance (scene)</dt><dd>A live copy of a saved scene embedded in another; edits propagate, overrides persist.</dd>
  <dt>Jolt</dt><dd>Industry physics engine built into Godot 4.4+ as an alternative to GodotPhysics.</dd>
  <dt>Layer / Mask</dt><dd>32-bit collision channel membership ("what I am") and scanning filter ("what I detect").</dd>
  <dt>LightmapGI</dt><dd>Baked direct+indirect lighting into UV2 lightmap textures; near-free at runtime.</dd>
  <dt>LOD</dt><dd>Level of detail — swapping fidelity (meshes, logic, animation) by distance/importance.</dd>
  <dt>MainLoop</dt><dd>Engine heartbeat interface; SceneTree is the default implementation owning your game.</dd>
  <dt>MeshLibrary</dt><dd>Resource catalog of grid modules (mesh+collision+material) consumed by GridMap.</dd>
  <dt>MultiplayerSpawner / Synchronizer</dt><dd>Declarative replication nodes: mirrored spawning; property pushing from authority.</dd>
  <dt>MultiMesh</dt><dd>One resource drawing many instances of a mesh with per-instance transforms — crowd rendering.</dd>
  <dt>ORM</dt><dd>Occlusion/Roughness/Metallic texture channels packed into RGB.</dd>
  <dt>Overdraw</dt><dd>Multiple translucent pixels stacked per screen pixel; the hidden transparency cost.</dd>
  <dt>PackedScene</dt><dd>Serialized scene tree; instantiate() clones it at runtime.</dd>
  <dt>PBR</dt><dd>Physically based rendering — albedo/metallic/roughness under one consistent light model.</dd>
  <dt>Physics tick</dt><dd>Fixed-rate (default 60 Hz) simulation step independent of frame rate.</dd>
</dl>
` },

{ c: 14, t: "Glossary III: Q–Z", html: `
<h2>Glossary Q–Z</h2>
<dl class="def">
  <dt>queue_free()</dt><dd>Schedule node deletion at frame end — the safe way to free during callbacks.</dd>
  <dt>Raycast</dt><dd>Segment query against physics (or the RayCast3D node); hitscan weapons &amp; sensors.</dd>
  <dt>RefCounted</dt><dd>Base class with automatic reference-counted lifetime; Resources inherit it.</dd>
  <dt>res:// / user://</dt><dd>Project-root virtual FS (read-only when exported) vs per-user writable data.</dd>
  <dt>Retargeting</dt><dd>Applying animations between different rigs via bone maps + rest-space correction.</dd>
  <dt>RID</dt><dd>Opaque handle to server-side state (meshes, bodies, buses); you free what you create.</dd>
  <dt>RigidBody3D</dt><dd>Server-simulated body moved by forces/impulses; mass, damping, sleeping.</dd>
  <dt>RPC (@rpc)</dt><dd>Annotates methods callable across peers with authority/reliability options.</dd>
  <dt>SDFGI</dt><dd>Signed distance field GI — Forward+ scene-scale real-time global illumination.</dd>
  <dt>Server (Rendering/Physics/Audio/Navigation)</dt><dd>Engine's low-level worker APIs beneath the node facade.</dd>
  <dt>Signal</dt><dd>Typed broadcast emission; decoupled observer pattern wired via Callables.</dd>
  <dt>Skeleton3D</dt><dd>Bone hierarchy driving skinned meshes; rest pose + per-bone pose transforms.</dd>
  <dt>Skinning</dt><dd>Per-vertex bone weights deforming a mesh on the GPU.</dd>
  <dt>Split-screen</dt><dd>Multiple SubViewports sharing one World3D, each with its own camera/listener.</dd>
  <dt>StringName</dt><dd>Interned string compared by identity — ids for actions/states/animations.</dd>
  <dt>SubViewport</dt><dd>Nested render surface: minimaps, split-screen, in-world screens, mirrors.</dd>
  <dt>Texture atlas</dt><dd>Many images in one texture to reduce bindings/draw calls.</dd>
  <dt>Transform3D</dt><dd>Basis + origin: full position/rotation/scale of a 3D node relative to parent.</dd>
  <dt>Triplanar</dt><dd>Projecting textures along three world axes — UV-free texturing.</dd>
  <dt>Tween</dt><dd>Property animation sequence builder; transitions, eases, callbacks, parallelism.</dd>
  <dt>UID</dt><dd>Stable resource identifier surviving file renames (4.x); .uid files externalize it (4.4+).</dd>
  <dt>VoxelGI</dt><dd>Real-time voxelized GI region for dynamic medium scenes.</dd>
  <dt>World3D</dt><dd>A world's combined physics space + scenario + navigation map; viewports share or own one.</dd>
</dl>
` },

{ c: 14, t: "Curriculum Map", html: `
<h2>The complete curriculum — one view</h2>
<div class="three">
  <div>
    <h3>Part I · Foundations</h3>
    <ul class="pts">
      <li><b>01 Foreword</b> — philosophy, MIT, ecosystem</li>
      <li><b>02 Quickstart</b> — first scene, textures, UVs</li>
      <li><b>03 Intro to 3D</b> — math, meshes, PBR, tree, servers, signals</li>
      <li><b>04 Editor &amp; Pipeline</b> — gizmos, glTF, settings, Git</li>
    </ul>
  </div>
  <div>
    <h3>Part II · Tutorials</h3>
    <ul class="pts">
      <li><b>05 Pumpkin Run</b> — CSG/GridMap, movement, lights, LightmapGI, audio</li>
      <li><b>06 Tube Cleaner</b> — instancing, weapons, pooling, waves</li>
      <li><b>07 Pinball</b> — rigid bodies, joints, impulses</li>
      <li><b>08 SubRacer</b> — 6-DOF, sensors, volumetrics, HUD</li>
    </ul>
  </div>
  <div>
    <h3>Part III · Advanced</h3>
    <ul class="pts">
      <li><b>09 Multiplayer</b> — ENet, @rpc, spawner/synchronizer</li>
      <li><b>10 Animation</b> — skeletons, retarget, AnimationTree</li>
      <li><b>11 Flying Buddha</b> — signal architecture, seeds, grids</li>
      <li><b>12 Platformer</b> — HFSM, streaming, split-screen</li>
    </ul>
  </div>
</div>
<div class="callout note"><b>ℹ Part IV in your pocket</b><p><b>13 Reference</b> (the desk-lookup shelf) + this appendix. Press <span class="kbd">C</span> anywhere to search all slides — the deck is your searchable textbook forever.</p></div>
` },

{ c: 14, t: "Closing — Go Build", html: `
<h2>You have the engine. Now build.</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>You've covered:</b> 3D math → materials → lighting → physics → audio → animation → networking → architecture → optimization → shipping.</li>
      <li><b>You've built:</b> six games spanning every major 3D genre mechanic.</li>
      <li><b>You own:</b> a reusable systems library (event bus, HFSM, pools, sensors, cameras) and the reference chapter to rebuild any of it from memory.</li>
      <li><b>The engine is free. The license is MIT. The community is real.</b> The only remaining ingredient is the game only you can make.</li>
    </ul>
    <div class="cov-nav" style="margin-top:18px">— End of curriculum · press C to revisit any slide —</div>
  </div>
  <div>
    <div class="logo-orb" style="margin:0 auto 18px">
      <svg width="66" height="66" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="26" r="12" fill="#478cbf"/>
        <circle cx="27" cy="25" r="3" fill="#0b0f17"/><circle cx="37" cy="25" r="3" fill="#0b0f17"/>
        <path d="M20 36 Q32 46 44 36 L41 52 Q32 58 23 52 Z" fill="#8f5db7"/>
        <circle cx="32" cy="10" r="3.2" fill="#56d4dd"/><line x1="32" y1="13" x2="32" y2="18" stroke="#56d4dd" stroke-width="2"/>
      </svg>
    </div>
    <div class="callout ex"><b>✎ The last exercise</b><p>Open a blank project. Set a 48-hour timer. Make a game with exactly three mechanics you learned here. Ship it publicly. Then start the next one better.</p></div>
  </div>
</div>
` }

);
