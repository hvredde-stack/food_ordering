import { CartProvider } from "@/components/customer/cart-provider";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen pb-24">{children}</div>
    </CartProvider>
  );
}
