# Mental Arithmetic - Finger Math Visualization

## Concept & Vision

A warm, child-friendly web app for teaching Finger Math (จินตคณิต) visualization. Children see animated hands showing finger positions for numbers, with step-by-step animated calculations. The app feels like a friendly teacher demonstrating on a digital blackboard — clear, colorful, and engaging for young learners.

## Design Language

**Aesthetic:** Playful educational — rounded shapes, soft shadows, bright but not garish colors. Inspired by children's educational apps.

**Color Palette:**
- Primary: `#FF6B6B` (coral red for emphasis)
- Secondary: `#4ECDC4` (teal for accents)
- Background: `#FFF9F0` (warm cream)
- Hand skin: `#FFEAA7` (light warm skin tone)
- Hand outline: `#E17055` (warm brown outline)
- Text: `#2D3436` (dark gray)
- Number display: `#6C5CE7` (purple)

**Typography:**
- Headings: `Prompt` (Thai-friendly, rounded)
- Numbers: `Fredoka One` (playful, bold)
- Body: `Prompt`

**Motion:**
- Finger movements: 300ms spring easing with slight overshoot
- Number changes: scale pulse 150ms
- Calculation steps: fade + slide 400ms staggered

## Layout & Structure

```
┌─────────────────────────────────────────────┐
│  🧮 จินตคณิต Finger Math                     │
├─────────────────────────────────────────────┤
│                                             │
│    ┌─────────┐         ┌─────────┐         │
│    │  LEFT   │         │  RIGHT  │         │
│    │  HAND   │         │  HAND   │         │
│    │ (Tens)  │         │ (Units) │         │
│    └─────────┘         └─────────┘         │
│                                             │
│         ┌───────────────────┐              │
│         │   NUMBER: 27      │              │
│         └───────────────────┘              │
│                                             │
│    [0] [1] [2] [3] ... [9] [+5] [-3]      │
│                                             │
│         ════════════════════               │
│         Step-by-step animation area        │
│         ════════════════════               │
│                                             │
└─────────────────────────────────────────────┘
```

## Features & Interactions

### 1. Hand Visualization
- Two hands displayed side by side (left = tens, right = units)
- 5 fingers per hand: thumb, index, middle, ring, pinky
- Each finger clearly shows UP/DOWN state with color change
- Labels showing which hand represents what place value

### 2. Number Input
- Number buttons 0-9 to set the current number
- Display shows current number prominently
- When number changes, fingers animate to correct positions

### 3. Finger Math Rules
**Right hand (units 0-9):**
- Thumb = 5
- Index = 6 (5+1)
- Middle = 7 (5+2)
- Ring = 8 (5+3)
- Pinky = 9 (5+4)
- Fingers 1-4 on right = 1, 2, 3, 4

**Left hand (tens 0-90):**
- Same pattern, multiplied by 10

### 4. Animated Calculations
- Input: 23 + 15
- Steps shown one at a time:
  1. Show 23 (left: 2, right: 3)
  2. Animate adding 15 step by step
  3. Final result: 38
- Each step pauses 1.5 seconds for learning

### 5. Practice Mode
- Random number display
- Student thinks, then tap to reveal answer
- Encouraging messages on correct answers

## Component Inventory

### Hand Component
- 5 finger buttons arranged anatomically
- States: finger down (default), finger up (active)
- Down: `#FFEAA7` with `#E17055` outline
- Up: `#FF6B6B` fill with `#E17055` outline
- Smooth transition on state change

### Number Display
- Large centered number in `Fredoka One`
- Purple background pill shape
- Scale animation on value change

### Operation Buttons
- Rounded rectangle buttons
- Primary: coral red background
- Secondary: teal background
- Hover: slight lift shadow
- Active: pressed state

### Step Display
- Shows calculation steps in boxes
- Current step highlighted
- Previous steps dimmed
- Arrow connectors between steps

## Technical Approach

- Single HTML file with embedded CSS and JavaScript
- No external dependencies except Google Fonts
- CSS animations for finger movements
- JavaScript for state management and calculation logic
- Responsive design for tablets (primary use case in classroom)
