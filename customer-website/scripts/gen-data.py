import json, os, random

random.seed(42)
BASE = "https://pub-XXXX.r2.dev"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data")

BRANDS = [
    {"id": "ray-ban", "name": "Ray-Ban", "logo": f"{BASE}/brands/ray-ban.webp",
     "story": "An icon since 1937, Ray-Ban defined the aviator and the wayfarer — timeless silhouettes built for every generation.",
     "collections": ["Aviator", "Wayfarer", "Clubmaster"]},
    {"id": "titan", "name": "Titan", "logo": f"{BASE}/brands/titan.webp",
     "story": "India's own precision eyewear house, Titan blends everyday durability with understated design.",
     "collections": ["Titan Fastrack", "Titan Eye+"]},
    {"id": "fastrack", "name": "Fastrack", "logo": f"{BASE}/brands/fastrack.webp",
     "story": "Bold, youthful and unapologetically loud — Fastrack frames are made for the fearless.",
     "collections": ["Fast Vibes", "UV Sunnies"]},
    {"id": "vincent-chase", "name": "Vincent Chase", "logo": f"{BASE}/brands/vincent-chase.webp",
     "story": "Design-forward frames at accessible prices, Vincent Chase brings runway trends to daily wear.",
     "collections": ["Studio Line", "Air Flex"]},
    {"id": "lenskart-house", "name": "Lenskart House", "logo": f"{BASE}/brands/lenskart-house.webp",
     "story": "In-house craftsmanship focused on comfort-first engineering for all-day wear.",
     "collections": ["Hustlr", "Air"]},
    {"id": "oakley", "name": "Oakley", "logo": f"{BASE}/brands/oakley.webp",
     "story": "Born on the racetrack, Oakley engineers performance eyewear for athletes and everyday adventurers.",
     "collections": ["Holbrook", "Radar"]},
    {"id": "police", "name": "Police", "logo": f"{BASE}/brands/police.webp",
     "story": "Italian edge and street-smart styling — Police frames are sharp, confident statements.",
     "collections": ["Origins", "Sunset"]},
    {"id": "carrera", "name": "Carrera", "logo": f"{BASE}/brands/carrera.webp",
     "story": "Racing heritage from Austria, Carrera fuses motorsport DNA with bold retro shapes.",
     "collections": ["Carrera Racing", "Carrera Icon"]},
]

CATEGORIES = ["frames", "sunglasses", "computer", "kids", "reading"]
GENDERS = ["men", "women", "unisex", "kids"]
SHAPES = ["oval", "round", "square", "rectangle", "aviator", "cat-eye", "wayfarer", "browline"]
MATERIALS = ["Acetate", "TR90 Flex Titanium", "Metal Alloy", "Stainless Steel", "Polycarbonate"]
FACE_SHAPES = ["oval", "square", "round", "heart", "diamond", "rectangle", "triangle"]
LENS_TYPES = ["single-vision", "blue-cut", "progressive", "photochromic", "reading", "computer", "driving"]
COLORS = [("Black", "#1A1A1A"), ("Tortoise", "#6B4A2E"), ("Gunmetal", "#4B4E52"),
          ("Blue", "#2C4E7C"), ("Silver", "#C7CBD1"), ("Golden", "#C6973F"), ("Rose Gold", "#B76E79"),
          ("Crystal Clear", "#E7E7E7")]
ANGLES = ["front", "left", "right", "45", "folded", "on-face", "box", "accessories"]

NAMES = [
    "Aurora Round", "Meridian Aviator", "Solstice Cat-Eye", "Heritage Browline", "Bengal Wayfarer",
    "Ivory Oval", "Patiala Classic", "Sirhind Square", "Nabha Rectangle", "Rajindra Retro",
    "Punjab Pilot", "Baradari Blue-Cut", "Qila Round", "Sheesh Mahal Cat-Eye", "Moti Bagh Aviator",
    "Anandpur Flex", "Fatehgarh Bold", "Sutlej Wave", "Jalandhar Edge", "Chandni Oval",
]

def img(prod_id, variant_idx, angle, i):
    stem = f"products/{prod_id}/v{variant_idx}-{angle}"
    return {
        "url": f"{BASE}/{stem}.jpg",
        "webp": f"{BASE}/{stem}.webp",
        "avif": f"{BASE}/{stem}.avif",
        "thumbnail": f"{BASE}/{stem}-thumb.webp",
        "blurPlaceholder": "data:image/webp;base64,UklGRhwAAABXRUJQVlA4TA8AAAAvAAAAAAfQ//73v/+BiOh/AAA=",
        "angle": angle,
        "alt": f"{prod_id.replace('-', ' ').title()} — {angle.replace('-', ' ')} view",
    }

