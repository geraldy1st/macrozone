#!/usr/bin/env python3
"""Summarise a `maestro hierarchy` JSON dump for the APK pass report.

Usage: hier-summary.py <hierarchy.json>
Prints one line per element of interest (testID, selected, text, bounds) and which
screen markers are present, so the selected state of the tabs can be read in the log.
"""
import json
import re
import sys

IDS = [
    "home-tab", "all-meals-tab", "add-meals-tab", "community-tab", "profile-tab",
    "journal-history-btn", "toggle-edit-mode", "delete-selected-btn", "welcome-guest-btn",
]
MARKERS = {
    "all-meals-screen": re.compile(r"^(Tous les repas|All Meals|Todas las comidas)$"),
    "welcome-screen": re.compile(r"(Continuer en tant qu'invité|Continue as guest|Continuar como invitado)"),
}


def descendant_texts(node, limit=3):
    out = []
    stack = list(node.get("children") or [])
    while stack and len(out) < limit:
        child = stack.pop(0)
        if not isinstance(child, dict):
            continue
        attrs = child.get("attributes") or {}
        text = attrs.get("text") or attrs.get("accessibilityText") or ""
        if text:
            out.append(text)
        stack.extend(child.get("children") or [])
    return out


def walk(node, out):
    if isinstance(node, dict):
        out.append(node)
        for child in node.get("children") or []:
            walk(child, out)


def main():
    raw = open(sys.argv[1], encoding="utf-8", errors="replace").read()
    start = raw.find("{")
    if start < 0:
        print("hier-summary: no JSON found in", sys.argv[1])
        return 1
    try:
        root = json.loads(raw[start:])
    except json.JSONDecodeError as exc:
        print("hier-summary: invalid JSON:", exc)
        return 1
    nodes = []
    walk(root, nodes)
    found = {}
    texts = []
    for node in nodes:
        attrs = node.get("attributes") or {}
        rid = attrs.get("resource-id") or ""
        text = attrs.get("text") or attrs.get("accessibilityText") or ""
        if text:
            texts.append(text)
        if rid in IDS and rid not in found:
            selected = node.get("selected")
            if selected is None:
                selected = attrs.get("selected")
            if not text:
                text = " | ".join(descendant_texts(node))
            found[rid] = (selected, text, attrs.get("bounds", ""))
    for rid in IDS:
        if rid in found:
            sel, text, bounds = found[rid]
            print(f"  {rid:22s} selected={sel!s:5s} bounds={bounds} text={text!r}")
        else:
            print(f"  {rid:22s} (not in hierarchy)")
    for name, rx in MARKERS.items():
        print(f"  marker {name}: {'present' if any(rx.search(t) for t in texts) else 'absent'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
