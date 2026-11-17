/* Chapter 13 — The Godot 4 Engine Reference (40 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 13, t: "Chapter 13 — Engine Reference", cover: true, html: `
<div class="cov-part">Part IV · Reference &amp; Appendix</div>
<div class="cov-n">13</div>
<h1>The Godot 4 Engine Reference</h1>
<p class="cov-sub">The professional's desk companion: materials &amp; GDShader internals, light systems &amp; global illumination, the import &amp; UV pipeline, inspector tooling, physics &amp; Jolt, AudioServer, and a full performance &amp; profiling playbook.</p>
<div class="chips">
  <span class="tag">Materials &amp; GDShaders</span><span class="tag">Lights · VoxelGI · SDFGI</span>
  <span class="tag">Import &amp; UV pipeline</span><span class="tag">Inspector &amp; @tool</span>
  <span class="tag">Physics &amp; Jolt</span><span class="tag">AudioServer</span><span class="tag">Profiler</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 13, t: "Materials Taxonomy", html: `
<h2>Material system map</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Class</th><th>What it is</th><th>When</th></tr>
  <tr><td><code>BaseMaterial3D</code></td><td>abstract PBR base</td><td>—</td></tr>
  <tr><td><code>StandardMaterial3D</code></td><td>feature-flag PBR, zero code</td><td>95% of surfaces</td></tr>
  <tr><td><code>ORMMaterial3D</code></td><td>Standard with packed ORM slots</td><td>ORM texture workflow</td></tr>
  <tr><td><code>ShaderMaterial</code></td><td>your .gdshader + uniforms</td><td>custom effects</td></tr>
  <tr><td><code>CanvasItemMaterial</code></td><td>2D canvas shader holder</td><td>2D custom FX</td></tr>
  <tr><td><code>PlaceholderMaterial</code></td><td>editor stand-in</td><td>importers/plugins</td></tr>
</table></div>
<div class="two">
  <div class="callout deep"><b>◉ Deep Dive</b><p>All materials funnel into the same renderer path: uniforms + shader permutations compiled from feature flags or your GDShader. StandardMaterial3D literally generates shader code — "material features" are shader codegen options.</p></div>
  <div class="callout bp"><b>✓ Best Practice</b><p>Materials are Resources: share via .tres files, mutate deliberately (Ch 3), and prefer <code>next_pass</code> for true multi-pass needs (outlines).</p></div>
</div>
` },

{ c: 13, t: "GDShader I: Spatial Structure", html: `
<h2>GDShader — spatial shaders 101</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>shader_type spatial;</code> declares the pipeline stage family; optional <code>render_mode</code> flips built-in variants.</li>
      <li>Three functions you may define: <code>vertex()</code>, <code>fragment()</code>, <code>light()</code> — each reads/writes <b>built-ins</b> (UPPERCASE) and your uniforms.</li>
      <li><b> uniforms</b> = Inspector-facing parameters; hints declare GUI + sampler behavior.</li>
      <li>Fails loudly in-editor: the shader editor shows compile errors live.</li>
    </ul>
  </div>
  <div>
<pre data-file="anatomy.gdshader" data-lang="gdshader"><code>shader_type spatial;
render_mode blend_mix, depth_draw_opaque,
             cull_back, diffuse_burley,
             specular_schlick_ggx;

// Uniforms: Inspector widgets via hints
uniform vec4 tint : source_color = vec4(1.0);
uniform float rim_power
	: hint_range(0.0, 8.0, 0.1) = 3.0;
uniform sampler2D mask_tex
	: source_color, filter_linear_mipmap;
global uniform vec4 day_cycle;   // engine-wide

varying vec3 world_normal;       // vertex→fragment

void vertex() {
	world_normal = normalize(
		(NODE_TRANSFORM_WORLD * vec4(NORMAL, 0.0)
		).xyz);
}

void fragment() {
	// write outputs; engine lighting consumes them
	ALBEDO = tint.rgb;
	ROUGHNESS = 0.6;
	float rim = pow(1.0 - abs(dot(
		world_normal, VIEW)), rim_power);
	EMISSION = tint.rgb * rim * 2.0;
}

void light() {
	// per-light contribution hook (advanced)
}</code></pre>
  </div>
</div>
` },

{ c: 13, t: "GDShader II: Fragment Built-ins", html: `
<h2>The spatial fragment dictionary</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th colspan="2">Writes (outputs)</th></tr>
      <tr><td><code>ALBEDO</code></td><td>base color</td></tr>
      <tr><td><code>METALLIC / SPECULAR</code></td><td>PBR params</td></tr>
      <tr><td><code>ROUGHNESS</code></td><td>0..1 microsurface</td></tr>
      <tr><td><code>NORMAL / NORMAL_MAP</code></td><td>custom/texture normals</td></tr>
      <tr><td><code>EMISSION</code></td><td>additive unlit (HDR)</td></tr>
      <tr><td><code>ALPHA</code> (+ <code>ALPHA_SCISSOR</code>)</td><td>transparency</td></tr>
      <tr><td><code>AO</code>, <code>AO_LIGHT_AFFECT</code></td><td>occlusion</td></tr>
      <tr><td><code>RIM / CLEARCOAT / ANISOTROPY</code></td><td>stylized lobes</td></tr>
      <tr><td><code>DISCARD</code></td><td>hard cut pixels</td></tr>
    </table></div>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th colspan="2">Reads (inputs)</th></tr>
      <tr><td><code>UV / UV2</code></td><td>texcoords</td></tr>
      <tr><td><code>VERTEX</code> (view space)</td><td>position</td></tr>
      <tr><td><code>VIEW</code></td><td>surface→eye dir</td></tr>
      <tr><td><code>NORMAL</code></td><td>shading normal</td></tr>
      <tr><td><code>TIME</code>, <code>PI</code>, <code>TAU</code></td><td>constants</td></tr>
      <tr><td><code>FRAGCOORD</code></td><td>pixel coords</td></tr>
      <tr><td><code>INSTANCE_CUSTOM</code></td><td>per-instance data</td></tr>
      <tr><td><code>SCREEN_UV</code></td><td>screen-space sampling</td></tr>
      <tr><td><code>DEPTH</code></td><td>fragment depth</td></tr>
    </table></div>
    <div class="callout note"><b>ℹ Note</b><p>Full tables live in the docs' "Shading language" + "Spatial shaders" pages — the two you'll keep open forever.</p></div>
  </div>
</div>
` },

{ c: 13, t: "GDShader III: A Practical FX Library", html: `
<h2>Four shaders you'll actually ship</h2>
<div class="two">
  <div>
<pre data-file="dissolve.gdshader" data-lang="gdshader"><code>// 1) Dissolve on hit/hide
shader_type spatial;
uniform sampler2D noise_tex
	: hint_default_black, filter_linear_mipmap;
uniform float dissolve_amount
	: hint_range(0.0, 1.0) = 0.0;
uniform vec4 edge_color : source_color
	= vec4(1.0, 0.4, 0.0, 1.0);

void fragment() {
	float n = texture(noise_tex, UV).r;
	float e = 0.06;                       // edge width
	ALBEDO = edge_color.rgb;
	EMISSION = edge_color.rgb *
		step(n - e, dissolve_amount) * 2.0;
	if (n &lt; dissolve_amount) {
		DISCARD;
	}
}</code></pre>
<pre data-file="scroll_frost.gdshader" data-lang="gdshader"><code>// 2) Two-layer scrolling water/shield
void fragment() {
	vec2 uv1 = UV * 3.0 + vec2(TIME * 0.05, 0.0);
	vec2 uv2 = UV * 3.0 - vec2(0.0, TIME * 0.03);
	float a = texture(tex_a, uv1).r;
	float b = texture(tex_b, uv2).r;
	ALBEDO = mix(deep, shallow, a * 0.5 + b * 0.5);
	ROUGHNESS = mix(0.05, 0.3, b);
	NORMAL_MAP = texture(nrm, uv1).rgb * 0.5;
}</code></pre>
  </div>
  <div>
<pre data-file="fresnel_force.gdshader" data-lang="gdshader"><code>// 3) Sci-fi force field (fresnel + pulse)
void fragment() {
	float fres = pow(1.0 - clamp(dot(
		NORMAL, VIEW), 0.0, 1.0), 3.0);
	float pulse = 0.75 + 0.25
		* sin(TIME * 4.0 + VERTEX.y * 8.0);
	ALBEDO = vec3(0.0);
	EMISSION = field_color.rgb
		* fres * intensity * pulse;
	ALPHA = clamp(fres * 1.4, 0.0, 1.0);
}
// render_mode: blend_mix, cull_disabled,
//              depth_draw_never, unshaded</code></pre>
<pre data-file="triplanar_rock.gdshader" data-lang="gdshader"><code>// 4) Triplanar rock (no UVs needed)
varying vec3 w_pos;
void vertex() {
	w_pos = (MODEL_MATRIX * vec4(VERTEX,1.0)).xyz;
}
void fragment() {
	vec3 n = normalize(NODE_TRANSFORM_WORLD
		* vec4(NORMAL, 0.0)).xyz;
	vec3 tw = pow(abs(n), vec3(4.0));
	tw /= dot(tw, vec3(1.0));
	vec3 x = texture(albedo, w_pos.zy * scale).rgb;
	vec3 y = texture(albedo, w_pos.xz * scale).rgb;
	vec3 z = texture(albedo, w_pos.xy * scale).rgb;
	ALBEDO = x * tw.x + y * tw.y + z * tw.z;
	ROUGHNESS = 0.95;
}</code></pre>
  </div>
</div>
` },

{ c: 13, t: "GDShader IV: Vertex & Instancing", html: `
<h2>Vertex shader powers</h2>
<div class="twoR">
  <div>
<pre data-file="wind_sway.gdshader" data-lang="gdshader"><code>// Wind sway for foliage (MultiMesh-friendly)
shader_type spatial;
render_mode depth_draw_opaque;

uniform float strength := 0.25;
uniform float speed := 1.5;
uniform float height_falloff := 0.6;

varying float v_h;

void vertex() {
	// UV2.y often holds 0=base, 1=tip for cards
	v_h = UV2.y;
	float sway = sin(TIME * speed
		+ INSTANCE_CUSTOM.x * 6.2831) * strength;
	sway *= pow(v_h, height_falloff);
	VERTEX.x += sway;
	VERTEX.z += sway * 0.5;
}

void fragment() {
	ALBEDO = texture(albedo, UV).rgb;
	// Fade tips (alpha-scissor keeps depth sane):
	float a = texture(albedo, UV).a;
	ALPHA_SCISSOR_THRESHOLD = 0.5;
	ALPHA = a;
}</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><code>vertex()</code> runs before rasterization: displace <code>VERTEX</code>, recompute normals, pass <code>varying</code>s.</li>
      <li><code>INSTANCE_CUSTOM</code> = per-instance vec4 from MultiMesh (<code>set_instance_custom_data</code>) — per-flower phase, per-enemy tint.</li>
      <li><code>MODEL_MATRIX / NODE_TRANSFORM_WORLD</code> for world math; writing <code>MODELVIEW_MATRIX</code> (view-space) for billboards.</li>
      <li>Doing it in vertex = per-vertex cost, not per-pixel: always displace here, never in fragment.</li>
    </ul>
    <div class="callout perf"><b>⚡ Performance</b><p>One swaying-foliage shader on a MultiMesh = 100k plants at trivial cost. Same logic per-plant via Tweens would cost megabytes of churn per second.</p></div>
  </div>
</div>
` },

{ c: 13, t: "GDShader V: light() & Particles", html: `
<h2>light() and particle shaders</h2>
<div class="two">
  <div>
<pre data-file="toon_light.gdshader" data-lang="gdshader"><code>// Toon shading via light():
void light() {
	float nd = clamp(dot(NORMAL, LIGHT),
		0.0, 1.0);
	// Quantize into 3 bands:
	float band = floor(nd * 3.0) / 3.0;
	DIFFUSE_LIGHT += LIGHT_COLOR
		* band * ATTENUATION;
	// crisp spec:
	float sh = pow(max(dot(REFLECT(
		-LIGHT, NORMAL), VIEW), 0.0), 32.0);
	SPECULAR_LIGHT += step(0.95, sh)
		* LIGHT_COLOR;
}
// render_mode diffuse_lambert, specular_disabled</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><code>light()</code> executes <b>once per light per pixel</b> — custom diffuse/spec contributions, toon ramps, shadow-tinting, stylized SSS fakes.</li>
      <li>Built-ins: <code>LIGHT</code> dir, <code>LIGHT_COLOR</code>, <code>ATTENUATION</code>, <code>SHADOW_MASK</code>…</li>
      <li><b>Particles shaders</b> (<code>shader_type particles</code>): <code>start()</code>/<code>process()</code> move GPU particles via <code>TRANSFORM</code>, <code>VELOCITY</code>, <code>LIFETIME</code> — the code version of ParticleProcessMaterial, with full control.</li>
      <li>Use particles shaders when ParticleProcessMaterial's feature list fights you (custom attractor math, mesh-surface emission).</li>
    </ul>
    <div class="callout ver"><b>◷ Version Note</b><p><b>4.3+:</b> <code>shader_type compute</code> — full compute shaders with <code>compute()</code> entry, storage buffers, local_size — GPU culling, particle sims, procedural generation.</p></div>
  </div>
</div>
` },

{ c: 13, t: "VisualShader vs Code", html: `
<h2>VisualShader graphs — when, why</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>VisualShader = node-graph frontend that <b>compiles to the same shader stages</b>; live-convertible (Material → Convert to ShaderMaterial).</li>
      <li>Great for: learning dataflow, quick fresnel/scroller sketches, artist-facing parameter playgrounds.</li>
      <li>Weak at: big branching logic, loops, shared libraries, code review/diffs.</li>
      <li>Production stance: prototype visually → <b>convert to code</b> → maintain in .gdshader with comments &amp; version control.</li>
    </ul>
  </div>
  <div>
    <div class="flow">
      <div class="fbox"><b>VisualShader sketch</b>idea in 5 min</div>
      <div class="arr">→</div>
      <div class="fbox"><b>Convert to code</b>right-click material</div>
      <div class="arr">→</div>
      <div class="fbox acc"><b>.gdshader in git</b>review · reuse · document</div>
    </div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Uniform names become your shader's public API — stable names, hint-annotated, defaults sane. Consumers (animators, designers) only ever touch uniforms.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Lights Reference", html: `
<h2>Light nodes — the full card</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th></th><th>DirectionalLight3D</th><th>OmniLight3D</th><th>SpotLight3D</th><th>LightmapProbe</th></tr>
  <tr><td>Shape</td><td>parallel (sun)</td><td>sphere</td><td>cone (angle)</td><td>GI sampler</td></tr>
  <tr><td>Key props</td><td>shadow max_distance, blend_splits, sky_mode</td><td>omni_attenuation, shadow_bias</td><td>spot_angle, spot_attenuation, <code>light_cone</code></td><td>—</td></tr>
  <tr><td>Shadows</td><td>PSSM splits</td><td>dual-paraboloid</td><td>one map</td><td>—</td></tr>
  <tr><td>Relative cost</td><td>low (1)</td><td>high (cube-ish)</td><td>medium</td><td>~0</td></tr>
  <tr><td>Bake (LightmapGI)</td><td>yes</td><td>yes (static)</td><td>yes (static)</td><td>is one</td></tr>
  <tr><td>Typical count</td><td>1</td><td>≤8 dynamic</td><td>≤4</td><td>hundreds</td></tr>
</table></div>
<div class="two">
  <div class="callout perf"><b>⚡ Performance</b><p>Forward+ <b>clusters</b> lights: cost scales with lights overlapping one pixel region, not raw count — still, shadow-casting lights re-render casters. Budget shadows like money.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p><code>Light3D.light_bake_mode</code>: <b>Disabled</b> (dynamic only), <b>Static</b> (bake into lightmaps), <b>Dynamic</b> (bake indirect only, direct stays live). Hybrid scenes = Static lanterns + Dynamic sun.</p></div>
</div>
` },

{ c: 13, t: "Shadows Deep Settings", html: `
<h2>Shadow quality matrix</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Setting</th><th>Where</th><th>Low</th><th>Recommended</th><th>Cinematic</th></tr>
  <tr><td>Shadow atlas size</td><td>Project → Rendering → Quality</td><td>2048</td><td>4096</td><td>8192</td></tr>
  <tr><td>Directional shadow mode</td><td>Light node</td><td>Orthogonal, 2 splits</td><td>PSSM 4, blend_splits</td><td>PSSM 4 + soft high</td></tr>
  <tr><td>Shadow softness</td><td>Light → Shadow</td><td>Hard</td><td>Soft Low/Medium</td><td>Soft High</td></tr>
  <tr><td>16-bit shadows</td><td>Project settings</td><td>on (banding risk)</td><td>off</td><td>off</td></tr>
  <tr><td>Bias / normal_bias</td><td>per light</td><td>1.0 / 2.0</td><td>0.4 / 1.5 tuned</td><td>tuned per surface</td></tr>
  <tr><td>Distance fade</td><td>Light → Fade</td><td>on, aggressive</td><td>on, gentle</td><td>off</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Fix acne by raising <b>normal_bias first</b> (geometry moves, not the shadow), then bias (peter-panning cost), then atlas size last.</p></div>
  <div class="callout note"><b>ℹ Note</b><p>Compatibility renderer shadows lack PSSM blending; Mobile shares most desktop settings — test shadow atlases early on real devices.</p></div>
</div>
` },

{ c: 13, t: "VoxelGI", html: `
<h2>VoxelGI — dynamic voxel GI</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>What:</b> a voxelized scene region stores direct+one-bounce light; dynamic objects sample it — real-time GI for medium scenes.</li>
      <li><b>Setup:</b> VoxelGI node (box extents cover room) → <code>subdiv</code> 64/128/256 → <b>Bake</b> → dynamic lights update the voxels live.</li>
      <li>Node flags matter: meshes report to VoxelGI via <code>gi_mode</code> (Static/Dynamic/Disabled).</li>
      <li>Costs VRAM (~subdiv³) + updates when lights move; best in enclosed scenes (rooms, caves).</li>
      <li>Fallback option <code>Interior</code>-style ambience when baking is impossible.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">VoxelGI</span> <span class="g">RoomGI</span>
<span class="m">├─ size = (16, 6, 16)</span>
<span class="m">├─ subdiv = 128</span>
<span class="m">└─ (bake → .voxel_gi data)</span>

<span class="m">Mesh gi_mode:</span>
<span class="m">· STATIC  → voxelized once</span>
<span class="m">· DYNAMIC → re-voxelized live (player!)</span>
<span class="m">· DISABLED→ ignored</span>

<span class="m">Light bake_mode: Dynamic → GI updates</span></div>
    <div class="callout perf"><b>⚡ Performance</b><p>One VoxelGI per room, subdiv 128, dynamic lights ≤ a handful moving. Multiple VoxelGIs stack costs — blend via extents, don't overlap heavily.</p></div>
  </div>
</div>
` },

{ c: 13, t: "SDFGI", html: `
<h2>SDFGI — signed distance field GI</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Forward+ only.</b> Scene-scale real-time GI: signed distance field of static geometry + cascades → multi-bounce-ish lighting, sky-lit interiors that just work outdoors→indoors.</li>
      <li>Enable in <b>Environment → SDFGI</b> (one checkbox) — no bake; static geometry captured on first frames.</li>
      <li>Tuning: <code>cascades</code> (distance), <code>min_cell_size</code>, <code>use_occlusion</code>, <code>read_sky_light</code>, <code>bounce_feedback</code>.</li>
      <li>Moving static geometry = stale SDF (artifacts); recompute is automatic only on load. Designed for open worlds with static shells.</li>
      <li>Pairs with <b>volumetric fog</b> (GI injects) for exterior depth.</li>
    </ul>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Need</th><th>SDFGI</th><th>VoxelGI</th><th>Lightmap</th></tr>
      <tr><td>Open world</td><td>★</td><td>—</td><td>—</td></tr>
      <tr><td>Room-scale, dynamic lights</td><td>ok</td><td>★</td><td>—</td></tr>
      <tr><td>Static, mobile, web</td><td>—</td><td>—</td><td>★</td></tr>
      <tr><td>Zero bake step</td><td>★</td><td>bake voxels</td><td>bake maps</td></tr>
      <tr><td>Runtime cost</td><td>med</td><td>med-high</td><td>~0</td></tr>
    </table></div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>SDFGI renders the scene's static shell into a hierarchical SDF; GI rays march it. That's why it loves static geometry and hates runtime-moving walls — the field doesn't know.</p></div>
  </div>
</div>
` },

{ c: 13, t: "LightmapGI & Probes", html: `
<h2>LightmapGI reference (condensed)</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Prereqs:</b> meshes with UV2 (glTF import option or "Lightmap Unwrap" on primitives); static geometry flagged via <code>gi_mode = Static</code>.</li>
      <li><b>Bake:</b> select LightmapGI → "Bake Lightmaps" — editor-blocked progress; output <code>LightmapGIData</code> + .lmbake textures.</li>
      <li>Quality dials: <code>bake_quality</code>, <code>energy</code>, <code>indirect_pass</code>, <code>denoise</code> (OIDN), <code>bias/texel</code>.</li>
      <li><b>Dynamic objects:</b> nearest lightmap probe lights them (add <code>LightmapProbe</code> nodes where coverage is thin).</li>
      <li>Workflow rule: bake after geometry/lighting milestones, commit the data.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>UV2 present?</b>glTF option / unwrap</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>gi_mode static</b>on receivers</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Bake</b>direct + indirect → atlases</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Runtime</b>static map + probes for movers</div>
    </div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Baking without UV2 silently produces black/garbled maps — check the unwrap first (Ch 4 import slide). Large atlases: <code>atlas_max_size</code> 4096 default.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Reflections & Decals", html: `
<h2>ReflectionProbes &amp; Decals</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>ReflectionProbe:</b> cube-map reflections for a region; <b>Update Modes</b>: Once (baked), Always (live), <b>Blends</b> (mixed).</li>
      <li><code>box_projection</code> keeps reflections perspective-correct inside boxes (rooms!); size/origin define the blend region.</li>
      <li>Interior rule: probe per room, box projection on;Ambient contribution via <code>ambient_mode</code>.</li>
      <li><b>Decal node:</b> projects a texture onto geometry — bullet holes, blood, road markings, fake shadows. Albedo/normal/ORM/emission channels; distance fade + cull.</li>
      <li>Decals read depth only where visible — cheap vs re-texturing meshes.</li>
    </ul>
  </div>
  <div>
<pre data-file="impact_decal.gd" data-lang="gdscript"><code># Pooled bullet-hole decals:
extends Decal

func place(at: Vector3, normal: Vector3) -> void:
	global_position = at + normal * 0.02
	# Decal projects along -Y of its own basis:
	var up := normal
	var fwd := normal.cross(Vector3.UP) \
		if abs(normal.dot(Vector3.UP)) &lt; 0.99 \
		else Vector3.RIGHT
	look_at(at + fwd, up)
	rotate_object_local(Vector3.RIGHT, PI)  # face out
	# Random roll + lifetime:
	rotate_object_local(Vector3.UP,
		randf() * TAU)
	var tw := create_tween()
	tw.tween_interval(30.0)
	tw.tween_property(self,
		"modulate", Color(1,1,1,0), 4.0)
	tw.tween_callback(_release)</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Renderer Comparison Matrix", html: `
<h2>Forward+ vs Mobile vs Compatibility</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Feature</th><th>Forward+</th><th>Mobile</th><th>Compatibility</th></tr>
  <tr><td>API</td><td>Vulkan (D3D12 opt.)</td><td>Vulkan</td><td>OpenGL 3.3 / WebGL2</td></tr>
  <tr><td>Clustered lights</td><td>✔</td><td>✔ (tuned)</td><td>✖ (per-object limits)</td></tr>
  <tr><td>SDFGI</td><td>✔</td><td>✖</td><td>✖</td></tr>
  <tr><td>VoxelGI</td><td>✔</td><td>✖</td><td>✖</td></tr>
  <tr><td>LightmapGI</td><td>✔</td><td>✔</td><td>✔</td></tr>
  <tr><td>Volumetric fog</td><td>✔</td><td>✖</td><td>✖</td></tr>
  <tr><td>SSR / SSAO / SSIL</td><td>✔</td><td>SSAO only</td><td>✖</td></tr>
  <tr><td>Compute shaders</td><td>✔</td><td>partial</td><td>✖ (4.3 web)</td></tr>
  <tr><td>MSAA + HDR pipeline</td><td>✔</td><td>✔</td><td>limited</td></tr>
  <tr><td>Targets</td><td>desktop</td><td>mobile/consoles</td><td>web/old HW</td></tr>
</table></div>
<div class="callout bp"><b>✓ Best Practice</b><p>Design your <em>lighting</em> for the lowest renderer you'll ship (usually: LightmapGI + 1 sun + few dynamics), then let Forward+ upgrades (SDFGI, volumetrics) be optional quality tiers — <code>feature_overrides</code> / env presets per tier.</p></div>
` },

{ c: 13, t: "RenderingServer Architecture", html: `
<h2>RenderingServer — under the nodes</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>Nodes are thin wrappers; every visual you see is server state addressed by <b>RIDs</b>.</li>
      <li>The node path: <code>MeshInstance3D._ready → RenderingServer.instance_create() → instance_set_base(mesh_rid) → instance_set_transform</code>…</li>
      <li>Driving the server yourself: create resources once, mutate per frame — no scene-tree overhead. The API behind crowd renderers, editor tools, and streaming worlds.</li>
      <li>Same pattern for PhysicsServer3D / AudioServer / NavigationServer3D (Ch 3).</li>
    </ul>
  </div>
  <div>
<pre data-file="server_mesh.gd" data-lang="gdscript"><code># A mesh drawn entirely through RenderingServer:
extends Node

var mesh_rid: RID
var instance_rid: RID
var material_rid: RID

func _ready() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.add_vertex(Vector3(-1, 0, 0))
	st.add_vertex(Vector3(1, 0, 0))
	st.add_vertex(Vector3(0, 2, 0))
	st.generate_normals()
	mesh_rid = st.commit().get_rid()

	material_rid = RenderingServer.material_create()
	RenderingServer.material_set_param(
		material_rid, "albedo", Color.CRIMSON)

	instance_rid = RenderingServer.instance_create2(
		mesh_rid, get_viewport().find_world_3d().scenario)
	RenderingServer.instance_set_transform(
		instance_rid, Transform3D(
			Basis(), Vector3(0, 1, 0)))

func _exit_tree() -> void:
	RenderingServer.free_rid(instance_rid)
	RenderingServer.free_rid(material_rid)</code></pre>
    <div class="callout deep"><b>◉ Deep Dive</b><p>You must <b>free RIDs yourself</b> — server resources aren't ref-counted. The classic leak: server meshes in an editor tool that never exit cleanly.</p></div>
  </div>
</div>
` },

{ c: 13, t: "MultiMesh Crowds", html: `
<h2>MultiMeshInstance3D — thousands of one mesh</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>One draw call-ish for N instances: grass, rocks, crowd billboards, debris fields.</li>
      <li>Per-instance: transform + <code>custom_data</code> (Color → shader <code>INSTANCE_CUSTOM</code>) + visibility.</li>
      <li><b>Bullet crowd renderer:</b> pool bullets as multimesh instances — transform updates each tick, zero scene churn.</li>
      <li><code>visible_instance_count</code> for partial updates; use <code>buffer</code> mode for fully CPU-driven swarms.</li>
    </ul>
  </div>
  <div>
<pre data-file="crowd.gd" data-lang="gdscript"><code>extends MultiMeshInstance3D

@export var count := 1000
@export var spread := 60.0

func _ready() -> void:
	multimesh.transform_format = \
		MultiMesh.TRANSFORM_3D
	multimesh.instance_count = count
	for i in count:
		var pos := Vector3(
			randf_range(-spread, spread), 0,
			randf_range(-spread, spread))
		var t := Transform3D(
			Basis.rotated(Vector3.UP,
				randf() * TAU), pos)
		multimesh.set_instance_transform(i, t)
		# per-instance hue, read in shader:
		multimesh.set_instance_custom_data(i,
			Color(randf(), randf(), 0, 0))
	# shader: ALBEDO = mix(cold, hot,
	#          INSTANCE_CUSTOM.x);</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>Rule of thumb: more than ~50 copies of the same mesh → MultiMesh. Draw calls collapse; only transforms move.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Import Pipeline Reference", html: `
<h2>Importers — per-type card</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Source</th><th>Importer</th><th>Output resource</th><th>Key options</th></tr>
  <tr><td>.png/.jpg/.webp/.svg</td><td>texture</td><td>CompressedTexture2D</td><td>3D detect, VRAM, mips, process</td></tr>
  <tr><td>.hdr/.exr</td><td>texture (HDR)</td><td>CompressedTexture2D</td><td>panorama → sky, force linear</td></tr>
  <tr><td>.glb/.gltf/.fbx/.obj/.dae</td><td>scene</td><td>PackedScene + sub-resources</td><td>nodes/meshes/anims/materials/retarget</td></tr>
  <tr><td>.wav</td><td>sample</td><td>AudioStreamWAV</td><td>loop, force 16-bit, trim</td></tr>
  <tr><td>.ogg/.mp3</td><td>stream</td><td>AudioStreamOggVorbis/MP3</td><td>loop, bitrate</td></tr>
  <tr><td>.ttf/.otf/.woff2</td><td>font</td><td>FontFile</td><td>antialias, MSDF, subpixel, variable</td></tr>
  <tr><td>.csv/.po</td><td>translation</td><td>Translation</td><td>locale columns</td></tr>
  <tr><td>.gdshader</td><td>shader</td><td>Shader</td><td>(hot reload, includes)</td></tr>
</table></div>
<div class="two">
  <div class="callout deep"><b>◉ Deep Dive</b><p>Custom importers: <code>EditorImportPlugin</code> — teach Godot new source formats (e.g. your level JSON → PackedScene). Same machinery the built-ins use.</p></div>
  <div class="callout bp"><b>✓ Best Practice</b><p>UIDs (4.x) track files across renames; <code>.uid</code> files (4.4+) externalize them. Never hand-edit UIDs; use the FileSystem dock to move/rename.</p></div>
</div>
` },

{ c: 13, t: "UV & Mesh Utilities", html: `
<h2>UV pipeline utilities</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Primitives:</b> "UV Unwrap" button on PrimitiveMesh (lightmap-grade UV2 for planes/boxes).</li>
      <li><b>glTF:</b> authors UV in DCC; ask for "Lightmap UV2" generation in import options.</li>
      <li><b>Runtime:</b> <code>ArrayMesh.add_surface_from_arrays</code> with your own <code>ARRAY_TEX_UV/UV2</code>; <code>MeshDataTool</code> reads/edits per-vertex.</li>
      <li><b>Material-level transforms:</b> UV1/UV2 offset-scale-triplanar on StandardMaterial3D — no mesh re-authoring needed.</li>
      <li>Validate: viewport display "UV" debug or <code>surf_tool</code> re-projects.</li>
    </ul>
  </div>
  <div>
<pre data-file="uv_tools.gd" data-lang="gdscript"><code># Scale UVs of surface 0 at runtime (arrays path):
extends MeshInstance3D

func double_uv_scale() -> void:
	var arrays := mesh.surface_get_arrays(0)
	var uvs: PackedVector2Array = arrays[
		Mesh.ARRAY_TEX_UV]
	for i in uvs.size():
		uvs[i] *= 2.0
	arrays[Mesh.ARRAY_TEX_UV] = uvs

	var nm := ArrayMesh.new()
	nm.add_surface_from_arrays(
		Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh = nm

# Per-vertex read/edit instead? MeshDataTool:
var mdt := MeshDataTool.new()
mdt.create_from_surface(mesh, 0)
for i in mdt.get_vertex_count():
	mdt.set_vertex_uv(i,
		mdt.get_vertex_uv(i) * 2.0)</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Inspector & @export Toolkit", html: `
<h2>The @export full toolbox</h2>
<div class="twoR">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Annotation</th><th>Editor widget</th></tr>
      <tr><td><code>@export</code></td><td>typed field editor</td></tr>
      <tr><td><code>@export_range(a,b,step)</code></td><td>slider (+or_less/more)</td></tr>
      <tr><td><code>@export_enum("A","B")</code></td><td>dropdown (int)</td></tr>
      <tr><td><code>@export_file("*.tscn")</code></td><td>file picker</td></tr>
      <tr><td><code>@export_node_path("Area3D")</code></td><td>node picker</td></tr>
      <tr><td><code>@export_multiline</code></td><td>text area</td></tr>
      <tr><td><code>@export_placeholder</code></td><td>hint text</td></tr>
      <tr><td><code>@export_group / _subgroup</code></td><td>folding sections</td></tr>
      <tr><td><code>@export_category</code></td><td>titled dividers</td></tr>
      <tr><td><code>@export_tool_button("Run")</code> (4.4)</td><td>clickable action</td></tr>
      <tr><td><code>@warning_ignore</code></td><td>silence lint</td></tr>
    </table></div>
  </div>
  <div>
<pre data-file="exports_full.gd" data-lang="gdscript"><code>@tool
class_name GunConfig
extends Resource

@export_category("Ballistics")
@export_group("Damage", "dmg_")
@export_range(1, 100, 1, "or_greater")
var dmg_base := 10
@export var dmg_falloff := true

@export_group("Ammo")
@export_enum("Kinetic:0", "Plasma:1") \
var ammo_kind := 0
@export var tracer: PackedScene
@export_node_path("Marker3D", "Node3D") \
var muzzle_path: NodePath

@export_category("Editor")
@export_tool_button("Balance report") \
var balance_btn = _report

func _report() -> void:
	print("dps = ", dmg_base * fire_rate)</code></pre>
    <div class="callout ver"><b>◷ Version Note</b><p><code>@export_tool_button</code> and color-picker-with-alpha variants arrived through 4.3/4.4 — check your exact minor version's docs.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Custom Resources in the Inspector", html: `
<h2>Custom Resources as data containers</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>class_name X extends Resource</code> → appears in "Create Resource"; nest freely (arrays of resources = tables).</li>
      <li>Save as <code>.tres</code> — text, diffable, hot-loadable, shareable across projects.</li>
      <li><b>Setters</b> make them self-validating (clamp on assignment) — bad data can't enter.</li>
      <li><code>@tool</code> on the resource + <code>validate_property</code> = designer-proof inspector.</li>
      <li>This is the backbone of item DBs, level tables, dialog trees, wave configs (Ch 6/8/11/12 all used it).</li>
    </ul>
  </div>
  <div>
<pre data-file="item_db.gd" data-lang="gdscript"><code>@tool
class_name ItemDef
extends Resource

@export var id: StringName : set = _set_id
@export_multiline var description := ""
@export var icon: Texture2D
@export var stats: Array[StatMod] = []

func _set_id(v: StringName) -> void:
	# ids lowercase, no spaces — enforce forever:
	id = StringName(
		String(v).to_lower().strip_edges()
		.replace(" ", "_"))

@tool
class_name StatMod
extends Resource
@export var stat: StringName
@export_range(-10.0, 10.0, 0.1) var delta := 0.0</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Data-flow: .tres (designer) → Resource (runtime). If you find yourself parsing JSON in a script, ask whether a Resource would do it with editor UI for free.</p></div>
  </div>
</div>
` },

{ c: 13, t: "@tool & Editor Plugins", html: `
<h2>Editor scripting anatomy</h2>
<div class="two">
  <div>
<pre data-file="plugin_skeleton.gd" data-lang="gdscript"><code># addons/level_tools/plugin.cfg:
#   [plugin] name="LevelTools"
#   script="level_tools.gd"
@tool
extends EditorPlugin

func _enter_tree() -> void:
	# 1) add custom node types to the Add menu:
	add_custom_type(
		"SpawnPoint", "Marker3D",
		preload("spawn_point.gd"),
		preload("spawn_icon.svg"))
	# 2) docks:
	add_control_to_dock(
		DOCK_SLOT_RIGHT_BR,
		preload("level_dock.tscn").instantiate())
	# 3) inspector plugins:
	add_inspector_plugin(preload(
		"spawn_inspector.gd").new())

func _exit_tree() -> void:
	remove_custom_type("SpawnPoint")
	# remove dock + inspector plugin…</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>@tool scripts</b> run in-editor (Ch 4); <b>EditorPlugin</b> bundles tooling into an addon.</li>
      <li>Plugin capabilities: custom nodes, docks, inspector panels, import plugins, export plugins, scene post-import hooks (<code>_process_scene</code> for auto-LOD, auto-collision).</li>
      <li><code>EditorInterface</code> (singleton since 4.2): selection, scene tree, inspector, filesystem — full editor automation.</li>
      <li>Ship: <code>addons/your_plugin/</code> + enable in Project Settings; distribute via AssetLib or git.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Tool scripts share the editor's process: infinite loops and <code>print</code> spam freeze YOUR editor. Guard with <code>Engine.is_editor_hint()</code> and test plugins in a sacrificial project.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Physics Architecture", html: `
<h2>Physics stack — servers to shapes</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>PhysicsServer3D</b>: spaces (worlds), bodies, shapes, joints, areas, queries — all by RID, threaded by default.</li>
      <li><b>Direct access:</b> <code>PhysicsServer3D.space_get_direct_state(space)</code> inside physics ticks — ray/shape casts, contacts.</li>
      <li><b>Node facades:</b> StaticBody3D/RigidBody3D/CharacterBody3D/AnimatableBody3D/Area3D + shape nodes + joints.</li>
      <li><b>Queries without nodes:</b> <code>PhysicsRayQueryParameters3D</code>, <code>PhysicsShapeQueryParameters3D</code> — sensor guns, AI vision, custom character controllers.</li>
      <li>Fixed tick 60 Hz; <code>max_physics_steps_per_frame</code> guards spiral-of-death.</li>
    </ul>
  </div>
  <div>
<pre data-file="query_card.gd" data-lang="gdscript"><code># All query forms, one card:
func raycast(from: Vector3, to: Vector3) -> Dictionary:
	var q := PhysicsRayQueryParameters3D.\
		create(from, to)
	q.collide_with_areas = true
	q.collide_with_bodies = true
	q.exclude = [self.get_rid()]
	q.hit_from_inside = false
	return get_viewport().find_world_3d()\
		.direct_space_state.intersect_ray(q)
	# {} if nothing hit

func sphere_check(at: Vector3, r: float) -> Array[Dictionary]:
	var shape := SphereShape3D.new()
	shape.radius = r
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = shape
	q.transform = Transform3D(Basis(), at)
	return get_viewport().find_world_3d()\
		.direct_space_state.intersect_shape(
			q, 32)  # max results</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Physics: Jolt Integration", html: `
<h2>Jolt in practice</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Enable: Project Settings → Physics → 3D → Physics Engine = <b>Jolt Physics</b> (4.4+ built-in; earlier: the godot-jolt addon).</li>
      <li><b>Wins:</b> multithreaded island solving, stiffer joints (better flippers/vehicles!), robust CCD, better stacking.</li>
      <li><b>Deltas:</b> some param mappings differ (<code>HingeJoint3D</code> bias/solver params map approximately); tune joints after switching.</li>
      <li>Determinism differs from GodotPhysics — never mix engine choice mid-project with recorded replays.</li>
      <li>2D unaffected (Box2D-derived GodotPhysics2D).</li>
    </ul>
  </div>
  <div>
<pre data-file="migration.gd" data-lang="gdscript"><code># Feature-check physics engine at runtime:
func _ready() -> void:
	var engine_name := ProjectSettings.\
		get_setting_with_override(
			"physics/3d/physics_engine")
	print("physics = %s" % engine_name)
	# "DEFAULT" (GodotPhysics3D) or "Jolt Physics"

# API surface is identical — this code runs on both:
var body := RigidBody3D.new()
body.mass = 2.0
body.apply_central_impulse(Vector3.UP * 9.8)

# Differences appear in:
# · joint damping/bias feel
# · sleep thresholds
# · contact ordering</code></pre>
    <div class="callout ver"><b>◷ Version Note</b><p>4.4 ships Jolt built-in AND the standalone godot-jolt addon continues for older versions. Prefer built-in on 4.4+; addon on 4.0–4.3.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Character Motion Reference", html: `
<h2>move_and_slide / move_and_collide card</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>API</th><th>Use</th><th>Notes</th></tr>
  <tr><td><code>move_and_slide()</code></td><td>locomotion with sliding</td><td>uses <code>velocity</code>; floors/slopes/steps</td></tr>
  <tr><td><code>move_and_collide(v)</code></td><td>one-shot displacement</td><td>returns <code>KinematicCollision3D</code> or null</td></tr>
  <tr><td><code>test_move(t, v)</code></td><td>would-it-collide probe</td><td>no motion, cheap checks</td></tr>
  <tr><td><code>get_last_slide_collision()</code></td><td>post-move info</td><td>normal, collider, position</td></tr>
  <tr><td><code>is_on_floor/wall/ceiling</code></td><td>contact states</td><td>valid after move_and_slide</td></tr>
  <tr><td><code>get_platform_*()</code></td><td>riding movers</td><td>velocity/angular/velocity of floor</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Tuning set that covers 90% of platformers: <code>floor_snap_length 0.1</code>, <code>floor_max_angle 50°</code>, <code>safe_margin 0.001</code>, <code>wall_min_slide_angle 15°</code>, <code>max_slides 4</code>.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p><code>separate_rays_on_floor</code>, <code>platform_on_leave</code>, and <code>platform_velocity_additive</code> resolve the classic "launcher platform vs rider" edge cases — read their docs once, save a week.</p></div>
</div>
` },

{ c: 13, t: "Collision Layers Cookbook", html: `
<h2>Layer/mask recipes</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Pattern</th><th>Layer</th><th>Mask</th><th>Why</th></tr>
  <tr><td>Solid world</td><td>world</td><td>—</td><td>static, scans nothing</td></tr>
  <tr><td>Player body</td><td>player</td><td>world</td><td>collides terrain only</td></tr>
  <tr><td>Enemy body</td><td>enemy</td><td>world</td><td>no enemy-enemy jam</td></tr>
  <tr><td>Player weapon (Area)</td><td>—</td><td>enemy</td><td>hits enemies, nothing else</td></tr>
  <tr><td>Pickup (Area)</td><td>—</td><td>player</td><td>only players collect</td></tr>
  <tr><td>Camera ray</td><td>—</td><td>world, interact</td><td>aim + interact</td></tr>
  <tr><td>Hazard (Area)</td><td>hazard</td><td>player, enemy</td><td>fire hurts all walkers</td></tr>
  <tr><td>Bullet (Area)</td><td>—</td><td>world, enemy</td><td>walls stop, enemies pop</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Name every layer (Project Settings); keep a table like this in your project README; new systems pick layers by menu, not bitmath.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p>Runtime API: <code>set_collision_layer_value(n, on)</code> / <code>set_collision_mask_value(n, on)</code>; <code>collision_layer</code> is a raw 32-bit int when you need math (<code>layer |= 1 &lt;&lt; 4</code>).</p></div>
</div>
` },

{ c: 13, t: "AudioServer & Buses", html: `
<h2>AudioServer — the mixer console</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Buses</b> = mix channels: sends/effects chain each; Master mandatory.</li>
      <li>Graph at runtime: <code>add_bus()</code>, <code>set_bus_send(from, "SFX")</code>, <code>add_bus_effect(i, AudioEffectReverb.new())</code>.</li>
      <li><b>Effect roster:</b> Reverb, Delay, Echo, Chorus, Distortion, EQ (6/10/21 band), Compressor, Limiter, Panner, <b>LowPass/HighPass</b> (our water filter), Capture, HardLimit, SpectrumAnalysis.</li>
      <li><b>Ducking:</b> sidechain the compressor bus (voice chat priority) via <code>AudioEffectCompressor.sidechain</code>.</li>
      <li>Voice budget: players allocate voices; polyphony + bus count plan the CPU.</li>
    </ul>
  </div>
  <div>
<pre data-file="bus_builder.gd" data-lang="gdscript"><code># Build/rebuild a ducking mix at runtime:
extends Node

func _ready() -> void:
	_ensure_bus("Music")
	_ensure_bus("SFX")
	_ensure_bus("Voice")

	# SFX gets a touch of reverb at the end:
	var sfx := AudioServer.get_bus_index("SFX")
	if AudioServer.get_bus_effect_count(sfx) == 0:
		var rev := AudioEffectReverb.new()
		rev.room_size = 0.6
		AudioServer.add_bus_effect(sfx, rev)

	# Master limiter = always last, always:
	var m := AudioServer.get_bus_index("Master")
	var lim := AudioEffectLimiter.new()
	lim.ceiling_db = -0.2
	AudioServer.add_bus_effect(m, lim)

func _ensure_bus(nm: String) -> void:
	if AudioServer.get_bus_index(nm) == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(
			AudioServer.bus_count - 1, nm)
		AudioServer.set_bus_send(nm, "Master")</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Audio Best Practices", html: `
<h2>Audio discipline card</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Routing:</b> one bus family (Master/Music/SFX/Ambience/Voice); players declare bus, never raw volumes cross-systems.</li>
      <li><b>Gain staging:</b> keep samples normalized; attenuate on buses (−6…−12 dB music bed) not per-clip extremes.</li>
      <li><b>Randomization:</b> pitch ±5–8% + slight volume variance on every repeated SFX — kills machine-gun monotony.</li>
      <li><b>Positional:</b> unit_size &gt; reach, max_db caps, doppler only on fast movers, attenuation_model Inverse default.</li>
      <li><b>Performance:</b> polyphony caps; distance culling (<code>max_distance</code>); stream (OGG) music, sample (WAV) SFX.</li>
    </ul>
  </div>
  <div>
<pre data-file="sfx_helper.gd" data-lang="gdscript"><code># A tiny play-helper every project wants:
class_name Sfx
extends AudioStreamPlayer3D

@export var pitch_jitter := 0.07
@export var volume_jitter_db := 1.5

func play_jittered() -> void:
	pitch_scale = 1.0 + randf_range(
		-pitch_jitter, pitch_jitter)
	volume_db = base_db + randf_range(
		-volume_jitter_db, volume_jitter_db)
	play()

# duck music during cutscenes:
func duck_music(on: bool) -> void:
	var idx := AudioServer.get_bus_index("Music")
	var db := -12.0 if on else 0.0
	var tw := create_tween()
	tw.tween_method(func(v):
		AudioServer.set_bus_volume_db(idx, v),
		AudioServer.get_bus_volume_db(idx),
		db, 0.4)</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p><code>volume_db</code> is logarithmic: −6 dB ≈ half loudness. Don't lerp dB linearly from 0 to −80 — most of the change is inaudible; use a slider-mapped curve.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Profiler Deep Dive", html: `
<h2>Profiler — reading the tea leaves</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Debugger → Profiler → Start:</b> per-function <em>process</em> + <em>physics</em> time, call counts, cumulative ms — the CPU truth.</li>
      <li>Read order: <b>top 3 rows</b> by self-time; ignore counts; fix, re-measure, repeat.</li>
      <li><b>Monitors tab:</b> live graphs — FPS, physics objects, draw calls, video memory, audio voices.</li>
      <li><b>Visual profiler:</b> viewport → Display Advanced → <b>Renderer</b> overdraw/wireframe; Shadow atlas views.</li>
      <li><b>Custom metrics:</b> <code>EngineProfiler</code> + <code>add_profiler</code> for your systems (AI budget, net ticks).</li>
    </ul>
  </div>
  <div>
<pre data-file="perf_overlay.gd" data-lang="gdscript"><code># In-game overlay — ships in debug builds:
extends CanvasLayer

func _ready() -> void:
	if not OS.is_debug_build():
		queue_free()
		return

func _process(_d: float) -> void:
	if Engine.get_frames_drawn() % 10:
		return
	var t := Time.get_ticks_msec()
	%Fps.text = "FPS %d" % Engine.get_frames_per_second()
	%Cpu.text = "cpu %.1f ms" % (
		Performance.get_monitor(
			Performance.TIME_PROCESS) * 1000.0)
	%Phys.text = "phys %.1f ms" % (
		Performance.get_monitor(
			Performance.TIME_PHYSICS_PROCESS) * 1000.0)
	%Draw.text = "draws %d · objs %d" % [
		RenderingServer.get_frame_setup_time_cpu() &gt; 0,
		Performance.get_monitor(
			Performance.OBJECT_COUNT)]
	%Mem.text = "mem %.0f MB" % (
		Performance.get_monitor(
			Performance.MEMORY_STATIC) / 1048576.0)</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Performance Playbook I", html: `
<h2>Optimization playbook — CPU &amp; logic</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Frame budget:</b> 16.6 ms (60) / 8.3 ms (120). Physics + process + draw submission must sum under it.</li>
      <li><b>Per-frame allocations:</b> avoid <code>new</code>/arrays in <code>_process</code> hot loops — pools (Ch 6), reused arrays.</li>
      <li><b>get_node caching</b> (<code>@onready</code>) — repeated lookups are hash walks.</li>
      <li><b>Group queries</b> (<code>get_nodes_in_group</code>) allocate arrays — cache or use <code>call_group</code>.</li>
      <li><b>Tick LOD:</b> not everything needs every frame — AI at 10 Hz timers, distance-gated logic.</li>
      <li><b>Await hygiene:</b> timers via <code>SceneTreeTimers</code> are pooled; deep <code>await</code> chains aren't free either.</li>
    </ul>
  </div>
  <div>
<pre data-file="tick_lod.gd" data-lang="gdscript"><code># Distance-based logic LOD — the workhorse:
extends EnemyBase

var _accum := 0.0

func _physics_process(delta: float) -> void:
	var d := global_position.distance_to(
		%Player.global_position)
	_accum += delta
	if d &gt; 60.0:
		return                          # frozen
	var hz := 10.0 if d &gt; 25.0 else 60.0
	if _accum &lt; 1.0 / hz:
		return
	_accum = 0.0
	_think()   # perception, pathing, targeting

func _physics_process_continuous(d: float) -> void:
	# cheap always-on part: velocity, gravity
	velocity.y -= 9.8 * d
	move_and_slide()</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>One line of profile-guided LOD (10 Hz far AI) regularly saves more than every micro-optimization combined. Measure first, always.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Performance Playbook II", html: `
<h2>Optimization playbook — rendering</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Draw calls:</b> fewer surfaces/materials; merge statics; MultiMesh repeats (slide 17).</li>
      <li><b>Overdraw:</b> transparency stacks — scissor over alpha-blend, small full-screen passes, reuse bloom.</li>
      <li><b>Shadows:</b> few casters per light; shadow distance fade; bake statics (LightmapGI).</li>
      <li><b>Texture memory:</b> VRAM-compressed 3D textures; sensible sizes (hero 2k, props 1k, dressing 512).</li>
      <li><b>Lighting:</b> cluster-friendly — avoid many overlapping dynamic lights; emissive+glow fakes lamps.</li>
      <li><b>Post stack:</b> one feature at a time, measured on target hardware (Ch 8's ritual).</li>
    </ul>
  </div>
  <div>
    <div class="term"><span class="dim">Rendering triage order (do in this order):</span>
1. measure: draw calls + overdraw views
2. merge/static-batch obvious repeat offenders
3. shadow casting audit (who really needs it?)
4. texture audit (2k → 1k invisible on props?)
5. transparency → scissor conversions
6. light count/placement pass
7. only then: consider LODs, occlusion, custom shaders
<span class="err">never start at 7.</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Keep a <b>perf baseline scene</b> (your worst-case level) with a logged 60-second flythrough — run it after every milestone. Regressions get caught while you still remember what changed.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Memory & Leaks", html: `
<h2>Memory management reference</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>RefCounted</b> (Resource, Thread, SceneTreeTimer…): auto-freed with last reference. The default good citizen.</li>
      <li><b>Node/Object:</b> manual — <code>queue_free()</code>; <code>free()</code> only outside physics/callbacks.</li>
      <li><b>Leak symptoms:</b> <code>Performance.OBJECT_COUNT</code> and <code>MEMORY_STATIC</code> climbing monotonic during gameplay loops.</li>
      <li><b>Leak hunts:</b> Debugger → <b>Orphan resource explorer</b> after runs; Remote tree ghost nodes; binary-search systems by enabling/disabling.</li>
      <li><b>Signals to freed nodes</b> auto-disconnect — remaining <em>stored references</em> are your leaks (<code>weakref</code> when in doubt).</li>
      <li><b>Servers/RIDs:</b> you free them (<code>RenderingServer.free_rid</code>) — server-side resources outlive nodes.</li>
    </ul>
  </div>
  <div>
<pre data-file="leak_guards.gd" data-lang="gdscript"><code># Patterns that prevent whole bug classes:

# 1) clear caches on removal
func _exit_tree() -> void:
	GameEvents.enemy_removed.disconnect(_on_foe)
	_tracked.clear()

# 2) validity checks on long-lived refs
func _on_timeout() -> void:
	if not is_instance_valid(_target):
		_target = null
		return

# 3) weakrefs for observer relationships
var _boss: WeakRef
func watch(boss: Node) -> void:
	_boss = weakref(boss)
func boss_alive() -> bool:
	return _boss.get_ref() != null

# 4) assert invariants in debug
func _ready() -> void:
	assert(not _pool.is_empty(), "prewarm first")</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Nodes & Signals vs Visual Workflows", html: `
<h2>Code, graphs, and the spectrum between</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Workflow</th><th>Best at</th><th>Weak at</th></tr>
  <tr><td>Plain GDScript</td><td>gameplay, systems, anything complex</td><td>visual preview</td></tr>
  <tr><td>Signals + editor connections</td><td>wiring, glue, designers</td><td>static analysis</td></tr>
  <tr><td>AnimationTree / tweens</td><td>state-based motion, polish</td><td>branching logic</td></tr>
  <tr><td>VisualShader</td><td>shader sketches, artists</td><td>large shaders, review</td></tr>
  <tr><td>ResourceDriven data (.tres)</td><td>content, balance, levels</td><td>imperative flows</td></tr>
  <tr><td>Visual scripting (3.x)</td><td>—</td><td><b>removed in 4.0</b></td></tr>
</table></div>
<div class="two">
  <div class="callout note"><b>ℹ Note</b><p>Godot 3's VisualScript is gone; 4.x philosophy: graphs where graphs win (animation, shaders), code where code wins (logic), data where data wins (content). This curriculum has followed exactly that split.</p></div>
  <div class="callout bp"><b>✓ Best Practice</b><p>When a system feels "graphy" (dialog trees? state flows?), prototype on paper first. Most want a data table + 50 lines of script, not a new graph framework.</p></div>
</div>
` },

{ c: 13, t: "Core GDScript API Cheat Sheet", html: `
<h2>Global functions &amp; singletons card</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Globals</th><th>Does</th></tr>
      <tr><td><code>range/clampf/lerpf/lerp_angle</code></td><td>scalar math</td></tr>
      <tr><td><code>move_toward / remap / smoothstep</code></td><td>interpolation</td></tr>
      <tr><td><code>randf/randi/randf_range / seed</code></td><td>global RNG</td></tr>
      <tr><td><code>deg_to_rad / rad_to_deg</code></td><td>angles</td></tr>
      <tr><td><code>linear_to_db / db_to_linear</code></td><td>audio</td></tr>
      <tr><td><code>print/print_rich/push_error</code></td><td>logging</td></tr>
      <tr><td><code>load / preload</code></td><td>resources</td></tr>
      <tr><td><code>weakref / instance_from_id</code></td><td>lifetimes</td></tr>
      <tr><td><code>typeof / type_string / is_instance_of</code></td><td>reflection</td></tr>
    </table></div>
  </div>
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Singleton</th><th>Domain</th></tr>
      <tr><td><code>Engine</code></td><td>fps, time_scale, features</td></tr>
      <tr><td><code>Time</code></td><td>ticks, datetime (UTC-safe)</td></tr>
      <tr><td><code>Input</code></td><td>actions, mouse mode</td></tr>
      <tr><td><code>OS</code></td><td>shell, clipboard, env</td></tr>
      <tr><td><code>Performance</code></td><td>monitors</td></tr>
      <tr><td><code>ResourceLoader</code></td><td>threaded loads</td></tr>
      <tr><td><code>RenderingServer</code> + peers</td><td>servers</td></tr>
      <tr><td><code>ClassDB / ProjectSettings</code></td><td>engine introspection</td></tr>
      <tr><td><code>TranslationServer</code></td><td>locale</td></tr>
    </table></div>
    <div class="callout note"><b>ℹ Note</b><p><code>Time.get_ticks_msec()</code> is monotonic &amp; UTC-anchored — prefer it over <code>OS.get_ticks_msec()</code> (legacy alias) in new code.</p></div>
  </div>
</div>
` },

{ c: 13, t: "String, Array & Dictionary Idioms", html: `
<h2>Container idioms — the fast set</h2>
<div class="two">
  <div>
<pre data-file="idioms.gd" data-lang="gdscript"><code># Typed everything:
var names: Array[StringName] = []
var hp_by_id: Dictionary[int, int] = {}

# Arrays:
names.append(&amp;"goblin")          # push_back
names.sort_custom(func a_b(a, b):
	return a.length() &lt; b.length())
var top3 := names.slice(0, 3)
names.shuffle()                  # global RNG!
var i := names.find(&amp;"orc")       # -1 if missing
var joined := ", ".join(names)

# Dictionaries:
for key in hp_by_id:             # keys by default
	print(key, hp_by_id[key])
hp_by_id.merge(other, false)     # no overwrite
hp_by_id.get(42, 0)              # safe default

# String escape hatch: format &amp; %:
var s := "%s hit %d dmg" % [who, dmg]
var pad := "%06d" % score        # 000123</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>Packed arrays</b> (<code>PackedVector3Array</code>…) — contiguous, lean, no per-element boxing: mesh data, hot loops.</li>
      <li><code>Array</code> of Variant — flexible; typed Array = checked + faster.</li>
      <li><b>Hashables:</b> Dictionary keys by hash — Vector2i/3i/StringName make perfect grid/spatial dicts.</li>
      <li><code>StringName</code> (<code>&amp;"idle"</code>) — interned; compare by pointer. Use for ids/actions/states compared often.</li>
      <li><code>NodePath</code> for scene references; never hand-build in hot loops.</li>
    </ul>
    <div class="callout perf"><b>⚡ Performance</b><p>Hot loop over 10k positions: <code>PackedVector3Array</code> ≈ 3–5× faster than <code>Array[Vector3]</code> — packed types are the engine's native tongue.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Async & Threads", html: `
<h2>Async patterns — await, threads, mutexes</h2>
<div class="two">
  <div>
<pre data-file="async.gd" data-lang="gdscript"><code># 1) Coroutines with await (single-threaded!):
func respawn_after(sec: float) -> void:
	await get_tree().create_timer(sec).timeout
	_do_respawn()

# await multiple:
await [a.done, b.done]      # first to finish

# 2) Real threads for heavy CPU:
var _thread := Thread.new()

func crunch_async(data: Array) -> void:
	_thread.start(_crunch.bind(data))

func _crunch(data: Array) -> void:
	var out := heavy_math(data)
	call_deferred("_done", out)

func _done(out) -> void:
	use(out)
	_thread.wait_to_finish()  # required!

# 3) Shared state → mutex or defer:
var _lock := Mutex.new()
func _tick_shared() -> void:
	_lock.lock()
	_counter += 1
	_lock.unlock()</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>await</b> = cooperative pause on the main thread — great for sequencing, useless for parallelism.</li>
      <li><b>Thread</b> rules: never touch the scene tree/servers from workers; marshal results back via <code>call_deferred</code>.</li>
      <li>Always <code>wait_to_finish()</code> before restarting/discarding a thread.</li>
      <li><b>WorkerThreadPool</b> — engine-managed task pool for batch jobs (image processing, procedural gen).</li>
      <li>Time-slicing alternative: <code>SceneTree.create_timer(0)</code> loops — "do a chunk per frame" without threads at all.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Node access from a thread = race with the main loop. If you must read, snapshot data before starting the thread; write back deferred.</p></div>
  </div>
</div>
` },

{ c: 13, t: "SceneTree Tools", html: `
<h2>SceneTree &amp; scene flow API</h2>
<div class="two">
  <div>
    <div class="tblwrap"><table class="tbl">
      <tr><th>Call</th><th>Job</th></tr>
      <tr><td><code>change_scene_to_file(p)</code></td><td>swap scenes (deferred)</td></tr>
      <tr><td><code>change_scene_to_packed(ps)</code></td><td>swap from PackedScene</td></tr>
      <tr><td><code>reload_current_scene()</code></td><td>restart</td></tr>
      <tr><td><code>create_timer(t, …)</code></td><td>SceneTreeTimer</td></tr>
      <tr><td><code>create_tween()</code></td><td>bound tweens</td></tr>
      <tr><td><code>get_nodes_in_group / call_group</code></td><td>group ops</td></tr>
      <tr><td><code>paused = true</code></td><td>process_mode-aware pause</td></tr>
      <tr><td><code>node_added/removed</code> signals</td><td>global reacts</td></tr>
    </table></div>
  </div>
  <div>
    <ul class="pts">
      <li><code>change_scene_*</code> is <b>deferred</b> — the current function keeps running! <code>return</code> right after calling it, always.</li>
      <li><b>Pause taxonomy:</b> INHERIT (default), PAUSABLE, WHEN_PAUSED, ALWAYS, DISABLED — every pause-UI bug is a mislabeled process_mode.</li>
      <li>Timers/tweens honor pause via flags (<code>create_timer(t, process_always, process_in_physics, ignore_time_scale)</code>).</li>
      <li><code>current_scene</code> — the live root gameplay scene; useful for late joins (Ch 9) and streaming (Ch 12).</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Scene flow belongs to ONE director (autoload or dedicated node): requests like <code>Events.goto(&amp;"cave")</code> — never scattered change_scene calls.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Viewport & Camera Reference", html: `
<h2>Viewports &amp; cameras</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Viewport</b> = render surface + input router + camera owner. Nested via SubViewport (Ch 12 split, minimaps, security cameras, portal mirrors).</li>
      <li><b>Camera3D:</b> <code>current</code>, <code>fov</code>, <code>near/far</code>, attributes (exposure/DOF), <code>cull_mask</code> (layer-based visibility!), environment override.</li>
      <li><b>2D in 3D:</b> SubViewport with 2D content shown on a quad's material — in-world screens.</li>
      <li><b>Project/unproject:</b> world↔screen math (Ch 8 markers) — <code>is_position_behind</code> guard.</li>
      <li><b>Stretch modes</b> (Project Settings): canvas_items (recommended) vs viewport (pixel-perfect upscale) + aspect keep/expand.</li>
    </ul>
  </div>
  <div>
<pre data-file="minimap.gd" data-lang="gdscript"><code># Minimap: SubViewport + ortho camera following:
extends SubViewport

@export var player: Node3D
@export var zoom := 40.0

func _ready() -> void:
	size = Vector2i(256, 256)

func _physics_process(_d: float) -> void:
	# Orthographic top-down, centered on player:
	var cam := get_camera_3d()
	cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	cam.size = zoom
	cam.global_position = player.global_position \
		+ Vector3.UP * 50.0
	cam.rotation = Vector3(-PI / 2, 0, 0)
	# Only the "minimap" visual layers:
	cam.cull_mask = 0b100  # layer 3 only</code></pre>
    <div class="callout deep"><b>◉ Deep Dive</b><p><b>cull_mask</b> layers double as visibility channels: put minimap-only duplicates (icons, beacon rings) on a dedicated visual layer — invisible to the main camera, drawn by the minimap's.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Groups, Resources & Ownership", html: `
<h2>Scene organization reference</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Groups:</b> persistent (scene-saved) vs runtime; <code>add_to_group("g", true)</code> persists into .tscn.</li>
      <li><b>owner</b> = which scene file a node belongs to — children added in the editor get owner; runtime-added don't (and don't save). Tool scripts must set it to persist edits.</li>
      <li><b>scene_file_path</b> on any node → where it came from; <code>get_scene_instance_state</code> for diffing.</li>
      <li><b>unique_name_in_owner</b> = the <code>%</code> mechanism; owner-scoped, not global.</li>
      <li>Debug: Remote tree + <code>print_tree_pretty()</code>.</li>
    </ul>
  </div>
  <div>
<pre data-file="organize.gd" data-lang="gdscript"><code># Tool-safe node authoring (editor plugins):
@tool
func add_marker(parent: Node3D) -> void:
	var m := Marker3D.new()
	parent.add_child(m)
	m.owner = get_tree().edited_scene_root()
	# ↑ without owner, it vanishes on save!
	m.name = "SpawnPoint_%d" % (parent.\
		get_child_count() + 1)

# Group broadcast patterns:
get_tree().call_group("enemies", "alert")
get_tree().call_group_flags(
	SceneTree.GROUP_CALL_DEFERRED,
	"enemies", "alert")

# group signal — reacts to membership itself:
get_tree().node_added.connect(
	func(n):
		if n.is_in_group("enemies"):
			_track(n))</code></pre>
  </div>
</div>
` },

{ c: 13, t: "Input System Reference", html: `
<h2>Input pipeline end-to-end</h2>
<div class="two">
  <div>
    <div class="tree"><span class="m">Event lifecycle:</span>
<span class="b">OS</span> <span class="m">→ InputEvent subclass</span>
<span class="m">→ </span><span class="b">Window</span> <span class="m">(per-window)</span>
<span class="m">→ </span><span class="b">Viewport</span>
<span class="m">→ </span><span class="b">Node._input</span> <span class="m">all nodes</span>
<span class="m">→ </span><span class="b">Control GUI</span> <span class="m">(focus, mouse)</span>
<span class="m">→ </span><span class="b">shortcuts</span>
<span class="m">→ </span><span class="b">_unhandled_input</span>
<span class="m">→ </span><span class="b">_unhandled_key_input</span>
<span class="m">→ </span><span class="b">_physics_process</span><span class="m"> polls</span>

<span class="m">set_input_as_handled() stops the chain</span></div>
  </div>
  <div>
    <ul class="pts">
      <li><b>Poll</b> (<code>Input.is_action_pressed</code>) in physics for movement; <b>events</b> (<code>_unhandled_input</code>) for discrete intents (menus, single shots).</li>
      <li><b>Mouse capture:</b> <code>Input.MOUSE_MODE_CAPTURED</code> + <code>InputEventMouseMotion.relative</code> for look (Ch 6/8).</li>
      <li><b>Touch → gesture:</b> multi-touch events in <code>_input</code>; pinch = distance delta of two touches.</li>
      <li><b>Remapping at runtime:</b> <code>InputMap.action_erase_events + action_add_event</code> — persist to user:// (Ch 12 Save).</li>
      <li><b>Echo keys:</b> <code>event.is_echo()</code> filter for held-key repeat spam.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>One input layer per project: a small autoload translating events→intents ("attack_pressed") so gameplay never touches raw InputEvents. Testability + remapping for free.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Localization & Platform", html: `
<h2>i18n &amp; platform services</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Translation workflow:</b> CSV per locale → auto-imported .translation files → <code>tr("Play")</code>; UI nodes auto-translate text.</li>
      <li><b>Pseudo-locale test:</b> <code>TranslationServer.set_locale("aa")</code> + a padded pseudo translation catches hardcoded strings &amp; layout overflow.</li>
      <li><b>OS services card:</b> <code>OS.shell_open(url)</code>, <code>OS.get_clipboard</code>, <code>OS.set_window_title</code>, <code>OS.has_feature("web")</code>.</li>
      <li><b>user:// differs per platform</b> — use <code>OS.get_user_data_dir()</code> to find it while debugging.</li>
      <li>Feature flags: <code>OS.has_feature()</code> + custom features in export presets ("demo", "steam") — one codebase, per-build behavior.</li>
    </ul>
  </div>
  <div>
<pre data-file="l10n.gd" data-lang="gdscript"><code>extends Label

func _ready() -> void:
	# key → per-locale .translation lookup:
	text = tr("PRESS_START")

	# numbers/dates respect locale:
	%Score.text = tr("%d points") % score

# CSV: strings.csv
#   keys,en,de,ja
#   PRESS_START,Press Start,Start drücken,スタート

# Export presets → add locale .translation filters;
# fallback chain: exact locale → language → keys</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Wrap ALL player-facing strings in <code>tr()</code> from the first build — retrofitting localization means finding every string twice.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Testing Strategies", html: `
<h2>Testing Godot projects</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>GUT</b> (Godot Unit Testing, AssetLib) — the community standard: scenes/scripts under test, asserts, doubles.</li>
      <li><b>Bare-bones harness</b> (zero deps): headless <code>-s test_runner.gd</code> with assert + exit codes for CI.</li>
      <li><b>Test the logic, fake the tree:</b> signal-emitting stubs (Ch 11's spies) — GameManager tested without rendering.</li>
      <li><b>Smoke tests:</b> load every scene, <code>instantiate()</code>, advance 10 frames — catches broken paths/refs instantly.</li>
      <li><b>Golden runs:</b> seeded input scripts (Ch 11 determinism) compared against saved state hashes.</li>
    </ul>
  </div>
  <div>
<pre data-file="test_runner.gd" data-lang="gdscript"><code># tools/test_runner.gd — CI with zero deps:
extends SceneTree

func _init() -> void:
	var failures := 0
	for script_path in [
		"res://tests/test_board.gd",
		"res://tests/test_save.gd",
	]:
		var s := load(script_path).new()
		s.run()
		failures += s.failures
	if failures:
		push_error("%d test(s) FAILED" % failures)
		quit(1)
	else:
		print("all green")
		quit(0)</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>CI minimum bar: <code>godot --headless --import</code> + test runner + export build. Three commands catch 90% of "works on my machine".</p></div>
  </div>
</div>
` },

{ c: 13, t: "Chapter 13 Pitfalls", html: `
<h2>Reference pitfalls — the professionals' list</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Shadowing engine methods</b><p>Script var <code>name</code>, <code>position</code>, <code>owner</code> = broken nodes. Prefix internals (<code>_name</code>) and let the linter speak.</p></div>
    <div class="callout pit"><b>⚠ heavy work in _ready</b><p>20 levels loading in _ready = launch hang. Threaded loads + progress UI (Ch 12) even for the main menu.</p></div>
    <div class="callout pit"><b>⚠ const vs preload chains</b><p>preload in const chains can create cycles (a↔b) — load lazily where possible; cycles error at parse.</p></div>
    <div class="callout pit"><b>⚠ float equality</b><p><code>0.1 + 0.2 == 0.3</code> is false. <code>is_equal_approx</code> / epsilon math everywhere; ints for game currencies.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ setget side effects in tool mode</b><p>Tool setters firing during scene load mutate saved files. Guard with <code>Engine.is_editor_hint()</code> checks inside side-effectful setters.</p></div>
    <div class="callout pit"><b>⚠ RID misuse</b><p>Double-freeing an RID or forgetting to free = crash/leak. Wrap server resources in a tiny manager class that owns lifecycle (Ch 12 style).</p></div>
    <div class="callout pit"><b>⚠ locale-dependent formats</b><p><code>str(float)</code> uses the C locale in Godot (dots) but parsing user input doesn't — validate with <code>String.is_valid_float</code>.</p></div>
  </div>
</div>
` },

{ c: 13, t: "Chapter 13 Recap", html: `
<h2>Chapter 13 — recap</h2>
<div class="two">
  <div>
    <h3>Reference shelves filled</h3>
    <ul class="pts">
      <li>Materials taxonomy; GDShader vertex/fragment/light + FX library.</li>
      <li>VisualShader conversion discipline.</li>
      <li>Lights card; shadow matrix; VoxelGI / SDFGI / LightmapGI selection.</li>
      <li>ReflectionProbes, Decals, renderer feature matrix.</li>
      <li>RenderingServer, MultiMesh crowds; import card; UV utilities.</li>
      <li>@export toolkit; custom Resources; EditorPlugins.</li>
      <li>Physics queries; Jolt migration; motion &amp; layer recipes.</li>
      <li>AudioServer mixer; profiler playbook CPU+GPU; memory rules.</li>
      <li>Async, SceneTree, viewports, input, i18n, testing.</li>
    </ul>
  </div>
  <div>
    <div class="callout note"><b>ℹ How to use this chapter</b><p>It's a desk reference — the searchable TOC (press <span class="kbd">C</span>) indexes every slide title. When a task says "I need a query/card/recipe", this chapter is the lookup, not a linear read.</p></div>
    <div class="callout ex"><b>✎ Final reference exercise</b><p>Pick any three systems you built in Parts II–III and re-implement one function each using the <em>server-level</em> API from this chapter. Note the trade-offs in a short retro.</p></div>
  </div>
</div>
` }

);