products = []
for idx, name in enumerate(NAMES):
    pid = f"p{idx+1:03d}"
    slug = name.lower().replace(" ", "-")
    brand = BRANDS[idx % len(BRANDS)]["name"]
    category = CATEGORIES[idx % len(CATEGORIES)]
    gender = GENDERS[idx % len(GENDERS)]
    shape = SHAPES[idx % len(SHAPES)]
    material = MATERIALS[idx % len(MATERIALS)]
    price = random.choice([1499, 1999, 2499, 2999, 3499, 3999, 4999, 5999, 7999])
    has_discount = idx % 3 == 0
    n_variants = 2 if idx % 4 else 3
    variants = []
    chosen_colors = random.sample(COLORS, n_variants)
    for vi, (cname, chex) in enumerate(chosen_colors):
        angles = random.sample([a for a in ANGLES if a != "on-face"], 3) + ["on-face"]
        angles = list(dict.fromkeys(["front", "left", "right"] + angles))[:5]
        images = [img(pid, vi, a, i) for i, a in enumerate(angles)]
        variant = {
            "id": f"{pid}-v{vi+1}",
            "color": cname,
            "colorHex": chex,
            "images": images,
            "video": f"{BASE}/products/{pid}/v{vi}-turntable.mp4" if idx % 5 == 0 else None,
            "availability": ["in-stock", "in-stock", "limited-stock", "store-only"][ (idx+vi) % 4],
            "sku": f"AO-{pid.upper()}-{cname[:2].upper()}",
        }
        if idx < 2:
            variant["spin360"] = [f"{BASE}/products/{pid}/v{vi}-spin/{deg}.webp" for deg in range(0, 360, 15)]
        variants.append({k: v for k, v in variant.items() if v is not None})

    products.append({
        "id": pid,
        "slug": slug,
        "name": name,
        "brand": brand,
        "price": price,
        **({"originalPrice": price + random.choice([500, 800, 1200])} if has_discount else {}),
        "variants": variants,
        "defaultVariantId": variants[0]["id"],
        "category": category,
        "gender": gender,
        "material": material,
        "frameShape": shape,
        "frameWidth": random.randint(128, 148),
        "lensWidth": random.randint(46, 58),
        "bridgeWidth": random.randint(14, 20),
        "templeLength": random.randint(138, 150),
        "weight": random.randint(18, 32),
        "warranty": "1 Year Manufacturer Warranty",
        "suitableFaceShapes": random.sample(FACE_SHAPES, 3),
        "recommendedLens": random.sample(LENS_TYPES, 2),
        "frequentlyBoughtWith": [],
        "isNew": idx % 6 == 0,
        "isBestseller": idx % 5 == 1,
        "tags": [category, shape, gender],
        "description": f"The {name} is a {material.lower()} {shape} frame from {brand}, engineered for all-day comfort with a refined, editorial finish suited to {gender} faces.",
    })

# frequentlyBoughtWith: reference 2 accessory-style product ids (reuse other product ids for simplicity)
for i, p in enumerate(products):
    others = [x["id"] for x in products if x["id"] != p["id"]]
    p["frequentlyBoughtWith"] = random.sample(others, 2)

os.makedirs(os.path.join(OUT, "products"), exist_ok=True)
with open(os.path.join(OUT, "products", "frames.json"), "w") as f:
    json.dump(products, f, indent=2)

with open(os.path.join(OUT, "brands.json"), "w") as f:
    json.dump(BRANDS, f, indent=2)

