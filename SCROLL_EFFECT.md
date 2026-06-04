# Parallax Scrolling Effect Documentation

This document describes the implementation of the parallax scrolling effect used in the application. The effect is built using **React** and **Framer Motion** (`motion/react`).

## 1. Core Architecture

The application uses a "sticky-scroll" pattern where a single container provides the scrollable height, while the content remains fixed or sticky in the viewport.

- **Container Height**: The main wrapper has a height of `800vh` (`h-[800vh]`), creating a long scrollable track.
- **Sticky Viewport**: Inside the container, a `sticky top-0 h-screen` div holds all the visual elements. This ensures the UI stays visible as the user scrolls through the 800vh track.
- **Scroll Tracking**: `useScroll` from Framer Motion tracks the progress of the container from `0` (top) to `1` (bottom).

```tsx
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end end"]
});
```

## 2. Hero Section Transition

The Hero section (headline, description, buttons) disappears almost immediately as the user starts scrolling.

- **Range**: `[0, 0.05]` (The first 5% of the total scroll).
- **Effects**:
  - **Opacity**: Fades from `1` to `0`.
  - **Scale**: Scales from `1` to `1.1`.
  - **Y-Offset**: Moves up by `5vh`.
  - **Blur**: Increases from `0px` to `10px`.
  - **Display**: Sets to `none` after `0.06` to prevent interaction with hidden elements.

## 3. Project Tiles (The Parallax Sequence)

The core of the experience is the sequence of project tiles that fly in and out.

### Timing Logic
Each tile has a specific "window" of the scroll progress where it is active. This is calculated based on its index:

- `total`: Number of projects (e.g., 7).
- `step`: `0.75 / total` (The portion of the scroll dedicated to each project, leaving some buffer).
- `center`: `0.15 + (index * step)` (The point where the tile is perfectly centered and scaled at 1).
- `start`: `center - step * 1.15` (When the tile starts appearing).
- `end`: `center + step * 0.85` (When the tile has fully flown past).

### Animations
Within its active range `[start, center, end]`, the tile undergoes several transformations:

1.  **Scale**: `[0.3, 1, 3.5]`
    - Starts small, hits full size at `center`, then grows massive as it "passes" the camera.
2.  **Opacity**: `[0, 1, 1, 1, 0]`
    - Fades in quickly at the start and fades out at the very end.
3.  **Horizontal Position (X)**:
    - **Even Index**: Slides from `-5vw` to `-32vw` to `-100vw`.
    - **Odd Index**: Slides from `5vw` to `32vw` to `100vw`.
    - This creates a staggered, dynamic feel.
4.  **Z-Index**: `Math.round(scale * 100)`
    - Ensures that tiles appearing "closer" (larger scale) are rendered on top of tiles further away.

## 4. Background Effects

The background also reacts to the scroll to enhance the depth:

- **Canvas Waves**: The `WaveBackground` zooms in up to 4x (`1 + currentScroll * 3`) and fades out as the user scrolls deeper.
- **Gradient Blobs**: The soft background circles scale up and fade out within the first 25% of the scroll.

## 5. Summary of Values

| Element | Scroll Range | Primary Effect |
| :--- | :--- | :--- |
| **Hero** | `0.0` → `0.05` | Fade out & Blur |
| **Tile 1** | `~0.03` → `~0.25` | Fly-through |
| **Tile N** | `Staggered` | Fly-through |
| **Background** | `0.0` → `1.0` | Zoom & Deep Fade |

This system allows for a highly controlled, cinematic "fly-through" experience where each element's lifecycle is tied directly to the user's scroll position.
