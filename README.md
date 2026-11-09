# Nihal portfolio — reference replica

A static recreation of [ingrassiadaniel.it](https://ingrassiadaniel.it/), prepared on November 8, 2026. The opening particle portrait now uses Nihal's supplied photos, and the location chapter shows India. The content, nine project case studies, education, certificates and contact links are personalized for Nihal Shaikh.

## Preview

On Windows, double-click `START-PREVIEW.cmd`, then visit **http://127.0.0.1:5175**. Keep its command window open while viewing the site. Close that window to stop the preview.

Alternatively, from this folder:

```sh
python -m http.server 5175 --bind 127.0.0.1
```

Use an HTTP server; opening `index.html` directly as a `file://` URL blocks JavaScript modules and particle-data requests in browsers.

## GitHub Pages

1. Upload the **contents** of this folder to a repository, including `.nojekyll`, `assets`, `css`, `js`, `projects`, and `vendor`.
2. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select the branch and **/(root)**, and save.
3. Open the Pages URL GitHub provides. All internal asset URLs and project links are relative, including on `username.github.io/repository-name/`.

These settings follow [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

No Node.js installation, npm build, PHP, database, framework server, or API key is needed. The downloadable archive excludes research and QA files. This project has not been pushed or published to GitHub.

## Files to edit

- `index.html`: homepage text, email, LinkedIn, footer, and monogram.
- `projects/*.html`: standalone project descriptions and contact details.
- `cookie-policy.html`: storage and hosting information.
- `js/projects.js`: gallery titles, years, video filenames, and project metadata.
- `js/scene.js`: Three.js particle setup, morph timing, pointer response, and camera movement.
- `js/shaders.js`: portrait/India/neural-network/data-tunnel/contact particle shaders.
- `js/main.js`: preloader, text reveals, horizontal gallery, contact hover, cursor, and navigation.
- `js/video-plane.js`: video-texture plane deformation.
- `css/style.css`: reference typography and layout, with readable class names.
- `css/enhancements.css`: static-site additions, focus indicators, and mobile adjustments.
- `assets/portrait.bin`: Nihal's photo-derived particle portrait; `assets/india.bin`: the generated India silhouette. Their provenance is recorded in `assets/PORTRAIT-SOURCE.txt` and `assets/INDIA-SOURCE.txt`.

The homepage uses 44,000 particles on desktop and 22,000 on coarse-pointer devices. It includes a first-visit intro, scroll-driven morphs, four animated video cards, local project pages, a contact particle outline, hover particles, and a cursor trail. Reduced-motion preferences skip the intro and disable CSS reveal animations; scroll still selects particle shapes. WebGL-unavailable devices receive a static 2D particle portrait.

## Dependencies and reference material

Three.js **0.185.0**, Bootstrap **5.3.8** utilities, and Lenis **1.3.26** are bundled locally in `vendor`, with their MIT licenses. Bootstrap's flex utilities support the layout without adding a global reset that would change the reference's appearance. The Inter Tight font, point-cloud data, noise texture, favicon, video demonstrations, layout, and shader behavior come from the supplied reference website. Font information: [Inter Tight](https://github.com/google/fonts/tree/main/ofl/intertight).

The implementation uses readable HTML/CSS and vanilla JavaScript modules with Three.js. It does not need the reference's Next.js/React server or CMS. The reference Cloudflare analytics beacons are omitted, and the local policy reflects that. No external runtime asset CDN is required; external contact and project destinations open only when clicked.

The main visual sequence closely follows the reference. Video-plane motion, contact hover particles, page transitions, and the static project detail layouts are reimplemented and may differ slightly from the live original. The source website can change after the date above.

The location chapter now morphs into India and displays “Based in India,” replacing the reference’s Italy shape.

## Nihal portrait

The portrait uses the more centered second photo for its broad hair shape, eyes, nose, lips, jaw, moustache and beard. Aligned landmarks from all four references contribute subtle depth. Approximately 28,000 of the 44,000 morph particles are visible in the portrait, with soft photographic cues and extra sampling around the main features. Pore-level contrast is removed. Hair, temples, face and neck share one continuous, shallow surface to avoid a detached hair layer or hard facial edge during turns. The result suggests Nihal through dots; it is not a full 360-degree scan.

The existing formation, pointer movement, and scroll choreography are retained. All 44,000 particles return for later morphs. The spare eighth byte of each portrait record preserves the original particle brightness for India, neural-network and contact shapes. Even dot sizes and gentler pointer highlighting apply only during the portrait chapter. The India point cloud is unchanged.

Raw reference photographs, ML models and local preprocessing dependencies live only in ignored development files and are excluded from the downloadable site. The published site needs only its local JavaScript and binary assets.

## Color palette

Matte black `#0A0A0B`, white `#FFFFFF`, antique gold `#D8A47F`, and restrained burgundy `#8B0000`. CSS variables in `css/style.css` supply the palette to the interface and `js/palette.js`, which feeds the canvas and Three.js colors. Particles and letter dots remain white at rest. The cursor and hover particles use a restrained red (#EF4444), with a soft localized falloff and no added exposure. Gold remains the interface accent. Geometry, animation timing and the India map are unchanged.

The globe chapter and rotating “Working globally / Available everywhere” labels have been removed. The introduction now morphs directly into India; later chapter timings move forward by one viewport.

## Location and education

The India chapter highlights Karnataka with a glowing gold outline and a state-only label. Education shows J.N.N. College of Engineering (currently studying Robotics and AI), Sri Aurobindo Pre-University College in Javalli, and Podar International School. No education dates or grades are inferred.

The map and education now share one chapter: a left-map/right-education layout on desktop, with education stacked immediately below the map within the same chapter on narrow screens.

## Processor assembly and tech stack
The 4.5-viewport sticky chapter displays five named, keyboard-accessible tabs containing all supplied skills, including ROS. Scroll progress controls both the active category and eight independent metallic hardware layers: base/contact layers, circuit boards, copper internals, central chip, and lid. Assembly finishes at 90% progress and holds before the gallery; backward scrolling reverses it. Clicking the final tab targets 97%.

`js/processor.js` builds the local Three.js geometry and materials, handles its responsive renderer, and shares one normalized scroll timeline with tab selection. Reduced motion uses stable milestones. No remote models, textures, APIs or new libraries are required. The particle robot is removed; the portrait, India and gold Karnataka outline are retained.

The processor is rendered entirely as sampled white particles with subtle gold circuitry and red pointer highlights. Component geometry is sampled in layer-local coordinates so the original scroll assembly is preserved.

## Continuous India-to-processor morph
The processor publishes its animated particle destinations in viewport coordinates. The main portrait/India cloud interpolates its existing particles into those destinations over the chapter entry; reverse scrolling restores the map. Only the main particle renderer draws this transition, avoiding overlapping map and processor canvases.

Processor readability: deliberate square rims, orthogonal traces, clear perimeter pins and a particle CPU marking replace noisy microgeometry sampling. Per-point strength separates bright structural edges from quiet surfaces. The shared map morph and assembly timeline remain intact.

Gallery navigation: a normal-flow horizontal rail supports Previous/Next buttons, mouse dragging, touch swiping and Left/Right/Home/End keys. Vertical scrolling moves directly past the gallery without traversing all projects. The closing message holds in a sticky 160-viewport-percent section before Certificates (115% with reduced motion).

Tech stack presentation: numbered category rail and two-column skill rows replace boxed tabs and chips. A compact footer shows assembly progress, with a wrapping category grid on mobile. All five categories, skills, and scroll timing are preserved.

Processor-to-work transition: a shared reversible scroll timeline fades the toolkit text, disperses the assembled CPU particles along a staggered arc, and raises/fades in the first project cards. The CPU is fully hidden behind the gallery; reduced motion uses a short state change. No extra spacer is added.

FinSight AI replaces the Michael London gallery slot. Repository-reviewed copy distinguishes the current Flask foundation from planned analytics/ML features. Landing and dashboard screenshots were captured through the in-app browser from locally rendered original templates; provenance is in `assets/finsight/SOURCE.txt`. Other project slots are unchanged.

Certificates: six supplied documents appear in a responsive section between Selected Works and Contact. Each card uses a locally stored preview and opens the original supplied URL in a new tab. Previews were reviewed/exported through the in-app browser; the MongoDB PDF preview is a clean browser capture. Links and titles are recorded in `assets/certificates/SOURCE.json`.

Contact hub: LinkedIn, GitHub and Gmail are direct icon links in one row on every page. Gmail opens its web composer; no message is sent. There is no popover or exposed email heading. The particle outline follows the compact hub.

Personal projects gallery: all nine supplied Nihal repositories replace the reference-site projects. FinSight retains its actual interface captures. The other cards use explicitly identified, locally generated SVG project covers, with repository-reviewed descriptions and honest development-stage labels. The hotel case study also contains a captured source chart. Research used the in-app browser only.

Homepage résumé: the link below Nihal Shaikh opens `resume.html`, with a responsive image preview rendered from the supplied `assets/Nihal Shaikh Resume.pdf`. Visitors can download the original PDF from that preview. The favicon is a local NS monogram in SVG, with ICO and PNG alternatives.

Case studies use lightweight local canvas particle circuits beside their sections, with scroll-linked positions, red pointer response, gold section highlights and reduced-motion support. Shared footer monograms now read NS on every page. MongoDB uses the user-supplied completion certificate image.
