import { PlaceholderLogo } from "@/components/home/PlaceholderLogo";

const companies = [
  "Northwind",
  "Aperture",
  "Vantage",
  "Meridian",
  "Solstice",
  "Kittiwake",
];

export function LogoRow() {
  return (
    <section
      aria-label="Organizations that trust LBET"
      className="border-y border-border bg-[rgb(var(--surface))] py-10"
    >
      <div className="container mx-auto">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Trusted by teams and training centers in 40+ countries
        </p>
        <ul className="mt-7 grid grid-cols-2 items-center gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {companies.map((name) => (
            <li key={name} className="flex justify-center">
              <PlaceholderLogo
                name={name}
                className="h-7 w-auto text-muted-foreground/70 transition-colors hover:text-foreground"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
