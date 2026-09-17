"""
Optional LLM-written auditor briefs for Claims Anomaly Radar.

The statistics decide what is anomalous; the model only turns a structured
evidence packet into a short, well-organised brief for a human reviewer.
Used by `python claims_radar.py --llm` (requires the `anthropic` package and
an ANTHROPIC_API_KEY or an `ant auth login` profile). Any failure falls back
to the deterministic template brief so the pipeline never depends on the API.
"""
from __future__ import annotations

import json
import os

# Current Anthropic model ID (Claude Opus 5, 2026). Override with CLAIMS_RADAR_MODEL if needed.
MODEL = os.environ.get("CLAIMS_RADAR_MODEL", "claude-opus-5")

SYSTEM = (
    "You are a payment-integrity analyst writing for a clinical auditor. You receive a JSON evidence "
    "packet produced by statistical detectors on SYNTHETIC claims data. Write a brief of at most 120 "
    "words with exactly these labelled lines: 'Provider', 'Primary pattern', 'Supporting evidence', "
    "'Governing policy', 'Disposition', 'Suggested next step', 'Caveat'. Use only facts that appear in the packet; "
    "do not assert fraud or intent, and state that a human reviewer makes the determination."
)


def write_brief(packet: dict) -> tuple[str, str]:
    """Return (brief, source) where source is 'llm' or 'template' (fallback if anything goes wrong)."""
    fallback = (packet["brief"], "template")
    try:
        import anthropic
    except ImportError:
        print("  [note] anthropic package not installed - using template brief (pip install anthropic)")
        return fallback
    evidence = {k: packet[k] for k in ("provider_id", "specialty", "rank", "n_detectors", "evidence",
                                       "policy_source", "required_evidence", "disposition")}
    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM,
            messages=[{"role": "user", "content": "Evidence packet:\n" + json.dumps(evidence, indent=2)}],
        )
    except anthropic.RateLimitError:
        print("  [note] rate limited - using template brief")
        return fallback
    except anthropic.APIStatusError as e:
        print(f"  [note] API error {e.status_code} - using template brief")
        return fallback
    except anthropic.APIConnectionError:
        print("  [note] network error - using template brief")
        return fallback
    except Exception as e:  # credentials or client construction problems must also fall back
        print(f"  [note] {type(e).__name__} - using template brief")
        return fallback
    if response.stop_reason == "refusal":
        return fallback
    text = "".join(block.text for block in response.content if block.type == "text").strip()
    return (text, "llm") if text else fallback
