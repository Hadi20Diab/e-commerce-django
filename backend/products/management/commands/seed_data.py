"""
Management command to seed the database with sample products, categories, and banners.

Usage:
  python manage.py seed_data              # seed everything + download images
  python manage.py seed_data --no-images  # skip image downloads (faster, offline)
  python manage.py seed_data --clear      # wipe existing data first, then seed
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.core.files.base import ContentFile
from products.models import Category, Product, ProductImage, Banner
from decimal import Decimal
import urllib.request
import urllib.error


# ── Categories ────────────────────────────────────────────────────────────────
CATEGORIES = [
    {"name": "Electronics"},
    {"name": "Fashion"},
    {"name": "Home & Living"},
    {"name": "Sports"},
    {"name": "Books"},
    {"name": "Beauty"},
]

# ── Products ──────────────────────────────────────────────────────────────────
# img_seed: picsum.photos seed word (deterministic, consistent picture each run)
PRODUCTS = [
    # Electronics
    {"name": "ProMax Wireless Headphones", "category": "Electronics", "price": "299.00", "compare_price": "399.00", "stock": 50, "description": "Premium noise-cancelling wireless headphones with 40-hour battery life, spatial audio, and titanium drivers. Experience music the way it was meant to be heard.", "is_featured": True, "img_seed": "headphones"},
    {"name": "UltraBook Pro 15", "category": "Electronics", "price": "1299.00", "compare_price": "1599.00", "stock": 20, "description": "Thin and light laptop with OLED display, 12-core processor, 16 GB RAM, and 1 TB SSD. All-day battery life in a stunning aluminium chassis.", "is_featured": True, "img_seed": "laptop"},
    {"name": "SmartWatch Series X", "category": "Electronics", "price": "449.00", "compare_price": "499.00", "stock": 35, "description": "Advanced health tracking, GPS, AMOLED always-on display, and 7-day battery. Water-resistant to 50 m.", "is_featured": True, "img_seed": "watch"},
    {"name": "4K Action Camera", "category": "Electronics", "price": "199.00", "compare_price": "249.00", "stock": 60, "description": "Capture every adventure in stunning 4K@120fps. Waterproof, stabilised, and ready for anything.", "is_featured": False, "img_seed": "camera"},
    {"name": "Mechanical Keyboard TKL", "category": "Electronics", "price": "129.00", "compare_price": "159.00", "stock": 80, "description": "Tenkeyless mechanical keyboard with per-key RGB, hot-swap switches, and aluminium frame. Engineered for performance.", "is_featured": False, "img_seed": "keyboard"},
    {"name": "Portable SSD 2TB", "category": "Electronics", "price": "179.00", "compare_price": "219.00", "stock": 45, "description": "Blazing-fast 2000 MB/s read speeds in a pocket-sized rugged enclosure. USB-C compatible.", "is_featured": False, "img_seed": "storage"},
    {"name": "Wireless Gaming Mouse", "category": "Electronics", "price": "89.00", "compare_price": "119.00", "stock": 100, "description": "Ultra-lightweight 65 g wireless mouse with 25 600 DPI sensor, 70-hour battery, and customisable RGB.", "is_featured": False, "img_seed": "mouse"},
    {"name": "Noise-Cancelling Earbuds Pro", "category": "Electronics", "price": "149.00", "compare_price": "199.00", "stock": 75, "description": "True wireless earbuds with adaptive ANC, 32-hour total battery life, and IPX5 water resistance.", "is_featured": True, "img_seed": "earbuds"},
    {"name": "Smart Home Speaker", "category": "Electronics", "price": "99.00", "compare_price": "129.00", "stock": 55, "description": "360-degree room-filling sound with built-in voice assistant, multiroom audio, and smart home integration.", "is_featured": False, "img_seed": "speaker"},
    {"name": "Ultrawide Monitor 34in", "category": "Electronics", "price": "549.00", "compare_price": "699.00", "stock": 18, "description": "34-inch curved IPS ultrawide monitor, 3440x1440 resolution, 144 Hz, HDR400 - immersive productivity and gaming.", "is_featured": False, "img_seed": "monitor"},
    # Fashion
    {"name": "Merino Wool Crewneck", "category": "Fashion", "price": "89.00", "compare_price": "120.00", "stock": 100, "description": "Ultra-soft 100% Merino wool crewneck. Naturally temperature-regulating, odour-resistant, and machine washable.", "is_featured": True, "img_seed": "sweater"},
    {"name": "Slim Fit Chinos", "category": "Fashion", "price": "69.00", "compare_price": None, "stock": 120, "description": "Classic slim-fit chinos in stretch twill fabric. Smart enough for the office, casual enough for the weekend.", "is_featured": False, "img_seed": "pants"},
    {"name": "Leather Minimalist Watch", "category": "Fashion", "price": "189.00", "compare_price": "249.00", "stock": 30, "description": "Swiss-movement minimalist watch with genuine Italian leather strap. Timeless design for the modern professional.", "is_featured": True, "img_seed": "fashion-watch"},
    {"name": "Canvas Tote Bag", "category": "Fashion", "price": "45.00", "compare_price": None, "stock": 200, "description": "Heavyweight canvas tote with internal zip pocket and reinforced handles. Sustainably made.", "is_featured": False, "img_seed": "bag"},
    {"name": "Premium Leather Sneakers", "category": "Fashion", "price": "145.00", "compare_price": "175.00", "stock": 60, "description": "Full-grain leather sneakers with memory foam insole and hand-stitched detailing. Versatile everyday style.", "is_featured": True, "img_seed": "shoes"},
    {"name": "Classic Denim Jacket", "category": "Fashion", "price": "119.00", "compare_price": "149.00", "stock": 40, "description": "Vintage-washed denim jacket with custom metal buttons and a relaxed modern fit.", "is_featured": False, "img_seed": "jacket"},
    {"name": "Silk Blend Scarf", "category": "Fashion", "price": "55.00", "compare_price": None, "stock": 90, "description": "Hand-rolled edges, vibrant print, 70% silk 30% cashmere blend. Elegant for every season.", "is_featured": False, "img_seed": "scarf"},
    # Home & Living
    {"name": "Ceramic Pour-Over Set", "category": "Home & Living", "price": "65.00", "compare_price": "85.00", "stock": 40, "description": "Handcrafted ceramic pour-over coffee set including dripper, server, and two cups. Start your morning ritual right.", "is_featured": True, "img_seed": "coffee"},
    {"name": "Linen Duvet Cover Set", "category": "Home & Living", "price": "129.00", "compare_price": "165.00", "stock": 55, "description": "Pre-washed 100% French linen duvet cover set. Gets softer with every wash. Available in 6 earthy tones.", "is_featured": False, "img_seed": "bedding"},
    {"name": "Scented Soy Candle Trio", "category": "Home & Living", "price": "48.00", "compare_price": None, "stock": 150, "description": "Hand-poured soy wax candles in Cedar and Moss, Ocean Breeze, and Amber Vanilla. 40-hour burn time each.", "is_featured": False, "img_seed": "candles"},
    {"name": "Bamboo Cutting Board Set", "category": "Home & Living", "price": "39.00", "compare_price": "55.00", "stock": 85, "description": "Three-piece bamboo cutting board set - antibacterial, sustainably sourced, and dishwasher safe.", "is_featured": False, "img_seed": "kitchen"},
    {"name": "Minimalist Wall Clock", "category": "Home & Living", "price": "72.00", "compare_price": "95.00", "stock": 35, "description": "Silent sweep-movement wall clock in powder-coated steel. 30 cm diameter, available in matte black and white.", "is_featured": True, "img_seed": "clock"},
    {"name": "Velvet Throw Pillow Set", "category": "Home & Living", "price": "58.00", "compare_price": None, "stock": 70, "description": "Set of two velvet throw pillows with down-alternative inserts. Deep jewel tones to elevate any space.", "is_featured": False, "img_seed": "pillow"},
    # Sports
    {"name": "Yoga Mat Pro 6mm", "category": "Sports", "price": "79.00", "compare_price": "99.00", "stock": 70, "description": "Non-slip natural rubber yoga mat with alignment markers, carrying strap, and moisture-wicking surface.", "is_featured": False, "img_seed": "yoga"},
    {"name": "Adjustable Dumbbell Set", "category": "Sports", "price": "349.00", "compare_price": "449.00", "stock": 15, "description": "Space-saving adjustable dumbbells from 5 to 52.5 lbs. One set replaces 15 pairs. Quick-change weight selector.", "is_featured": True, "img_seed": "dumbbell"},
    {"name": "Trail Running Shoes", "category": "Sports", "price": "129.00", "compare_price": "159.00", "stock": 50, "description": "Aggressive lugged outsole, waterproof Gore-Tex upper, and 8 mm drop for confident off-road running.", "is_featured": True, "img_seed": "running"},
    {"name": "Resistance Band Set", "category": "Sports", "price": "29.00", "compare_price": "39.00", "stock": 200, "description": "Set of 5 latex resistance bands (10-50 lbs) with carry bag. Perfect for home gym and travel workouts.", "is_featured": False, "img_seed": "bands"},
    {"name": "Insulated Water Bottle 1L", "category": "Sports", "price": "35.00", "compare_price": None, "stock": 150, "description": "Double-wall vacuum insulation keeps drinks cold 24 h or hot 12 h. BPA-free, leak-proof lid.", "is_featured": False, "img_seed": "bottle"},
    # Books
    {"name": "The Art of Deep Work", "category": "Books", "price": "18.00", "compare_price": "24.00", "stock": 200, "description": "Actionable strategies for cultivating intense, distraction-free focus in a world addicted to shallow work.", "is_featured": True, "img_seed": "book1"},
    {"name": "Atomic Habits Special Edition", "category": "Books", "price": "22.00", "compare_price": "28.00", "stock": 180, "description": "Hardcover special edition with illustrated inserts. The definitive guide to building good habits and breaking bad ones.", "is_featured": True, "img_seed": "book2"},
    {"name": "Design Systems Handbook", "category": "Books", "price": "45.00", "compare_price": "60.00", "stock": 60, "description": "Comprehensive guide to creating scalable design systems for digital products. Includes real-world case studies.", "is_featured": False, "img_seed": "book3"},
    {"name": "World Atlas Collectors Edition", "category": "Books", "price": "79.00", "compare_price": "99.00", "stock": 25, "description": "Large-format full-colour atlas with 200+ maps, infographics, and satellite imagery. A coffee-table treasure.", "is_featured": False, "img_seed": "book4"},
    # Beauty
    {"name": "Vitamin C Serum 30ml", "category": "Beauty", "price": "55.00", "compare_price": "70.00", "stock": 90, "description": "20% Vitamin C + Hyaluronic Acid brightening serum. Visibly reduces dark spots and boosts collagen in 4 weeks.", "is_featured": True, "img_seed": "serum"},
    {"name": "Natural Face Oil Blend", "category": "Beauty", "price": "38.00", "compare_price": None, "stock": 75, "description": "Rosehip, Jojoba, and Argan oil blend for all skin types. Lightweight, fast-absorbing, fragrance-free.", "is_featured": False, "img_seed": "face-oil"},
    {"name": "SPF 50 Mineral Sunscreen", "category": "Beauty", "price": "28.00", "compare_price": "36.00", "stock": 120, "description": "Reef-safe zinc oxide formula. Invisible finish, no white cast, water-resistant for 80 minutes.", "is_featured": False, "img_seed": "sunscreen"},
    {"name": "Retinol Night Cream", "category": "Beauty", "price": "62.00", "compare_price": "80.00", "stock": 65, "description": "0.3% encapsulated retinol with niacinamide and peptides. Smooths fine lines overnight without irritation.", "is_featured": True, "img_seed": "night-cream"},
    {"name": "Hydrating Sheet Mask Box", "category": "Beauty", "price": "22.00", "compare_price": None, "stock": 200, "description": "10-pack of biodegradable sheet masks infused with hyaluronic acid, aloe vera, and green tea extract.", "is_featured": False, "img_seed": "mask"},
]

# ── Banners ───────────────────────────────────────────────────────────────────
BANNERS = [
    {
        "title": "New Season. New Looks.",
        "subtitle": "Discover the latest fashion and electronics arrivals curated just for you.",
        "link": "/products",
        "is_active": True,
        "order": 1,
    },
    {
        "title": "Up to 30% Off Electronics",
        "subtitle": "Limited-time deals on premium headphones, laptops, and more.",
        "link": "/products?category=electronics",
        "is_active": True,
        "order": 2,
    },
]


# ── Coupons ───────────────────────────────────────────────────────────────────
COUPONS = [
    {
        "code": "WELCOME10",
        "discount_type": "percentage",
        "discount_value": "10.00",
        "min_order_amount": "0.00",
        "max_uses": None,
        "is_active": True,
        "description": "10% off your first order",
    },
    {
        "code": "SAVE20",
        "discount_type": "percentage",
        "discount_value": "20.00",
        "min_order_amount": "100.00",
        "max_uses": 100,
        "is_active": True,
        "description": "20% off orders over $100",
    },
    {
        "code": "FLAT15",
        "discount_type": "fixed",
        "discount_value": "15.00",
        "min_order_amount": "50.00",
        "max_uses": 200,
        "is_active": True,
        "description": "$15 off orders over $50",
    },
    {
        "code": "LUXE30",
        "discount_type": "percentage",
        "discount_value": "30.00",
        "min_order_amount": "200.00",
        "max_uses": 50,
        "is_active": True,
        "description": "30% off orders over $200",
    },
    {
        "code": "FREESHIP",
        "discount_type": "fixed",
        "discount_value": "10.00",
        "min_order_amount": "0.00",
        "max_uses": None,
        "is_active": True,
        "description": "Free shipping on any order",
    },
    {
        "code": "FLASH50",
        "discount_type": "percentage",
        "discount_value": "50.00",
        "min_order_amount": "300.00",
        "max_uses": 20,
        "is_active": True,
        "description": "Flash sale: 50% off orders over $300",
    },
]


def _download_image(seed, width=800, height=600):
    """Download a Picsum photo by keyword seed and return raw bytes, or None on failure."""
    url = f"https://picsum.photos/seed/{seed}/{width}/{height}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read()
    except (urllib.error.URLError, Exception):
        return None


class Command(BaseCommand):
    help = "Seed the database with sample categories, products, and banners"

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-images",
            action="store_true",
            help="Skip downloading product images (faster, for offline use)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing products, categories, and banners before seeding",
        )

    def handle(self, *args, **options):
        skip_images = options["no_images"]

        if options["clear"]:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            Banner.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            self.stdout.write("  Done.\n")

        self.stdout.write("Seeding categories...")
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=slugify(cat_data["name"]),
                defaults={"name": cat_data["name"]},
            )
            cat_map[cat_data["name"]] = cat
            marker = "created" if created else "exists"
            self.stdout.write(f"  {cat.name} ({marker})")

        self.stdout.write("Seeding products...")
        for p in PRODUCTS:
            slug = slugify(p["name"])
            defaults = {
                "name": p["name"],
                "description": p["description"],
                "price": Decimal(p["price"]),
                "compare_price": Decimal(p["compare_price"]) if p.get("compare_price") else None,
                "stock": p["stock"],
                "is_featured": p.get("is_featured", False),
                "category": cat_map[p["category"]],
            }
            product, created = Product.objects.get_or_create(slug=slug, defaults=defaults)
            marker = "created" if created else "exists"
            self.stdout.write(f"  {product.name} ({marker})", ending="")

            if not skip_images and not product.images.exists():
                img_seed = p.get("img_seed", slug)
                self.stdout.write(" - downloading image...", ending="")
                data = _download_image(img_seed)
                if data:
                    filename = f"{slug}.jpg"
                    img_obj = ProductImage(product=product, is_primary=True, alt_text=product.name)
                    img_obj.image.save(filename, ContentFile(data), save=True)
                    self.stdout.write(" OK", ending="")
                else:
                    self.stdout.write(" (image download failed, skipped)", ending="")
            self.stdout.write("")

        self.stdout.write("Seeding banners...")
        for b in BANNERS:
            banner, created = Banner.objects.get_or_create(
                title=b["title"],
                defaults={k: v for k, v in b.items() if k != "title"},
            )
            marker = "created" if created else "exists"
            self.stdout.write(f"  {banner.title} ({marker})")

        self.stdout.write("Seeding coupons...")
        from orders.models import Coupon
        for c in COUPONS:
            coupon, created = Coupon.objects.get_or_create(
                code=c["code"],
                defaults={
                    "discount_type": c["discount_type"],
                    "discount_value": Decimal(c["discount_value"]),
                    "min_order_amount": Decimal(c["min_order_amount"]),
                    "max_uses": c["max_uses"],
                    "is_active": c["is_active"],
                },
            )
            marker = "created" if created else "exists"
            self.stdout.write(f"  {coupon.code} — {c['description']} ({marker})")

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Seeded {len(CATEGORIES)} categories, "
            f"{len(PRODUCTS)} products, {len(BANNERS)} banners, "
            f"{len(COUPONS)} coupons."
        ))
