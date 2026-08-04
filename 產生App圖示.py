#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
產生App圖示.py — 重繪 PWA 主畫面圖示（背景色跟著品牌色走）
==========================================================================
用途：
  assets/icons/ 裡的三張圖示（192／512／maskable-512）背景色是寫死的顏色，
  不會因為改了 css/styles.css 的 --navy 就自動跟著換。這支腳本用同一組
  「長條圖」圖案，重新畫一次背景色，跟 manifest.json／index.html 的
  theme-color 保持一致。

怎麼用：
  改了品牌主色之後，在這個資料夾執行一次：

      python3 產生App圖示.py

  會覆蓋 assets/icons/icon-192.png、icon-512.png、icon-maskable-512.png。
  圖案本身（三色長條）不會變，只有背景色會換成下面 BG 指定的顏色。
==========================================================================
"""

import pathlib

from PIL import Image, ImageDraw

BASE = pathlib.Path(__file__).resolve().parent
OUT_DIR = BASE / "assets/icons"

# 背景色：跟 css/styles.css 的 --navy 一致（康和品牌紅）。
# 改主色的時候，這裡也要跟著改一次，兩邊目前沒有自動同步。
BG = (15, 76, 117, 255)          # #0F4C75
BARS = [(46, 125, 91), (27, 123, 140), (217, 138, 31)]  # 綠／藍綠／金，不用改


def draw_bars(size, corner_radius):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if corner_radius:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_radius, fill=BG)
    else:
        d.rectangle([0, 0, size - 1, size - 1], fill=BG)

    bar_w = round(size * 0.15)
    gap = round(size * 0.10)
    total_w = bar_w * 3 + gap * 2
    x0 = (size - total_w) // 2
    bottom = round(size * 0.80)
    heights = [round(size * 0.30), round(size * 0.50), round(size * 0.22)]
    radius = round(bar_w * 0.4)

    for i, (h, color) in enumerate(zip(heights, BARS)):
        x1 = x0 + i * (bar_w + gap)
        x2 = x1 + bar_w
        y1 = bottom - h
        d.rounded_rectangle([x1, y1, x2, bottom], radius=radius, fill=color + (255,))

    return img


def main():
    if not OUT_DIR.exists():
        raise SystemExit(f"✗ 找不到 {OUT_DIR}，請在 康和好日子App 資料夾裡執行。")

    draw_bars(192, round(192 * 0.22)).save(OUT_DIR / "icon-192.png")
    draw_bars(512, round(512 * 0.22)).save(OUT_DIR / "icon-512.png")
    draw_bars(512, 0).save(OUT_DIR / "icon-maskable-512.png")   # maskable 不能有圓角

    print(f"✓ 已重繪三張圖示，背景色 #{BG[0]:02X}{BG[1]:02X}{BG[2]:02X}")


if __name__ == "__main__":
    main()
