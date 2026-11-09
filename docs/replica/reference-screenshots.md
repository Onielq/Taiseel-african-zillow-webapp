# Reference materials reviewed

The primary design and structure references are now the two user-supplied HTML demos in the source repository Onielq/Taiseel-african-zillow-:

| Source file | Role in Taiseel |
|---|---|
| zillow-clean.html | Home page: navigation, left rail, hero/search, recommendations, budget/affordability section, feature cards and footer |
| zillow-rwanda-v3.html | Search page: Rwanda filters, split map/results layout, district boundaries, map layers, listing cards and map controls |

Both files are ported into the target repository under public/ and are rendered directly by the app routes. The app no longer substitutes a separately invented landing or search layout.

The earlier screenshot archive remains useful for checking small visual states such as dropdowns and filter panels. It is secondary to the HTML prototypes because the prototypes contain the actual markup, styles, data arrangement and map behavior.