lenses = [
    {"type": "single-vision", "name": "Single Vision", "description": "One prescription power across the whole lens, correcting either near- or far-sightedness.", "whoFor": "Most first-time glasses wearers with a single, simple prescription."},
    {"type": "blue-cut", "name": "Blue-Cut", "description": "Filters high-energy blue light from screens to reduce digital eye strain.", "whoFor": "Anyone spending 4+ hours daily on laptops, phones or TVs."},
    {"type": "progressive", "name": "Progressive", "description": "A seamless gradient of powers in one lens — near, intermediate and distance — with no visible line.", "whoFor": "Presbyopia (40+) wearers who want one pair for every distance."},
    {"type": "photochromic", "name": "Photochromic", "description": "Clear indoors, automatically darkens in sunlight — one lens for day and night.", "whoFor": "People who move between indoor and bright outdoor settings often."},
    {"type": "reading", "name": "Reading", "description": "A fixed near-vision power optimised for books, menus and close-up work.", "whoFor": "Anyone who only needs correction for close-range reading."},
    {"type": "computer", "name": "Computer", "description": "Optimised focal length for arm's-length screen distance, reducing squinting and fatigue.", "whoFor": "Desk workers spending most of the day at a monitor."},
    {"type": "driving", "name": "Driving", "description": "Anti-glare, polarised tint tuned to cut headlight glare and road glare.", "whoFor": "Frequent drivers, especially for night and highway driving."},
]
with open(os.path.join(OUT, "lenses.json"), "w") as f:
    json.dump(lenses, f, indent=2)

offers = [
    {"id": "o1", "title": "Festival Offer", "description": "Flat discount storewide on all frames and sunglasses this festive season.", "discount": "20% OFF", "validUntil": "2026-11-15", "image": f"{BASE}/offers/festival.webp", "code": "FEST20"},
    {"id": "o2", "title": "Student Discount", "description": "Valid student ID gets you a special price on every frame, every day.", "discount": "15% OFF", "validUntil": "2026-12-31", "image": f"{BASE}/offers/student.webp", "code": "STUDENT15"},
    {"id": "o3", "title": "Senior Citizen Offer", "description": "A thank-you discount for our senior customers, on frames and lenses.", "discount": "10% OFF", "validUntil": "2026-12-31", "image": f"{BASE}/offers/senior.webp"},
    {"id": "o4", "title": "Frame + Lens Combo", "description": "Bundle any frame with premium lenses and save on the combined price.", "discount": "Up to ₹1,500 OFF", "validUntil": "2026-10-31", "image": f"{BASE}/offers/combo.webp", "code": "COMBO"},
]
with open(os.path.join(OUT, "offers.json"), "w") as f:
    json.dump(offers, f, indent=2)

gallery = []
cats = ["Store", "Frames", "Customers", "Events"]
for i in range(16):
    cat = cats[i % 4]
    gallery.append({"id": f"g{i+1}", "url": f"{BASE}/gallery/{cat.lower()}-{i+1}.webp", "category": cat, "alt": f"American Optical Patiala — {cat} photo {i+1}"})
with open(os.path.join(OUT, "gallery.json"), "w") as f:
    json.dump(gallery, f, indent=2)

reviewers = ["Simran Kaur", "Rohit Mehta", "Gurpreet Singh", "Anjali Sharma", "Harpreet Bhatia",
             "Vikram Aggarwal", "Priya Nanda", "Amandeep Sidhu"]
reviews = []
for i, name in enumerate(reviewers):
    reviews.append({
        "id": f"r{i+1}", "name": name, "rating": random.choice([4, 4, 5, 5, 5]),
        "review": random.choice([
            "Great collection and honest advice on frame shapes for my face.",
            "Quick eye test and the staff helped me pick the right lens type.",
            "Loved the try-on experience — got exactly the pair I wanted.",
            "Good prices and the frames feel sturdy. Been coming here for years.",
            "Excellent service, they even adjusted my old frame for free.",
        ]),
        "date": f"2026-0{(i%6)+1}-1{i}", "source": "google",
    })
with open(os.path.join(OUT, "reviews.json"), "w") as f:
    json.dump(reviews, f, indent=2)

