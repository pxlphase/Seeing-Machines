# Seeing Machines

A multimodal retrieval-augmented system for exploring a personal archive of 346 generative images, built to ask a research question: **does a vision-language model read real-world meaning into images that were never meant to depict anything?**

The corpus is my own TouchDesigner work (particle simulations, 2D fluid sims, solver-based systems, noise-driven and procedural shapes). I know what generates every frame, so I can check whether the machine's reading matches what is structurally there.

- Live demo page: https://pxlphase.github.io/Seeing-Machines/
- Notebook: [`notebooks/seeing_machines.ipynb`](notebooks/seeing_machines.ipynb)

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/pxlphase/Seeing-Machines/blob/main/notebooks/seeing_machines.ipynb)

## What it does

The system is built in three levels, each reusing the previous one.

| Level | Name | What it does | Models |
|---|---|---|---|
| 1 | **Finder** | Text-to-image search with joint embeddings and cosine similarity | SigLIP 2 (`google/siglip2-base-patch16-224`); SigLIP v1 and CLIP configurable |
| 2 | **Companion** | A VLM writes a structured JSON caption per image; captions are embedded and searched; chat answers are grounded in retrieved captions | Gemma 3 4B IT (`google/gemma-3-4b-it`, 4-bit NF4), `all-MiniLM-L6-v2` |
| 3 | **Critic** | Hybrid fusion of both routes, an adjustable weight in the UI, images passed directly into the VLM context, and precision@5 evaluation on a hand-labelled gold set | all of the above |

### Caption schema

The caption separates what the model *sees* from what it *thinks the image resembles*, so the pareidolia effect can be measured rather than buried in one free-text field:

`literal_description` (visual terms only, no object names) · `perceived_subject` · `resemblance_confidence` (abstract / low / medium / high) · `composition` · `color_palette` · `texture` · `mood` · `notable_elements` · `ambiguous_or_uncertain`

### Hybrid retrieval

SigLIP 2 image-text cosine scores and sentence-embedding caption scores sit on different scales, so each route is min-max normalized across the full corpus and then fused:

```
score = alpha * siglip2_norm + (1 - alpha) * caption_norm      # alpha = 0.5 by default
```

`alpha` is exposed as a slider in a Gradio panel.

## Results

Evaluation: 20 text queries, correct images hand-labelled by me (1 to 4 per query, 41 labels in total), precision@5.

| Route | Mean P@5 | Share of the best achievable score |
|---|---|---|
| SigLIP 2 only | 0.27 | 66% |
| Captions only | 0.20 | 49% |
| **Hybrid (alpha = 0.5)** | **0.31** | **76%** |

Because no query has more than 4 correct images, the best achievable mean P@5 on this set is **0.41**, not 1.0. The right-hand column puts the scores against that ceiling.

What the per-query numbers show:

- **Fusion can add more than either route alone.** Hybrid scored 0.4 on "dark and shadowy composition", "scattered random noise" and "thin wispy strands", where the individual routes scored 0.2/0.0, 0.2/0.0 and 0.0/0.2. Each route found a different correct image, and fusion let both into the top 5.
- **Fusion can hurt.** On "cool blue tones", SigLIP 2 scored 0.6, captions 0.0 and hybrid 0.2: the weak caption route diluted a route that was already right.
- **Captions win on some queries.** On "a human figure" and "a grid or lattice structure", captions scored 0.4 against 0.0 for SigLIP 2, and hybrid matched captions.

A fixed `alpha` is therefore a compromise. Choosing it per query is the obvious next step and is not implemented here.

### Mis-seeing dossier

The notebook logs cases where the machine misreads an image, with what it said and what the image actually is. Four failure modes came up:

| Failure mode | Example |
|---|---|
| Missed resemblance | A conical, evergreen-shaped particle render was retrieved as a "tree" by SigLIP 2 but captioned as abstract, so the caption route never found it. The schema's discouragement of forced resemblances cost recall here. |
| Rationalized false resemblance | For "a galaxy or nebula", the model justified a symmetrical GLSL kaleidoscope with "radiating streaks" and "glow". |
| Mislabelled mood | A stark, high-contrast pattern was captioned "serene, contemplative", so the caption route ranked it first for "a calm and peaceful scene", ahead of genuinely calmer sunset renders. The caption route inherits the VLM's mood errors with no way to correct them at retrieval time. |
| Retrieval mismatch | "asphalt" surfaced a pastel butterfly render through incidental shared caption vocabulary; the chat model correctly declined to confirm it. |

### Multimodal grounding

Passing the retrieved images into the VLM instead of their cached captions made no difference on "a spiral or vortex shape" and a visible difference on "an explosion or burst" (these runs used three images; the final demo caps it at 2 images resized to 448 px to fit a T4). Answer quality tracked retrieval quality more than it tracked grounding mode. This is two queries, so treat it as an observation, not a measurement.

## Running it

The notebook is written for **Google Colab with a T4 GPU**. Gemma 3 4B runs in 4-bit; the SigLIP 2 and MiniLM models are small.

1. Put your images in Google Drive at `MyDrive/Corpus/` (the corpus is not included in this repo).
2. Open the notebook in Colab (badge above), choose a T4 runtime, and run top to bottom.
3. If your folder is elsewhere, change `CFG["drive_root"]` in the setup cell.
4. The first run captions every image with the VLM, which is slow. Captions, embeddings and the Hugging Face model cache are stored on Drive under `cache/`, so later runs reuse them.
5. For your own evaluation, replace `GOLD_QUERIES` in section 7.4 with your own queries and labels.

Notes:

- Seed is 42; captioning uses greedy decoding.
- The Gradio cells launch with `share=True`, which creates a public link. Change it to `share=False` if you do not want that.
- `requirements.txt` documents the dependencies for reference; in Colab the notebook installs them itself.

## Limitations

- **Small evaluation.** 20 queries and one annotator (me). Differences of 0.04 to 0.11 in mean P@5 are about one or two images and should not be read as statistically established.
- **Zero-shot throughout.** No model is fine-tuned. The captioner is a 4B model quantized to 4-bit; a larger one would likely caption differently.
- **One corpus.** 346 images from one practice, one author's eye.
- **No serving layer.** This is a research notebook, not a deployed service.

## Repository layout

```
notebooks/seeing_machines.ipynb   the full system, evaluation and write-up
requirements.txt                  dependencies
README.md
```

## AI usage

I used Claude (Anthropic) and Gemini (Google) for notebook structure, debugging, grammar and text checks, and for the GitHub Pages site (HTML/CSS/JS). The research question, the corpus and how it was curated, the caption schema, the gold-set labels and the interpretation of results were decided by me and checked against my own corpus.

## Author

Amin Rasti Pour, M.A. Design for Digital Futures, TH Nürnberg · [GitHub](https://github.com/pxlphase) · [LinkedIn](https://linkedin.com/in/amin-rasti-pour)

## License

No license has been chosen yet. The images are my own work and are not included.
