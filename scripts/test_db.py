import sqlite3

conn = sqlite3.connect('data/bigambitions.sqlite')
cur = conn.cursor()

tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables in SQLite database:", tables)

print("\n--- Top 5 Highest Margin Retail Items ---")
for r in cur.execute("SELECT name, wholesale_price, default_market_price, profit_margin_pct FROM items WHERE wholesale_price > 0 ORDER BY profit_margin_pct DESC LIMIT 5").fetchall():
    print(f"• {r[0]}: ${r[1]:.2f} wholesale -> ${r[2]:.2f} retail ({r[3]:.1f}% margin)")

print("\n--- Top 5 Most Profitable Factory Recipes per Batch ---")
for r in cur.execute("SELECT name, total_ingredient_cost, gross_profit_skilled FROM recipes ORDER BY gross_profit_skilled DESC LIMIT 5").fetchall():
    print(f"• {r[0]}: Cost ${r[1]:.2f} -> Gross Profit ${r[2]:.2f}/batch")

print("\n--- Total Counts ---")
print("Items:", cur.execute("SELECT COUNT(*) FROM items").fetchone()[0])
print("Businesses:", cur.execute("SELECT COUNT(*) FROM businesses").fetchone()[0])
print("Recipes:", cur.execute("SELECT COUNT(*) FROM recipes").fetchone()[0])
print("Buildings:", cur.execute("SELECT COUNT(*) FROM buildings").fetchone()[0])
print("Neighborhoods:", cur.execute("SELECT COUNT(*) FROM neighborhoods").fetchone()[0])
