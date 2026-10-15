# Mis-Seeing Dossier — Level 2 (Text-Only)

## Entry 1: Query — "asphalt"

**Issue Type:** retrieval mismatch

**Model said:** chat answer: 'I cannot confirm that any of these images depict asphalt'

**Actually is:** a pastel-colored butterfly render, no textural or color relation to asphalt

**Analysis:** Caption-mediated retrieval for 'asphalt' surfaced this butterfly render at rank 5, unrelated to any of the genuinely granular dark textures found elsewhere. Likely matched on incidental shared caption vocabulary rather than visual similarity, since nothing about a pastel butterfly resembles asphalt. Worth noting the chat model itself stayed honest and refused to confirm any image as asphalt when asked directly.

## Entry 2: Query — "tree"

**Issue Type:** missed resemblance

**Model said:** captioned as abstract, no clear resemblance noted; chat explicitly denied any tree resemblance

**Actually is:** a clearly tree-shaped particle render, conical evergreen silhouette

**Analysis:** SigLIP2 correctly retrieved this as a tree purely from visual silhouette (conical, tapering, evergreen-like branch structure). The caption route missed it entirely: the captioning model described it as abstract geometric/particle structure with no noted resemblance, so no caption text existed for the query 'tree' to match against. My schema deliberately discourages forcing resemblances to avoid false positives elsewhere, which cost recall here on an obvious real case.

## Entry 3: Query — "a galaxy or nebula"

**Issue Type:** rationalized false resemblance

**Model said:** 'radiating streaks and dense fields... somewhat similar to how light and gas flow in nebulae'

**Actually is:** a symmetrical geometric kaleidoscope shader, not a cosmic or celestial form

**Analysis:** For 'a galaxy or nebula,' caption-mediated retrieval surfaced this GlSL shader, and rather than rejecting the match the model stretched to justify it, citing 'radiating streaks,' 'luminous,' and 'glow' as vague evidence of a cosmic resemblance. These are words shared with genuine nebula-like renders in the corpus, but a symmetrical mandala bears no real visual resemblance to a galaxy. Different failure mode than the tree case: here the model overreaches instead of underclaiming.

## Entry 4: Query — "a calm and peaceful scene"

**Issue Type:** mislabeled mood

**Model said:** 'serene, contemplative, slightly melancholic, with a hint of warmth'

**Actually is:** a stark, high-contrast symmetrical pattern with no calm but melancholic visual qualities

**Analysis:** This high-contrast, aggressive pattern was captioned with the mood 'serene, contemplative' which doesn't match what's visually there. Caption-mediated retrieval trusted that mood label for the query 'a calm and peaceful scene' and ranked this image first, ahead of genuinely calmer sunset renders elsewhere in the corpus, and also surfaced two visually chaotic fire-toned images for the same reason. Shows the caption route inherits whatever mood-reading errors the VLM made at captioning time, with no way to correct for it at retrieval time.
