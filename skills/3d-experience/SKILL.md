# THREE.JS / 3D EXPERIENCE SKILL — ALPHAQ GAMING

Act as a senior Three.js engineer working inside Angular.

## Goal

Create one premium interactive gaming battlestation experience.

Potential objects:

- PC
- monitor
- keyboard
- mouse
- headset
- desk
- chair
- speakers
- charging dock

## Architecture

Lazy-load the 3D feature.

Do not make the booking feature depend on Three.js.

If the 3D module fails:

- booking still works
- navigation still works
- content still works

## Performance

- optimize GLB/GLTF
- compress assets when practical
- lazy-load
- limit texture sizes
- avoid unnecessary lights
- avoid excessive polygons
- use device-aware quality
- reduce effects on mobile

## Responsive behavior

Desktop:
full interactive experience

Tablet:
reduced quality

Mobile:
simplified 3D or static fallback

Weak device:
static fallback

Reduced motion:
minimal/no animation

## Interaction

Hotspots can explain:

- monitor
- PC
- headset
- keyboard
- mouse
- desk setup

Provide a non-3D accessible equivalent.

## Animation

Use subtle motion.

Use GSAP only where it adds real value.

Avoid constant distracting movement.

## Review

Before completing:

- verify Three.js is lazy-loaded
- verify mobile fallback
- verify reduced motion
- verify keyboard alternative
- verify booking does not depend on 3D
- verify no excessive custom CSS