faqs = [
    {"id": "f1", "category": "Returns & Exchange", "question": "Can I return or exchange my frame?", "answer": "Yes — unworn frames in original condition can be exchanged within 7 days of purchase. Prescription lenses are non-returnable once cut."},
    {"id": "f2", "category": "Returns & Exchange", "question": "What if the frame doesn't fit well?", "answer": "Bring it back for a free fitting adjustment any time — our opticians will re-fit the temples and nose pads at no charge."},
    {"id": "f3", "category": "Warranty", "question": "What does the 1-year warranty cover?", "answer": "Manufacturing defects in the frame — hinge failure, coating peeling, or material faults. It does not cover accidental damage or scratches."},
    {"id": "f4", "category": "Warranty", "question": "How do I claim warranty service?", "answer": "Visit the store with your original bill. We'll inspect the frame and repair or replace it if the issue is covered."},
    {"id": "f5", "category": "Lens Replacement", "question": "Can I get new lenses in my old frame?", "answer": "Yes, if the frame is in good condition we can fit updated prescription lenses into it."},
    {"id": "f6", "category": "Lens Replacement", "question": "How long does lens replacement take?", "answer": "Most single-vision lenses are ready same-day. Progressive and specialised lenses typically take 2-3 days."},
    {"id": "f7", "category": "Eye Testing", "question": "Is the eye test free?", "answer": "Yes, our in-store eye test is completely free, no purchase required."},
    {"id": "f8", "category": "Eye Testing", "question": "Do I need an appointment?", "answer": "Walk-ins are welcome, but booking via WhatsApp guarantees you a slot without waiting."},
    {"id": "f9", "category": "Delivery", "question": "Do you deliver frames to my home?", "answer": "Yes, we offer home delivery within Patiala for a small fee, or you can choose free store pickup."},
    {"id": "f10", "category": "Delivery", "question": "How long does delivery take?", "answer": "Ready-stock frames deliver within 1-2 days. Frames needing lens fitting take 2-4 days."},
    {"id": "f11", "category": "Payment Options", "question": "What payment methods do you accept?", "answer": "Cash, all major UPI apps, credit/debit cards, and EMI on select bank cards."},
    {"id": "f12", "category": "Payment Options", "question": "Can I pay a deposit and the rest on delivery?", "answer": "Yes, for custom lens orders we take a partial advance and the balance is due on pickup or delivery."},
]
with open(os.path.join(OUT, "faqs.json"), "w") as f:
    json.dump(faqs, f, indent=2)

settings = {
    "storeName": "American Optical Patiala",
    "address": "Shop No. 45, 46 & 47, Main Sirhind Road, Near B.N. Khalsa School, Jawahar Nagar, Hargobind Nagar, Patiala, Punjab 147004",
    "phone": "094632 95273",
    "whatsapp": "919463295273",
    "hours": "Mon–Sun: 9:00 AM – 8:00 PM",
    "mapEmbedUrl": "https://www.google.com/maps?q=American+Optical+Patiala,+Main+Sirhind+Road,+Patiala&output=embed",
    "rating": 4.4,
    "reviewCount": 42,
    "featureFlags": {"enableAIAssistant": True, "enable360Spin": True, "enableVirtualTryOn": True},
}
with open(os.path.join(OUT, "settings.json"), "w") as f:
    json.dump(settings, f, indent=2)

blog_topics = [
    ("How to Choose the Right Frame for Your Face Shape", "eye-care", "Understanding your face shape is the fastest way to narrow hundreds of frames down to the handful that actually suit you."),
    ("Blue-Cut Lenses: Do You Really Need Them?", "lens-guide", "Screens are unavoidable — here's what blue-cut lenses actually do, and when they're worth it."),
    ("5 Signs It's Time for a New Eye Test", "eye-care", "Headaches, squinting, and blurred text are common signs your prescription has shifted."),
    ("Frame Trends for 2026: What's In Right Now", "fashion-tips", "From bold acetate to slim titanium, here's what's trending in eyewear this year."),
    ("Progressive vs Bifocal: Which Lens Is Right for You", "lens-guide", "Both correct near and far vision — but they work very differently day to day."),
    ("Caring for Your Frames: A Simple Maintenance Guide", "frame-guide", "A few small habits can double the lifespan of your favourite pair of glasses."),
]
blogs = []
for i, (title, cat, excerpt) in enumerate(blog_topics):
    slug = title.lower().replace(",", "").replace(":", "").replace("'", "").replace(" ", "-")
    blogs.append({
        "id": f"b{i+1}", "slug": slug, "title": title, "excerpt": excerpt,
        "content": f"## {title}\n\n{excerpt}\n\nAt American Optical Patiala, our opticians walk every customer through this in-store, but here's the short version.\n\n### The basics\n\nStart with what you actually need day to day, not just what looks good in the mirror. Comfort, prescription accuracy and lens coatings matter more long-term than trend alone.\n\n### Our recommendation\n\nBook a free eye test with us and we'll talk you through the options in person — WhatsApp us any time.",
        "image": f"{BASE}/blog/{slug}.webp", "category": cat,
        "publishedAt": f"2026-0{(i%6)+1}-0{i+1}", "readTime": random.choice([3,4,5,6]),
    })
with open(os.path.join(OUT, "blogs.json"), "w") as f:
    json.dump(blogs, f, indent=2)

print("Generated:", len(products), "products,", len(BRANDS), "brands,", len(blogs), "blogs")
