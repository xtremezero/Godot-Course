/* Chapter 03 — Introduction to 3D and the Godot Engine (28 slides) */
window.DECK = window.DECK || [];
window.DECK.push(

{ c: 3, t: "Chapter 03 — Introduction to 3D", cover: true, html: `
<div class="cov-part">Part I · Foundations &amp; Quickstart</div>
<div class="cov-n">03</div>
<h1>Introduction to 3D &amp; the Godot Engine</h1>
<p class="cov-sub">Coordinate systems, vector math, meshes and mesh instances, PBR materials — then the engine itself: MainLoop, the scene tree, servers, nodes, and signals.</p>
<div class="chips">
  <span class="tag">Right-handed Y-up</span><span class="tag">Vector3 math</span>
  <span class="tag">Meshes &amp; MeshInstance3D</span><span class="tag">StandardMaterial3D / ORM</span>
  <span class="tag">MainLoop · Servers · Scene Tree</span>
</div>
<div class="cov-nav">→ to begin</div>
` },

{ c: 3, t: "Coordinate System: Right-Handed, Y-Up", html: `
<h2>Godot's coordinate system</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Godot is <b>right-handed</b> with <b>Y pointing up</b>: +X right, +Y up, +Z <b>toward the viewer</b> (out of the screen).</li>
      <li>Hand rule: fingers curl from +X to +Y, thumb points +Z. Cross products and rotations follow this handedness everywhere.</li>
      <li>Rotation is in <b>radians</b>, and property <code>rotation</code> is Euler (X-pitch, Y-yaw, Z-roll) — handy for humans, treacherous beyond single-axis use.</li>
      <li>Why it matters: Blender/OpenGL match this; Unreal is left-handed Z-up; Unity is left-handed Y-up. Converters exist — but know your axes when porting code.</li>
      <li><b>1 unit = 1 meter</b> by convention. Gravity (9.8), physics tuning, and audio falloff all assume it.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">        +Y ┌─────────────┐</span>
<span class="m">           │ ▲           │</span>
<span class="m">           │ │           │</span>
<span class="m"> +X ◄──────┼─┴───► -X    │   Godot viewport:</span>
<span class="m">           │             │   +Z comes OUT of the</span>
<span class="m">           ▼             │   screen toward you.</span>
<span class="m">          -Y             │</span>
<span class="m">                          │   Right-handed, Y-up.</span>

<span class="m"># Node3D basis columns:</span>
<span class="b">transform.basis.x</span> <span class="m">→ local right  (+X)</span>
<span class="b">transform.basis.y</span> <span class="m">→ local up     (+Y)</span>
<span class="b">transform.basis.z</span> <span class="m">→ local back   (+Z)</span>
<span class="m"># "forward" is therefore </span><span class="y">-basis.z</span></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>"Forward" in Godot is <b>−Z</b>, not +Z. <code>look_at()</code>, cameras, and imported characters all face −Z. Half of all "my character looks backwards" bugs live here.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Vectors: The Atoms of 3D", html: `
<h2>Vector3 — the workhorse</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>A <code>Vector3</code> is 3 floats — used as a <b>point</b> (position), a <b>direction</b> (normalized), or a <b>scale</b>.</li>
      <li><code>length()</code>, <code>normalized()</code> (safe: zero vector → zero), <code>distance_to()</code>, <code>direction_to()</code>.</li>
      <li><b>Dot product</b> <code>a.dot(b)</code>: how aligned two directions are — <b>1 same, 0 perpendicular, −1 opposite</b>. Powers facing checks, FOV cones, lambert lighting.</li>
      <li><b>Cross product</b> <code>a.cross(b)</code>: perpendicular vector, length = parallelogram area. Powers "which side", torque axes, normals.</li>
      <li>Lerp everything: <code>lerp(a, b, t)</code> (linear), <code>move_toward(a, b, d)</code> (constant speed).</li>
    </ul>
  </div>
  <div>
<pre data-file="vector_lab.gd" data-lang="gdscript"><code>extends Node3D

func _ready() -> void:
	var a := Vector3(1, 0, 0)
	var b := Vector3(0, 1, 0)

	print(a.dot(b))        # 0  → perpendicular
	print(a.cross(b))      # (0, 0, 1) → +Z by right-hand rule

	# Is an enemy in front of us? (forward = -basis.z)
	var to_enemy := (enemy.position - position).normalized()
	var facing := -transform.basis.z
	var in_front := facing.dot(to_enemy) &gt; 0.5  # ~60° cone

	# Constant-speed approach without frame-rate coupling:
	position = position.move_toward(enemy.position, 5.0 * 3.0)</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p><code>Vector3</code> is a <b>value type</b> (packed floats) — passing/assigning copies 12 bytes, no allocation, no GC pressure. Vector math in GDScript is genuinely fast; use it freely.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Transforms: Basis + Origin", html: `
<h2>Transform3D — position, rotation and scale as one matrix</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li>A <code>Transform3D</code> = <b>Basis</b> (3×3 rotation/scale) + <b>Origin</b> (translation). It answers two questions: "where is this frame?" and "how is it oriented?"</li>
      <li>Basis columns are the object's <b>local axes in parent space</b>: <code>basis.x/y/z</code>. Scale hides as column length: <code>basis.get_scale()</code>.</li>
      <li><b>Local vs global:</b> <code>position</code> is relative to the parent; <code>global_position</code> is world-space. Same for transforms.</li>
      <li>Compose with confidence: child transform × parent transform = global. Godot does this for you — until you mix spaces carelessly.</li>
      <li><code>transform.basis * v</code> transforms a local vector to parent space; <code>to_local()</code> / <code>to_global()</code> convert points.</li>
    </ul>
  </div>
  <div>
<pre data-file="transform_demo.gd" data-lang="gdscript"><code>extends Node3D

func _ready() -> void:
	# Euler (human-friendly) → Basis (stable):
	rotation = Vector3(deg_to_rad(-15.0), deg_to_rad(45.0), 0.0)

	# Facing helpers:
	look_at(Vector3(0, 0, 0), Vector3.UP)  # face target
	# look_at with zero distance = error → guard it.

	# Spaces:
	var local_point := Vector3(0, 1, -2)
	var world_point := to_global(local_point)
	var back := to_local(world_point)      # == local_point

	# Move 3 units along *our own* forward (-Z):
	global_position += -global_transform.basis.z * 3.0</code></pre>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Nested scaled parents: a 90°-rotated child inside a non-uniformly scaled parent <b>shears</b>. Never apply non-uniform scale to ancestors of rotated nodes — bake scale into meshes instead.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Node3D: The 3D Node", html: `
<h2>Node3D — everything 3D descends from it</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>Node3D</code> adds a 3D <code>Transform</code> + gizmos + spatial methods. <code>MeshInstance3D</code>, lights, physics bodies, <code>Camera3D</code> — all grandchildren of Node3D.</li>
      <li>Common API: <code>position/rotation/scale</code>, <code>global_transform</code>, <code>look_at()</code>, <code>translate_object_local()</code>, <code>rotate_y()</code>, <code>get_parent()</code>, <code>top_level</code> (ignore parent transform).</li>
      <li><b>Hierarchy = transform inheritance.</b> Reparenting a node under another changes its world position unless you compensate.</li>
      <li><code>visible</code> hides the whole subtree; <code>process_mode</code> pauses it; <code>owner</code> controls scene-file membership.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="b">Node</span>
<span class="m">└──</span><span class="b">Node3D</span> <span class="m">(transform)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">VisualInstance3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">MeshInstance3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">GPUParticles3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">Light3D</span> <span class="m">(→ Directional/Omni/Spot)</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">CollisionObject3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">StaticBody3D</span> · <span class="b">RigidBody3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp;&nbsp; ├──</span><span class="b">CharacterBody3D</span> · <span class="b">AnimatableBody3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; │&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">Area3D</span>
<span class="m">&nbsp;&nbsp;&nbsp;&nbsp; └──</span><span class="b">Camera3D</span> · <span class="b">Skeleton3D</span> · <span class="b">Path3D</span> …</div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Use plain <code>Node3D</code> as a free "transform group" — pivot rigs, camera arms, attach points. It costs nothing and keeps hierarchy readable.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Meshes: The Data of Shape", html: `
<h2>What a mesh actually is</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li>A mesh is <b>arrays of vertex data</b> + an <b>index buffer</b> + per-surface material:
        <ul>
          <li><b>POSITION</b> — Vector3 per vertex</li>
          <li><b>NORMAL</b> — unit vector, drives lighting</li>
          <li><b>UV / UV2</b> — texture coordinates</li>
          <li><b>COLOR, TANGENT, BONES/WEIGHTS</b> (skinning)</li>
        </ul></li>
      <li>Triangles are indexed triples of vertices — shared vertices save memory and give smooth normals.</li>
      <li><b>Winding order</b> (default: counter-clockwise when viewed from outside) defines the front face; backfaces are culled.</li>
      <li>A mesh can hold <b>multiple surfaces</b>, each with its own material — one draw call per surface per pass.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Vertex arrays</b>positions · normals · UVs (+ optional)</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Index buffer</b>which vertices form each triangle</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Surface</b>array set + primitive type + material</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Mesh resource</b>uploaded to GPU as a VBO/IBO</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p><b>ArrayMesh</b> is the generic mesh resource; <b>PrimitiveMesh</b> subclasses (Box, Sphere…) generate their arrays procedurally on demand. Both feed the same GPU path — a BoxMesh is not "cheaper magic", it's just fewer triangles.</p></div>
  </div>
</div>
` },

{ c: 3, t: "PrimitiveMesh Family", html: `
<h2>PrimitiveMesh — built-in procedural meshes</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Primitive</th><th>Key properties</th><th>Typical use</th></tr>
  <tr><td><code>BoxMesh</code></td><td>size (w/h/d)</td><td>crates, blockout, triggers</td></tr>
  <tr><td><code>SphereMesh</code></td><td>radius, height, radial/latitude rings</td><td>balls, planets, hit spheres</td></tr>
  <tr><td><code>PlaneMesh</code></td><td>size, subdivide (adds verts)</td><td>floors, water, tiling</td></tr>
  <tr><td><code>QuadMesh</code></td><td>size</td><td>billboards, UI in 3D</td></tr>
  <tr><td><code>CylinderMesh</code></td><td>top/bottom radius, height</td><td>barrels, pipes, columns</td></tr>
  <tr><td><code>CapsuleMesh</code></td><td>radius, height (cylinder part)</td><td>character proxies</td></tr>
  <tr><td><code>TorusMesh</code></td><td>inner/outer radius</td><td>rings, wheels</td></tr>
  <tr><td><code>TextMesh</code></td><td>text, font, depth, curve steps</td><td>3D signage, titles</td></tr>
  <tr><td><code>TubeSurfaceMesh</code>, <code>PointPathMesh</code>…</td><td>path-driven</td><td>rivers, wires, ribbons</td></tr>
</table></div>
<div class="two">
  <div class="callout perf"><b>⚡ Performance</b><p>PrimitiveMeshes generate at load on a worker thread — negligible for hundreds of instances. For thousands, share <b>one</b> mesh resource across MeshInstances (or a MultiMesh — Ch 13).</p></div>
  <div class="callout bp"><b>✓ Best Practice</b><p>Blockout your whole game with primitives first (Ch 5). Art direction before gameplay is the classic trap.</p></div>
</div>
` },

{ c: 3, t: "Building Meshes in Code", html: `
<h2>Generating geometry: SurfaceTool &amp; ArrayMesh</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><code>SurfaceTool</code> streams vertices in order, then commits to an <code>ArrayMesh</code>.</li>
      <li>Set per-vertex attributes <em>before</em> <code>add_vertex()</code> — they attach to the next vertex.</li>
      <li><code>generate_normals()</code> computes smooth normals from winding; <code>generate_tangents()</code> for normal mapping.</li>
      <li>Alternatively, fill a <code>PackedVector3Array</code>-based <code>Array</code> and call <code>ArrayMesh.add_surface_from_arrays()</code> directly.</li>
    </ul>
  </div>
  <div>
<pre data-file="build_mesh.gd" data-lang="gdscript"><code>extends MeshInstance3D

func _ready() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)

	# Two triangles = one upward quad on XZ plane.
	var v := 1.0
	st.set_uv(Vector2(0, 0))
	st.add_vertex(Vector3(-v, 0, -v))
	st.set_uv(Vector2(1, 0))
	st.add_vertex(Vector3( v, 0, -v))
	st.set_uv(Vector2(0, 1))
	st.add_vertex(Vector3(-v, 0,  v))
	# Second tri completes the quad (CCW from above).
	st.set_uv(Vector2(1, 0))
	st.add_vertex(Vector3( v, 0, -v))
	st.set_uv(Vector2(1, 1))
	st.add_vertex(Vector3( v, 0,  v))
	st.set_uv(Vector2(0, 1))
	st.add_vertex(Vector3(-v, 0,  v))

	st.generate_normals()      # from winding order
	mesh = st.commit()         # → ArrayMesh, auto-uploaded</code></pre>
  </div>
</div>
<div class="callout pit"><b>⚠ Common Pitfall</b><p>Invisible generated mesh? 9 times out of 10 the winding is clockwise → all faces culled. Either flip vertex order or set material <code>cull_mode = DISABLED</code> while debugging.</p></div>
` },

{ c: 3, t: "MeshInstance3D & Mesh Data Tools", html: `
<h2>MeshInstance3D — meshes in the scene</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><code>MeshInstance3D</code> = a <b>Transform</b> + a <b>Mesh resource</b> + optional per-surface material overrides. It's the visible thing.</li>
      <li><b>Share the mesh, not the instance:</b> 100 MeshInstances can reference one mesh → 1 GPU buffer, 100 cheap draw submissions.</li>
      <li>Override materials per-instance (materials array / <code>surface_material_override/0</code>) — great for "flash red" damage tints. See Ch 6 &amp; 12.</li>
      <li>Inspect mesh data at runtime with <code>MeshDataTool</code> (read/edit arrays post-commit) or <code>create_trimesh_shape()</code> for collision.</li>
      <li><b>LOD</b>: assign <code>visibility_range</code> / <code>visibility_range_fade_mode</code> to auto-swap distant meshes — used heavily in Ch 12.</li>
    </ul>
  </div>
  <div>
<pre data-file="mesh_facts.gd" data-lang="gdscript"><code>extends MeshInstance3D

func _ready() -> void:
	var m: Mesh = mesh
	var faces := m.get_faces()           # PackedVector3Array
	print("surface count: ", m.get_surface_count())
	var aabb: AABB = m.get_aabb()        # local bounds
	print("size: ", aabb.size)

	# Cheap distance culling / LOD:
	visibility_range_end = 120.0    # hide beyond 120 m
	visibility_range_end_margin = 8.0
	visibility_range_fade_mode = \
		MeshInstance3D.FADE_MODE_DITHER</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>Draw calls cost CPU, not GPU. Fewer surfaces/materials = fewer draw calls. Chapter 13's MultiMesh slides push this to drawing 10,000 blades of grass in ~1 call.</p></div>
  </div>
</div>
` },

{ c: 3, t: "StandardMaterial3D — PBR Overview", html: `
<h2>StandardMaterial3D — PBR without shaders</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>Physically Based Rendering: one consistent lighting model — <b>albedo, metallic, roughness</b> (+ emission, normal, AO…) — so materials look right in <em>any</em> light.</li>
      <li><b>Albedo:</b> base color/texture. No baked lighting.</li>
      <li><b>Metallic:</b> 0 = dielectric, 1 = metal; texture = smoothness maps (gloss packed in METALLIC_TEXTURE channel).</li>
      <li><b>Roughness:</b> 0 mirror → 1 matte. The single most important slider for "expensive" vs "cheap" looks.</li>
      <li><b>Emission:</b> unlit glow color; feeds bloom with glow enabled.</li>
      <li><b>Normal map:</b> fakes small-scale surface detail without geometry.</li>
    </ul>
  </div>
  <div>
    <h3>Texture slots you'll actually use</h3>
    <table class="tbl">
      <tr><th>Slot</th><th>SRGB?</th><th>Purpose</th></tr>
      <tr><td>Albedo</td><td>Yes</td><td>base color</td></tr>
      <tr><td>Metallic</td><td>No</td><td>metal + gloss in B/A</td></tr>
      <tr><td>Roughness</td><td>No</td><td>microsurface</td></tr>
      <tr><td>Emission</td><td>Yes</td><td>self-light</td></tr>
      <tr><td>Normal</td><td>No</td><td>surface relief</td></tr>
      <tr><td>AO</td><td>No</td><td>crevice occlusion</td></tr>
    </table>
    <div class="callout bp"><b>✓ Best Practice</b><p>Calibrate with the middle path first: roughness ~0.5–0.8, metallic 0. Most "looks wrong" materials are roughness at extreme values.</p></div>
  </div>
</div>
` },

{ c: 3, t: "PBR: How Lighting Uses Your Data", html: `
<h2>Under the PBR hood (just enough math)</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li>Surface shading ≈ <b>BRDF</b>: how much light reflects from direction <b>L</b> toward the eye <b>V</b>.</li>
      <li>Split into <b>diffuse</b> (scattered; matte color) + <b>specular</b> (mirror bounce; sharp highlights).</li>
      <li>Roughness statistically blurs the specular lobe — microfacets, not blur textures.</li>
      <li>Metals tint specular by albedo and (nearly) kill diffuse; dielectrics reflect ~4% white specular plus diffuse.</li>
      <li>Godot implements Cook-Torrance-style BRDF (GGX distribution, Smith visibility, Schlick Fresnel) in its spatial shaders — identical math across renderers.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>Light ray</b>direction L, color, energy</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>BRDF(L, V, N, roughness, metallic)</b>diffuse + specular lobes</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>Pixels out</b>albedo × sum of all light contributions</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>The <b>light()</b> shader function (Ch 13) lets you modify every light's contribution per-pixel — the same hook the engine uses internally. If you can read that function's signature, renderer talks stop being magic.</p></div>
  </div>
</div>
` },

{ c: 3, t: "ORM Texture Workflow", html: `
<h2>ORM — the packed texture convention</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>ORM = Occlusion · Roughness · Metallic</b> packed into one texture's <b>R · G · B</b> channels. One file instead of three grayscales.</li>
      <li>Why: fewer samplers, fewer files, better compression (block compression loves grayscale channels), standard from Substance/Marmoset/Blender exports.</li>
      <li>In StandardMaterial3D: assign the same ORM texture to <b>AO</b>, <b>Roughness</b>, <b>Metallic</b> slots — set channel selectors to use R / G / B respectively.</li>
      <li><b>ORMMaterial3D</b> is a sibling of StandardMaterial3D with dedicated ORM slots — that's its whole difference.</li>
      <li>Import ORM as <b>non-color (linear)</b> data — uncheck sRGB detection in import settings.</li>
    </ul>
  </div>
  <div>
    <div class="tree"><span class="m">ORM texture channel map</span>
<span class="y">R</span> <span class="m">→ Ambient Occlusion</span>
<span class="g">G</span> <span class="m">→ Roughness</span>   <span class="m">(white = rough)</span>
<span class="b">B</span> <span class="m">→ Metallic</span>    <span class="m">(white = metal)</span>
<span class="m">A</span> <span class="m">→ free (often height/detail mask)</span>

<span class="m">Material hookup (StandardMaterial3D):</span>
<span class="m">ao_texture        = </span><span class="y">orm.png</span><span class="m">  (R)</span>
<span class="m">roughness_texture = </span><span class="y">orm.png</span><span class="m">  (G)</span>
<span class="m">metallic_texture  = </span><span class="y">orm.png</span><span class="m">  (B)</span></div>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Channels reversed (metallic roughness = "MRG" in some tools' exports)? Symptom: wet-looking metal that's matte when it should shine. Always verify against a known material before blaming lighting.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Material Features Tour", html: `
<h2>StandardMaterial3D — the toggles that matter</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Group</th><th>Option</th><th>When to use</th></tr>
  <tr><td rowspan="3">Transparency</td><td>Alpha Scissor</td><td>hard-cut foliage (alpha_test, depth-safe)</td></tr>
  <tr><td>Alpha blend / premul</td><td>glass, holograms (sorted, no shadows by default)</td></tr>
  <tr><td>Depth draw / render priority</td><td>control overdraw artifacts</td></tr>
  <tr><td rowspan="2">Shading</td><td>Unshaded</td><td>UI in 3D, baked sprites, debug markers</td></tr>
  <tr><td>Per-Vertex</td><td>stylized low-poly lighting</td></tr>
  <tr><td rowspan="3">Geometry</td><td>Cull: Back/Front/Disabled</td><td>double-sided cloth, inside-out volumes</td></tr>
  <tr><td>Triplanar</td><td>texture rocks/cliffs without UVs (Ch 5)</td></tr>
  <tr><td>Billboard</td><td>particles, imposters, fake volume</td></tr>
  <tr><td rowspan="2">Lighting fx</td><td>Rim, Clearcoat,anisotropy</td><td>car paint, hair, styled highlights</td></tr>
  <tr><td>Subsurface scattering</td><td>wax, skin, leaves</td></tr>
  <tr><td>Effects</td><td>Grow / Distort (vertex)</td><td>cheap stylized outlines/foam</td></tr>
</table></div>
<div class="callout perf"><b>⚡ Performance</b><p>Every enabled feature is shader permutations, not runtime cost alone — but transparency (blend) disables early-Z and costs heavy overdraw. Prefer <b>alpha scissor</b> wherever you can accept a hard edge.</p></div>
` },

{ c: 3, t: "MainLoop & SceneTree Architecture", html: `
<h2>How the engine runs your game</h2>
<div class="twoL">
  <div>
    <ul class="pts">
      <li><code>OS.main_loop</code> is the engine's heartbeat: <code>initialize()</code>, <code>process(delta)</code> per frame, <code>finalize()</code>.</li>
      <li><b>SceneTree extends MainLoop</b> — it owns the node tree, the servers, and the frame phases. 99.9% of games never replace it (you can, via Project Settings).</li>
      <li>Each frame: input → physics ticks (0 or more) → process → scene tree flush (adds/removes/deferred) → draw.</li>
      <li><b>Servers</b> (Rendering/Physics/Audio/Navigation) are the engine's worker layer — SceneTree nodes are their friendly, inspector-friendly face.</li>
    </ul>
  </div>
  <div>
    <div class="flow flow-col">
      <div class="fbox"><b>OS / platform layer</b>window, events, files</div>
      <div class="arr">↓</div>
      <div class="fbox acc"><b>MainLoop → SceneTree</b>frame orchestration</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Node tree</b>your scenes &amp; scripts</div>
      <div class="arr">↓</div>
      <div class="fbox"><b>Servers</b>Rendering · Physics · Audio · Navigation</div>
    </div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Rendering/Physics servers can be driven <em>directly</em>, bypassing nodes entirely — the API behind crowds, object pools, and dedicated-server builds. Fully covered in Chapter 13.</p></div>
  </div>
</div>
` },

{ c: 3, t: "The Scene Tree: Order of Operations", html: `
<h2>Node lifecycle — the exact order</h2>
<div class="two">
  <div>
    <ol class="steps">
      <li><code>_init()</code> — constructor. No parent, no siblings. Assign defaults; don't touch the tree.</li>
      <li><code>_enter_tree()</code> — node entered the tree (before children enter).</li>
      <li><code>_ready()</code> — node + <b>all children</b> ready. Build references, connect, start logic. Runs once.</li>
      <li><code>_process(delta)</code> — per rendered frame (variable rate).</li>
      <li><code>_physics_process(delta)</code> — per physics tick (fixed 60/s default; Project Settings).</li>
      <li><code>_exit_tree()</code> — leaving. Disconnect signals, free resources.</li>
    </ol>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p><code>_ready</code> order is <b>children first</b> (depth-first, bottom-up). A parent reading a child's exported state in <code>_ready</code> is fine; a child initializing from its <em>parent</em> in <code>_ready</code> is a race — pass data down explicitly instead.</p></div>
  </div>
  <div>
    <div class="tree"><span class="m">Parent</span>
<span class="m">├── _enter_tree()</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ┌─ </span><span class="g">Child _enter_tree()</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; ├─ </span><span class="g">Child _ready()      ← first!</span>
<span class="m">│&nbsp;&nbsp;&nbsp;&nbsp; └─ </span><span class="g">Child _process()</span>
<span class="m">├── _ready()               ← after children</span>
<span class="m">└── _process()</span>

<span class="m">Frame (60+ Hz):  _process</span>
<span class="m">Physics (fixed): _physics_process</span>
<span class="m">Deferred calls flush between them.</span></div>
    <div class="callout bp"><b>✓ Best Practice</b><p>Rule of thumb: anything reading <code>Input</code>/forces/collisions belongs in <code>_physics_process</code>; anything visual-only (camera smoothing, UI) in <code>_process</code>.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Servers: The Engine's Real Muscles", html: `
<h2>Servers — headless-capable engine cores</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Server</th><th>Owns</th><th>Node facade</th><th>Direct-use scenario</th></tr>
  <tr><td><code>RenderingServer</code></td><td>draw lists, meshes, materials, viewports</td><td>MeshInstance3D, Camera3D…</td><td>MultiMesh crowds, dynamic textures</td></tr>
  <tr><td><code>PhysicsServer3D</code></td><td>bodies, shapes, spaces, queries</td><td>*Body3D, Area3D</td><td>hundreds of bullets; server-only games</td></tr>
  <tr><td><code>PhysicsServer2D</code></td><td>2D equivalent</td><td>*Body2D, Area2D</td><td>2D pooling</td></tr>
  <tr><td><code>AudioServer</code></td><td>buses, voices, effects</td><td>AudioStreamPlayer*</td><td>bus routing, DSP (Ch 8)</td></tr>
  <tr><td><code>NavigationServer3D</code></td><td>navmaps, regions, agents</td><td>NavigationAgent3D</td><td>async pathfinding</td></tr>
  <tr><td><code>TextServerManager</code></td><td>fonts/shaping</td><td>Label, Font</td><td>rich text pipelines</td></tr>
</table></div>
<div class="two">
  <div class="callout deep"><b>◉ Deep Dive</b><p>Servers are <b>thread-safe-ish APIs over RIDs</b>. An RID (Resource ID) is a handle to server-side state. Node wrappers exist for editor integration &amp; signals; the server objects can outlive and outrun them.</p></div>
  <div class="callout perf"><b>⚡ Performance</b><p>A dedicated server build (headless) runs the same servers minus RenderingServer output — the backbone of Ch 9's multiplayer servers and CI bots.</p></div>
</div>
` },

{ c: 3, t: "Scene = Data + Behavior", html: `
<h2>Scenes, resources, scripts — the trinity</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>Nodes</b> are behavior+structure ( timers, bodies, sprites ). <b>Resources</b> are data (textures, meshes, materials, curves, custom stats). <b>Scripts</b> attach behavior to either.</li>
      <li>Resources are <b>shared by reference</b>. Two nodes holding the same material see each other's edits. <code>duplicate()</code> / <code>Resource.duplicate(true)</code> when you need copies.</li>
      <li>Save any resource to disk as <code>.tres</code> (text) or binary <code>.res</code> — drag it anywhere in any project.</li>
      <li><b>Custom resources</b> (<code>class_name ItemData extends Resource</code>) become your data-driven item/level databases — Ch 12 &amp; 13 lean on this hard.</li>
    </ul>
  </div>
  <div>
<pre data-file="item_data.gd" data-lang="gdscript"><code># A data-only class — appears in the "Create Resource" dialog
class_name ItemData
extends Resource

@export var display_name: StringName
@export var icon: Texture2D
@export_multiline var description: String
@export var stackable := false
@export_range(1, 999) var max_stack := 1
@export var effects: Dictionary[String, float] = {}</code></pre>
<pre data-file="loot.gd" data-lang="gdscript"><code># .tres files become drop-in loot entries:
# [gd_resource type="ItemData" ...]
# display_name = "Ancient Pumpkin Seed"
# stackable = true, max_stack = 64</code></pre>
  </div>
</div>
` },

{ c: 3, t: "Signals: Decoupled Communication", html: `
<h2>Signals — Godot's observer pattern</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li>A signal is a <b>typed broadcast</b>: emitters don't know who listens. This is how you keep systems decoupled.</li>
      <li>Built-ins everywhere: <code>pressed</code>, <code>body_entered</code>, <code>animation_finished</code>, <code>timeout</code>…</li>
      <li>Connect via Inspector (visual) or code with <b>Callables</b>: <code>signal.connect(fn)</code>; disconnect with <code>disconnect</code>; <code>await my_signal</code> suspends until fired.</li>
      <li>Declare your own: <code>signal health_changed(new_value: int)</code> — typed args show up in the editor.</li>
    </ul>
    <div class="callout bp"><b>✓ Best Practice</b><p>Signal <b>upward</b> (children notify parents), call <b>downward</b> (parents command children), and use an autoload <b>event bus</b> for cross-cutting events (score, game over). Never hard-wire distant nodes with <code>get_node("../../..")</code>.</p></div>
  </div>
  <div>
<pre data-file="health.gd" data-lang="gdscript"><code>class_name Health
extends Node

signal damaged(current: int, amount: int)
signal died
signal health_changed(current: int, max: int)

@export var max_health := 100 : set = _set_max
var current := 100

func take_hit(amount: int) -> void:
	current = maxf(current - amount, 0)
	damaged.emit(current, amount)
	health_changed.emit(current, max_health)
	if current == 0:
		died.emit()</code></pre>
<pre data-file="hud.gd" data-lang="gdscript"><code># Consumer — knows nothing about emitters:
func _ready() -> void:
	var hp: Health = %PlayerHealth
	hp.health_changed.connect(_on_hp)
	hp.died.connect(func(): %GameOver.show())

func _on_hp(cur: int, mx: int) -> void:
	%Bar.value = float(cur) / float(mx) * 100.0</code></pre>
  </div>
</div>
` },

{ c: 3, t: "Signals: Mechanics & Patterns", html: `
<h2>Connect flags, await, one-shots</h2>
<div class="two">
  <div>
<pre data-file="signal_patterns.gd" data-lang="gdscript"><code>extends Node

func _ready() -> void:
	var timer: Timer = $Cooldown

	# 1) Classic connect
	timer.timeout.connect(_on_timeout)

	# 2) Fire once, then auto-disconnect
	timer.timeout.connect(_once,
		CONNECT_ONE_SHOT)

	# 3) Deferred — runs at end of frame,
	#    safe inside physics callbacks/teardown
	timer.timeout.connect(_later, CONNECT_DEFERRED)

	# 4) Inline lambdas for glue
	timer.timeout.connect(
		func(): print("cooldown done"))

	# 5) await — coroutine style
	await timer.timeout
	print("resumed after first timeout")

func _on_timeout() -> void: pass
func _once() -> void: pass
func _later() -> void: pass</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><b>CONNECT_DEFERRED</b> matters when the emitter might be freed in the same callback (e.g. hitting an enemy that <code>queue_free()</code>s itself).</li>
      <li><b>await</b> turns async flows (timers, animations, network) into readable straight-line code — but the function suspends; callers must know.</li>
      <li>Lambdas capture by value — beware late-binding surprises; bind explicitly with <code>fn.bind(args)</code>.</li>
      <li>Signal connections to freed objects are auto-cleaned (Connection is tied to instance lifetime) — one of Godot's nicest safety nets.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p>Connecting in <code>_ready</code> of a node that gets re-instanced duplicates the connection on reused scenes. Use <code>CONNECT_ONE_SHOT</code>, guard with <code>is_connected()</code>, or connect in <em>one</em> owner.</p></div>
  </div>
</div>
` },

{ c: 3, t: "GDScript Essentials I: Types & Exports", html: `
<h2>GDScript essentials — types &amp; exports</h2>
<div class="twoR">
  <div>
    <ul class="pts">
      <li><b>Always type:</b> <code>var speed := 8.0</code>, <code>func hit(dmg: int) -&gt; void:</code>. The editor autocomplete, the type checker (5–10× more errors caught at parse), and optimized bytecode all improve.</li>
      <li><code>const</code> for compile-time constants; <code>@export</code> pushes variables into the Inspector with full typing.</li>
      <li>Typed arrays &amp; dictionaries: <code>Array[PackedScene]</code>, <code>Dictionary[String, int]</code>.</li>
      <li><code>static</code> functions/variables live on the class, not instances — your free utility library.</li>
    </ul>
  </div>
  <div>
<pre data-file="exports.gd" data-lang="gdscript"><code>class_name Turret
extends Node3D

# --- The export toolkit ---
@export var damage := 10                      # number field
@export_range(0.1, 5.0, 0.1) var fire_rate := 1.0
@export var targeting_mode: TargetMode = TargetMode.NEAREST
@export_file("*.tscn") var projectile_scene_path: String
@export var projectile: PackedScene           # drag &amp; drop
@export_node_path("Area3D") var sensor_path: NodePath
@export_group("Debug", "debug_")
@export var debug_draw := false

enum TargetMode { NEAREST, FIRST, STRONGEST }

static func aim_at(a: Node3D, b: Node3D) -> Vector3:
	# Static utility — call as Turret.aim_at(...)
	return a.global_position.direction_to(b.global_position)</code></pre>
  </div>
</div>
` },

{ c: 3, t: "GDScript Essentials II: Tree Access", html: `
<h2>Getting nodes &amp; navigating the tree</h2>
<div class="two">
  <div>
<pre data-file="tree_access.gd" data-lang="gdscript"><code>extends Node3D

# Runs after children ready — the safe time to cache:
@onready var gun := $Rig/Gun          # relative path
@onready var spawn := %BulletSpawn    # scene-unique name

func _ready() -> void:
	# %names work from ANYWHERE in the scene:
	# right-click node → "Access as Scene Unique Name"
	var hud := %HUD

	# Lazy alternatives:
	var anim := get_node_or_null("Rig/Anim")
	var any_turret := get_tree().get_first_node_in_group("turrets")

	# Groups — cheap tags with mass-ops:
	add_to_group("enemies")
	get_tree().call_group("enemies", "alert", self)

	# Walking up:
	var player := get_owner()          # scene root of this .tscn
	# ...and across:
	var scene := get_tree().current_scene</code></pre>
  </div>
  <div>
    <ul class="pts">
      <li><code>$Path</code> = <code>get_node("Path")</code>; <code>%Name</code> = scene-unique lookup. Prefer <code>%</code> — it survives hierarchy refactors.</li>
      <li>Cache in <code>@onready</code> — <code>get_node</code> is a hashmap walk; per-frame lookups are waste.</li>
      <li><b>Groups</b> are your dynamic collections: membership survives instancing, works across scenes, and powers <code>call_group</code> broadcasts.</li>
      <li><code>get_tree()</code> = the SceneTree (frame timers, scene changes, group ops). <code>get_owner()</code> = the scene root — crucial inside nested instances.</li>
    </ul>
    <div class="callout pit"><b>⚠ Common Pitfall</b><p><code>$Gun</code> in a member initializer (<code>var gun = $Gun</code> without <code>@onready</code>) runs <em>before</em> the node is in the tree → crash. This is the #1 beginner error in Godot 4.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Object Lifetime & Memory", html: `
<h2>Memory: RefCounted vs Object, free() vs queue_free()</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li><b>RefCounted</b> (and <code>Resource</code>, <code>Vector</code>…): automatic ref-counting. Last reference gone → freed. Assign &amp; pass freely.</li>
      <li><b>Object / Node</b>: manual lifetime. You must <code>free()</code> or <code>queue_free()</code> nodes or they leak until exit.</li>
      <li><code>free()</code> = immediate (illegal during physics/callbacks on in-use objects). <code>queue_free()</code> = end-of-frame, always safe — default choice.</li>
      <li><code>is_instance_valid(x)</code> guards stale references; signals auto-disconnect from freed objects, but <em>your</em> stored references dangle.</li>
      <li>Strings/arrays/dicts: copy-on-write value semantics — cheap until modified.</li>
    </ul>
  </div>
  <div>
<pre data-file="lifetime.gd" data-lang="gdscript"><code>extends Node

var _target: Node3D = null

func attack_then_clear(node: Node3D) -> void:
	_target = node
	# ... later, in some callback:
	if is_instance_valid(_target):
		_target.queue_free()
		_target = null     # drop the stale handle too!

# RefCounted — no frees needed:
var res := preload("res://items/seed.tres")
var copy := res.duplicate(true)   # deep copy</code></pre>
    <div class="callout perf"><b>⚡ Performance</b><p>Spawning/destroying hundreds of nodes per second? That's allocation churn — <b>object pooling</b> (Ch 6) recycles instances instead of queue_freeing them.</p></div>
    <div class="callout deep"><b>◉ Deep Dive</b><p>Nodes are not RefCounted <em>because</em> a parent owns children — ref-counting nodes would create ambiguous ownership cycles. The tree <em>is</em> the ownership model.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Debugging the Running Game", html: `
<h2>Debugging: the running scene tree &amp; beyond</h2>
<div class="two">
  <div>
    <ul class="pts">
      <li>While the game runs, the <b>Scene dock's "Remote" tab</b> shows the <em>live</em> tree — inspect real transforms, children, everything.</li>
      <li><b>Debugger panel</b>: stack traces on errors, live inspector, monitors (FPS, objects, video memory), and the profiler record button.</li>
      <li><code>print()</code> liberally; <code>push_warning/push_error</code> for structured issues; <code>assert(cond)</code> dies only in debug builds.</li>
      <li>Visual debug: <b>Perspective ▸ Display Advanced…</b> — wireframe, overdraw, shadow atlases. Physics shapes: Debug ▸ Visible Collision Shapes.</li>
    </ul>
  </div>
  <div>
<pre data-file="debug_helpers.gd" data-lang="gdscript"><code>extends Node3D

func _ready() -> void:
	# Structured logging
	print_debug("spawned at ", global_position)
	push_warning("spawn point inside a wall")
	assert(is_inside_tree(), "must be in tree")

	# Frame-cost tracing — shows in profiler
	EngineProfiler  # (custom profilers, see docs)

func _process(_d: float) -> void:
	if OS.is_debug_build():
		%DebugLabel.text = "FPS %d" % Engine.get_frames_per_second()</code></pre>
    <div class="callout bp"><b>✓ Best Practice</b><p>Debug overlays (FPS, state name, last hit) behind <code>OS.is_debug_build()</code> ship silently in release builds. Build the habit in Chapter 5's HUD.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Nodes vs Alternatives: Design Map", html: `
<h2>Choosing your architecture tools</h2>
<div class="tblwrap"><table class="tbl">
  <tr><th>Need</th><th>Reach for</th><th>Avoid</th></tr>
  <tr><td>Reused composite object</td><td>Scene instancing</td><td>copy-pasted node groups</td></tr>
  <tr><td>Parent↔child notification</td><td>signals upward, calls downward</td><td>direct cross-references</td></tr>
  <tr><td>Global state/services</td><td>autoload singletons, event bus</td><td>static-everything God objects</td></tr>
  <tr><td>Data definitions</td><td>custom Resources (.tres)</td><td>dictionaries-of-dictionaries</td></tr>
  <tr><td>Many similar entities</td><td>instancing + pooling (Ch 6)</td><td>per-entity unique nodes</td></tr>
  <tr><td>State machines</td><td>enum FSM → node HFSM (Ch 12)</td><td>giant match statements</td></tr>
  <tr><td>Behavior composition</td><td>small single-purpose nodes</td><td>deep script inheritance</td></tr>
</table></div>
<div class="two">
  <div class="callout bp"><b>✓ Best Practice</b><p>Inheritance question? Ask "is-a <em>data variant</em> of" — Goblin <em>is an</em> Enemy (scene inheritance, Ch 12). Everything else: compose.</p></div>
  <div class="callout deep"><b>◉ Deep Dive</b><p>Script inheritance still has its place — shared <em>behavior</em> for nodes of the same base class. The anti-pattern is inheriting to <em>reuse one function</em>: that's what static utils and autoloads are for.</p></div>
</div>
` },

{ c: 3, t: "Chapter 03 Pitfalls", html: `
<h2>Chapter 03 — pitfall roundup</h2>
<div class="two">
  <div>
    <div class="callout pit"><b>⚠ Mixed degrees and radians</b><p>Everything in code is radians. <code>deg_to_rad()</code> on every Euler you type. Symptom: rotations 57× too small or too big.</p></div>
    <div class="callout pit"><b>⚠ Editing shared resources at runtime</b><p>Changing a material at runtime edits the shared resource — every user changes, and (in editor) the change can persist into the .tres. Duplicate first when you mean "mine only".</p></div>
    <div class="callout pit"><b>⚠ _process vs _physics_process mixing</b><p>Reading <code>Input.is_action_just_pressed</code> in <code>_process</code> can double-fire or skip during physics ticks. Input semantics live with physics; camera reads state in _process.</p></div>
  </div>
  <div>
    <div class="callout pit"><b>⚠ Node paths as strings everywhere</b><p>Refactors silently break <code>get_node("../../Gun")</code>. Scene-unique names (<code>%</code>) + <code>@onready</code> caching = refactor-proof.</p></div>
    <div class="callout pit"><b>⚠ Forgetting parent transform</b><p>Setting <code>position</code> on a child of a rotated/scaled parent gives surprising world results. Think in the parent's frame, or set <code>global_position</code>.</p></div>
    <div class="callout pit"><b>⚠ Treating nodes as data</b><p>Adding invisible nodes to "store" stats creates tree bloat and slow lookups. Stats are Resources; nodes are behavior.</p></div>
  </div>
</div>
` },

{ c: 3, t: "Chapter 03 Exercises", html: `
<h2>Exercises — Introduction to 3D</h2>
<div class="stack">
  <div class="callout ex"><b>✎ Ex 3.1 — Vector gym</b><p>Script that draws (print) for two bodies: distance, normalized direction, whether B is in a 90° cone in front of A, and A's local-space position of B. Verify by moving nodes in Remote view while running.</p></div>
  <div class="callout ex"><b>✎ Ex 3.2 — Procedural tetrahedron</b><p>Build a valid tetrahedron with SurfaceTool (4 verts, 4 faces, correct CCW winding, smooth normals). Then color each vertex differently with <code>set_color</code> and enable <b>Vertex Color → Use as Albedo</b>.</p></div>
  <div class="callout ex"><b>✎ Ex 3.3 — Signal chain</b><p>Three nodes: <code>Timer</code> → <code>Spawner</code> (custom <code>spawned(node)</code> signal) → <code>Counter</code>. Zero direct references from Timer to Counter. Add a second listener to prove decoupling.</p></div>
  <div class="callout ex"><b>✎ Ex 3.4 — Resource database</b><p>Define <code>WeaponData extends Resource</code> (damage, fire rate, projectile scene). Author 2 <code>.tres</code> weapons; one <code>Turret</code> script consumes either. Swap by Inspector drag — no code edits.</p></div>
</div>
` },

{ c: 3, t: "Chapter 03 Recap", html: `
<h2>Chapter 03 — recap</h2>
<div class="two">
  <div>
    <h3>You can now explain</h3>
    <ul class="pts">
      <li>RH Y-up axes, −Z forward, 1 unit = 1 m.</li>
      <li>Vector3 algebra: dot/cross/lerp/normalize — and what each is <em>for</em>.</li>
      <li>Transform3D = basis + origin; local vs global space.</li>
      <li>Mesh = vertex arrays + indices + surfaces; winding &amp; normals.</li>
      <li>PBR inputs (albedo/metal/rough/ORM) and how lighting consumes them.</li>
      <li>SceneTree frame order; node lifecycle; process vs physics_process.</li>
      <li>Servers as the engine's core; nodes as facades.</li>
      <li>Signals, groups, exports, RefCounted vs Node lifetime.</li>
    </ul>
  </div>
  <div>
    <h3>Next up</h3>
    <ul class="pts">
      <li><b>Chapter 4</b> — the editor &amp; asset pipeline: glTF/Blender workflows, import docks, project settings, and the version-control-safe way to collaborate.</li>
      <li>Then Part II begins: real games, starting with <b>Pumpkin Run</b>.</li>
    </ul>
    <div class="callout note"><b>ℹ Note</b><p>Everything from here on assumes Chapter 3 fluency — especially signals, typed GDScript, and transforms. Revisit any shaky slide before starting Chapter 5.</p></div>
  </div>
</div>
` }

);
