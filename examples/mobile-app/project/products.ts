export interface Product {
  id: string;
  name: string;
  category: "drinks" | "snacks" | "staples" | "household";
  priceVnd: number;
  stock: number;
}

export const products: Product[] = [
  { id: "p1", name: "Jasmine rice 5 kg", category: "staples", priceVnd: 125000, stock: 14 },
  { id: "p2", name: "Fish sauce 500 ml", category: "staples", priceVnd: 38000, stock: 22 },
  { id: "p3", name: "Instant noodles (pack of 5)", category: "staples", priceVnd: 21000, stock: 60 },
  { id: "p4", name: "Iced tea 450 ml", category: "drinks", priceVnd: 10000, stock: 48 },
  { id: "p5", name: "Coconut water 330 ml", category: "drinks", priceVnd: 15000, stock: 0 },
  { id: "p6", name: "Shrimp crackers", category: "snacks", priceVnd: 12000, stock: 30 },
  { id: "p7", name: "Dried mango 200 g", category: "snacks", priceVnd: 45000, stock: 7 },
  { id: "p8", name: "Dish soap 750 ml", category: "household", priceVnd: 32000, stock: 11 },
  { id: "p9", name: "Laundry powder 1 kg", category: "household", priceVnd: 54000, stock: 3 },
  { id: "p10", name: "Eggs (10)", category: "staples", priceVnd: 35000, stock: 18 }
];
