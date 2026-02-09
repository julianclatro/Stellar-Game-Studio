# Project Overview: ZK Detective Frontend Assets

This directory (`/public/assets`) contains all the visual assets for the `zk-detective-frontend` game, developed as part of the Stellar Game Studio's `zk-gaming-hackathon` project. These assets are primarily SVG files generated using an AI image model (specifically, the Gemini 2.5 Flash Image model, referred to as "Nano Banana") based on meticulously crafted text prompts.

The overall aesthetic is a "dark noir detective illustration" style, featuring ink linework with muted watercolor washes, a consistent color palette, and a 1920s murder mystery atmosphere with moody lighting and strong shadows.

## Key Files and Directories:

*   **`PROMPTS.md`**: This Markdown file serves as the primary specification for all visual assets. It details the "Style Anchor" (a consistent prefix for all image generation prompts), categorizes the assets into "Phase 0: Style Seeking" (for testing the visual style) and "Phase 1: Production Assets," and provides a comprehensive checklist of all required images with their intended filenames, sizes, and any special attributes (e.g., "KEY EVIDENCE").
*   **`PROMPTS.fountain`**: A screenplay-formatted document that mirrors the content of `PROMPTS.md` but structures the image generation prompts in a narrative flow. It explicitly defines the "Style Anchor" and includes metadata for each asset, such as `file`, `size`, `game_id`, `zk_id`, `key` (indicating key evidence), and `suspect` (linking clues to characters). This file is used to organize and automate the generation process for visual consistency.
*   **`clues/`**: Contains SVG icons representing various in-game clues that the player can discover. Examples include `perfume-bottle.svg`, `fingerprints.svg`, `torn-letter.svg`, etc.
*   **`rooms/`**: Contains SVG illustrations of different locations within the Meridian Manor, such as `bedroom.svg`, `kitchen.svg`, `study.svg`, `lounge.svg`, and `garden.svg`. These serve as the backdrops for gameplay.
*   **`suspects/`**: Stores SVG portraits of the game's suspects, each designed to fit the noir aesthetic. Examples include `celeste.svg`, `elena.svg`, `isabelle.svg`, etc.
*   **`title/`**: Holds the SVG asset for the game's title screen, specifically `manor-exterior.svg`.
*   **`weapons/`**: Contains SVG icons for potential murder weapons, like `candlestick.svg`, `kitchen-knife.svg`, `poison-vial.svg`, etc.

## Usage:

These assets are integral to the `zk-detective-frontend` game, providing the visual interface for the player. They are loaded and displayed to represent:

*   **Game Environments**: The `rooms/` illustrations define the scenes where the detective investigates.
*   **Characters**: The `suspects/` portraits are used when interacting with or identifying potential culprits.
*   **Interactive Elements**: The `clues/` and `weapons/` icons are interactive elements that players can examine to gather evidence.
*   **Title Screen**: `title/manor-exterior.svg` provides the initial visual experience of the game.

The detailed prompts within `PROMPTS.md` and `PROMPTS.fountain` ensure that any new or regenerated assets strictly adhere to the game's established visual style, making it easy to maintain consistency and expand the game's content. The embedded metadata in `PROMPTS.fountain` (`game_id`, `zk_id`, `key`, `suspect`) suggests a programmatic integration of these assets with the game's logic, likely for tracking evidence, suspect relationships, and potentially supporting zero-knowledge proof mechanisms for game state verification.