Pumpdrop — Demo Rewards Portal (Static)


A safe, read-only demo landing page inspired by crypto reward portals. It:
connects Phantom wallet (client-side only)

shows SOL balance and a basic demo eligibility label

never initiates any transaction or signature requests


Local preview


Python: python3 -m http.server 8000 -d public

Open http://localhost:8000


Deploy on Render (Static Site)


This repo includes a render.yaml blueprint for a Static Site.

Steps:
Push this repo to GitHub (done).

In Render, click New > Blueprint, point to this repo.

Render will detect render.yaml. Confirm and deploy.


Alternatively, create a Static Site manually:
Publish directory: public

Build command: empty (no build)


