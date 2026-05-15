import { FEATURES } from "@/App";
import { Card, CardContent } from "@/components/ui/card";

export default function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4">
          Features
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100 mb-16">
          Everything you need,
          <br />
          nothing you don't.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className=" hover:shadow-sm transition-all duration-200 bg-neutral-800"
            >
              <CardContent className="p-6">
                <f.icon className="mb-4 h-8 w-8 text-emerald-400" aria-hidden="true" />
                <h3 className="font-semibold text-zinc-100 text-xl mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
