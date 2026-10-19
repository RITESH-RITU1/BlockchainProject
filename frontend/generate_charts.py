import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

OUT = "/home/samar/.gemini/antigravity/scratch/ClearEscrow/frontend/public/charts"

DARK_BG   = "#1c1917"   # stone-900
CARD_BG   = "#292524"   # stone-800
AMBER     = "#f59e0b"
ORANGE    = "#ea580c"
EMERALD   = "#059669"
RED       = "#ef4444"
TEXT      = "#e7e5e4"
SUBTEXT   = "#78716c"

def apply_dark(fig, ax):
    fig.patch.set_facecolor(DARK_BG)
    ax.set_facecolor(CARD_BG)
    ax.tick_params(colors=TEXT, labelsize=11)
    ax.xaxis.label.set_color(TEXT)
    ax.yaxis.label.set_color(TEXT)
    ax.title.set_color(TEXT)
    for spine in ax.spines.values():
        spine.set_edgecolor(SUBTEXT)

# ── CHART 1: Platform Fee Comparison ──────────────────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5))
apply_dark(fig, ax)

platforms = ["Upwork\n(standard)", "Fiverr\n(standard)", "Freelancer.com", "Toptal", "This Escrow\ndApp"]
fees      = [20, 20, 10, 0, 0]
colors    = [RED, RED, RED, ORANGE, EMERALD]

bars = ax.bar(platforms, fees, color=colors, width=0.55, zorder=3, edgecolor=CARD_BG, linewidth=1.5)
ax.set_ylabel("Platform Fee (%)", color=TEXT, fontsize=12)
ax.set_title("Platform Fee Comparison", color=TEXT, fontsize=15, fontweight="bold", pad=14)
ax.set_ylim(0, 28)
ax.yaxis.grid(True, color=SUBTEXT, alpha=0.3, linestyle='--')
ax.set_axisbelow(True)

for bar, val in zip(bars, fees):
    label = f"{val}%" if val > 0 else "0% ✓"
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
            label, ha='center', va='bottom', color=TEXT, fontweight='bold', fontsize=12)

legend_patches = [mpatches.Patch(color=RED, label='Existing Platforms'),
                  mpatches.Patch(color=EMERALD, label='This dApp (0%)')]
ax.legend(handles=legend_patches, facecolor=CARD_BG, labelcolor=TEXT, edgecolor=SUBTEXT, fontsize=10)

plt.tight_layout()
plt.savefig(f"{OUT}/platform_fee.png", dpi=150, bbox_inches='tight', facecolor=DARK_BG)
plt.close()
print("✓ platform_fee.png")

# ── CHART 2: Gas Cost Comparison ──────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5))
apply_dark(fig, ax)

categories = ["ETH L1\n(transfer)", "ETH L1\n(contract call)", "Polygon\n(contract call)", "Arbitrum\nSepolia (ours)"]
costs      = [15.50, 22.00, 0.15, 0.03]
colors2    = [RED, RED, ORANGE, EMERALD]

bars2 = ax.bar(categories, costs, color=colors2, width=0.5, zorder=3, edgecolor=CARD_BG, linewidth=1.5)
ax.set_ylabel("Average Gas Cost (USD)", color=TEXT, fontsize=12)
ax.set_title("Gas Cost per Transaction", color=TEXT, fontsize=15, fontweight="bold", pad=14)
ax.set_yscale('log')
ax.yaxis.grid(True, color=SUBTEXT, alpha=0.3, linestyle='--')
ax.set_axisbelow(True)

for bar, val in zip(bars2, costs):
    ax.text(bar.get_x() + bar.get_width()/2, val * 1.6,
            f"${val:.2f}", ha='center', va='bottom', color=TEXT, fontweight='bold', fontsize=12)

legend2 = [mpatches.Patch(color=RED, label='Ethereum L1 (expensive)'),
           mpatches.Patch(color=ORANGE, label='Other L2s'),
           mpatches.Patch(color=EMERALD, label='Arbitrum Sepolia (ours)')]
ax.legend(handles=legend2, facecolor=CARD_BG, labelcolor=TEXT, edgecolor=SUBTEXT, fontsize=10)

