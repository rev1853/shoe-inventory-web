# Integrating This React UI into a Laravel + Inertia (React) Project

The bundle is a Vite + React + Tailwind UI with mock data and `react-router-dom`. Below is a practical map for dropping it into a Laravel/Inertia setup.

## 1) Prerequisites
- Laravel app already configured with Inertia React and Vite (typical files: `resources/js/app.jsx`, `resources/views/app.blade.php`).
- Tailwind already installed (or planned to be).

## 2) Copy the UI code
1. Create folders in Laravel to mirror this repo:
   - `resources/js/Pages` (for pages)
   - `resources/js/Layouts` (for `DashboardLayout`)
   - `resources/js/Components` (for UI atoms/molecules)
   - `resources/css` (for Tailwind entry)
2. Copy files:
   - Move `src/components/ui/**/*` → `resources/js/Components/ui/**/*`
   - Move page-like files (`Dashboard.tsx`, `Products.tsx`, `Variants.tsx`, `Suppliers.tsx`, `Users.tsx`, `StockMovements.tsx`, dialogs, Pagination) → `resources/js/Pages/...` and/or `resources/js/Components/...` as fits your structure.
   - Move layout (`DashboardLayout.tsx`) → `resources/js/Layouts/DashboardLayout.tsx`
   - Move `src/index.css` → merge into `resources/css/app.css` (see Tailwind note below).

## 3) Install dependencies (pin versions)
Add the UI dependencies to Laravel’s `package.json` and pin versions to match this bundle to avoid breakage:
```jsonc
{
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-aspect-ratio": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.3",
    "@radix-ui/react-context-menu": "^2.2.6",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-hover-card": "^1.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-navigation-menu": "^1.2.5",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.1.2",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-toggle-group": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.487.0",
    "next-themes": "^0.4.6",
    "qrcode": "^1.5.3",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "sonner": "^2.0.3",
    "tailwind-merge": "^2.2.1",
    "vaul": "^1.1.2"
  }
}
```
Then run `npm install` (or `pnpm`/`yarn`) from the Laravel project.

## 4) Tailwind integration
- Replace the generated Tailwind dump in `src/index.css` with your Laravel Tailwind pipeline. Merge any custom tokens you need (colors, radii, font definitions) into `tailwind.config.js` theme extensions instead of raw CSS variables.
- Ensure `resources/css/app.css` includes `@tailwind base; @tailwind components; @tailwind utilities;` plus any custom layers you copy over.

## 5) Convert routing to Inertia
The bundle uses `react-router-dom` (`BrowserRouter`, `Routes`, `Link`, `Navigate`, `useNavigate`). Inertia handles routing via server responses and `@inertiajs/react` `Link`/`router`.
- Remove `BrowserRouter`/`Routes` wrappers. Each page component (e.g., `Products`) should export a default page that Inertia renders.
- Replace navigation:
  - `Link` → `import { Link } from '@inertiajs/react'`
  - `useNavigate()` + `navigate('/path')` → `import { router } from '@inertiajs/react'; router.visit('/path');`
  - Redirect guards (`Navigate`) → handle on the server (Laravel middleware) and via Inertia responses.
- Define Laravel routes that return Inertia responses:
  ```php
  // routes/web.php
  Route::middleware(['auth', 'verified'])->group(function () {
      Route::get('/dashboard', fn () => Inertia::render('Dashboard'));
      Route::get('/products', fn () => Inertia::render('Products'));
      // ...other pages
  });
  ```

## 6) Wrap pages with an Inertia layout
- Move `DashboardLayout` to `resources/js/Layouts/DashboardLayout.tsx`.
- In each page, set:
  ```tsx
  import DashboardLayout from '@/Layouts/DashboardLayout';
  import { Head } from '@inertiajs/react';

  const Products = (props) => {
    return (
      <>
        <Head title="Products" />
        {/* existing content */}
      </>
    );
  };
  Products.layout = (page) => <DashboardLayout>{page}</DashboardLayout>;
  export default Products;
  ```
- Remove the local `isAuthenticated` state; rely on Laravel auth middleware to gate routes.

## 7) Replace mock data with backend props
- Mock arrays (`mockProducts`, `mockMovements`, `recentMovements`, chart data) should be replaced with props sent from Laravel controllers:
  ```php
  return Inertia::render('Products', [
      'products' => ProductResource::collection(
          Product::query()->with('brand','category')->paginate(10)
      ),
      'filters' => request()->only('search','brand','category','sort','page'),
  ]);
  ```
- Adjust the components to read from props instead of local constants, and wire pagination to Laravel’s paginator data (`links`, `meta`).

## 8) Wire forms to Laravel with `useForm`
- Dialogs currently log to console. Replace with `useForm` from `@inertiajs/react`:
  ```tsx
  const form = useForm({ code: '', name: '', ... });
  const submit = () => form.post(route('products.store'), {
    onSuccess: () => onOpenChange(false)
  });
  ```
- Server-side validation errors will flow into `form.errors`. Show them near inputs.
- For edits/deletes, use `form.put(route('products.update', id))` and `form.delete(route('products.destroy', id))`.

## 9) Auth and user info
- The sidebar uses a mock user. Use `usePage().props.auth.user` and expose that from Laravel (typical Inertia share in `HandleInertiaRequests`).
- Remove the mock login page; keep Laravel’s auth scaffolding or Jetstream/Fortify and redirect to `/dashboard`.

## 10) Assets and Vite
- Update aliases if you use `@` → `resources/js` via Vite config.
- Ensure `resources/views/app.blade.php` includes `@vite(['resources/css/app.css','resources/js/app.jsx'])`.

## 11) Testing/verification
- `npm run dev` to verify the UI builds in Laravel.
- Visit routes to confirm navigation works without `react-router-dom` and that data renders from backend props.
- Check dialogs submit correctly and validation errors appear.

## 12) Cleanup
- Remove `react-router-dom` from deps once all navigation is Inertia-driven.
- Drop unused mock/stateful auth code.
- Consider extracting shared UI primitives into `resources/js/Components/ui` for reuse across other pages.
