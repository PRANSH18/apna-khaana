import { composedMeals } from './composed';

export type MealDiet = 'veg'|'egg'|'nonveg';
export type Meal = { id:string; name:string; slot:'Breakfast'|'Lunch'|'Dinner'; diet:MealDiet; cuisine:string; kcal:number; protein:number; carbs:number; fat:number; price:number; image:string; note:string; spice:number; oil:number };
const photo = (id:string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

// The 30 curated, photographed signature dishes. The full option space Sehat
// and the self-build planner draw from is these plus the ~105 composed
// "build-a-bowl" meals (lib/composed.ts) — 135 in total.
export const signatureMeals: Meal[] = [
 // Breakfast
 {id:'moong-chilla',name:'Moong Dal Chilla',slot:'Breakfast',diet:'veg',cuisine:'north',kcal:320,protein:18,carbs:38,fat:9,price:320,image:photo('photo-1751560455942-f859f1215826'),note:'Moong from Karnataka farms; mint chutney made fresh.',spice:2,oil:2},
 {id:'idli-sambar',name:'Idli, Sambar & Podi',slot:'Breakfast',diet:'veg',cuisine:'south',kcal:300,protein:12,carbs:52,fat:5,price:320,image:photo('photo-1741376509166-cbd74b608f5a'),note:'Fermented rice and urad batter, ground in our kitchen.',spice:2,oil:1},
 {id:'egg-bhurji',name:'Egg Bhurji & Toast',slot:'Breakfast',diet:'egg',cuisine:'north',kcal:360,protein:24,carbs:28,fat:16,price:320,image:photo('photo-1673925962465-7bfd6339ab2e'),note:'Cage-free eggs from a Hosur farm.',spice:3,oil:2},
 {id:'ragi-dosa',name:'Ragi Dosa & Chutney',slot:'Breakfast',diet:'veg',cuisine:'south',kcal:310,protein:10,carbs:50,fat:8,price:320,image:photo('photo-1668236543090-82eba5ee5976'),note:'Ragi milled in Chikkaballapur; coconut from Tumakuru.',spice:1,oil:2},
 {id:'masala-oats',name:'Masala Oats with Vegetables',slot:'Breakfast',diet:'veg',cuisine:'west',kcal:290,protein:11,carbs:44,fat:7,price:320,image:photo('photo-1607116685391-29c9e9726561'),note:'Rolled oats and garden vegetables, tempered fresh each morning.',spice:2,oil:1},
 {id:'paneer-paratha',name:'Paneer Paratha & Curd',slot:'Breakfast',diet:'veg',cuisine:'north',kcal:420,protein:20,carbs:40,fat:20,price:320,image:photo('photo-1788538397295-41114c76044d'),note:'Paneer from a small dairy near Nandi Hills, curd churned daily.',spice:2,oil:3},
 {id:'veg-uttapam',name:'Vegetable Uttapam & Sambar',slot:'Breakfast',diet:'veg',cuisine:'south',kcal:330,protein:11,carbs:54,fat:8,price:320,image:photo('photo-1694849789325-914b71ab4075'),note:'Fermented batter topped with onion, tomato and carrot.',spice:2,oil:2},
 {id:'masala-omelette',name:'Masala Omelette & Toast',slot:'Breakfast',diet:'egg',cuisine:'north',kcal:340,protein:22,carbs:18,fat:20,price:320,image:photo('photo-1494597706938-de2cd7341979'),note:'Cage-free eggs from a Hosur farm, whisked with onion and chilli.',spice:3,oil:2},
 {id:'poha',name:'Poha with Peanuts',slot:'Breakfast',diet:'veg',cuisine:'west',kcal:300,protein:8,carbs:44,fat:10,price:320,image:photo('photo-1778449796312-03a0ef8469ed'),note:'Flattened rice tempered with peanuts and curry leaves.',spice:2,oil:2},
 {id:'sprouts-salad',name:'Sprouts & Moong Salad Bowl',slot:'Breakfast',diet:'veg',cuisine:'west',kcal:260,protein:14,carbs:28,fat:6,price:320,image:photo('photo-1758721217610-a5d729a319e9'),note:'Sprouted moong and chickpeas, tossed fresh to order.',spice:1,oil:1},

 // Lunch
 {id:'chicken-bowl',name:'Grilled Chicken Rice Bowl',slot:'Lunch',diet:'nonveg',cuisine:'west',kcal:520,protein:42,carbs:48,fat:14,price:320,image:photo('photo-1762631383846-6bead15b9796'),note:'Free-range chicken and red rice from local growers.',spice:2,oil:1},
 {id:'rajma-rice',name:'Rajma & Jeera Rice',slot:'Lunch',diet:'veg',cuisine:'north',kcal:480,protein:18,carbs:74,fat:11,price:320,image:photo('photo-1668236534990-73c4ed23043c'),note:'Kidney beans slow-cooked with whole spices.',spice:3,oil:2},
 {id:'paneer-quinoa',name:'Paneer Tikka & Quinoa',slot:'Lunch',diet:'veg',cuisine:'north',kcal:510,protein:26,carbs:46,fat:22,price:320,image:photo('photo-1666001120694-3ebe8fd207be'),note:'Paneer from a small dairy near Nandi Hills.',spice:3,oil:2},
 {id:'fish-curry',name:'Fish Curry & Red Rice',slot:'Lunch',diet:'nonveg',cuisine:'south',kcal:470,protein:34,carbs:52,fat:12,price:320,image:photo('photo-1761314036779-84078bec535c'),note:'Line-caught seer fish from Mangaluru.',spice:3,oil:2},
 {id:'chicken-chettinad',name:'Chicken Chettinad & Appam',slot:'Lunch',diet:'nonveg',cuisine:'south',kcal:540,protein:38,carbs:30,fat:26,price:320,image:photo('photo-1757445060056-6d6aeec73de4'),note:'Free-range chicken slow-cooked with Chettinad spice.',spice:4,oil:2},
 {id:'chana-masala',name:'Chana Masala & Millet Roti',slot:'Lunch',diet:'veg',cuisine:'north',kcal:440,protein:19,carbs:62,fat:12,price:320,image:photo('photo-1591940597372-bd266c6eb29e'),note:'Chickpeas simmered overnight, millet milled locally.',spice:3,oil:2},
 {id:'lemon-rice',name:'Lemon Rice & Peanut Curry',slot:'Lunch',diet:'veg',cuisine:'south',kcal:460,protein:14,carbs:68,fat:14,price:320,image:photo('photo-1733414717515-d997dafb7341'),note:'Tempered rice with curry leaves and roasted peanuts.',spice:2,oil:2},
 {id:'kadai-paneer',name:'Kadai Paneer & Jeera Rice',slot:'Lunch',diet:'veg',cuisine:'north',kcal:520,protein:24,carbs:34,fat:30,price:320,image:photo('photo-1606222651797-dc3116801261'),note:'Paneer and peppers tossed in a kadai masala.',spice:3,oil:2},
 {id:'egg-curry-rice',name:'Egg Curry & Steamed Rice',slot:'Lunch',diet:'egg',cuisine:'south',kcal:470,protein:26,carbs:40,fat:20,price:320,image:photo('photo-1764315197254-94385571df22'),note:'Cage-free eggs in a coconut-based curry.',spice:3,oil:2},
 {id:'chicken-biryani',name:'Chicken Biryani & Raita',slot:'Lunch',diet:'nonveg',cuisine:'south',kcal:560,protein:36,carbs:60,fat:20,price:320,image:photo('photo-1631515243349-e0cb75fb8d3a'),note:'Slow-dum biryani, free-range chicken from local growers.',spice:3,oil:2},

 // Dinner
 {id:'palak-tofu',name:'Palak Tofu & Phulka',slot:'Dinner',diet:'veg',cuisine:'north',kcal:380,protein:24,carbs:32,fat:16,price:320,image:photo('photo-1767114915936-745dd372f1d8'),note:'Spinach from a nearby hydroponic farm.',spice:2,oil:2},
 {id:'grilled-fish',name:'Grilled Fish & Greens',slot:'Dinner',diet:'nonveg',cuisine:'west',kcal:410,protein:40,carbs:14,fat:20,price:320,image:photo('photo-1763867641066-cd26a5f11105'),note:'Fresh fish, seasonal greens, clean flavours.',spice:2,oil:1},
 {id:'dal-pulao',name:'Dal Tadka & Veg Pulao',slot:'Dinner',diet:'veg',cuisine:'north',kcal:430,protein:16,carbs:64,fat:12,price:320,image:photo('photo-1788603092417-a01e665e0ab2'),note:'Toor dal and aged basmati, tempered to order.',spice:2,oil:2},
 {id:'chicken-stew',name:'Chicken Stew & Roti',slot:'Dinner',diet:'nonveg',cuisine:'south',kcal:460,protein:36,carbs:40,fat:16,price:320,image:photo('photo-1708782344490-9026aaa5eec7'),note:'Coconut milk and chicken from trusted partners.',spice:3,oil:2},
 {id:'baingan-bharta',name:'Baingan Bharta & Roti',slot:'Dinner',diet:'veg',cuisine:'north',kcal:360,protein:12,carbs:30,fat:20,price:320,image:photo('photo-1777613112774-1a64a2c2d337'),note:'Fire-roasted aubergine, mashed and tempered fresh.',spice:3,oil:2},
 {id:'moong-khichdi',name:'Moong Dal Khichdi & Ghee',slot:'Dinner',diet:'veg',cuisine:'north',kcal:400,protein:17,carbs:60,fat:8,price:320,image:photo('photo-1630409351211-d62ab2d24da4'),note:'Moong and rice simmered soft, finished with clarified ghee.',spice:1,oil:2},
 {id:'malabar-chicken',name:'Malabar Chicken Curry & Appam',slot:'Dinner',diet:'nonveg',cuisine:'south',kcal:470,protein:37,carbs:16,fat:24,price:320,image:photo('photo-1764304733301-3a9f335f0c67'),note:'Coconut-milk curry, free-range chicken from local growers.',spice:3,oil:2},
 {id:'prawn-curry',name:'Prawn Curry & Rice',slot:'Dinner',diet:'nonveg',cuisine:'south',kcal:420,protein:32,carbs:14,fat:22,price:320,image:photo('photo-1781684081404-5c090011b53e'),note:'Fresh prawns from Mangaluru in a tangy coconut curry.',spice:3,oil:2},
 {id:'mixed-veg-bajra',name:'Mixed Veg Curry & Bajra Khichdi',slot:'Dinner',diet:'veg',cuisine:'west',kcal:390,protein:14,carbs:56,fat:10,price:320,image:photo('photo-1755090154755-006e02ea26b9'),note:'Seasonal vegetables with millet khichdi, tempered light.',spice:2,oil:2},
 {id:'grilled-paneer',name:'Grilled Paneer & Stir-Fry Veg',slot:'Dinner',diet:'veg',cuisine:'north',kcal:410,protein:26,carbs:14,fat:26,price:320,image:photo('photo-1567188040759-fb8a883dc6d8'),note:'Paneer from a small dairy near Nandi Hills, chargrilled.',spice:2,oil:1},
];

// The full catalog the planner scores over: curated signatures + composed bowls.
export const meals: Meal[] = [...signatureMeals, ...composedMeals];
