// Default image hints for common dish names. We render an emoji on a
// styled square when an admin hasn't uploaded a real image — looks
// intentional and matches the warm editorial palette, with no risk of
// broken external image URLs.
//
// Keywords are matched case-insensitively as substrings, longest-match
// wins so "biryani" beats "rice" when the dish is "Chicken Biryani".

interface Match { keyword: string; emoji: string }

const MAP: Match[] = [
  // Mains
  { keyword: "pizza",        emoji: "🍕" },
  { keyword: "burger",       emoji: "🍔" },
  { keyword: "hot dog",      emoji: "🌭" },
  { keyword: "spaghetti",    emoji: "🍝" },
  { keyword: "carbonara",    emoji: "🍝" },
  { keyword: "lasagna",      emoji: "🍝" },
  { keyword: "ravioli",      emoji: "🍝" },
  { keyword: "pasta",        emoji: "🍝" },
  { keyword: "ramen",        emoji: "🍜" },
  { keyword: "udon",         emoji: "🍜" },
  { keyword: "pho",          emoji: "🍜" },
  { keyword: "noodle",       emoji: "🍜" },
  { keyword: "kottu",        emoji: "🍜" },
  { keyword: "sushi",        emoji: "🍣" },
  { keyword: "sashimi",      emoji: "🍣" },
  { keyword: "nigiri",       emoji: "🍣" },
  { keyword: "biryani",      emoji: "🍛" },
  { keyword: "biriyani",     emoji: "🍛" },
  { keyword: "biriynai",     emoji: "🍛" }, // common misspelling
  { keyword: "curry",        emoji: "🍛" },
  { keyword: "fried rice",   emoji: "🍚" },
  { keyword: "rice",         emoji: "🍚" },
  { keyword: "taco",         emoji: "🌮" },
  { keyword: "burrito",      emoji: "🌯" },
  { keyword: "quesadilla",   emoji: "🌮" },
  { keyword: "nachos",       emoji: "🌮" },
  { keyword: "steak",        emoji: "🥩" },
  { keyword: "ribeye",       emoji: "🥩" },
  { keyword: "sirloin",      emoji: "🥩" },
  { keyword: "lamb",         emoji: "🥩" },
  { keyword: "mutton",       emoji: "🥩" },
  { keyword: "chicken",      emoji: "🍗" },
  { keyword: "wing",         emoji: "🍗" },
  { keyword: "salmon",       emoji: "🐟" },
  { keyword: "tuna",         emoji: "🐟" },
  { keyword: "cod",          emoji: "🐟" },
  { keyword: "fish",         emoji: "🐟" },
  { keyword: "shrimp",       emoji: "🦐" },
  { keyword: "prawn",        emoji: "🦐" },
  { keyword: "lobster",      emoji: "🦞" },
  { keyword: "crab",         emoji: "🦀" },
  { keyword: "salad",        emoji: "🥗" },
  { keyword: "caesar",       emoji: "🥗" },
  { keyword: "soup",         emoji: "🍲" },
  { keyword: "stew",         emoji: "🍲" },
  { keyword: "dumpling",     emoji: "🥟" },
  { keyword: "gyoza",        emoji: "🥟" },
  { keyword: "samosa",       emoji: "🥟" },
  { keyword: "spring roll",  emoji: "🥟" },
  { keyword: "sandwich",     emoji: "🥪" },
  { keyword: "panini",       emoji: "🥪" },
  { keyword: "sub",          emoji: "🥪" },
  { keyword: "wrap",         emoji: "🌯" },
  { keyword: "bowl",         emoji: "🥣" },
  { keyword: "poke",         emoji: "🥣" },

  // Bread / brunch
  { keyword: "bruschetta",   emoji: "🥖" },
  { keyword: "bagel",        emoji: "🥯" },
  { keyword: "croissant",    emoji: "🥐" },
  { keyword: "pretzel",      emoji: "🥨" },
  { keyword: "garlic bread", emoji: "🥖" },
  { keyword: "bread",        emoji: "🥖" },
  { keyword: "toast",        emoji: "🍞" },
  { keyword: "pancake",      emoji: "🥞" },
  { keyword: "crepe",        emoji: "🥞" },
  { keyword: "waffle",       emoji: "🧇" },
  { keyword: "omelet",       emoji: "🍳" },
  { keyword: "omelette",     emoji: "🍳" },
  { keyword: "scrambled",    emoji: "🍳" },
  { keyword: "egg",          emoji: "🍳" },
  { keyword: "bacon",        emoji: "🥓" },

  // Sides / extras
  { keyword: "fries",        emoji: "🍟" },
  { keyword: "chips",        emoji: "🍟" },
  { keyword: "popcorn",      emoji: "🍿" },
  { keyword: "cheese",       emoji: "🧀" },
  { keyword: "avocado",      emoji: "🥑" },
  { keyword: "guacamole",    emoji: "🥑" },

  // Desserts
  { keyword: "tiramisu",     emoji: "🍰" },
  { keyword: "cheesecake",   emoji: "🍰" },
  { keyword: "cake",         emoji: "🍰" },
  { keyword: "cupcake",      emoji: "🧁" },
  { keyword: "pie",          emoji: "🥧" },
  { keyword: "donut",        emoji: "🍩" },
  { keyword: "doughnut",     emoji: "🍩" },
  { keyword: "ice cream",    emoji: "🍦" },
  { keyword: "gelato",       emoji: "🍦" },
  { keyword: "sorbet",       emoji: "🍦" },
  { keyword: "chocolate",    emoji: "🍫" },
  { keyword: "cookie",       emoji: "🍪" },
  { keyword: "biscuit",      emoji: "🍪" },
  { keyword: "pudding",      emoji: "🍮" },

  // Drinks
  { keyword: "espresso",     emoji: "☕" },
  { keyword: "americano",    emoji: "☕" },
  { keyword: "cappuccino",   emoji: "☕" },
  { keyword: "latte",        emoji: "☕" },
  { keyword: "mocha",        emoji: "☕" },
  { keyword: "coffee",       emoji: "☕" },
  { keyword: "matcha",       emoji: "🍵" },
  { keyword: "tea",          emoji: "🍵" },
  { keyword: "smoothie",     emoji: "🥤" },
  { keyword: "milkshake",    emoji: "🥤" },
  { keyword: "shake",        emoji: "🥤" },
  { keyword: "juice",        emoji: "🧃" },
  { keyword: "lemonade",     emoji: "🍋" },
  { keyword: "sparkling water", emoji: "💧" },
  { keyword: "tap water",    emoji: "💧" },
  { keyword: "water",        emoji: "💧" },
  { keyword: "soda",         emoji: "🥤" },
  { keyword: "cola",         emoji: "🥤" },
  { keyword: "wine",         emoji: "🍷" },
  { keyword: "champagne",    emoji: "🍾" },
  { keyword: "beer",         emoji: "🍺" },
  { keyword: "lager",        emoji: "🍺" },
  { keyword: "ale",          emoji: "🍺" },
  { keyword: "ipa",          emoji: "🍺" },
  { keyword: "cocktail",     emoji: "🍸" },
  { keyword: "martini",      emoji: "🍸" },
  { keyword: "whiskey",      emoji: "🥃" },
];

// Sort once, longest keyword first, so multi-word matches win.
const SORTED = [...MAP].sort((a, b) => b.keyword.length - a.keyword.length);

/**
 * Returns an emoji for a dish name, or null if no famous-food keyword matches.
 * "Chicken Biriyani" → 🍛, "Tap Water" → 💧, "Foo Bar" → null.
 */
export function defaultEmojiFor(name: string): string | null {
  const n = name.toLowerCase();
  for (const { keyword, emoji } of SORTED) {
    if (n.includes(keyword)) return emoji;
  }
  return null;
}