plt.tight_layout()
plt.savefig(f"{OUT}/gas_cost.png", dpi=150, bbox_inches='tight', facecolor=DARK_BG)
plt.close()
print("✓ gas_cost.png")

# ── CHART 3: Finality / Latency Comparison ────────────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5))
apply_dark(fig, ax)

chains   = ["Bitcoin\n(1 conf)", "Ethereum\nL1", "Optimism\nL2", "Polygon\nPoS", "Arbitrum\nSepolia"]
latency  = [600, 12.0, 2.0, 2.0, 0.25]
colors3  = [RED, RED, ORANGE, ORANGE, EMERALD]

bars3 = ax.bar(chains, latency, color=colors3, width=0.5, zorder=3, edgecolor=CARD_BG, linewidth=1.5)
ax.set_ylabel("Block Finality (seconds)", color=TEXT, fontsize=12)
ax.set_title("Transaction Finality / Latency", color=TEXT, fontsize=15, fontweight="bold", pad=14)
ax.set_yscale('log')
ax.yaxis.grid(True, color=SUBTEXT, alpha=0.3, linestyle='--')
ax.set_axisbelow(True)

labels3 = ["10 min", "12 s", "2 s", "2 s", "~0.25 s ✓"]
for bar, lbl in zip(bars3, labels3):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() * 1.6,
            lbl, ha='center', va='bottom', color=TEXT, fontweight='bold', fontsize=11)

legend3 = [mpatches.Patch(color=RED, label='Slow (>10s)'),
           mpatches.Patch(color=ORANGE, label='Moderate'),
           mpatches.Patch(color=EMERALD, label='Arbitrum Sepolia — sub-second')]
ax.legend(handles=legend3, facecolor=CARD_BG, labelcolor=TEXT, edgecolor=SUBTEXT, fontsize=10)

plt.tight_layout()
plt.savefig(f"{OUT}/latency.png", dpi=150, bbox_inches='tight', facecolor=DARK_BG)
plt.close()
print("✓ latency.png")

# ── CHART 4: Total Cost of a $1000 Freelance Job ─────────────────────────────
fig, ax = plt.subplots(figsize=(9, 5))
apply_dark(fig, ax)

job_value = 1000
scenarios = ["Upwork\n(20% fee)", "Fiverr\n(20% fee)", "Freelancer\n(10% fee)", "This dApp\n(0% fee + L2)"]

platform_fees = [200, 200, 100, 0]
gas_costs     = [0, 0, 0, 0.03]

x = np.arange(len(scenarios))
w = 0.35

b1 = ax.bar(x - w/2, platform_fees, w, label='Platform Cut ($)', color=RED, zorder=3, edgecolor=CARD_BG)
b2 = ax.bar(x + w/2, gas_costs,     w, label='Gas Cost ($)',     color=AMBER, zorder=3, edgecolor=CARD_BG)

ax.set_ylabel("Cost Deducted from Freelancer ($)", color=TEXT, fontsize=12)
ax.set_title("Total Cost on a $1,000 Freelance Job", color=TEXT, fontsize=15, fontweight="bold", pad=14)
ax.set_xticks(x)
ax.set_xticklabels(scenarios, color=TEXT, fontsize=10)
ax.yaxis.grid(True, color=SUBTEXT, alpha=0.3, linestyle='--')
ax.set_axisbelow(True)

for bar in list(b1) + list(b2):
    h = bar.get_height()
    label = f"${h:.2f}" if h < 1 else f"${h:.0f}"
    ax.text(bar.get_x() + bar.get_width()/2, h + 1.5,
            label, ha='center', va='bottom', color=TEXT, fontweight='bold', fontsize=11)

ax.legend(facecolor=CARD_BG, labelcolor=TEXT, edgecolor=SUBTEXT, fontsize=11)

# Annotation
ax.annotate("Freelancer keeps $999.97", xy=(3, 2), xytext=(2.1, 60),
            arrowprops=dict(arrowstyle='->', color=EMERALD, lw=2),
            color=EMERALD, fontweight='bold', fontsize=11)

plt.tight_layout()
plt.savefig(f"{OUT}/cost_breakdown.png", dpi=150, bbox_inches='tight', facecolor=DARK_BG)
plt.close()
print("✓ cost_breakdown.png")

print("\nAll 4 charts saved to", OUT)
