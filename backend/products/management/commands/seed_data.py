"""
Management command to seed the database with sample products, categories, and banners.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.core.files.base import ContentFile
from products.models import Category, Product, ProductImage, Banner
from decimal import Decimal
import urllib.request
import urllib.error


CATEGORIES = [
    {"name": "Electronics", "icon": "⚡"},
    {"name": "Fashion", "icon": "👗"},
    {"name": "Home & Living", "icon": "🏠"},
    {"name": "Sports", "icon": "🏋️"},
    {"name": "Books", "icon": "📚"},
    {"name": "Beauty", "icon": "💄"},
]

# picsum.photos seed IDs chosen to match each product category
PRODUCTS = [
    # Electronics
    {"name": "ProMax Wireless Headphones", "category": "Electronics", "price": "299.00", "compare_price": "399.00", "stock": 50, "description": "Premium noise-cancelling wireless headphones with 40-hour battery life, spatial audio, and titanium drivers. Experience music the way it was meant to be heard.", "is_featured": True, "img_seed": 1043},
    {"name": "UltraBook Pro 15", "category": "Electronics", "price": "1299.00", "compare_price": "1599.00", "stock": 20, "description": "Thin and light laptop with OLED display, 12-core processor, 16GB RAM, and 1TB SSD. All-day battery life in a stunning aluminium chassis.", "is_featured": True, "img_seed": 1054},
    {"name": "SmartWatch Series X", "category": "Electronics", "price": "449.00", "compare_price": "499.00", "stock": 35, "description": "Advanced health tracking, GPS, AMOLED always-on display, and 7-day battery. Water resistant to 50m.", "is_featured": True, "img_seed": 1068},
    {"name": "4K Action Camera", "category": "Electronics", "price": "199.00", "compare_price": "249.00", "stock": 60, "description": "Capture every adventure in stunning 4K@120fps. Waterproof, stabilised, and ready for anything.", "is_featured": False, "img_seed": 1071},
    {"name": "Mechanical Keyboard TKL", "category": "Electronics", "price": "129.00", "compare_price": "159.00", "stock": 80, "description": "Tenkeyless mechanical keyboard with per-key RGB, hot-swap switches, and aluminium frame. Engineered for performance.", "is_featured": False, "img_seed": 1080},
    {"name": "Portable SSD 2TB", "category": "Electronics", "price": "179.00", "compare_price": "219.00", "stock": 45, "description": "Blazing-fast 2000MB/s read speeds in a pocket-sized rugged enclosure. USB-C compatible.", "is_featured": False, "img_seed": 1082},
    # Fashion
    {"name": "Merino Wool Crewneck", "category": "Fashion", "price": "89.00", "compare_price": "120.00", "stock": 100, "description": "Ultra-soft 100% Merino wool crewneck. Naturally temperature-regulating, odour-resistant, and machine washable.", "is_featured": True, "img_seed": 399},
    {"name": "Slim Fit Chinos", "category": "Fashion", "price": "69.00", "compare_price": None, "stock": 120, "description": "Classic slim-fit chinos in stretch twill fabric. Smart enough for the office, casual enough for the weekend.", "is_featured": False, "img_seed": 375},
    {"name": "Leather Minimalist Watch", "category": "Fashion", "price": "189.00", "compare_price": "249.00", "stock": 30, "description": "Swiss-movement minimalist watch with genuine Italian leather strap. Timeless design for the modern professional.", "is_featured": True, "img_seed": 390},
    {"name": "Canvas Tote Bag", "category": "Fashion", "price": "45.00", "compare_price": None, "stock": 200, "description": "Heavyweight canvas tote with internal zip pocket and reinforced handles. Sustainably made.", "is_featured": False, "img_seed": 429},
    # Home & Living
    {"name": "Ceramic Pour-Over Set", "category": "Home & Living", "price": "65.00", "compare_price": "85.00", "stock": 40, "description": "Handcrafted ceramic pour-over coffee set including dripper, server, and two cups. Start your morning ritual right.", "is_featured": True, "img_seed": 225},
    {"name": "Linen Duvet Cover Set", "category": "Home & Living", "price": "129.00", "compare_price": "165.00", "stock": 55, "description": "Pre-washed 100% French linen duvet cover set. Gets softer with every wash. Available in 6 earthy tones.", "is_featured": False, "img_seed": 210},
    {"name": "Scented Soy Candle Trio", "category": "Home & Living", "price": "48.00", "compare_price": None, "stock": 150, "description": "Hand-poured soy wax candles in three signature scents: Cedar & Moss, Ocean Breeze, and Amber Vanilla. 40-hour burn time each.", "is_featured": False, "img_seed": 239},
    # Sports
    {"name": "Yoga Mat Pro 6mm", "category": "Sports", "price": "79.00", "compare_price": "99.00", "stock": 70, "description": "Non-slip natural rubber yoga mat with alignment markers, carrying strap, and moisture-wicking surface.", "is_featured": False, "img_seed": 517},
    {"name": "Adjustable Dumbbell Set", "category": "Sports", "price": "349.00", "compare_price": "449.00", "stock": 15, "description": "Space-saving adjustable dumbbells from 5-52.5 lbs. One set replaces 15 pairs. Quick-change weight selector.", "is_featured": True, "img_seed": 526},
    # Beauty
    {"name": "Vitamin C Serum 30ml", "category": "Beauty", "price": "55.00", "compare_price": "70.00", "stock": 90, "description": "20% Vitamin C + Hyaluronic Acid brightening serum. Visibly reduces dark spots and boosts collagen in 4 weeks.", "is_featured": True, "img_seed": 774},
    {"name": "Natural Face Oil Blend", "category": "Beauty", "price": "38.00", "compare_price": None, "stock": 75, "description": "Rosehip, Jojoba, and Argan oil blend for all skin types. Lightweight, fast-absorbing, and fragrance-free.", "is_featured": False, "img_seed": 762},
]

BANNERS = [
    {
        "title": "New Season. New Looks.",
        "subtitle": "Discover the latest fashion & electronics arrivals curated just for you.",
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


def _download_image(seed, width=800, height=600):
    """Download a Picsum photo and return raw bytes, or None on failure."""
    url = f"https://picsum.photos/seed/{seed}/{width}/{height}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read()
    except (urllib.error.URLError, Exception):
        return None


class Command(BaseCommand):
    help = "Seed the database with sample categories, products, and banners"

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-images',
            action='store_true',
            help='Skip downloading product images (faster, for offline use)',
        )

    def handle(self, *args, **options):
        skip_images = options['no_images']

        self.stdout.write("Seeding categories…")
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=slugify(cat_data["name"]),
                defaults={"name": cat_data["name"]},
            )
            cat_map[cat_data["name"]] = cat
            status = "created" if created else "exists"
            self.stdout.write(f"  {cat.name} ({status})")

        self.stdout.write("Seeding products…")
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
            status = "created" if created else "exists"
            self.stdout.write(f"  {product.name} ({status})", ending='')

            # Add primary image if none exists yet
            if not skip_images and not product.images.exists():
                img_seed = p.get("img_seed", slug)
                self.stdout.write(" — downloading image…", ending='')
                data = _download_image(img_seed)
                if data:
                    filename = f"{slug}.jpg"
                    img_obj = ProductImage(product=product, is_primary=True, alt_text=product.name)
                    img_obj.image.save(filename, ContentFile(data), save=True)
                    self.stdout.write(" ✓", ending='')
                else:
                    self.stdout.write(" (image download failed, skipped)", ending='')
            self.stdout.write("")

        self.stdout.write("Seeding banners…")
        for b in BANNERS:
            banner, created = Banner.objects.get_or_create(
                title=b["title"],
                defaults={k: v for k, v in b.items() if k != "title"},
            )
            status = "created" if created else "exists"
            self.stdout.write(f"  {banner.title} ({status})")

        self.stdout.write(self.style.SUCCESS("\nDone! Database seeded successfully."))



CATEGORIES = [
    {"name": "Electronics", "icon": "⚡"},
    {"name": "Fashion", "icon": "👗"},
    {"name": "Home & Living", "icon": "🏠"},
    {"name": "Sports", "icon": "🏋️"},
    {"name": "Books", "icon": "📚"},
    {"name": "Beauty", "icon": "💄"},
]

PRODUCTS = [
    # Electronics
    {"name": "ProMax Wireless Headphones", "category": "Electronics", "price": "299.00", "compare_price": "399.00", "stock": 50, "description": "Premium noise-cancelling wireless headphones with 40-hour battery life, spatial audio, and titanium drivers. Experience music the way it was meant to be heard.", "is_featured": True},
    {"name": "UltraBook Pro 15", "category": "Electronics", "price": "1299.00", "compare_price": "1599.00", "stock": 20, "description": "Thin and light laptop with OLED display, 12-core processor, 16GB RAM, and 1TB SSD. All-day battery life in a stunning aluminium chassis.", "is_featured": True},
    {"name": "SmartWatch Series X", "category": "Electronics", "price": "449.00", "compare_price": "499.00", "stock": 35, "description": "Advanced health tracking, GPS, AMOLED always-on display, and 7-day battery. Water resistant to 50m.", "is_featured": True},
    {"name": "4K Action Camera", "category": "Electronics", "price": "199.00", "compare_price": "249.00", "stock": 60, "description": "Capture every adventure in stunning 4K@120fps. Waterproof, stabilised, and ready for anything.", "is_featured": False},
    {"name": "Mechanical Keyboard TKL", "category": "Electronics", "price": "129.00", "compare_price": "159.00", "stock": 80, "description": "Tenkeyless mechanical keyboard with per-key RGB, hot-swap switches, and aluminium frame. Engineered for performance.", "is_featured": False},
    {"name": "Portable SSD 2TB", "category": "Electronics", "price": "179.00", "compare_price": "219.00", "stock": 45, "description": "Blazing-fast 2000MB/s read speeds in a pocket-sized rugged enclosure. USB-C compatible.", "is_featured": False},
    # Fashion
    {"name": "Merino Wool Crewneck", "category": "Fashion", "price": "89.00", "compare_price": "120.00", "stock": 100, "description": "Ultra-soft 100% Merino wool crewneck. Naturally temperature-regulating, odour-resistant, and machine washable.", "is_featured": True},
    {"name": "Slim Fit Chinos", "category": "Fashion", "price": "69.00", "compare_price": None, "stock": 120, "description": "Classic slim-fit chinos in stretch twill fabric. Smart enough for the office, casual enough for the weekend.", "is_featured": False},
    {"name": "Leather Minimalist Watch", "category": "Fashion", "price": "189.00", "compare_price": "249.00", "stock": 30, "description": "Swiss-movement minimalist watch with genuine Italian leather strap. Timeless design for the modern professional.", "is_featured": True},
    {"name": "Canvas Tote Bag", "category": "Fashion", "price": "45.00", "compare_price": None, "stock": 200, "description": "Heavyweight canvas tote with internal zip pocket and reinforced handles. Sustainably made.", "is_featured": False},
    # Home & Living
    {"name": "Ceramic Pour-Over Set", "category": "Home & Living", "price": "65.00", "compare_price": "85.00", "stock": 40, "description": "Handcrafted ceramic pour-over coffee set including dripper, server, and two cups. Start your morning ritual right.", "is_featured": True},
    {"name": "Linen Duvet Cover Set", "category": "Home & Living", "price": "129.00", "compare_price": "165.00", "stock": 55, "description": "Pre-washed 100% French linen duvet cover set. Gets softer with every wash. Available in 6 earthy tones.", "is_featured": False},
    {"name": "Scented Soy Candle Trio", "category": "Home & Living", "price": "48.00", "compare_price": None, "stock": 150, "description": "Hand-poured soy wax candles in three signature scents: Cedar & Moss, Ocean Breeze, and Amber Vanilla. 40-hour burn time each.", "is_featured": False},
    # Sports
    {"name": "Yoga Mat Pro 6mm", "category": "Sports", "price": "79.00", "compare_price": "99.00", "stock": 70, "description": "Non-slip natural rubber yoga mat with alignment markers, carrying strap, and moisture-wicking surface.", "is_featured": False},
    {"name": "Adjustable Dumbbell Set", "category": "Sports", "price": "349.00", "compare_price": "449.00", "stock": 15, "description": "Space-saving adjustable dumbbells from 5-52.5 lbs. One set replaces 15 pairs. Quick-change weight selector.", "is_featured": True},
    # Beauty
    {"name": "Vitamin C Serum 30ml", "category": "Beauty", "price": "55.00", "compare_price": "70.00", "stock": 90, "description": "20% Vitamin C + Hyaluronic Acid brightening serum. Visibly reduces dark spots and boosts collagen in 4 weeks.", "is_featured": True},
    {"name": "Natural Face Oil Blend", "category": "Beauty", "price": "38.00", "compare_price": None, "stock": 75, "description": "Rosehip, Jojoba, and Argan oil blend for all skin types. Lightweight, fast-absorbing, and fragrance-free.", "is_featured": False},
]

BANNERS = [
    {
        "title": "New Season. New Looks.",
        "subtitle": "Discover the latest fashion & electronics arrivals curated just for you.",
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


class Command(BaseCommand):
    help = "Seed the database with sample categories, products, and banners"

    def handle(self, *args, **options):
        self.stdout.write("Seeding categories…")
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=slugify(cat_data["name"]),
                defaults={"name": cat_data["name"]},
            )
            cat_map[cat_data["name"]] = cat
            status = "created" if created else "exists"
            self.stdout.write(f"  {cat.name} ({status})")

        self.stdout.write("Seeding products…")
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
            status = "created" if created else "exists"
            self.stdout.write(f"  {product.name} ({status})")

        self.stdout.write("Seeding banners…")
        for b in BANNERS:
            banner, created = Banner.objects.get_or_create(
                title=b["title"],
                defaults={k: v for k, v in b.items() if k != "title"},
            )
            status = "created" if created else "exists"
            self.stdout.write(f"  {banner.title} ({status})")

        self.stdout.write(self.style.SUCCESS("\nDone! Database seeded successfully."))
